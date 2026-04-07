
ALTER TABLE public.procedures ADD COLUMN is_complete boolean NOT NULL DEFAULT false;
ALTER TABLE public.procedures ADD COLUMN completed_at timestamptz;
ALTER TABLE public.procedures ADD COLUMN completed_by uuid;
