-- Battle cards: one row per generated card
create table public.battle_cards (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  decision_maker    text not null,
  vertical          text not null,
  product_category  text not null,
  competitor_ids    uuid[] not null,
  generated_content jsonb not null default '{}',
  source_citations  jsonb not null default '[]',
  pdf_url           text,
  created_at        timestamptz not null default now()
);

create index battle_cards_user_id_idx
  on public.battle_cards(user_id);

create index battle_cards_created_at_idx
  on public.battle_cards(created_at desc);

-- Full-text search index on generated content
create index battle_cards_content_fts
  on public.battle_cards
  using gin(to_tsvector('english', generated_content::text));

-- RLS
alter table public.battle_cards enable row level security;

create policy "Users can read own battle cards"
  on public.battle_cards for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can insert own battle cards"
  on public.battle_cards for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own battle cards"
  on public.battle_cards for update
  to authenticated
  using (user_id = auth.uid());

create policy "Users can delete own battle cards"
  on public.battle_cards for delete
  to authenticated
  using (user_id = auth.uid());
