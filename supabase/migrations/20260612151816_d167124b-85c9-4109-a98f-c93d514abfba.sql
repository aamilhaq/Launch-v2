
-- Allow PostgREST to join student_profiles -> profiles and applications -> profiles
ALTER TABLE public.student_profiles
  ADD CONSTRAINT student_profiles_profile_fk FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.applications
  ADD CONSTRAINT applications_student_profile_fk FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
