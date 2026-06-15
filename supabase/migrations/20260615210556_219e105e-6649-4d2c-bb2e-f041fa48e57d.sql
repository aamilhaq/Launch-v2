
-- 1) Fix privilege escalation: drop self-insert policy on user_roles
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;

-- 2) Lock down profiles: own row OR coordinator can read all
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
CREATE POLICY "profiles_select_own_or_coord" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'coordinator'));

-- 3) Hide quiz correct_index from students via column-level revoke
REVOKE SELECT (correct_index) ON public.quiz_questions FROM authenticated;
-- Coordinators read via has_role policy + service_role retains full access

-- Secure quiz submission function (grades server-side)
CREATE OR REPLACE FUNCTION public.submit_quiz_attempt(_quiz_id uuid, _answers jsonb)
RETURNS TABLE (score int, total int, attempt_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _score int := 0;
  _total int := 0;
  _aid uuid;
  rec record;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  FOR rec IN SELECT id, correct_index FROM public.quiz_questions WHERE quiz_id = _quiz_id LOOP
    _total := _total + 1;
    IF (_answers ->> rec.id::text)::int = rec.correct_index THEN
      _score := _score + 1;
    END IF;
  END LOOP;
  INSERT INTO public.quiz_attempts (quiz_id, student_id, score, total, answers)
  VALUES (_quiz_id, auth.uid(), _score, _total, _answers)
  RETURNING id INTO _aid;
  RETURN QUERY SELECT _score, _total, _aid;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.submit_quiz_attempt(uuid, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.submit_quiz_attempt(uuid, jsonb) TO authenticated;

-- 4) Saved jobs (bookmarks)
CREATE TABLE IF NOT EXISTS public.saved_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, job_id)
);

GRANT SELECT, INSERT, DELETE ON public.saved_jobs TO authenticated;
GRANT ALL ON public.saved_jobs TO service_role;

ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_jobs_own" ON public.saved_jobs
  FOR ALL TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());
