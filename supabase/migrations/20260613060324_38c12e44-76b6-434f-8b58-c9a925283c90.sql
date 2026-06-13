ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS resume_url text,
  ADD COLUMN IF NOT EXISTS extracted_skills text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS extraction_timestamp timestamptz,
  ADD COLUMN IF NOT EXISTS resume_last_updated timestamptz;