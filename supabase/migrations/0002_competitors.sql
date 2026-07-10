-- Competitors: includes Genea itself (is_genea = true) and all external competitors
create table public.competitors (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  is_genea            boolean not null default false,
  logo_url            text,
  website             text,
  help_center_url     text,
  release_notes_urls  jsonb not null default '[]',
  product_news_urls   jsonb not null default '[]',
  documentation_urls  jsonb not null default '[]',
  serper_terms        jsonb not null default '[]',
  active              boolean not null default true,
  notes               text,
  last_refresh_at     timestamptz,
  refresh_status      text check (refresh_status in ('idle', 'running', 'success', 'error')),
  refresh_error       text,
  doc_count           integer not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger competitors_updated_at
  before update on public.competitors
  for each row execute procedure public.set_updated_at();

-- RLS
alter table public.competitors enable row level security;

create policy "Authenticated users can read active competitors"
  on public.competitors for select
  to authenticated
  using (active = true or exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ));

create policy "Admins can insert competitors"
  on public.competitors for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update competitors"
  on public.competitors for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
