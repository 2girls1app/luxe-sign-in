-- Add unique constraint for upsert to work correctly
ALTER TABLE public.procedure_preferences
ADD CONSTRAINT procedure_preferences_procedure_user_category_unique
UNIQUE (procedure_id, user_id, category);