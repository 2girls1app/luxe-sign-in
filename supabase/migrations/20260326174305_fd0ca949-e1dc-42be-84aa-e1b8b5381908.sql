
-- Facilities table
CREATE TABLE public.facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  location text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own facilities" ON public.facilities
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own facilities" ON public.facilities
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own facilities" ON public.facilities
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own facilities" ON public.facilities
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_facilities_updated_at
  BEFORE UPDATE ON public.facilities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Procedures table
CREATE TABLE public.procedures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text,
  facility_id uuid REFERENCES public.facilities(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own procedures" ON public.procedures
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own procedures" ON public.procedures
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own procedures" ON public.procedures
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own procedures" ON public.procedures
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_procedures_updated_at
  BEFORE UPDATE ON public.procedures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
