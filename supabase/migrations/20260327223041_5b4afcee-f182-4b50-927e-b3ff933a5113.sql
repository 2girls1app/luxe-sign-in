
CREATE TABLE public.shared_procedure_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_id uuid NOT NULL REFERENCES public.procedures(id) ON DELETE CASCADE,
  shared_by uuid NOT NULL,
  shared_with uuid NOT NULL,
  share_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  permission text NOT NULL DEFAULT 'view',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shared_procedure_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view shares they created or received"
ON public.shared_procedure_cards FOR SELECT TO authenticated
USING (auth.uid() = shared_by OR auth.uid() = shared_with);

CREATE POLICY "Users can insert their own shares"
ON public.shared_procedure_cards FOR INSERT TO authenticated
WITH CHECK (auth.uid() = shared_by);

CREATE POLICY "Users can delete their own shares"
ON public.shared_procedure_cards FOR DELETE TO authenticated
USING (auth.uid() = shared_by);
