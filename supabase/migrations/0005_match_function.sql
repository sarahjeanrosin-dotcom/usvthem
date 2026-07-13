-- Vector similarity search function for RAG retrieval
create or replace function match_knowledge_chunks(
  query_embedding  vector(1536),
  competitor_id_filter uuid,
  match_count      int default 15
)
returns table (
  id            uuid,
  competitor_id uuid,
  source_url    text,
  content       text,
  similarity    float
)
language sql stable
as $$
  select
    id,
    competitor_id,
    source_url,
    content,
    1 - (embedding <=> query_embedding) as similarity
  from public.knowledge_chunks
  where competitor_id = competitor_id_filter
    and embedding is not null
  order by embedding <=> query_embedding
  limit match_count;
$$;
