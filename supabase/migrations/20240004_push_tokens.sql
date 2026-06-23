-- Push tokens table for Expo push notifications
create table if not exists push_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  masjid_id   uuid not null references masjids(id) on delete cascade,
  token       text not null,
  platform    text check (platform in ('ios','android','web')),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique (user_id, token)
);

alter table push_tokens enable row level security;

-- Users can manage their own tokens
create policy "Users manage own push tokens"
  on push_tokens for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_push_tokens_masjid on push_tokens(masjid_id);
