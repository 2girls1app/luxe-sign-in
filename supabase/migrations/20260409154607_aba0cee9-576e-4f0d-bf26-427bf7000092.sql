
-- The "Individual users can view facility-linked doctor links" policy on doctor_facilities
-- causes recursion because it queries facilities, which queries doctor_facilities
DROP POLICY IF EXISTS "Individual users can view facility-linked doctor links" ON public.doctor_facilities;
