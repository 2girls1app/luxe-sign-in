
-- Allow admins to insert procedure preferences for any user
CREATE POLICY "Admins can insert procedure preferences"
ON public.procedure_preferences
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update procedure preferences for any user
CREATE POLICY "Admins can update procedure preferences"
ON public.procedure_preferences
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update pending preference changes
CREATE POLICY "Admins can update pending changes"
ON public.pending_preference_changes
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete pending preference changes
CREATE POLICY "Admins can delete pending changes"
ON public.pending_preference_changes
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
