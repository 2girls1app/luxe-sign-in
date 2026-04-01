
-- Add facility_code column to facilities table
ALTER TABLE public.facilities ADD COLUMN IF NOT EXISTS facility_code text UNIQUE;

-- Add facility_id column to profiles table to link clinical staff to their facility
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS facility_id uuid REFERENCES public.facilities(id);

-- Insert the 3 demo facilities with codes (using the admin's user_id placeholder - we'll use a known pattern)
-- We need a user_id for facilities. Let's create them with a special system approach.
-- First, let's check if facilities exist and insert them

-- Create RLS policy so clinical staff can view their assigned facility
CREATE POLICY "Clinical staff can view assigned facility"
ON public.facilities FOR SELECT TO authenticated
USING (
  id = (SELECT facility_id FROM public.profiles WHERE user_id = auth.uid())
);

-- Allow clinical staff to view doctors (profiles with role containing doctor/surgeon) at their facility
-- We need procedures linked to facilities, and profiles linked via procedures
-- Actually, clinical staff need to see all procedures at their facility
CREATE POLICY "Clinical staff can view facility procedures"
ON public.procedures FOR SELECT TO authenticated
USING (
  facility_id IN (SELECT facility_id FROM public.profiles WHERE user_id = auth.uid() AND facility_id IS NOT NULL)
);

-- Clinical staff can view procedure preferences for procedures at their facility
CREATE POLICY "Clinical staff can view facility procedure preferences"
ON public.procedure_preferences FOR SELECT TO authenticated
USING (
  procedure_id IN (
    SELECT p.id FROM public.procedures p
    JOIN public.profiles pr ON pr.user_id = auth.uid()
    WHERE p.facility_id = pr.facility_id AND pr.facility_id IS NOT NULL
  )
);

-- Clinical staff can view profiles of doctors at their facility (via procedures)
CREATE POLICY "Clinical staff can view facility doctor profiles"
ON public.profiles FOR SELECT TO authenticated
USING (
  user_id IN (
    SELECT DISTINCT p.user_id FROM public.procedures p
    WHERE p.facility_id = (SELECT facility_id FROM public.profiles WHERE user_id = auth.uid() AND facility_id IS NOT NULL LIMIT 1)
  )
);

-- Clinical staff can submit pending preference changes for facility procedures
CREATE POLICY "Clinical staff can submit changes for facility procedures"
ON public.pending_preference_changes FOR INSERT TO authenticated
WITH CHECK (
  procedure_id IN (
    SELECT p.id FROM public.procedures p
    JOIN public.profiles pr ON pr.user_id = auth.uid()
    WHERE p.facility_id = pr.facility_id AND pr.facility_id IS NOT NULL
  )
  AND submitted_by = auth.uid()
);

-- Clinical staff can view their own submitted changes
-- (already exists: "Submitters can view own changes")
