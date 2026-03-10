-- ============================================================
-- McGill Marketplace — Patch Migration
-- Aligns column names with TypeScript types, adds missing columns.
-- Run this in the Supabase SQL Editor AFTER 0001_initial_schema.sql
-- ============================================================

-- ---- 1. messages: rename body → content ----
alter table messages rename column body to content;

-- Drop and re-create the body-length check constraint with new column name
alter table messages drop constraint if exists messages_body_length;
alter table messages add constraint messages_content_length
  check (char_length(content) between 1 and 2000);

-- ---- 2. conversations: rename updated_at → last_message_at ----
alter table conversations rename column updated_at to last_message_at;

-- Drop and re-create triggers that referenced updated_at on conversations
drop trigger if exists conversations_updated_at on conversations;

-- The bump trigger also updated conversations.updated_at; fix it
create or replace function bump_conversation_last_message_at()
returns trigger language plpgsql as $$
begin
  update conversations set last_message_at = now() where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists messages_bump_conversation on messages;
create trigger messages_bump_conversation
  after insert on messages
  for each row execute function bump_conversation_last_message_at();

-- ---- 3. reviews: rename comment → content ----
alter table reviews rename column comment to content;

-- ---- 4. reports: add missing columns ----
alter table reports
  add column if not exists reported_user_id uuid references profiles(id) on delete set null,
  add column if not exists admin_notes text;

-- ---- 5. report_status enum: add 'dismissed' ----
alter type report_status add value if not exists 'dismissed';

-- ---- 6. Add index on reports.reported_user_id ----
create index if not exists reports_reported_user_id_idx on reports(reported_user_id);

-- ---- 7. RLS: allow reports on users (add reported_user_id check) ----
-- (existing RLS policies already cover the reports table; no changes needed)

-- ---- Done ----
