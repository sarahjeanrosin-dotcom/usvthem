-- Few-shot battle card templates: curated example cards Claude references at generation time.

create table public.battle_card_templates (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  decision_maker    text not null,
  vertical          text not null,
  product_category  text not null,
  content           jsonb not null default '{}',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger battle_card_templates_updated_at
  before update on public.battle_card_templates
  for each row execute procedure public.set_updated_at();

alter table public.profiles
  add column can_manage_templates boolean not null default false;

-- Whoever already manages users/permissions keeps full access to templates too.
update public.profiles
set can_manage_templates = true
where can_manage_users = true;

alter table public.battle_card_templates enable row level security;

create policy "Template managers can read templates"
  on public.battle_card_templates for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and can_manage_templates = true
    )
  );

create policy "Template managers can insert templates"
  on public.battle_card_templates for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and can_manage_templates = true
    )
  );

create policy "Template managers can update templates"
  on public.battle_card_templates for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and can_manage_templates = true
    )
  );

create policy "Template managers can delete templates"
  on public.battle_card_templates for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and can_manage_templates = true
    )
  );
