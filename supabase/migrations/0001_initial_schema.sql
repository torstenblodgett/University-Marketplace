-- ============================================================
-- McGill Marketplace — Initial Schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm; -- for full-text search

-- ============================================================
-- ENUMS
-- ============================================================

create type listing_type   as enum ('good', 'service');
create type listing_status as enum ('active', 'sold', 'removed');
create type report_status  as enum ('pending', 'reviewed', 'resolved');
create type category       as enum (
  'textbooks', 'furniture', 'electronics', 'clothing',
  'winter_gear', 'other_goods', 'tutoring', 'moving',
  'cleaning', 'other_services'
);

-- ============================================================
-- PROFILES
-- Mirrors auth.users 1-to-1. Created on first sign-in.
-- ============================================================

create table profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  email          text not null unique,
  display_name   text not null,
  bio            text,
  is_admin       boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  -- Enforce McGill email at DB level
  constraint profiles_mcgill_email check (
    email like '%@mail.mcgill.ca' or email like '%@mcgill.ca'
  )
);

-- Auto-update updated_at
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGN-UP
-- Backup to the /auth/callback route handler.
-- ============================================================

create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- LISTINGS
-- ============================================================

create table listings (
  id           uuid primary key default uuid_generate_v4(),
  seller_id    uuid not null references profiles(id) on delete cascade,
  title        text not null,
  description  text not null,
  price        numeric(10,2),           -- null = free / negotiable
  listing_type listing_type not null default 'good',
  category     category not null,
  status       listing_status not null default 'active',
  location     text,
  availability text,                    -- services only
  service_area text,                    -- services only
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint listings_price_positive check (price is null or price >= 0),
  constraint listings_service_fields check (
    listing_type = 'service' or (availability is null and service_area is null)
  )
);

create trigger listings_updated_at
  before update on listings
  for each row execute function set_updated_at();

-- Indexes for search and filtering
create index listings_seller_id_idx  on listings(seller_id);
create index listings_status_idx     on listings(status);
create index listings_category_idx   on listings(category);
create index listings_created_at_idx on listings(created_at desc);

-- Full-text search index
create index listings_fts_idx on listings
  using gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));

-- ============================================================
-- CONVERSATIONS
-- One per (listing, buyer) pair. seller = listing.seller_id.
-- ============================================================

create table conversations (
  id         uuid primary key default uuid_generate_v4(),
  listing_id uuid not null references listings(id) on delete cascade,
  buyer_id   uuid not null references profiles(id) on delete cascade,
  seller_id  uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint conversations_no_self_message check (buyer_id <> seller_id),
  constraint conversations_unique_pair unique (listing_id, buyer_id)
);

create trigger conversations_updated_at
  before update on conversations
  for each row execute function set_updated_at();

create index conversations_buyer_id_idx  on conversations(buyer_id);
create index conversations_seller_id_idx on conversations(seller_id);

-- ============================================================
-- MESSAGES
-- ============================================================

create table messages (
  id              uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id       uuid not null references profiles(id) on delete cascade,
  body            text not null,
  read_at         timestamptz,
  created_at      timestamptz not null default now(),

  constraint messages_body_length check (char_length(body) between 1 and 2000)
);

create index messages_conversation_id_idx on messages(conversation_id);
create index messages_sender_id_idx       on messages(sender_id);
create index messages_created_at_idx      on messages(created_at);

-- Bump conversation.updated_at whenever a message is inserted
create or replace function bump_conversation_updated_at()
returns trigger language plpgsql as $$
begin
  update conversations set updated_at = now() where id = new.conversation_id;
  return new;
end;
$$;

create trigger messages_bump_conversation
  after insert on messages
  for each row execute function bump_conversation_updated_at();

-- ============================================================
-- REVIEWS
-- Buyer reviews seller after a completed transaction.
-- ============================================================

create table reviews (
  id              uuid primary key default uuid_generate_v4(),
  reviewer_id     uuid not null references profiles(id) on delete cascade,
  reviewee_id     uuid not null references profiles(id) on delete cascade,
  listing_id      uuid references listings(id) on delete set null,
  rating          smallint not null,
  comment         text,
  created_at      timestamptz not null default now(),

  constraint reviews_rating_range check (rating between 1 and 5),
  constraint reviews_no_self_review check (reviewer_id <> reviewee_id),
  constraint reviews_unique_per_listing unique (reviewer_id, listing_id)
);

create index reviews_reviewee_id_idx on reviews(reviewee_id);

-- ============================================================
-- REPORTS
-- ============================================================

create table reports (
  id          uuid primary key default uuid_generate_v4(),
  reporter_id uuid not null references profiles(id) on delete cascade,
  listing_id  uuid references listings(id) on delete set null,
  reason      text not null,
  details     text,
  status      report_status not null default 'pending',
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);

create index reports_status_idx on reports(status);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles      enable row level security;
alter table listings      enable row level security;
alter table conversations enable row level security;
alter table messages      enable row level security;
alter table reviews       enable row level security;
alter table reports       enable row level security;

-- Helper: is the current user email-verified?
create or replace function auth_is_verified()
returns boolean language sql security definer stable as $$
  select coalesce(
    (select email_confirmed_at is not null
     from auth.users where id = auth.uid()),
    false
  );
$$;

-- Helper: is the current user an admin?
create or replace function auth_is_admin()
returns boolean language sql security definer stable as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

-- ---- PROFILES ----

-- Anyone can read profiles (display names, etc.)
create policy "profiles_select_public"
  on profiles for select using (true);

-- Users can only update their own profile (not is_admin)
create policy "profiles_update_own"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and is_admin = (select is_admin from profiles where id = auth.uid()));

-- ---- LISTINGS ----

-- Anyone can read active listings
create policy "listings_select_active"
  on listings for select using (status = 'active' or seller_id = auth.uid() or auth_is_admin());

-- Only verified users can create listings
create policy "listings_insert_verified"
  on listings for insert
  with check (auth.uid() = seller_id and auth_is_verified());

-- Seller can update their own listing; admin can update any
create policy "listings_update_own"
  on listings for update
  using (seller_id = auth.uid() or auth_is_admin())
  with check (seller_id = auth.uid() or auth_is_admin());

-- No hard deletes — use status = 'removed' instead
create policy "listings_no_delete"
  on listings for delete using (false);

-- ---- CONVERSATIONS ----

-- Only participants can see their conversations
create policy "conversations_select_participants"
  on conversations for select
  using (buyer_id = auth.uid() or seller_id = auth.uid() or auth_is_admin());

-- Only verified users can start conversations (buyer_id = self)
create policy "conversations_insert_verified"
  on conversations for insert
  with check (auth.uid() = buyer_id and auth_is_verified());

-- No updates or deletes by users
create policy "conversations_no_update" on conversations for update using (false);
create policy "conversations_no_delete" on conversations for delete using (false);

-- ---- MESSAGES ----

-- Only conversation participants can read messages
create policy "messages_select_participants"
  on messages for select
  using (
    auth.uid() in (
      select buyer_id from conversations where id = conversation_id
      union
      select seller_id from conversations where id = conversation_id
    )
    or auth_is_admin()
  );

-- Only verified participants can send messages
create policy "messages_insert_participant"
  on messages for insert
  with check (
    auth.uid() = sender_id
    and auth_is_verified()
    and auth.uid() in (
      select buyer_id from conversations where id = conversation_id
      union
      select seller_id from conversations where id = conversation_id
    )
  );

-- No updates; read receipts via update on read_at only for recipient
create policy "messages_update_read_at"
  on messages for update
  using (
    auth.uid() <> sender_id
    and auth.uid() in (
      select buyer_id from conversations where id = conversation_id
      union
      select seller_id from conversations where id = conversation_id
    )
  )
  with check (read_at is not null);

create policy "messages_no_delete" on messages for delete using (false);

-- ---- REVIEWS ----

create policy "reviews_select_public"   on reviews for select using (true);
create policy "reviews_insert_verified" on reviews for insert
  with check (auth.uid() = reviewer_id and auth_is_verified());
create policy "reviews_no_update"  on reviews for update using (false);
create policy "reviews_no_delete"  on reviews for delete using (false);

-- ---- REPORTS ----

-- Only admins can read reports
create policy "reports_select_admin"  on reports for select using (auth_is_admin());

-- Verified users can file reports
create policy "reports_insert_verified" on reports for insert
  with check (auth.uid() = reporter_id and auth_is_verified());

-- Only admins can update report status
create policy "reports_update_admin"  on reports for update using (auth_is_admin());
create policy "reports_no_delete"     on reports for delete using (false);

-- ============================================================
-- REALTIME
-- Enable Realtime only for the messages table (used for live chat)
-- ============================================================

-- In the Supabase Dashboard → Database → Replication,
-- add the 'messages' table to the replication publication.
-- Or run this (requires superuser in some Supabase plans):
-- alter publication supabase_realtime add table messages;

-- ============================================================
-- DONE
-- ============================================================
