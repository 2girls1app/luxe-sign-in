-- Allow admins to delete any procedure
CREATE POLICY "Admins can delete procedures"
ON public.procedures
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update any procedure
CREATE POLICY "Admins can update procedures"
ON public.procedures
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete any procedure preferences
CREATE POLICY "Admins can delete procedure preferences"
ON public.procedure_preferences
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete any procedure files
CREATE POLICY "Admins can delete procedure files"
ON public.procedure_files
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to insert procedure files
CREATE POLICY "Admins can insert procedure files"
ON public.procedure_files
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all procedure files
CREATE POLICY "Admins can view all procedure files"
ON public.procedure_files
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));