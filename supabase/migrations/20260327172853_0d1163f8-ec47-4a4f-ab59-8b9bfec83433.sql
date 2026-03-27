
-- Create storage bucket for procedure files
INSERT INTO storage.buckets (id, name, public) VALUES ('procedure-files', 'procedure-files', true);

-- Create table to track uploaded files
CREATE TABLE public.procedure_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  procedure_id UUID NOT NULL REFERENCES public.procedures(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  category TEXT NOT NULL, -- 'images', 'videos', 'pdfs'
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.procedure_files ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own procedure files" ON public.procedure_files FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own procedure files" ON public.procedure_files FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own procedure files" ON public.procedure_files FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Storage RLS policies
CREATE POLICY "Users can upload procedure files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'procedure-files' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can view procedure files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'procedure-files');
CREATE POLICY "Users can delete their procedure files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'procedure-files' AND (storage.foldername(name))[1] = auth.uid()::text);
