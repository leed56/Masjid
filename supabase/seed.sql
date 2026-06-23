-- Seed data for local development / pilot masjid

insert into masjids (id, name, type, address, district, city, default_monthly_fee, status)
values (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'Masjid Al-Noor',
  'jumma',
  '12 Main Street, Wellampitiya',
  'Colombo',
  'Wellampitiya',
  500.00,
  'active'
);

insert into funds (masjid_id, name, type, opening_balance, current_balance, visibility)
values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Monthly Fee Fund',   'monthly_fee',      0, 0, 'private'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Development Fund',   'development',       0, 0, 'public'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Ramadan Fund',       'ramadan',           0, 0, 'public'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Janaza Support Fund','janaza_support',    0, 0, 'private'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'General Donation',   'general_donation',  0, 0, 'public');
