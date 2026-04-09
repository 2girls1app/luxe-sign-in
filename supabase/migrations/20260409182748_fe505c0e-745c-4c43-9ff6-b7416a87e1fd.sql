CREATE POLICY "Individual users can delete facility-linked procedures"
ON public.procedures
FOR DELETE
TO authenticated
USING ((facility_id IS NOT NULL) AND is_facility_owner(auth.uid(), facility_id));