import OpenAI from "openai";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TextChunk } from "./chunker";

const BATCH_SIZE = 100;

export async function embedAndStore(
  competitorId: string,
  sourceUrl: string,
  chunks: TextChunk[]
): Promise<void> {
  if (!chunks.length) return;

  const openai = new OpenAI();
  const admin = createAdminClient();

  // Remove stale chunks for this URL before reinserting
  await admin
    .from("knowledge_chunks")
    .delete()
    .eq("competitor_id", competitorId)
    .eq("source_url", sourceUrl);

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);

    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: batch.map((c) => c.content),
    });

    const rows = batch.map((chunk, j) => ({
      competitor_id: competitorId,
      source_url: chunk.source_url,
      content: chunk.content,
      // Supabase types vector as string but pgvector accepts number[] at runtime
      embedding: response.data[j].embedding as unknown as string,
      token_count: chunk.token_count,
      metadata: { chunk_index: chunk.chunk_index },
    }));

    const { error } = await admin.from("knowledge_chunks").insert(rows);
    if (error) throw new Error(`Supabase insert error: ${error.message}`);
  }
}
