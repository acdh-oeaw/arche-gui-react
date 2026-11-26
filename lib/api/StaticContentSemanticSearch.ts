import "server-only";

import { promises as fs } from "node:fs";
import { join } from "node:path";

import { EMBEDDING_MODEL_ID, embedTexts } from "@/lib/api/EmbeddingModel";
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
 * The model runs locally in the node.js process (see `EmbeddingModel`), so no external api is
 * called.
 */

const MODEL_ID = EMBEDDING_MODEL_ID;
const INDEX_FILE_NAME = "search-index.json";
/** Version 4: without bibliographies and the navigation repeated on several pages. */
const INDEX_VERSION = 4;

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
 * A chunk with its sentences, whose vectors are stored in the index too, so the highlight of a
 * result needs no model run at search time - on webassembly embedding the sentences of five results
 * would take seconds.
 */
interface IndexedChunk extends StaticContentChunk {
	/** Empty for a chunk with a single sentence (or a table), which needs no highlight. */
	sentences: Array<string>;
	/** Position of the first sentence vector in `sentenceVectors`. */
	firstSentence: number;
}

/**
 * Picks the one or two sentences of a chunk which are most similar to the question.
 *
 * A chunk with a single sentence (or a table without sentence punctuation) gets no highlight, since
 * it would only repeat the passage.
 */
function getHighlight(
	chunk: IndexedChunk,
	sentenceVectors: Float32Array,
	queryVector: Float32Array,
	dimensions: number,
): string | null {
	if (chunk.sentences.length === 0) return null;

	const scored = chunk.sentences.map((sentence, position) => {
		const offset = (chunk.firstSentence + position) * dimensions;
		const score =
			dot(sentenceVectors, offset, queryVector, dimensions) +
			(position === 0 ? FIRST_SENTENCE_BONUS : 0);
		return { sentence, position, score };
	});

	scored.sort((a, b) => {
		return b.score - a.score;
	});
	const best = scored[0]!.score;
	const selected = scored.slice(0, MAX_HIGHLIGHT_SENTENCES).filter((entry) => {
		return best - entry.score <= MAX_SECOND_SENTENCE_DISTANCE;
	});

	/* All sentences of a short chunk would just repeat the passage below it. */
	if (selected.length === chunk.sentences.length) return null;

	return selected
		.sort((a, b) => {
			return a.position - b.position;
		})
		.map((entry) => {
			return entry.sentence;
		})
		.join(" ");
}

interface StoredIndex {
	version: number;
	model: string;
	createdAt: string;
	dimensions: number;
	chunks: Array<IndexedChunk>;
	/** All chunk vectors as one base64 encoded `Float32Array`, `dimensions` values per chunk. */
	vectors: string;
	/** All sentence vectors, in the same encoding. */
	sentenceVectors: string;
}

interface LoadedIndex {
	modifiedAt: number;
	createdAt: string;
	dimensions: number;
	chunks: Array<IndexedChunk>;
	vectors: Float32Array;
	sentenceVectors: Float32Array;
}

function encodeVectors(vectors: Float32Array): string {
	return Buffer.from(vectors.buffer, vectors.byteOffset, vectors.byteLength).toString("base64");
}

function decodeVectors(encoded: string): Float32Array {
	/* Copied into a fresh buffer, because a `Float32Array` view needs a 4 byte aligned offset. */
	return new Float32Array(new Uint8Array(Buffer.from(encoded, "base64")).buffer);
}

const loadedIndexes = new Map<IntlLanguage, LoadedIndex>();

/**
 * The e5 models are trained with these prefixes, which tell the model whether a text is a question
 * or a passage that might answer one.
 */
function embed(texts: Array<string>, kind: "query" | "passage"): Promise<Float32Array> {
	return embedTexts(
		texts.map((text) => {
			return `${kind}: ${text}`;
		}),
	);
}

function getIndexPath(language: IntlLanguage): string {
	return join(process.cwd(), "static-content", language, INDEX_FILE_NAME);
}

function chunkToPassage(chunk: StaticContentChunk): string {
	return chunk.heading ? `${chunk.heading}: ${chunk.text}` : chunk.text;
}

export type StaticContentSearchIndexBuild =
	| { state: "building"; startedAt: string }
	| { state: "done"; chunks: number; startedAt: string; finishedAt: string }
	| { state: "failed"; error: string; startedAt: string; finishedAt: string };

/** The last build of each language since the server started. */
const builds = new Map<IntlLanguage, StaticContentSearchIndexBuild>();
const runningBuilds = new Map<IntlLanguage, Promise<number>>();

/**
 * Rebuilds the search index of one language from the pages on disk. Called by `/api/static-content`
 * after it wrote the pages, so the index always matches the published content.
 *
 * Takes a few minutes, because the model runs on webassembly. A build already running for the
 * language is reused instead of starting a second one.
 *
 * @returns the number of indexed chunks
 */
export function rebuildStaticContentSearchIndex(language: IntlLanguage): Promise<number> {
	const running = runningBuilds.get(language);
	if (running != null) return running;

	const startedAt = new Date().toISOString();
	builds.set(language, { state: "building", startedAt });

	const build = buildIndex(language)
		.then((chunks) => {
			builds.set(language, {
				state: "done",
				chunks,
				startedAt,
				finishedAt: new Date().toISOString(),
			});
			return chunks;
		})
		.catch((error: unknown) => {
			const message = error instanceof Error ? error.message : String(error);
			console.error(`Building the ${language} static content search index failed.`, error);
			builds.set(language, {
				state: "failed",
				error: message,
				startedAt,
				finishedAt: new Date().toISOString(),
			});
			throw error;
		})
		.finally(() => {
			runningBuilds.delete(language);
		});

	runningBuilds.set(language, build);

	return build;
}

/** The state of the last index build and of the index file on disk, for each language. */
export async function getStaticContentSearchIndexStatus(
	languages: ReadonlyArray<IntlLanguage>,
): Promise<
	Record<
		string,
		{
			lastBuild: StaticContentSearchIndexBuild | null;
			index: { createdAt: string; chunks: number } | null;
		}
	>
> {
	const entries = await Promise.all(
		languages.map(async (language) => {
			const index = await loadIndex(language).catch(() => {
				return null;
			});
			const stored =
				index == null ? null : { createdAt: index.createdAt, chunks: index.chunks.length };

			return [language, { lastBuild: builds.get(language) ?? null, index: stored }] as const;
		}),
	);

	return Object.fromEntries(entries);
}

async function buildIndex(language: IntlLanguage): Promise<number> {
	const pages = await Promise.all(
		getStaticContentPages().map(async (slug) => {
			const html = await getStaticPageFromDisk(slug, language);

			return html == null ? [] : htmlToChunks(html, slug);
		}),
	);
	/*
	 * Passages which appear word for word on several pages are navigation, e.g. the cards linking to
	 * the other pages ("Preservation Policy - Archiving, maintenance, ... Show") at the bottom of
	 * most pages. They are the most generic passages of all and would match many questions a little.
	 */
	const pagesByPassage = new Map<string, Set<string>>();
	for (const chunk of pages.flat()) {
		const key = chunkToPassage(chunk);
		pagesByPassage.set(key, (pagesByPassage.get(key) ?? new Set()).add(chunk.slug));
	}
	const contentChunks = pages.flat().filter((chunk) => {
		return pagesByPassage.get(chunkToPassage(chunk))!.size === 1;
	});

	let sentenceCount = 0;
	const chunks: Array<IndexedChunk> = contentChunks.map((chunk) => {
		const sentences = splitSentences(chunk.text);
		const indexed = {
			...chunk,
			sentences: sentences.length > 1 ? sentences : [],
			firstSentence: sentenceCount,
		};
		sentenceCount += indexed.sentences.length;
		return indexed;
	});

	const vectors = await embed(chunks.map(chunkToPassage), "passage");
	const sentenceVectors = await embed(
		chunks.flatMap((chunk) => {
			return chunk.sentences;
		}),
		"passage",
	);

	const index: StoredIndex = {
		version: INDEX_VERSION,
		model: MODEL_ID,
		createdAt: new Date().toISOString(),
		dimensions: chunks.length > 0 ? vectors.length / chunks.length : 0,
		chunks,
		vectors: encodeVectors(vectors),
		sentenceVectors: encodeVectors(sentenceVectors),
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

	const index: LoadedIndex = {
		modifiedAt,
		createdAt: stored.createdAt,
		dimensions: stored.dimensions,
		chunks: stored.chunks,
		vectors: decodeVectors(stored.vectors),
		sentenceVectors: decodeVectors(stored.sentenceVectors),
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

		const results: Array<SemanticSearchResult> = [];
		const countBySlug = new Map<string, number>();
		const bestScore =
			scored.find((result) => {
				return result.similarity >= MIN_SCORE;
			})?.score ?? 0;

		for (const result of scored) {
			if (results.length >= limit) break;
			/* Relevance is decided by meaning alone, the keyword bonus only reorders. */
			if (result.similarity < MIN_SCORE || result.score < bestScore - MAX_DISTANCE_TO_BEST) {
				continue;
			}

			const count = countBySlug.get(result.slug) ?? 0;
			if (count >= MAX_RESULTS_PER_PAGE) continue;

			countBySlug.set(result.slug, count + 1);

			const {
				similarity: _similarity,
				sentences: _sentences,
				firstSentence: _first,
				...chunk
			} = result;
			results.push({
				...chunk,
				highlight: getHighlight(result, index.sentenceVectors, queryVector, dimensions),
			});
		}

		return results;
	} catch (error) {
		console.error("Semantic search is unavailable, falling back to the text search.", error);

		return null;
	}
}
