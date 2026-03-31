
CREATE TABLE public.notification_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES public.admin_notifications(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL,
  viewer_name text NOT NULL DEFAULT '',
  viewed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(notification_id, viewer_id)
);

ALTER TABLE public.notification_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all notification views"
  ON public.notification_views FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can insert own views"
  ON public.notification_views FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = viewer_id);
