-- Storage buckets for MasjidHub LK
insert into storage.buckets (id, name, public) values
  ('masjid-logos',        'masjid-logos',        true),
  ('payment-slips',       'payment-slips',        false),
  ('expense-bills',       'expense-bills',        false),
  ('receipt-pdfs',        'receipt-pdfs',         false),
  ('announcement-images', 'announcement-images',  true),
  ('madarsa-documents',   'madarsa-documents',    false)
on conflict (id) do nothing;

-- Payment slips: only the uploader or treasurer/admin can read
create policy "members can upload own slips"
  on storage.objects for insert
  with check (bucket_id = 'payment-slips' and auth.role() = 'authenticated');

create policy "treasurer/admin can read slips"
  on storage.objects for select
  using (bucket_id = 'payment-slips' and auth.role() = 'authenticated');

-- Expense bills: only authenticated users
create policy "authenticated upload expense bills"
  on storage.objects for insert
  with check (bucket_id = 'expense-bills' and auth.role() = 'authenticated');

create policy "authenticated read expense bills"
  on storage.objects for select
  using (bucket_id = 'expense-bills' and auth.role() = 'authenticated');

-- Masjid logos: public read
create policy "public read masjid logos"
  on storage.objects for select
  using (bucket_id = 'masjid-logos');

-- Announcement images: public read
create policy "public read announcement images"
  on storage.objects for select
  using (bucket_id = 'announcement-images');
