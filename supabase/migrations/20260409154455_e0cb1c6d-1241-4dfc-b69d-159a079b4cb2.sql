
-- Create a SECURITY DEFINER function to check if a user is linked via facilities
CREATE OR REPLACE FUNCTION public.is_linked_doctor(_viewer_id uuid, _doctor_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM doctor_facilities df
    JOIN facilities f ON f.id = df.facility_id
    WHERE df.user_id = _doctor_user_id
    AND f.user_id = _viewer_id
  )
$$;

-- Drop and recreate the profiles policy to use the new function
DROP POLICY IF EXISTS "Individual users can view linked doctor profiles" ON public.profiles;

CREATE POLICY "Individual users can view linked doctor profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.is_linked_doctor(auth.uid(), user_id)
);
