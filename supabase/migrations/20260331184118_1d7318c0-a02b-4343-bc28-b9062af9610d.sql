CREATE POLICY "Admins can view all facilities"
  ON public.facilities FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));