-- v4.1: jenis konten SOP. Server menjalankan ini otomatis (server/schema.mjs); aman diulang.
alter table public.content_items drop constraint if exists content_items_kind_check;
alter table public.content_items add constraint content_items_kind_check check (kind in ('course', 'quiz', 'article', 'sop'));
