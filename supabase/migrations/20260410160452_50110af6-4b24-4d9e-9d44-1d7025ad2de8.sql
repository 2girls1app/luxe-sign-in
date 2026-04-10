INSERT INTO storage.buckets (id, name, public) VALUES ('app-assets', 'app-assets', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read access for app-assets" ON storage.objects FOR SELECT USING (bucket_id = 'app-assets');
