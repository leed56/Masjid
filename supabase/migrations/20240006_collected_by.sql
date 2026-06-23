-- Add collector tracking to payments
alter table payments add column if not exists collected_by uuid references auth.users(id);
create index if not exists idx_payments_collected_by on payments(collected_by, payment_date);
