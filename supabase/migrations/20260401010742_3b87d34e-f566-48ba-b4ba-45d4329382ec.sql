
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url, role, facility_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    NEW.raw_user_meta_data->>'profession',
    CASE 
      WHEN NEW.raw_user_meta_data->>'facility_id' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'facility_id')::uuid
      ELSE NULL
    END
  );
  RETURN NEW;
END;
$function$;
