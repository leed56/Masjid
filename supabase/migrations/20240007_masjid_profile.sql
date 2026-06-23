-- Extended masjid profile fields
alter table masjids
  add column if not exists registration_number text,
  add column if not exists address             text,
  add column if not exists district            text,
  add column if not exists phone               text,
  add column if not exists mobile              text,
  add column if not exists email               text,
  add column if not exists website             text,
  add column if not exists letterhead_url      text,
  add column if not exists bank_name           text,
  add column if not exists bank_account        text,
  add column if not exists bank_branch         text,
  add column if not exists imam_name           text,
  add column if not exists secretary_name      text,
  add column if not exists chairperson_name    text,
  add column if not exists profile_complete    boolean default false,
  add column if not exists setup_step          int     default 1,
  add column if not exists created_by_admin    uuid    references auth.users(id);

-- Super admin role tracked in a separate table (not masjid-scoped)
create table if not exists super_admins (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  created_at timestamptz default now()
);

-- Only super_admins can read this table (server-side via service role)
alter table super_admins enable row level security;
create policy "super_admin_self_read" on super_admins
  for select using (auth.uid() = id);
