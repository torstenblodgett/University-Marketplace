-- ============================================================
-- Migration 0004: program and year fields on profiles
-- Run in the Supabase SQL editor AFTER 0001, 0002, and 0003
-- ============================================================

alter table profiles
  add column if not exists program text,
  add column if not exists year text;
