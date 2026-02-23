-- Migration: Add comments and community help tracking
-- For "First Comment" and "Helper" achievements

-- ─── Comments table ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  lesson_index INTEGER NOT NULL,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  is_helpful BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Community help tracking ────────────────────────────
CREATE TABLE IF NOT EXISTS public.community_help (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  helper_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  helped_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(helper_id, comment_id)
);

-- ─── Indexes ────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_comments_lesson ON public.comments(course_id, lesson_index);
CREATE INDEX IF NOT EXISTS idx_comments_user ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON public.comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_help_helper ON public.community_help(helper_id);
CREATE INDEX IF NOT EXISTS idx_community_help_helped ON public.community_help(helped_user_id);

-- ─── RLS ────────────────────────────────────────────────
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_help ENABLE ROW LEVEL SECURITY;

-- Comments: anyone authenticated can read, own write/delete
CREATE POLICY "Authenticated users can view comments"
  ON public.comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create comments"
  ON public.comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON public.comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Community help: anyone authenticated can read, participants can write
CREATE POLICY "Authenticated users can view help records"
  ON public.community_help FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can mark comments as helpful"
  ON public.community_help FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = helped_user_id);

-- ─── Auto-update trigger ────────────────────────────────
CREATE TRIGGER comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
