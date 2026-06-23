-- Row Level Security Policies for MasjidHub LK

-- Helper function: get the caller's role for a given masjid
create or replace function get_my_role(p_masjid_id uuid)
returns text language sql security definer stable as $$
  select role from masjid_users
  where masjid_id = p_masjid_id
    and user_id = auth.uid()
    and status = 'active'
  limit 1;
$$;

-- ─── MASJIDS ────────────────────────────────────────────────────────────────
alter table masjids enable row level security;

create policy "public can view active masjids"
  on masjids for select
  using (status = 'active');

create policy "masjid admin can update own masjid"
  on masjids for update
  using (get_my_role(id) in ('masjid_admin','super_admin'));

-- ─── MASJID_USERS ───────────────────────────────────────────────────────────
alter table masjid_users enable row level security;

create policy "users can view own masjid memberships"
  on masjid_users for select
  using (user_id = auth.uid());

create policy "admin can manage masjid users"
  on masjid_users for all
  using (get_my_role(masjid_id) in ('masjid_admin','super_admin'));

-- ─── MEMBERS ────────────────────────────────────────────────────────────────
alter table members enable row level security;

create policy "admin/treasurer/collector can view members"
  on members for select
  using (get_my_role(masjid_id) in ('masjid_admin','treasurer','secretary','collector'));

create policy "member can view own record"
  on members for select
  using (
    email = (select email from auth.users where id = auth.uid())
    or phone = (select phone from auth.users where id = auth.uid())
  );

create policy "admin/secretary can manage members"
  on members for all
  using (get_my_role(masjid_id) in ('masjid_admin','secretary'));

-- ─── FUNDS ──────────────────────────────────────────────────────────────────
alter table funds enable row level security;

create policy "public funds visible to all masjid users"
  on funds for select
  using (
    visibility = 'public'
    or get_my_role(masjid_id) in ('masjid_admin','treasurer','secretary','collector')
  );

create policy "admin/treasurer can manage funds"
  on funds for all
  using (get_my_role(masjid_id) in ('masjid_admin','treasurer'));

-- ─── PAYMENTS ───────────────────────────────────────────────────────────────
alter table payments enable row level security;

create policy "treasurer/admin can view all payments"
  on payments for select
  using (get_my_role(masjid_id) in ('masjid_admin','treasurer','collector'));

create policy "member can view own payments"
  on payments for select
  using (
    member_id in (
      select id from members
      where email = (select email from auth.users where id = auth.uid())
    )
  );

create policy "treasurer/collector can insert payments"
  on payments for insert
  with check (get_my_role(masjid_id) in ('masjid_admin','treasurer','collector'));

create policy "treasurer can approve/reject payments"
  on payments for update
  using (get_my_role(masjid_id) in ('masjid_admin','treasurer'));

-- ─── MEMBER MONTHLY FEES ────────────────────────────────────────────────────
alter table member_monthly_fees enable row level security;

create policy "admin/treasurer can view all monthly fees"
  on member_monthly_fees for select
  using (get_my_role(masjid_id) in ('masjid_admin','treasurer','collector','secretary'));

create policy "member can view own monthly fees"
  on member_monthly_fees for select
  using (
    member_id in (
      select id from members
      where email = (select email from auth.users where id = auth.uid())
    )
  );

-- ─── RECEIPTS ───────────────────────────────────────────────────────────────
alter table receipts enable row level security;

create policy "admin/treasurer can view receipts"
  on receipts for select
  using (get_my_role(masjid_id) in ('masjid_admin','treasurer'));

create policy "member can view own receipts"
  on receipts for select
  using (
    member_id in (
      select id from members
      where email = (select email from auth.users where id = auth.uid())
    )
  );

-- ─── EXPENSES ───────────────────────────────────────────────────────────────
alter table expenses enable row level security;

create policy "admin/treasurer can manage expenses"
  on expenses for all
  using (
    get_my_role(masjid_id) in ('masjid_admin','treasurer')
    and deleted_at is null
  );

-- ─── STAFF ──────────────────────────────────────────────────────────────────
alter table staff enable row level security;

create policy "admin/treasurer can view staff"
  on staff for select
  using (get_my_role(masjid_id) in ('masjid_admin','treasurer','secretary'));

create policy "admin can manage staff"
  on staff for all
  using (get_my_role(masjid_id) in ('masjid_admin'));

-- ─── STAFF SALARIES ─────────────────────────────────────────────────────────
alter table staff_salaries enable row level security;

create policy "admin/treasurer can manage salaries"
  on staff_salaries for all
  using (get_my_role(masjid_id) in ('masjid_admin','treasurer'));

-- ─── ANNOUNCEMENTS ──────────────────────────────────────────────────────────
alter table announcements enable row level security;

create policy "public announcements visible to all"
  on announcements for select
  using (
    (status = 'published' and audience = 'public')
    or get_my_role(masjid_id) in ('masjid_admin','secretary','treasurer','collector','moulavi','muazzin')
  );

create policy "admin/secretary can manage announcements"
  on announcements for all
  using (get_my_role(masjid_id) in ('masjid_admin','secretary'));

-- ─── JANAZA ANNOUNCEMENTS ───────────────────────────────────────────────────
alter table janaza_announcements enable row level security;

create policy "public janaza visible to all"
  on janaza_announcements for select
  using (
    visibility = 'public'
    or get_my_role(masjid_id) is not null
  );

create policy "admin/secretary can manage janaza"
  on janaza_announcements for all
  using (get_my_role(masjid_id) in ('masjid_admin','secretary'));

-- ─── NOTIFICATIONS ──────────────────────────────────────────────────────────
alter table notifications enable row level security;

create policy "user can view own notifications"
  on notifications for select
  using (user_id = auth.uid());

create policy "user can mark own notifications read"
  on notifications for update
  using (user_id = auth.uid());

-- ─── AUDIT LOGS ─────────────────────────────────────────────────────────────
alter table audit_logs enable row level security;

create policy "admin can view audit logs"
  on audit_logs for select
  using (get_my_role(masjid_id) in ('masjid_admin','treasurer'));

-- audit logs are insert-only; no update/delete
create policy "system can insert audit logs"
  on audit_logs for insert
  with check (true);
