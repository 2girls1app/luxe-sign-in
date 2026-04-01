
CREATE OR REPLACE FUNCTION public.get_user_facility_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT facility_id FROM public.profiles WHERE user_id = _user_id LIMIT 1;
$$;

DROP POLICY IF EXISTS "Clinical staff can view facility doctor profiles" ON public.profiles;

CREATE POLICY "Clinical staff can view facility doctor profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  facility_id IS NOT NULL 
  AND facility_id = get_user_facility_id(auth.uid())
);

DROP POLICY IF EXISTS "Clinical staff can view facility procedures" ON public.procedures;

CREATE POLICY "Clinical staff can view facility procedures"
ON public.procedures
FOR SELECT
TO authenticated
USING (
  facility_id IS NOT NULL 
  AND facility_id = get_user_facility_id(auth.uid())
);

DROP POLICY IF EXISTS "Clinical staff can view facility procedure preferences" ON public.procedure_preferences;

CREATE POLICY "Clinical staff can view facility procedure preferences"
ON public.procedure_preferences
FOR SELECT
TO authenticated
USING (
  procedure_id IN (
    SELECT p.id FROM public.procedures p
    WHERE p.facility_id IS NOT NULL 
    AND p.facility_id = get_user_facility_id(auth.uid())
  )
);

DROP POLICY IF EXISTS "Clinical staff can submit changes for facility procedures" ON public.pending_preference_changes;

CREATE POLICY "Clinical staff can submit changes for facility procedures"
ON public.pending_preference_changes
FOR INSERT
TO authenticated
WITH CHECK (
  procedure_id IN (
    SELECT p.id FROM public.procedures p
    WHERE p.facility_id IS NOT NULL 
    AND p.facility_id = get_user_facility_id(auth.uid())
  )
  AND submitted_by = auth.uid()
);

DROP POLICY IF EXISTS "Clinical staff can view assigned facility" ON public.facilities;

CREATE POLICY "Clinical staff can view assigned facility"
ON public.facilities
FOR SELECT
TO authenticated
USING (
  id = get_user_facility_id(auth.uid())
);
