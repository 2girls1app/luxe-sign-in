
-- Facility documents table
CREATE TABLE public.facility_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid REFERENCES public.facilities(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  file_path text,
  file_name text,
  mime_type text,
  file_size bigint,
  target_role text,
  is_favorite boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.facility_documents ENABLE ROW LEVEL SECURITY;

-- Users can view documents for facilities they own or documents shared with their role
CREATE POLICY "Users can view own facility documents"
  ON public.facility_documents FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can insert documents for their own facilities
CREATE POLICY "Users can insert own facility documents"
  ON public.facility_documents FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own documents
CREATE POLICY "Users can update own facility documents"
  ON public.facility_documents FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Users can delete their own documents
CREATE POLICY "Users can delete own facility documents"
  ON public.facility_documents FOR DELETE TO authenticated
  USING (user_id = auth.uid());
