-- Allow clinical staff to read doctor_facilities rows for their assigned facility
CREATE POLICY "Clinical staff can view facility doctor links"
  ON public.doctor_facilities FOR SELECT TO authenticated
  USING (
    facility_id = get_user_facility_id(auth.uid())
  );

-- Allow clinical staff to view doctor profiles linked to their facility via doctor_facilities
CREATE POLICY "Clinical staff can view facility-linked doctor profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    user_id IN (
      SELECT df.user_id FROM public.doctor_facilities df
      WHERE df.facility_id = get_user_facility_id(auth.uid())
    )
  );