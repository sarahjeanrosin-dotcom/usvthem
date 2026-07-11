// ~800 tokens per chunk, ~100-token overlap (1 token ≈ 4 chars)
const CHUNK_CHARS = 3200;
const OVERLAP_CHARS = 400;
const MIN_CHUNK_CHARS = 100;

export interface TextChunk {
  content: string;
  source_url: string;
  chunk_index: number;
  token_count: number;
}

export function chunkText(text: string, sourceUrl: string): TextChunk[] {
  const chunks: TextChunk[] = [];
  let start = 0;
  let index = 0;

  while (start < text.length) {
    const end = Math.min(start + CHUNK_CHARS, text.length);
    const content = text.slice(start, end).trim();

    if (content.length >= MIN_CHUNK_CHARS) {
      chunks.push({
        content,
        source_url: sourceUrl,
        chunk_index: index++,
        token_count: Math.ceil(content.length / 4),
      });
    }

    if (end >= text.length) break;
    start = end - OVERLAP_CHARS;
  }

  return chunks;
}
