CREATE TABLE public.music_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('genre', 'artist', 'mood')),
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, type, value)
);

ALTER TABLE public.music_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own music preferences"
  ON public.music_preferences FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own music preferences"
  ON public.music_preferences FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own music preferences"
  ON public.music_preferences FOR DELETE TO authenticated
  USING (auth.uid() = user_id);