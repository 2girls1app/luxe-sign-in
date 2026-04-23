-- Allow facility owners to insert doctor_facilities rows linking
-- one of THEIR doctors (is_linked_doctor) to one of THEIR facilities (is_facility_owner).
CREATE POLICY "Facility owners can link their doctors"
ON public.doctor_facilities
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_facility_owner(auth.uid(), facility_id)
  AND public.is_linked_doctor(auth.uid(), user_id)
);

-- Allow facility owners to remove those same links.
CREATE POLICY "Facility owners can unlink their doctors"
ON public.doctor_facilities
FOR DELETE
TO authenticated
USING (
  public.is_facility_owner(auth.uid(), facility_id)
  AND public.is_linked_doctor(auth.uid(), user_id)
);
