CREATE POLICY "Users can view linked facilities"
  ON public.facilities FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT facility_id FROM public.doctor_facilities WHERE user_id = auth.uid()
    )
  );