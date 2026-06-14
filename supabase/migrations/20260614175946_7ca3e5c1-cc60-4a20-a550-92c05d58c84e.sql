
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS rank_by_match boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_shortlist_top_n integer;

CREATE POLICY "notif_coord_insert" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'coordinator'));
