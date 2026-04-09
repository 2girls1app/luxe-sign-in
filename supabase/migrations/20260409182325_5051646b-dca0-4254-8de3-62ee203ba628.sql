
-- Allow Individual users (facility owners) to manage music prefs for their linked doctors
CREATE POLICY "Individual users can view linked doctor music preferences"
ON public.music_preferences
FOR SELECT
TO authenticated
USING (is_linked_doctor(auth.uid(), user_id));

CREATE POLICY "Individual users can insert linked doctor music preferences"
ON public.music_preferences
FOR INSERT
TO authenticated
WITH CHECK (is_linked_doctor(auth.uid(), user_id));

CREATE POLICY "Individual users can update linked doctor music preferences"
ON public.music_preferences
FOR UPDATE
TO authenticated
USING (is_linked_doctor(auth.uid(), user_id));

CREATE POLICY "Individual users can delete linked doctor music preferences"
ON public.music_preferences
FOR DELETE
TO authenticated
USING (is_linked_doctor(auth.uid(), user_id));

-- Allow clinical staff to view/manage music prefs for facility-linked doctors
CREATE POLICY "Clinical staff can view facility doctor music preferences"
ON public.music_preferences
FOR SELECT
TO authenticated
USING (user_id IN (
  SELECT df.user_id FROM doctor_facilities df
  WHERE df.facility_id = get_user_facility_id(auth.uid())
));

CREATE POLICY "Clinical staff can insert facility doctor music preferences"
ON public.music_preferences
FOR INSERT
TO authenticated
WITH CHECK (user_id IN (
  SELECT df.user_id FROM doctor_facilities df
  WHERE df.facility_id = get_user_facility_id(auth.uid())
));

CREATE POLICY "Clinical staff can update facility doctor music preferences"
ON public.music_preferences
FOR UPDATE
TO authenticated
USING (user_id IN (
  SELECT df.user_id FROM doctor_facilities df
  WHERE df.facility_id = get_user_facility_id(auth.uid())
));

CREATE POLICY "Clinical staff can delete facility doctor music preferences"
ON public.music_preferences
FOR DELETE
TO authenticated
USING (user_id IN (
  SELECT df.user_id FROM doctor_facilities df
  WHERE df.facility_id = get_user_facility_id(auth.uid())
));

-- Add missing UPDATE policy for own music preferences
CREATE POLICY "Users can update their own music preferences"
ON public.music_preferences
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);
