-- Adds an optional cover image to courses so the /kurs cards can show an image.
-- Run this once in the Supabase SQL editor. The app works with or without it,
-- but the dashboard image picker for courses only persists once this exists.
alter table public.courses
  add column if not exists image_url text;
