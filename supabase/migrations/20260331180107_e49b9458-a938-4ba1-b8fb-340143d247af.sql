
-- Allow admins to view all pending preference changes
CREATE POLICY "Admins can view all pending changes"
ON public.pending_preference_changes
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to insert pending preference changes
CREATE POLICY "Admins can submit pending changes"
ON public.pending_preference_changes
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
