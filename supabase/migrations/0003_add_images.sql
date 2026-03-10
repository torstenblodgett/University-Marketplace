-- ============================================================
-- Migration 0003: listing image uploads
-- Run this in the Supabase SQL editor AFTER 0001 and 0002
-- ============================================================

-- Add images column if it doesn't already exist
alter table listings
  add column if not exists images text[] not null default '{}';

-- ============================================================
-- Storage bucket for listing images
-- ============================================================

insert into storage.buckets (id, name, public)
  values ('listing-images', 'listing-images', true)
  on conflict (id) do nothing;

-- Anyone can view images in this bucket (it's public)
create policy "Public read for listing images"
  on storage.objects for select
  using (bucket_id = 'listing-images');

-- Authenticated users can upload into their own folder ({user_id}/...)
create policy "Owners can upload listing images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can delete their own images
create policy "Owners can delete listing images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
