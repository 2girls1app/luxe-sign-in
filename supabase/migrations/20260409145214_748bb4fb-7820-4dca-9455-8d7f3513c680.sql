-- Individual users can view procedures linked to their facilities
CREATE POLICY "Individual users can view facility-linked procedures"
ON public.procedures
FOR SELECT
TO authenticated
USING (
  facility_id IN (
    SELECT f.id FROM public.facilities f WHERE f.user_id = auth.uid()
  )
);

-- Individual users can update procedures linked to their facilities
CREATE POLICY "Individual users can update facility-linked procedures"
ON public.procedures
FOR UPDATE
TO authenticated
USING (
  facility_id IN (
    SELECT f.id FROM public.facilities f WHERE f.user_id = auth.uid()
  )
);

-- Individual users can insert procedures linked to their facilities
CREATE POLICY "Individual users can insert facility-linked procedures"
ON public.procedures
FOR INSERT
TO authenticated
WITH CHECK (
  facility_id IN (
    SELECT f.id FROM public.facilities f WHERE f.user_id = auth.uid()
  )
);

-- Individual users can view preferences for procedures at their facilities
CREATE POLICY "Individual users can view facility procedure preferences"
ON public.procedure_preferences
FOR SELECT
TO authenticated
USING (
  procedure_id IN (
    SELECT p.id FROM public.procedures p
    WHERE p.facility_id IN (
      SELECT f.id FROM public.facilities f WHERE f.user_id = auth.uid()
    )
  )
);

-- Individual users can insert preferences for procedures at their facilities
CREATE POLICY "Individual users can insert facility procedure preferences"
ON public.procedure_preferences
FOR INSERT
TO authenticated
WITH CHECK (
  procedure_id IN (
    SELECT p.id FROM public.procedures p
    WHERE p.facility_id IN (
      SELECT f.id FROM public.facilities f WHERE f.user_id = auth.uid()
    )
  )
);

-- Individual users can update preferences for procedures at their facilities
CREATE POLICY "Individual users can update facility procedure preferences"
ON public.procedure_preferences
FOR UPDATE
TO authenticated
USING (
  procedure_id IN (
    SELECT p.id FROM public.procedures p
    WHERE p.facility_id IN (
      SELECT f.id FROM public.facilities f WHERE f.user_id = auth.uid()
    )
  )
);

-- Individual users can delete preferences for procedures at their facilities
CREATE POLICY "Individual users can delete facility procedure preferences"
ON public.procedure_preferences
FOR DELETE
TO authenticated
USING (
  procedure_id IN (
    SELECT p.id FROM public.procedures p
    WHERE p.facility_id IN (
      SELECT f.id FROM public.facilities f WHERE f.user_id = auth.uid()
    )
  )
);

-- Individual users can view files for procedures at their facilities
CREATE POLICY "Individual users can view facility procedure files"
ON public.procedure_files
FOR SELECT
TO authenticated
USING (
  procedure_id IN (
    SELECT p.id FROM public.procedures p
    WHERE p.facility_id IN (
      SELECT f.id FROM public.facilities f WHERE f.user_id = auth.uid()
    )
  )
);

-- Individual users can insert files for procedures at their facilities
CREATE POLICY "Individual users can insert facility procedure files"
ON public.procedure_files
FOR INSERT
TO authenticated
WITH CHECK (
  procedure_id IN (
    SELECT p.id FROM public.procedures p
    WHERE p.facility_id IN (
      SELECT f.id FROM public.facilities f WHERE f.user_id = auth.uid()
    )
  )
);

-- Individual users can delete files for procedures at their facilities
CREATE POLICY "Individual users can delete facility procedure files"
ON public.procedure_files
FOR DELETE
TO authenticated
USING (
  procedure_id IN (
    SELECT p.id FROM public.procedures p
    WHERE p.facility_id IN (
      SELECT f.id FROM public.facilities f WHERE f.user_id = auth.uid()
    )
  )
);

-- Individual users can view profiles of doctors linked to their facilities
CREATE POLICY "Individual users can view linked doctor profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT df.user_id FROM public.doctor_facilities df
    WHERE df.facility_id IN (
      SELECT f.id FROM public.facilities f WHERE f.user_id = auth.uid()
    )
  )
);