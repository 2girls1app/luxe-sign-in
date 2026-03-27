
-- Function to check if user owns a procedure
CREATE OR REPLACE FUNCTION public.owns_procedure(_user_id uuid, _procedure_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.procedures
    WHERE id = _procedure_id AND user_id = _user_id
  )
$$;

-- Function to check if user has edit access to a procedure
CREATE OR REPLACE FUNCTION public.has_edit_access(_user_id uuid, _procedure_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.shared_procedure_cards
    WHERE procedure_id = _procedure_id
    AND shared_with = _user_id
    AND permission = 'edit'
  )
$$;

-- Pending preference changes table
CREATE TABLE public.pending_preference_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_id uuid NOT NULL REFERENCES public.procedures(id) ON DELETE CASCADE,
  category text NOT NULL,
  old_value text DEFAULT '',
  new_value text NOT NULL,
  submitted_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  denial_reason text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pending_preference_changes ENABLE ROW LEVEL SECURITY;

-- Submitters can view their own submissions
CREATE POLICY "Submitters can view own changes"
ON public.pending_preference_changes
FOR SELECT TO authenticated
USING (auth.uid() = submitted_by);

-- Procedure owners can view pending changes for their procedures
CREATE POLICY "Owners can view pending changes"
ON public.pending_preference_changes
FOR SELECT TO authenticated
USING (public.owns_procedure(auth.uid(), procedure_id));

-- Users with edit access can submit changes
CREATE POLICY "Editors can submit changes"
ON public.pending_preference_changes
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = submitted_by
  AND public.has_edit_access(auth.uid(), procedure_id)
);

-- Owners can update (approve/deny) changes
CREATE POLICY "Owners can approve deny changes"
ON public.pending_preference_changes
FOR UPDATE TO authenticated
USING (public.owns_procedure(auth.uid(), procedure_id));

-- Owners can delete changes
CREATE POLICY "Owners can delete changes"
ON public.pending_preference_changes
FOR DELETE TO authenticated
USING (public.owns_procedure(auth.uid(), procedure_id));

-- Also allow shared_procedure_cards update for permission changes
CREATE POLICY "Owners can update their shares"
ON public.shared_procedure_cards
FOR UPDATE TO authenticated
USING (auth.uid() = shared_by);

-- Add RLS policy so shared users can read procedure data
CREATE POLICY "Shared users can view shared procedures"
ON public.procedures
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.shared_procedure_cards
    WHERE procedure_id = id AND shared_with = auth.uid()
  )
);

-- Shared users can view preferences for shared procedures
CREATE POLICY "Shared users can view shared procedure preferences"
ON public.procedure_preferences
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.shared_procedure_cards
    WHERE procedure_id = procedure_preferences.procedure_id AND shared_with = auth.uid()
  )
);

-- Shared users can view files for shared procedures
CREATE POLICY "Shared users can view shared procedure files"
ON public.procedure_files
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.shared_procedure_cards
    WHERE procedure_id = procedure_files.procedure_id AND shared_with = auth.uid()
  )
);

-- Shared users can view the profile of the procedure owner (for provider name)
CREATE POLICY "Shared users can view procedure owner profiles"
ON public.profiles
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.shared_procedure_cards sc
    JOIN public.procedures p ON p.id = sc.procedure_id
    WHERE sc.shared_with = auth.uid() AND p.user_id = profiles.user_id
  )
);
