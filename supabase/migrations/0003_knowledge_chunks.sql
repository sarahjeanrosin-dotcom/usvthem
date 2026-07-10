-- Enable pgvector for semantic search
create extension if not exists vector;

-- Knowledge chunks: RAG store for competitor and Genea documentation
create table public.knowledge_chunks (
  id            uuid primary key default gen_random_uuid(),
  competitor_id uuid not null references public.competitors(id) on delete cascade,
  source_url    text not null,
  content       text not null,
  embedding     vector(1536),
  token_count   integer,
  metadata      jsonb not null default '{}',
  created_at    timestamptz not null default now()
);

create index knowledge_chunks_competitor_id_idx
  on public.knowledge_chunks(competitor_id);

-- IVFFlat index for fast approximate nearest-neighbor search
-- lists=100 is appropriate for up to ~1M rows; revisit if collection grows large
create index knowledge_chunks_embedding_idx
  on public.knowledge_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- RLS
alter table public.knowledge_chunks enable row level security;

create policy "Authenticated users can read knowledge chunks"
  on public.knowledge_chunks for select
  to authenticated
  using (true);

-- Inserts/deletes are handled by the service role in the ingestion pipeline only
