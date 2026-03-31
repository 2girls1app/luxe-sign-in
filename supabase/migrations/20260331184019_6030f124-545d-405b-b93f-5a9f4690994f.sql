CREATE POLICY "Admins can insert procedures"
  ON public.procedures FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));