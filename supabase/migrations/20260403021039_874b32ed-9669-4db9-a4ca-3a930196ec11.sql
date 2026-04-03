
-- Clinical staff can view procedure files for their facility
CREATE POLICY "Clinical staff can view facility procedure files"
ON public.procedure_files FOR SELECT
TO authenticated
USING (
  procedure_id IN (
    SELECT p.id FROM procedures p
    WHERE p.facility_id IS NOT NULL
    AND p.facility_id = get_user_facility_id(auth.uid())
  )
);

-- Clinical staff can upload files for facility procedures
CREATE POLICY "Clinical staff can insert facility procedure files"
ON public.procedure_files FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND procedure_id IN (
    SELECT p.id FROM procedures p
    WHERE p.facility_id IS NOT NULL
    AND p.facility_id = get_user_facility_id(auth.uid())
  )
);
