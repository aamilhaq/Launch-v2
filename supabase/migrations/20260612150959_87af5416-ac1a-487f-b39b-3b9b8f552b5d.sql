
-- ENUMS
CREATE TYPE public.app_role AS ENUM ('student', 'coordinator');
CREATE TYPE public.application_status AS ENUM ('applied','under_review','shortlisted','interview_scheduled','selected','rejected');

-- updated_at helper
CREATE OR REPLACE FUNCTION public.tg_set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- PROFILES (basic user record)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE TRIGGER tg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- USER ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.get_role(_user_id UUID)
RETURNS app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Auto create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  IF NEW.raw_user_meta_data->>'role' IN ('student','coordinator') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, (NEW.raw_user_meta_data->>'role')::app_role);
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- STUDENT PROFILES
CREATE TABLE public.student_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  department TEXT,
  graduation_year INT,
  cgpa NUMERIC(3,2),
  skills TEXT[] DEFAULT '{}',
  linkedin_url TEXT,
  github_url TEXT,
  phone TEXT,
  onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_profiles TO authenticated;
GRANT ALL ON public.student_profiles TO service_role;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "student_self_select" ON public.student_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'coordinator'));
CREATE POLICY "student_self_upsert" ON public.student_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "student_self_update" ON public.student_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER tg_student_updated BEFORE UPDATE ON public.student_profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- COORDINATOR PROFILES
CREATE TABLE public.coordinator_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  college TEXT,
  department TEXT,
  designation TEXT,
  phone TEXT,
  onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coordinator_profiles TO authenticated;
GRANT ALL ON public.coordinator_profiles TO service_role;
ALTER TABLE public.coordinator_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coord_self_select" ON public.coordinator_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'coordinator'));
CREATE POLICY "coord_self_insert" ON public.coordinator_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "coord_self_update" ON public.coordinator_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER tg_coord_updated BEFORE UPDATE ON public.coordinator_profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- RESUMES
CREATE TABLE public.resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  raw_text TEXT,
  parsed JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resumes TO authenticated;
GRANT ALL ON public.resumes TO service_role;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "resumes_self" ON public.resumes FOR ALL TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'coordinator')) WITH CHECK (auth.uid() = user_id);

-- JOBS
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  company TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  ctc TEXT,
  required_skills TEXT[] DEFAULT '{}',
  min_cgpa NUMERIC(3,2) DEFAULT 0,
  eligible_departments TEXT[] DEFAULT '{}',
  deadline TIMESTAMPTZ,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jobs_read_published" ON public.jobs FOR SELECT TO authenticated USING (published = true OR created_by = auth.uid() OR public.has_role(auth.uid(),'coordinator'));
CREATE POLICY "jobs_coord_write" ON public.jobs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'coordinator') AND created_by = auth.uid());
CREATE POLICY "jobs_coord_update" ON public.jobs FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'coordinator'));
CREATE POLICY "jobs_coord_delete" ON public.jobs FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'coordinator'));
CREATE TRIGGER tg_jobs_updated BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- APPLICATIONS
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  status application_status NOT NULL DEFAULT 'applied',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (job_id, student_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "apps_select" ON public.applications FOR SELECT TO authenticated USING (student_id = auth.uid() OR public.has_role(auth.uid(),'coordinator'));
CREATE POLICY "apps_insert_self" ON public.applications FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());
CREATE POLICY "apps_update_coord" ON public.applications FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'coordinator') OR student_id = auth.uid());
CREATE POLICY "apps_delete_owner" ON public.applications FOR DELETE TO authenticated USING (student_id = auth.uid() OR public.has_role(auth.uid(),'coordinator'));
CREATE TRIGGER tg_apps_updated BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- QUIZZES
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INT NOT NULL DEFAULT 15,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quizzes TO authenticated;
GRANT ALL ON public.quizzes TO service_role;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quiz_read" ON public.quizzes FOR SELECT TO authenticated USING (published OR created_by = auth.uid() OR public.has_role(auth.uid(),'coordinator'));
CREATE POLICY "quiz_coord_all" ON public.quizzes FOR ALL TO authenticated USING (public.has_role(auth.uid(),'coordinator')) WITH CHECK (public.has_role(auth.uid(),'coordinator') AND created_by = auth.uid());

CREATE TABLE public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes ON DELETE CASCADE,
  question TEXT NOT NULL,
  options TEXT[] NOT NULL,
  correct_index INT NOT NULL,
  position INT NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_questions TO authenticated;
GRANT ALL ON public.quiz_questions TO service_role;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "qq_read" ON public.quiz_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "qq_coord_all" ON public.quiz_questions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'coordinator')) WITH CHECK (public.has_role(auth.uid(),'coordinator'));

CREATE TABLE public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  score INT NOT NULL DEFAULT 0,
  total INT NOT NULL DEFAULT 0,
  answers JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_attempts TO authenticated;
GRANT ALL ON public.quiz_attempts TO service_role;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "qa_select" ON public.quiz_attempts FOR SELECT TO authenticated USING (student_id = auth.uid() OR public.has_role(auth.uid(),'coordinator'));
CREATE POLICY "qa_insert_self" ON public.quiz_attempts FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());

-- ANNOUNCEMENTS
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ann_read" ON public.announcements FOR SELECT TO authenticated USING (true);
CREATE POLICY "ann_coord_write" ON public.announcements FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'coordinator') AND created_by = auth.uid());
CREATE POLICY "ann_coord_modify" ON public.announcements FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'coordinator'));
CREATE POLICY "ann_coord_delete" ON public.announcements FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'coordinator'));

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_self" ON public.notifications FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ATS REPORTS
CREATE TABLE public.ats_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  job_title TEXT,
  job_description TEXT NOT NULL,
  score INT NOT NULL,
  matching_skills TEXT[] DEFAULT '{}',
  missing_skills TEXT[] DEFAULT '{}',
  recommendations TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ats_reports TO authenticated;
GRANT ALL ON public.ats_reports TO service_role;
ALTER TABLE public.ats_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ats_self" ON public.ats_reports FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
