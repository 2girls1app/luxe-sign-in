
CREATE TABLE public.procedure_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  procedure_id UUID NOT NULL REFERENCES public.procedures(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  value TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.procedure_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own procedure preferences"
  ON public.procedure_preferences FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own procedure preferences"
  ON public.procedure_preferences FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own procedure preferences"
  ON public.procedure_preferences FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own procedure preferences"
  ON public.procedure_preferences FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE UNIQUE INDEX idx_procedure_preferences_unique ON public.procedure_preferences (procedure_id, category);
