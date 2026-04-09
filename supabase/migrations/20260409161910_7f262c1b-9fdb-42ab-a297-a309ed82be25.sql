-- Allow Individual users (facility owners) to see which doctors are linked to their facilities
CREATE POLICY "Facility owners can view doctor links"
ON public.doctor_facilities
FOR SELECT
TO authenticated
USING (
  facility_id IN (
    SELECT f.id FROM public.facilities f WHERE f.user_id = auth.uid()
  )
);
