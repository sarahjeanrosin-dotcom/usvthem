import OpenAI from "openai";
import { createAdminClient } from "@/lib/supabase/admin";

export interface KnowledgeChunk {
  id: string;
  competitor_id: string;
  source_url: string;
  content: string;
  similarity: number;
}

export async function embedQuery(query: string): Promise<number[]> {
  const openai = new OpenAI();
  const { data } = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
  });
  return data[0].embedding;
}

export async function searchKnowledgeByEmbedding(
  queryEmbedding: number[],
  competitorId: string,
  limit = 15
): Promise<KnowledgeChunk[]> {
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any).rpc("match_knowledge_chunks", {
    query_embedding: queryEmbedding,
    competitor_id_filter: competitorId,
    match_count: limit,
  });

  if (error) throw new Error(`Vector search error: ${error.message}`);
  return (data ?? []) as KnowledgeChunk[];
}

/** Convenience wrapper: embeds the query, then searches. Prefer embedQuery + searchKnowledgeByEmbedding when running multiple searches for the same query. */
export async function searchKnowledge(
  query: string,
  competitorId: string,
  limit = 15
): Promise<KnowledgeChunk[]> {
  const queryEmbedding = await embedQuery(query);
  return searchKnowledgeByEmbedding(queryEmbedding, competitorId, limit);
}
