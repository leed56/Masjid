-- MasjidHub LK — Initial Schema
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── MASJIDS ────────────────────────────────────────────────────────────────
create table masjids (
  id                  uuid primary key default uuid_generate_v4(),
  name                text not null,
  type                text not null check (type in ('jumma','masjid','thakkiya','madrasa_attached','other')),
  registration_number text,
  address             text not null,
  district            text not null,
  city                text not null,
  gps_lat             numeric,
  gps_lng             numeric,
  phone               text,
  email               text,
  president_name      text,
  secretary_name      text,
  treasurer_name      text,
  bank_account_name   text,
  bank_name           text,
  bank_branch         text,
  bank_account_number text,
  logo_url            text,
  photo_url           text,
  jumma_prayer_time   text,
  default_monthly_fee numeric(10,2) not null default 0,
  language_preference text not null default 'en' check (language_preference in ('en','ta','si')),
  timezone            text not null default 'Asia/Colombo',
  status              text not null default 'pending' check (status in ('active','inactive','pending')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ─── MASJID USERS (roles) ───────────────────────────────────────────────────
create table masjid_users (
  id         uuid primary key default uuid_generate_v4(),
  masjid_id  uuid not null references masjids(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null check (role in (
               'super_admin','masjid_admin','treasurer','secretary',
               'collector','moulavi','muazzin','madarsa_admin','member','public'
             )),
  status     text not null default 'invited' check (status in ('active','inactive','invited')),
  created_at timestamptz not null default now(),
  unique (masjid_id, user_id)
);

-- ─── FAMILIES ───────────────────────────────────────────────────────────────
create table families (
  id                 uuid primary key default uuid_generate_v4(),
  masjid_id          uuid not null references masjids(id) on delete cascade,
  family_name        text not null,
  head_of_family_id  uuid,
  address            text not null,
  area               text not null,
  collector_id       uuid,
  monthly_fee_plan   numeric(10,2),
  category           text not null default 'standard'
                       check (category in ('standard','poor','sponsor_supported','committee','exempted')),
  created_at         timestamptz not null default now()
);

-- ─── MEMBERS ────────────────────────────────────────────────────────────────
create table members (
  id                   uuid primary key default uuid_generate_v4(),
  masjid_id            uuid not null references masjids(id) on delete cascade,
  family_id            uuid references families(id),
  member_code          text not null,
  full_name            text not null,
  phone                text,
  whatsapp             text,
  email                text,
  nic                  text,
  address              text not null,
  area                 text not null,
  district             text,
  family_members_count integer,
  gender               text check (gender in ('male','female')),
  occupation           text,
  monthly_fee_amount   numeric(10,2) not null default 0,
  fee_category         text not null default 'standard'
                         check (fee_category in ('standard','reduced','exempted','sponsored')),
  collector_id         uuid,
  registered_date      date not null default current_date,
  status               text not null default 'active'
                         check (status in ('active','inactive','moved','deceased','exempted')),
  notes                text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (masjid_id, member_code)
);

-- ─── FUNDS ──────────────────────────────────────────────────────────────────
create table funds (
  id              uuid primary key default uuid_generate_v4(),
  masjid_id       uuid not null references masjids(id) on delete cascade,
  name            text not null,
  type            text not null check (type in (
                    'monthly_fee','ramadan','development','well_wisher','madarsa',
                    'janaza_support','zakat','sadaqah','utility','jumma_guest','general_donation'
                  )),
  opening_balance numeric(12,2) not null default 0,
  current_balance numeric(12,2) not null default 0,
  visibility      text not null default 'private' check (visibility in ('public','private')),
  is_restricted   boolean not null default false,
  status          text not null default 'active' check (status in ('active','closed')),
  created_at      timestamptz not null default now()
);

-- ─── PAYMENTS ───────────────────────────────────────────────────────────────
create table payments (
  id               uuid primary key default uuid_generate_v4(),
  masjid_id        uuid not null references masjids(id) on delete cascade,
  member_id        uuid not null references members(id),
  fund_id          uuid not null references funds(id),
  amount           numeric(12,2) not null,
  method           text not null check (method in ('cash','bank_transfer','cheque','other')),
  status           text not null default 'pending'
                     check (status in ('pending','approved','rejected','voided')),
  payment_date     date not null default current_date,
  reference_no     text,
  slip_url         text,
  collected_by     uuid,
  approved_by      uuid,
  receipt_id       uuid,
  rejection_reason text,
  rejection_notes  text,
  notes            text,
  created_at       timestamptz not null default now()
);

-- ─── MEMBER MONTHLY FEES ────────────────────────────────────────────────────
create table member_monthly_fees (
  id          uuid primary key default uuid_generate_v4(),
  masjid_id   uuid not null references masjids(id) on delete cascade,
  member_id   uuid not null references members(id),
  year        integer not null,
  month       integer not null check (month between 1 and 12),
  amount_due  numeric(10,2) not null,
  amount_paid numeric(10,2) not null default 0,
  status      text not null default 'unpaid'
                check (status in ('not_generated','unpaid','partially_paid','paid','waived','sponsored','overdue')),
  due_date    date not null,
  unique (member_id, year, month)
);

-- ─── RECEIPTS ───────────────────────────────────────────────────────────────
create table receipts (
  id             uuid primary key default uuid_generate_v4(),
  masjid_id      uuid not null references masjids(id) on delete cascade,
  receipt_number text not null,
  payment_id     uuid not null references payments(id),
  member_id      uuid not null references members(id),
  amount         numeric(12,2) not null,
  method         text not null,
  fund_id        uuid not null references funds(id),
  received_by    uuid not null,
  approved_by    uuid not null,
  pdf_url        text,
  voided         boolean not null default false,
  void_reason    text,
  created_at     timestamptz not null default now(),
  unique (masjid_id, receipt_number)
);

-- back-fill receipts.id into payments
alter table payments add constraint payments_receipt_fk
  foreign key (receipt_id) references receipts(id) deferrable initially deferred;

-- ─── EXPENSES ───────────────────────────────────────────────────────────────
create table expenses (
  id           uuid primary key default uuid_generate_v4(),
  masjid_id    uuid not null references masjids(id) on delete cascade,
  fund_id      uuid not null references funds(id),
  category     text not null,
  amount       numeric(12,2) not null,
  expense_date date not null default current_date,
  paid_to      text,
  method       text,
  bill_url     text,
  approved_by  uuid,
  notes        text,
  status       text not null default 'draft'
                 check (status in ('draft','pending','approved','rejected','paid')),
  deleted_at   timestamptz,
  created_at   timestamptz not null default now()
);

-- ─── STAFF ──────────────────────────────────────────────────────────────────
create table staff (
  id             uuid primary key default uuid_generate_v4(),
  masjid_id      uuid not null references masjids(id) on delete cascade,
  full_name      text not null,
  role           text not null check (role in (
                   'head_moulavi','muazzin','assistant_moulavi','madarsa_teacher',
                   'cleaner','security','office_helper','ramadan_temp','guest_speaker'
                 )),
  phone          text,
  address        text,
  start_date     date not null,
  salary_amount  numeric(10,2) not null,
  salary_cycle   text not null check (salary_cycle in ('monthly','weekly','per_event','per_class')),
  bank_details   text,
  status         text not null default 'active' check (status in ('active','inactive')),
  created_at     timestamptz not null default now()
);

-- ─── STAFF SALARIES ─────────────────────────────────────────────────────────
create table staff_salaries (
  id                uuid primary key default uuid_generate_v4(),
  staff_id          uuid not null references staff(id),
  masjid_id         uuid not null references masjids(id) on delete cascade,
  month             integer not null check (month between 1 and 12),
  year              integer not null,
  basic_salary      numeric(10,2) not null,
  allowance         numeric(10,2) not null default 0,
  advance_deduction numeric(10,2) not null default 0,
  bonus             numeric(10,2) not null default 0,
  net_paid          numeric(10,2) not null,
  paid_date         date,
  method            text,
  voucher_url       text,
  notes             text,
  paid              boolean not null default false,
  created_at        timestamptz not null default now(),
  unique (staff_id, year, month)
);

-- ─── ANNOUNCEMENTS ──────────────────────────────────────────────────────────
create table announcements (
  id          uuid primary key default uuid_generate_v4(),
  masjid_id   uuid not null references masjids(id) on delete cascade,
  category    text not null check (category in (
                'general','janaza','jumma','ramadan','madarsa',
                'development_appeal','payment_reminder','emergency','volunteer'
              )),
  title       text not null,
  body        text not null,
  audience    text not null default 'all_members' check (audience in (
                'all_members','selected_area','unpaid_members',
                'donors','madarsa_parents','committee','public'
              )),
  priority    text not null default 'normal' check (priority in ('normal','high','urgent')),
  publish_at  timestamptz,
  expires_at  timestamptz,
  image_url   text,
  created_by  uuid not null,
  approved_by uuid,
  status      text not null default 'draft'
                check (status in ('draft','scheduled','published','archived')),
  created_at  timestamptz not null default now()
);

-- ─── JANAZA ANNOUNCEMENTS ───────────────────────────────────────────────────
create table janaza_announcements (
  id             uuid primary key default uuid_generate_v4(),
  masjid_id      uuid not null references masjids(id) on delete cascade,
  deceased_name  text not null,
  gender         text check (gender in ('male','female')),
  age            integer,
  area           text not null,
  family_relation text,
  janaza_time    timestamptz not null,
  burial_place   text not null,
  contact_person text,
  message        text,
  visibility     text not null default 'members_only' check (visibility in ('public','members_only')),
  approved_by    uuid,
  created_by     uuid not null,
  created_at     timestamptz not null default now()
);

-- ─── NOTIFICATIONS ──────────────────────────────────────────────────────────
create table notifications (
  id          uuid primary key default uuid_generate_v4(),
  masjid_id   uuid not null references masjids(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  body        text not null,
  category    text not null,
  deep_link   text,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ─── AUDIT LOGS ─────────────────────────────────────────────────────────────
create table audit_logs (
  id            uuid primary key default uuid_generate_v4(),
  masjid_id     uuid not null references masjids(id) on delete cascade,
  actor_user_id uuid not null,
  action        text not null,
  entity_type   text not null,
  entity_id     text not null,
  before_data   jsonb,
  after_data    jsonb,
  created_at    timestamptz not null default now()
);

-- ─── SUBSCRIPTIONS ──────────────────────────────────────────────────────────
create table subscriptions (
  id          uuid primary key default uuid_generate_v4(),
  masjid_id   uuid not null references masjids(id) on delete cascade,
  plan        text not null check (plan in ('free','basic','pro','premium')),
  status      text not null default 'active' check (status in ('active','expired','cancelled')),
  starts_at   date not null,
  expires_at  date not null,
  created_at  timestamptz not null default now()
);

-- ─── INDEXES ────────────────────────────────────────────────────────────────
create index on members (masjid_id, status);
create index on members (masjid_id, area);
create index on members (masjid_id, collector_id);
create index on payments (masjid_id, status);
create index on payments (masjid_id, member_id);
create index on member_monthly_fees (masjid_id, status);
create index on member_monthly_fees (member_id, year, month);
create index on expenses (masjid_id, status);
create index on announcements (masjid_id, status);
create index on audit_logs (masjid_id, created_at desc);
