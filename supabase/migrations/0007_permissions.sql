-- Replace the single admin/user role with five independent permission toggles.

alter table public.profiles
  add column can_view_history       boolean not null default false,
  add column can_create_battlecards boolean not null default false,
  add column can_edit_us            boolean not null default false,
  add column can_edit_them          boolean not null default false,
  add column can_manage_users       boolean not null default false;

-- Backfill: the current admin(s) keep full access across all five permissions.
update public.profiles
set can_view_history = true,
    can_create_battlecards = true,
    can_edit_us = true,
    can_edit_them = true,
    can_manage_users = true
where role = 'admin';

alter table public.profiles drop column role;

-- Profiles RLS: "admin" read-all becomes "can_manage_users" read-all
drop policy if exists "Admins can read all profiles" on public.profiles;

create policy "Users who manage users can read all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and can_manage_users = true
    )
  );

-- Competitors RLS: split by is_genea between can_edit_us and can_edit_them.
-- Actual enforcement lives in the Next.js route handlers (service-role client
-- bypasses RLS there); these policies are a defense-in-depth backstop.
drop policy if exists "Authenticated users can read active competitors" on public.competitors;
drop policy if exists "Admins can insert competitors" on public.competitors;
drop policy if exists "Admins can update competitors" on public.competitors;

create policy "Authenticated users can read active or editable competitors"
  on public.competitors for select
  to authenticated
  using (
    active = true
    or exists (
      select 1 from public.profiles
      where id = auth.uid()
        and (
          (competitors.is_genea = true and can_edit_us = true)
          or (competitors.is_genea = false and can_edit_them = true)
        )
    )
  );

create policy "Editors can insert competitors"
  on public.competitors for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and (
          (competitors.is_genea = true and can_edit_us = true)
          or (competitors.is_genea = false and can_edit_them = true)
        )
    )
  );

create policy "Editors can update competitors"
  on public.competitors for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and (
          (competitors.is_genea = true and can_edit_us = true)
          or (competitors.is_genea = false and can_edit_them = true)
        )
    )
  );
