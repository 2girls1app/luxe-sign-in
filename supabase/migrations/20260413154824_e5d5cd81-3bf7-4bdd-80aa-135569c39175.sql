
-- Facility Medications master list
CREATE TABLE public.facility_medications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.facility_medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage facility medications" ON public.facility_medications FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Facility owners can manage their medications" ON public.facility_medications FOR ALL TO authenticated
  USING (is_facility_owner(auth.uid(), facility_id))
  WITH CHECK (is_facility_owner(auth.uid(), facility_id));

CREATE POLICY "Linked users can view facility medications" ON public.facility_medications FOR SELECT TO authenticated
  USING (is_facility_linked_user(auth.uid(), facility_id));

CREATE POLICY "Clinical staff can view facility medications" ON public.facility_medications FOR SELECT TO authenticated
  USING (facility_id = get_user_facility_id(auth.uid()));

CREATE TRIGGER update_facility_medications_updated_at BEFORE UPDATE ON public.facility_medications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Facility Sutures master list
CREATE TABLE public.facility_sutures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  size TEXT,
  type TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.facility_sutures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage facility sutures" ON public.facility_sutures FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Facility owners can manage their sutures" ON public.facility_sutures FOR ALL TO authenticated
  USING (is_facility_owner(auth.uid(), facility_id))
  WITH CHECK (is_facility_owner(auth.uid(), facility_id));

CREATE POLICY "Linked users can view facility sutures" ON public.facility_sutures FOR SELECT TO authenticated
  USING (is_facility_linked_user(auth.uid(), facility_id));

CREATE POLICY "Clinical staff can view facility sutures" ON public.facility_sutures FOR SELECT TO authenticated
  USING (facility_id = get_user_facility_id(auth.uid()));

CREATE TRIGGER update_facility_sutures_updated_at BEFORE UPDATE ON public.facility_sutures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Facility Supplies master list
CREATE TABLE public.facility_supplies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.facility_supplies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage facility supplies" ON public.facility_supplies FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Facility owners can manage their supplies" ON public.facility_supplies FOR ALL TO authenticated
  USING (is_facility_owner(auth.uid(), facility_id))
  WITH CHECK (is_facility_owner(auth.uid(), facility_id));

CREATE POLICY "Linked users can view facility supplies" ON public.facility_supplies FOR SELECT TO authenticated
  USING (is_facility_linked_user(auth.uid(), facility_id));

CREATE POLICY "Clinical staff can view facility supplies" ON public.facility_supplies FOR SELECT TO authenticated
  USING (facility_id = get_user_facility_id(auth.uid()));

CREATE TRIGGER update_facility_supplies_updated_at BEFORE UPDATE ON public.facility_supplies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
