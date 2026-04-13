CREATE POLICY "Users can update their own procedure files"
ON public.procedure_files
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can update procedure files"
ON public.procedure_files
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Individual users can update facility procedure files"
ON public.procedure_files
FOR UPDATE
USING (procedure_id IN (
  SELECT p.id FROM procedures p
  WHERE p.facility_id IN (
    SELECT f.id FROM facilities f WHERE f.user_id = auth.uid()
  )
));

CREATE POLICY "Clinical staff can update facility procedure files"
ON public.procedure_files
FOR UPDATE
USING (
  auth.uid() = user_id
  AND procedure_id IN (
    SELECT p.id FROM procedures p
    WHERE p.facility_id IS NOT NULL
    AND p.facility_id = get_user_facility_id(auth.uid())
  )
);