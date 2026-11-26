import "server-only";

import { promises as fs } from "node:fs";
import { availableParallelism } from "node:os";
import { dirname, join } from "node:path";
import { Worker } from "node:worker_threads";

import { Tokenizer } from "@huggingface/tokenizers";

/**
 * A small multilingual text embedding model, run locally in the node.js process.
 *
 * The model runs on `onnxruntime-web`, i.e. on webassembly, and not on the native
 * `onnxruntime-node`: the native binaries need glibc, and the docker image is alpine (musl). The
 * webassembly build runs everywhere; a question takes ~20 ms, rebuilding an index a few minutes.
 *
 * The model runs in a worker thread: a webassembly run blocks its thread, and on the main thread
 * the server could not answer any request while an index is rebuilt.
 *
 * The model files are downloaded from the hugging face hub on first use and cached on disk.
 *
 * @see https://huggingface.co/intfloat/multilingual-e5-small
 */

export const EMBEDDING_MODEL_ID = "Xenova/multilingual-e5-small";

const MODEL_BASE_URL = `https://huggingface.co/${EMBEDDING_MODEL_ID}/resolve/main`;
const MODEL_DIR = join(process.cwd(), ".cache", "models", EMBEDDING_MODEL_ID);
const TOKENIZER_FILE = "tokenizer.json";
const TOKENIZER_CONFIG_FILE = "tokenizer_config.json";
/** The int8 quantised model, ~118 MB, with practically the same results as the full model. */
const MODEL_FILE = "onnx/model_quantized.onnx";

/** The model only reads the first 512 tokens of a text. */
const MAX_TOKENS = 512;
const BATCH_SIZE = 4;
/** More threads halve the time of the index build; a single question is equally fast with one. */
const MAX_THREADS = 4;

interface RunResult {
	data: Float32Array;
	dims: ReadonlyArray<number>;
}

/** Runs the model on one padded batch and returns its token vectors. */
type Run = (
	ids: BigInt64Array<ArrayBuffer>,
	mask: BigInt64Array<ArrayBuffer>,
	dims: Array<number>,
) => Promise<RunResult>;

interface Model {
	run: Run;
	tokenizer: Tokenizer;
}

let modelPromise: Promise<Model> | null = null;

/** Returns the local path of a model file, downloading it first if it is not cached yet. */
async function getModelFile(file: string): Promise<string> {
	const path = join(MODEL_DIR, file);

	try {
		await fs.access(path);
		return path;
	} catch {
		/* not downloaded yet */
	}

	const response = await fetch(`${MODEL_BASE_URL}/${file}`);
	if (!response.ok) {
		throw new Error(`Downloading ${file} failed with status ${String(response.status)}.`);
	}

	/* Written to a temporary file first, so an interrupted download is never mistaken for a model. */
	await fs.mkdir(dirname(path), { recursive: true });
	const temporaryPath = `${path}.download`;
	await fs.writeFile(temporaryPath, Buffer.from(await response.arrayBuffer()));
	await fs.rename(temporaryPath, path);

	return path;
}

/**
 * The worker, as plain commonjs source, because a worker needs a file or source of its own and the
 * app code is bundled. It loads the model and answers each batch message with the token vectors.
 * Its imports resolve from the working directory, i.e. from the app's `node_modules`.
 */
const WORKER_SOURCE = `
const { parentPort, workerData } = require("node:worker_threads");
const { readFileSync } = require("node:fs");

import("onnxruntime-web")
	.then(async (ort) => {
		ort.env.wasm.numThreads = workerData.threads;
		const session = await ort.InferenceSession.create(readFileSync(workerData.modelPath));
		const hasTokenTypes = session.inputNames.includes("token_type_ids");

		parentPort.on("message", async ({ id, ids, mask, dims }) => {
			try {
				const feeds = {
					input_ids: new ort.Tensor("int64", ids, dims),
					attention_mask: new ort.Tensor("int64", mask, dims),
				};
				if (hasTokenTypes) {
					feeds.token_type_ids = new ort.Tensor("int64", new BigInt64Array(ids.length), dims);
				}
				const output = (await session.run(feeds))[session.outputNames[0]];
				const data = Float32Array.from(output.data);
				parentPort.postMessage({ id, data, dims: output.dims }, [data.buffer]);
			} catch (error) {
				parentPort.postMessage({ id, error: String((error && error.stack) || error) });
			}
		});
		parentPort.postMessage({ ready: true });
	})
	.catch((error) => {
		parentPort.postMessage({ failed: String((error && error.stack) || error) });
	});
`;

interface WorkerMessage {
	id?: number;
	data?: Float32Array;
	dims?: Array<number>;
	error?: string;
	ready?: boolean;
	failed?: string;
}

function startWorker(modelPath: string, threads: number): Promise<Run> {
	return new Promise((resolve, reject) => {
		const worker = new Worker(WORKER_SOURCE, {
			eval: true,
			workerData: { modelPath, threads },
		});
		/* The worker must not keep the process alive on shutdown. */
		worker.unref();

		const pending = new Map<
			number,
			{ resolve: (result: RunResult) => void; reject: (error: Error) => void }
		>();
		let nextId = 0;

		function failAll(error: Error) {
			for (const request of pending.values()) request.reject(error);
			pending.clear();
			/* The next request starts a new worker. */
			modelPromise = null;
		}

		worker.on("message", (message: WorkerMessage) => {
			if (message.ready === true) {
				resolve((ids, mask, dims) => {
					return new Promise((resolveRun, rejectRun) => {
						const id = nextId++;
						pending.set(id, { resolve: resolveRun, reject: rejectRun });
						worker.postMessage({ id, ids, mask, dims }, [ids.buffer, mask.buffer]);
					});
				});
				return;
			}
			if (message.failed != null) {
				reject(new Error(message.failed));
				void worker.terminate();
				return;
			}

			const request = pending.get(message.id!);
			if (request == null) return;
			pending.delete(message.id!);

			if (message.error != null) request.reject(new Error(message.error));
			else request.resolve({ data: message.data!, dims: message.dims! });
		});
		worker.on("error", (error) => {
			reject(error);
			failAll(error);
		});
		worker.on("exit", (code) => {
			failAll(new Error(`The embedding model worker exited with code ${String(code)}.`));
		});
	});
}

function getModel(): Promise<Model> {
	modelPromise ??= (async () => {
		const tokenizerPath = await getModelFile(TOKENIZER_FILE);
		const tokenizerConfigPath = await getModelFile(TOKENIZER_CONFIG_FILE);
		const modelPath = await getModelFile(MODEL_FILE);

		const tokenizer = new Tokenizer(
			JSON.parse(await fs.readFile(tokenizerPath, "utf8")) as object,
			JSON.parse(await fs.readFile(tokenizerConfigPath, "utf8")) as object,
		);
		/*
		 * Not needed here, the worker imports it too - but this reference lets the build include the
		 * package (and its dependency) in the standalone output, and a missing package fails here
		 * with a clear error instead of inside the worker.
		 */
		await import("onnxruntime-web");
		const run = await startWorker(modelPath, Math.min(MAX_THREADS, availableParallelism()));

		return { run, tokenizer };
	})().catch((error: unknown) => {
		/* Allow a retry on the next request, e.g. after a network error during the download. */
		modelPromise = null;
		throw error;
	});

	return modelPromise;
}

function tokenize(model: Model, text: string): Array<number> {
	const { ids } = model.tokenizer.encode(text);
	/* Keeps the closing special token when a text is too long. */
	return ids.length > MAX_TOKENS ? [...ids.slice(0, MAX_TOKENS - 1), ids.at(-1)!] : ids;
}

/** Pads the token ids of a batch to the same length, as the model input tensors expect it. */
function toBatch(encodings: Array<Array<number>>): {
	ids: BigInt64Array<ArrayBuffer>;
	mask: BigInt64Array<ArrayBuffer>;
	length: number;
} {
	const length = Math.max(
		...encodings.map((ids) => {
			return ids.length;
		}),
	);

	const ids = new BigInt64Array(encodings.length * length);
	const mask = new BigInt64Array(encodings.length * length);
	encodings.forEach((encoding, row) => {
		encoding.forEach((id, column) => {
			ids[row * length + column] = BigInt(id);
			mask[row * length + column] = 1n;
		});
	});

	return { ids, mask, length };
}

/** Embeds one batch: the mean of the token vectors of each text, normalised to length 1. */
async function embedBatch(model: Model, encodings: Array<Array<number>>): Promise<Float32Array> {
	const { ids, mask, length } = toBatch(encodings);
	const rows = encodings.length;
	/* `mask` is transferred to the worker, so the rows' token counts are taken before. */
	const tokenCounts = encodings.map((encoding) => {
		return encoding.length;
	});

	const output = await model.run(ids, mask, [rows, length]);
	const tokenVectors = output.data;
	const dimensions = output.dims[2]!;
	const vectors = new Float32Array(rows * dimensions);

	for (let row = 0; row < rows; row++) {
		const vector = vectors.subarray(row * dimensions, (row + 1) * dimensions);
		const tokens = tokenCounts[row]!;

		/* Only the real tokens, the padding is always at the end of a row. */
		for (let column = 0; column < tokens; column++) {
			const offset = (row * length + column) * dimensions;
			for (let dimension = 0; dimension < dimensions; dimension++) {
				vector[dimension]! += tokenVectors[offset + dimension]!;
			}
		}

		let norm = 0;
		for (let dimension = 0; dimension < dimensions; dimension++) {
			vector[dimension]! /= tokens;
			norm += vector[dimension]! ** 2;
		}
		norm = Math.sqrt(norm);
		for (let dimension = 0; dimension < dimensions; dimension++) {
			vector[dimension]! /= norm;
		}
	}

	return vectors;
}

/**
 * Turns every text into a normalised vector, returned one after another in a single array (384
 * values per text), so the dot product of two vectors is their cosine similarity.
 */
export async function embedTexts(texts: Array<string>): Promise<Float32Array> {
	const model = await getModel();
	const encodings = texts.map((text) => {
		return tokenize(model, text);
	});

	/*
	 * Every text of a batch is padded to the longest one, so texts of similar length are batched
	 * together - mixed lengths waste most of the work on padding, which on webassembly costs seconds.
	 */
	const order = encodings
		.map((_, index) => {
			return index;
		})
		.sort((a, b) => {
			return encodings[a]!.length - encodings[b]!.length;
		});

	let vectors = new Float32Array(0);
	let dimensions = 0;

	for (let start = 0; start < order.length; start += BATCH_SIZE) {
		const batchOrder = order.slice(start, start + BATCH_SIZE);
		const batch = await embedBatch(
			model,
			batchOrder.map((index) => {
				return encodings[index]!;
			}),
		);

		if (dimensions === 0) {
			dimensions = batch.length / batchOrder.length;
			vectors = new Float32Array(texts.length * dimensions);
		}
		/* Back to the order of `texts`. */
		batchOrder.forEach((index, row) => {
			vectors.set(batch.subarray(row * dimensions, (row + 1) * dimensions), index * dimensions);
		});
	}

	return vectors;
}
