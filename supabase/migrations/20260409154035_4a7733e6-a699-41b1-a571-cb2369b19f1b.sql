CREATE POLICY "Individual users can view facility-linked doctor links"
ON public.doctor_facilities
FOR SELECT
TO authenticated
USING (
  facility_id IN (
    SELECT f.id FROM facilities f WHERE f.user_id = auth.uid()
  )
);