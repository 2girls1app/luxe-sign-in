CREATE OR REPLACE FUNCTION public.is_facility_owner(_viewer_id uuid, _facility_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.facilities f
    WHERE f.id = _facility_id
      AND f.user_id = _viewer_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_facility_linked_user(_viewer_id uuid, _facility_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.doctor_facilities df
    WHERE df.user_id = _viewer_id
      AND df.facility_id = _facility_id
  );
$$;

DROP POLICY IF EXISTS "Users can view linked facilities" ON public.facilities;
CREATE POLICY "Users can view linked facilities"
ON public.facilities
FOR SELECT
TO authenticated
USING (
  public.is_facility_linked_user(auth.uid(), id)
);

DROP POLICY IF EXISTS "Facility owners can view doctor links" ON public.doctor_facilities;
CREATE POLICY "Facility owners can view doctor links"
ON public.doctor_facilities
FOR SELECT
TO authenticated
USING (
  public.is_facility_owner(auth.uid(), facility_id)
);

DROP POLICY IF EXISTS "Individual users can view facility-linked procedures" ON public.procedures;
CREATE POLICY "Individual users can view facility-linked procedures"
ON public.procedures
FOR SELECT
TO authenticated
USING (
  facility_id IS NOT NULL
  AND public.is_facility_owner(auth.uid(), facility_id)
);

DROP POLICY IF EXISTS "Individual users can update facility-linked procedures" ON public.procedures;
CREATE POLICY "Individual users can update facility-linked procedures"
ON public.procedures
FOR UPDATE
TO authenticated
USING (
  facility_id IS NOT NULL
  AND public.is_facility_owner(auth.uid(), facility_id)
);

DROP POLICY IF EXISTS "Individual users can insert facility-linked procedures" ON public.procedures;
CREATE POLICY "Individual users can insert facility-linked procedures"
ON public.procedures
FOR INSERT
TO authenticated
WITH CHECK (
  facility_id IS NOT NULL
  AND public.is_facility_owner(auth.uid(), facility_id)
);