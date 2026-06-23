-- ── Ramadan Programs ────────────────────────────────────────────────────────
create table if not exists ramadan_programs (
  id              uuid primary key default gen_random_uuid(),
  masjid_id       uuid not null references masjids(id) on delete cascade,
  hijri_year      int  not null,
  gregorian_year  int  not null,
  iftar_time      time,
  sehri_time      time,
  tarawih_time    time,
  tarawih_rakats  int  default 20,
  imam_name       text,
  hafiz_name      text,
  sponsor_name    text,
  daily_ifthar_budget numeric(10,2),
  notes           text,
  created_at      timestamptz default now()
);

create table if not exists ramadan_ifthar_sponsors (
  id              uuid primary key default gen_random_uuid(),
  masjid_id       uuid not null references masjids(id) on delete cascade,
  program_id      uuid references ramadan_programs(id) on delete cascade,
  sponsor_name    text not null,
  phone           text,
  date            date not null,
  amount          numeric(10,2),
  is_confirmed    boolean default false,
  notes           text,
  created_at      timestamptz default now()
);

-- ── Jumma Guest Moulavi ──────────────────────────────────────────────────────
create table if not exists jumma_programs (
  id              uuid primary key default gen_random_uuid(),
  masjid_id       uuid not null references masjids(id) on delete cascade,
  jumma_date      date not null,
  moulavi_name    text not null,
  moulavi_phone   text,
  topic           text,
  fee_amount      numeric(10,2) default 0,
  fee_paid        boolean default false,
  fund_id         uuid references funds(id),
  transport       text,
  notes           text,
  created_at      timestamptz default now(),
  created_by      uuid references auth.users(id)
);

-- ── Madarsa ─────────────────────────────────────────────────────────────────
create table if not exists madarsa_classes (
  id              uuid primary key default gen_random_uuid(),
  masjid_id       uuid not null references masjids(id) on delete cascade,
  name            text not null,
  grade_level     text,
  teacher_staff_id uuid references staff(id),
  schedule        text,
  max_students    int,
  fee_per_month   numeric(10,2) default 0,
  created_at      timestamptz default now()
);

create table if not exists madarsa_students (
  id              uuid primary key default gen_random_uuid(),
  masjid_id       uuid not null references masjids(id) on delete cascade,
  class_id        uuid references madarsa_classes(id) on delete cascade,
  member_id       uuid references members(id),
  full_name       text not null,
  date_of_birth   date,
  guardian_name   text,
  guardian_phone  text,
  enrolled_date   date default current_date,
  status          text default 'active' check (status in ('active','inactive','graduated')),
  created_at      timestamptz default now()
);

create table if not exists madarsa_fees (
  id              uuid primary key default gen_random_uuid(),
  masjid_id       uuid not null references masjids(id) on delete cascade,
  student_id      uuid not null references madarsa_students(id) on delete cascade,
  year            int  not null,
  month           int  not null check (month between 1 and 12),
  amount_due      numeric(10,2) not null,
  amount_paid     numeric(10,2) default 0,
  status          text default 'unpaid' check (status in ('unpaid','paid','partial','waived')),
  paid_date       date,
  created_at      timestamptz default now(),
  unique (student_id, year, month)
);

-- ── Development Projects ─────────────────────────────────────────────────────
create table if not exists development_projects (
  id              uuid primary key default gen_random_uuid(),
  masjid_id       uuid not null references masjids(id) on delete cascade,
  title           text not null,
  description     text,
  target_amount   numeric(12,2) not null,
  raised_amount   numeric(12,2) default 0,
  fund_id         uuid references funds(id),
  status          text default 'active' check (status in ('active','completed','paused','cancelled')),
  start_date      date,
  target_date     date,
  cover_image_url text,
  created_at      timestamptz default now(),
  created_by      uuid references auth.users(id)
);

create table if not exists project_donations (
  id              uuid primary key default gen_random_uuid(),
  masjid_id       uuid not null references masjids(id) on delete cascade,
  project_id      uuid not null references development_projects(id) on delete cascade,
  donor_name      text not null,
  donor_phone     text,
  amount          numeric(10,2) not null,
  method          text,
  donated_at      date default current_date,
  notes           text,
  created_at      timestamptz default now()
);

-- ── RLS (permissive for masjid members/admins) ───────────────────────────────
alter table ramadan_programs       enable row level security;
alter table ramadan_ifthar_sponsors enable row level security;
alter table jumma_programs         enable row level security;
alter table madarsa_classes        enable row level security;
alter table madarsa_students       enable row level security;
alter table madarsa_fees           enable row level security;
alter table development_projects   enable row level security;
alter table project_donations      enable row level security;

-- Allow masjid members to read; admins/treasurers to write
do $$
declare
  t text;
begin
  foreach t in array array[
    'ramadan_programs','ramadan_ifthar_sponsors',
    'jumma_programs',
    'madarsa_classes','madarsa_students','madarsa_fees',
    'development_projects','project_donations'
  ] loop
    execute format(
      'create policy "%s_member_read" on %I for select using (
        get_my_role(masjid_id) is not null
      )', t, t
    );
    execute format(
      'create policy "%s_admin_write" on %I for all using (
        get_my_role(masjid_id) in (''super_admin'',''masjid_admin'',''treasurer'',''secretary'')
      ) with check (
        get_my_role(masjid_id) in (''super_admin'',''masjid_admin'',''treasurer'',''secretary'')
      )', t, t
    );
  end loop;
end $$;

-- Indexes
create index idx_ramadan_masjid    on ramadan_programs(masjid_id, gregorian_year);
create index idx_jumma_masjid_date on jumma_programs(masjid_id, jumma_date);
create index idx_madarsa_students  on madarsa_students(masjid_id, class_id, status);
create index idx_madarsa_fees      on madarsa_fees(masjid_id, year, month, status);
create index idx_dev_projects      on development_projects(masjid_id, status);
