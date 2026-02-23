-- Migration: Add forum post support
-- Makes course_id and lesson_index nullable for standalone forum posts.
-- Adds title column for forum post titles.

ALTER TABLE public.comments ALTER COLUMN course_id DROP NOT NULL;
ALTER TABLE public.comments ALTER COLUMN lesson_index DROP NOT NULL;

-- Title for standalone forum posts (null for lesson comments)
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS title TEXT;

-- Index for browsing forum posts (standalone posts = course_id IS NULL)
CREATE INDEX IF NOT EXISTS idx_comments_forum ON public.comments(created_at DESC) WHERE course_id IS NULL;
