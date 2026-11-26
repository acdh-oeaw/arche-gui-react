import "server-only";

import { promises as fs } from "node:fs";
import { join } from "node:path";

import type { FeatureExtractionPipeline } from "@huggingface/transformers";

import { htmlToChunks, type StaticContentChunk } from "@/lib/api/StaticContentChunks";
import { getStaticContentPages } from "@/lib/api/StaticContentSearchApi";
import { getStaticPageFromDisk } from "@/lib/api/StaticPagesApi";
import type { IntlLanguage } from "@/lib/i18n/locales";

/**
 * Semantic search over the static content pages, i.e. matching by meaning instead of by words.
 *
 * Every chunk of every page is turned into a vector by a small multilingual embedding model when
 * `/api/static-content` regenerates the pages. A question is turned into a vector the same way, and
 * the chunks whose vectors point in the most similar direction are the answer.
 *
 * The model runs locally in the node.js process (onnx runtime on the cpu), so no external api is
 * called. It is downloaded from the hugging face hub on first use and cached on disk.
 */

/** @see https://huggingface.co/intfloat/multilingual-e5-small */
const MODEL_ID = "Xenova/multilingual-e5-small";
const MODEL_CACHE_DIR = join(process.cwd(), ".cache", "transformers");
const INDEX_FILE_NAME = "search-index.json";
const INDEX_VERSION = 1;
const EMBEDDING_BATCH_SIZE = 16;

/**
 * The e5 scores of unrelated texts are still around 0.78, and good matches are above 0.85. A chunk
 * is shown when it is above `MIN_SCORE` and close to the best match, so a clear answer is not
 * diluted by passages which only share the topic.
 */
const MIN_SCORE = 0.82;
const MAX_DISTANCE_TO_BEST = 0.03;

/**
 * A small bonus for every word of the question that also appears in the chunk, which only changes
 * the order of chunks that are already similar in meaning (e.g. puts "Costs" above a list of
 * sources for "how much does it cost"). Words are compared by their first four letters, so "cost"
 * also matches "costs" and "kostet" matches "Kosten".
 */
const KEYWORD_BONUS = 0.012;
const HEADING_KEYWORD_BONUS = 0.012;
const MAX_KEYWORD_BONUS = 0.05;
const KEYWORD_PREFIX_LENGTH = 4;
const KEYWORD_MIN_LENGTH = 3;
const STOP_WORDS = new Set([
	// english
	"and",
	"are",
	"can",
	"does",
	"for",
	"how",
	"the",
	"there",
	"what",
	"when",
	"where",
	"which",
	"who",
	"why",
	"with",
	"you",
	"your",
	// german
	"auch",
	"das",
	"der",
	"die",
	"ein",
	"eine",
	"für",
	"ich",
	"ihr",
	"kann",
	"meine",
	"mit",
	"muss",
	"sie",
	"und",
	"was",
	"welche",
	"welchen",
	"wer",
	"wie",
	"wo",
]);

function toKeywords(text: string): Set<string> {
	return new Set(
		text
			.toLowerCase()
			.split(/[^\p{L}\p{N}]+/u)
			.filter((word) => {
				return word.length >= KEYWORD_MIN_LENGTH && !STOP_WORDS.has(word);
			})
			.map((word) => {
				return word.slice(0, KEYWORD_PREFIX_LENGTH);
			}),
	);
}

function getKeywordBonus(queryKeywords: Set<string>, chunk: StaticContentChunk): number {
	if (queryKeywords.size === 0) return 0;

	const textKeywords = toKeywords(chunk.text);
	const headingKeywords = toKeywords(chunk.heading ?? "");
	let bonus = 0;

	for (const keyword of queryKeywords) {
		if (textKeywords.has(keyword)) bonus += KEYWORD_BONUS;
		if (headingKeywords.has(keyword)) bonus += HEADING_KEYWORD_BONUS;
	}

	return Math.min(bonus, MAX_KEYWORD_BONUS);
}
const MAX_RESULTS_PER_PAGE = 2;

export interface SemanticSearchResult extends StaticContentChunk {
	score: number;
	/** The one or two sentences of the chunk which answer the question best, in text order. */
	highlight: string | null;
}

/**
 * The second best sentence is only added to the highlight when it is nearly as good as the best
 * one, so the highlight stays a short answer instead of a second copy of the passage.
 *
 * On single sentences the small model is less sure than on whole passages: for "how much does it
 * cost" it ranks "we might charge for the curation" above "the deposition is free of charge". The
 * first sentence of a passage usually states the point (always so in the faq answers), so it gets a
 * small bonus, and together with the second sentence the highlight then reads like the answer.
 */
const MAX_HIGHLIGHT_SENTENCES = 2;
const MAX_SECOND_SENTENCE_DISTANCE = 0.05;
const FIRST_SENTENCE_BONUS = 0.02;
const MIN_HIGHLIGHT_WORDS = 4;

function splitSentences(text: string): Array<string> {
	return text
		.split(/(?<=[.!?])\s+(?=[\p{Lu}\p{N}„"(])/u)
		.map((sentence) => {
			return sentence.trim();
		})
		.filter((sentence) => {
			return sentence.split(" ").length >= MIN_HIGHLIGHT_WORDS;
		});
}

function dot(a: Float32Array, aOffset: number, b: Float32Array, dimensions: number): number {
	let sum = 0;
	for (let dimension = 0; dimension < dimensions; dimension++) {
		sum += a[aOffset + dimension]! * b[dimension]!;
	}
	return sum;
}

/**
 * Picks the sentences of every result which are most similar to the question. All sentences are
 * embedded in one batch, which takes a few dozen milliseconds for five results.
 *
 * A chunk with a single sentence (or a table without sentence punctuation) gets no highlight, since
 * it would only repeat the passage.
 */
async function addHighlights(
	results: Array<Omit<SemanticSearchResult, "highlight">>,
	queryVector: Float32Array,
	dimensions: number,
): Promise<Array<SemanticSearchResult>> {
	const sentencesByResult = results.map((result) => {
		const sentences = splitSentences(result.text);
		return sentences.length > 1 ? sentences : [];
	});
	const allSentences = sentencesByResult.flat();
	if (allSentences.length === 0) {
		return results.map((result) => {
			return { ...result, highlight: null };
		});
	}

	const sentenceVectors = await embed(allSentences, "passage");
	let sentenceIndex = 0;

	return results.map((result, resultIndex) => {
		const sentences = sentencesByResult[resultIndex]!;
		const scored = sentences.map((sentence, position) => {
			const score =
				dot(sentenceVectors, sentenceIndex * dimensions, queryVector, dimensions) +
				(position === 0 ? FIRST_SENTENCE_BONUS : 0);
			sentenceIndex++;
			return { sentence, position, score };
		});

		if (scored.length === 0) return { ...result, highlight: null };

		scored.sort((a, b) => {
			return b.score - a.score;
		});
		const best = scored[0]!.score;
		const highlight = scored
			.slice(0, MAX_HIGHLIGHT_SENTENCES)
			.filter((entry) => {
				return best - entry.score <= MAX_SECOND_SENTENCE_DISTANCE;
			})
			.sort((a, b) => {
				return a.position - b.position;
			})
			.map((entry) => {
				return entry.sentence;
			})
			.join(" ");

		return { ...result, highlight };
	});
}

interface StoredIndex {
	version: number;
	model: string;
	createdAt: string;
	dimensions: number;
	chunks: Array<StaticContentChunk>;
	/** All vectors as one base64 encoded `Float32Array`, `dimensions` values per chunk. */
	vectors: string;
}

interface LoadedIndex {
	modifiedAt: number;
	dimensions: number;
	chunks: Array<StaticContentChunk>;
	vectors: Float32Array;
}

let extractorPromise: Promise<FeatureExtractionPipeline> | null = null;
const loadedIndexes = new Map<IntlLanguage, LoadedIndex>();

function getExtractor(): Promise<FeatureExtractionPipeline> {
	extractorPromise ??= (async () => {
		/* Imported lazily, so the onnx runtime is only loaded once the search is actually used. */
		const { env, pipeline } = await import("@huggingface/transformers");
		env.cacheDir = MODEL_CACHE_DIR;

		return pipeline("feature-extraction", MODEL_ID, { dtype: "q8", device: "cpu" });
	})().catch((error: unknown) => {
		/* Allow a retry on the next request, e.g. after a network error during the download. */
		extractorPromise = null;
		throw error;
	});

	return extractorPromise;
}

/**
 * The e5 models are trained with these prefixes, which tell the model whether a text is a question
 * or a passage that might answer one.
 */
async function embed(texts: Array<string>, kind: "query" | "passage"): Promise<Float32Array> {
	const extractor = await getExtractor();
	const batches: Array<Float32Array> = [];

	for (let start = 0; start < texts.length; start += EMBEDDING_BATCH_SIZE) {
		const batch = texts.slice(start, start + EMBEDDING_BATCH_SIZE).map((text) => {
			return `${kind}: ${text}`;
		});
		const output = await extractor(batch, { pooling: "mean", normalize: true });
		batches.push(output.data as Float32Array);
	}

	const vectors = new Float32Array(
		batches.reduce((length, batch) => {
			return length + batch.length;
		}, 0),
	);
	let offset = 0;
	for (const batch of batches) {
		vectors.set(batch, offset);
		offset += batch.length;
	}

	return vectors;
}

function getIndexPath(language: IntlLanguage): string {
	return join(process.cwd(), "static-content", language, INDEX_FILE_NAME);
}

function chunkToPassage(chunk: StaticContentChunk): string {
	return chunk.heading ? `${chunk.heading}: ${chunk.text}` : chunk.text;
}

/**
 * Rebuilds the search index of one language from the pages on disk. Called by `/api/static-content`
 * after it wrote the pages, so the index always matches the published content.
 *
 * @returns the number of indexed chunks
 */
export async function buildStaticContentSearchIndex(language: IntlLanguage): Promise<number> {
	const pages = await Promise.all(
		getStaticContentPages().map(async (slug) => {
			const html = await getStaticPageFromDisk(slug, language);

			return html == null ? [] : htmlToChunks(html, slug);
		}),
	);
	const chunks = pages.flat();
	const vectors = await embed(chunks.map(chunkToPassage), "passage");

	const index: StoredIndex = {
		version: INDEX_VERSION,
		model: MODEL_ID,
		createdAt: new Date().toISOString(),
		dimensions: chunks.length > 0 ? vectors.length / chunks.length : 0,
		chunks,
		vectors: Buffer.from(vectors.buffer, vectors.byteOffset, vectors.byteLength).toString("base64"),
	};

	await fs.writeFile(getIndexPath(language), JSON.stringify(index), "utf8");
	loadedIndexes.delete(language);

	return chunks.length;
}

/** Reads the index from disk, and again whenever the file changed since the last read. */
async function loadIndex(language: IntlLanguage): Promise<LoadedIndex | null> {
	const path = getIndexPath(language);

	let modifiedAt: number;
	try {
		modifiedAt = (await fs.stat(path)).mtimeMs;
	} catch {
		return null;
	}

	const cached = loadedIndexes.get(language);
	if (cached?.modifiedAt === modifiedAt) return cached;

	const stored = JSON.parse(await fs.readFile(path, "utf8")) as StoredIndex;
	if (stored.version !== INDEX_VERSION || stored.model !== MODEL_ID) return null;

	const bytes = Buffer.from(stored.vectors, "base64");
	const index: LoadedIndex = {
		modifiedAt,
		dimensions: stored.dimensions,
		chunks: stored.chunks,
		/* Copied into a fresh buffer, because a `Float32Array` view needs a 4 byte aligned offset. */
		vectors: new Float32Array(new Uint8Array(bytes).buffer),
	};
	loadedIndexes.set(language, index);

	return index;
}

/**
 * Returns the chunks most similar in meaning to `query`, at most `MAX_RESULTS_PER_PAGE` per page.
 *
 * Returns `null` when the semantic search is not available (no index yet, or the model could not
 * be loaded), so the caller can fall back to the plain text search.
 */
export async function semanticSearchStaticContent(
	query: string,
	language: IntlLanguage,
	limit = 5,
): Promise<Array<SemanticSearchResult> | null> {
	const text = query.trim();
	if (text.length === 0) return [];

	try {
		const index = await loadIndex(language);
		if (index == null || index.chunks.length === 0) return null;

		const queryVector = await embed([text], "query");
		const queryKeywords = toKeywords(text);
		const { dimensions, vectors } = index;

		/* The vectors are normalised, so the dot product is the cosine similarity. */
		const scored = index.chunks.map((chunk, chunkIndex) => {
			let similarity = 0;
			const offset = chunkIndex * dimensions;
			for (let dimension = 0; dimension < dimensions; dimension++) {
				similarity += queryVector[dimension]! * vectors[offset + dimension]!;
			}
			return { ...chunk, similarity, score: similarity + getKeywordBonus(queryKeywords, chunk) };
		});

		scored.sort((a, b) => {
			return b.score - a.score;
		});

		const results: Array<Omit<SemanticSearchResult, "highlight">> = [];
		const countBySlug = new Map<string, number>();
		const bestScore =
			scored.find((result) => {
				return result.similarity >= MIN_SCORE;
			})?.score ?? 0;

		for (const { similarity, ...result } of scored) {
			if (results.length >= limit) break;
			/* Relevance is decided by meaning alone, the keyword bonus only reorders. */
			if (similarity < MIN_SCORE || result.score < bestScore - MAX_DISTANCE_TO_BEST) continue;

			const count = countBySlug.get(result.slug) ?? 0;
			if (count >= MAX_RESULTS_PER_PAGE) continue;

			countBySlug.set(result.slug, count + 1);
			results.push(result);
		}

		return await addHighlights(results, queryVector, dimensions);
	} catch (error) {
		console.error("Semantic search is unavailable, falling back to the text search.", error);

		return null;
	}
}
