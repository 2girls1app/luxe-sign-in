-- Sales rep invite tokens for self-onboarding
CREATE TABLE public.sales_rep_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  procedure_id uuid NOT NULL,
  created_by uuid NOT NULL,
  rep_email text NOT NULL,
  rep_index integer NOT NULL DEFAULT 0,
  prefill_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitted_data jsonb,
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '72 hours'),
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sales_rep_invites_token ON public.sales_rep_invites(token);
CREATE INDEX idx_sales_rep_invites_procedure ON public.sales_rep_invites(procedure_id);

ALTER TABLE public.sales_rep_invites ENABLE ROW LEVEL SECURITY;

-- Owners (procedure creators) can manage their invites
CREATE POLICY "Users can view their own sales rep invites"
ON public.sales_rep_invites FOR SELECT
TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own sales rep invites"
ON public.sales_rep_invites FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own sales rep invites"
ON public.sales_rep_invites FOR UPDATE
TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own sales rep invites"
ON public.sales_rep_invites FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Admins can manage all sales rep invites"
ON public.sales_rep_invites FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Update timestamp trigger
CREATE TRIGGER update_sales_rep_invites_updated_at
BEFORE UPDATE ON public.sales_rep_invites
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Public lookup function (bypasses RLS via SECURITY DEFINER) for token-based access
CREATE OR REPLACE FUNCTION public.get_sales_rep_invite_by_token(_token text)
RETURNS TABLE (
  id uuid,
  procedure_id uuid,
  rep_email text,
  prefill_data jsonb,
  status text,
  expires_at timestamptz,
  submitted_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, procedure_id, rep_email, prefill_data, status, expires_at, submitted_at
  FROM public.sales_rep_invites
  WHERE token = _token
  LIMIT 1;
$$;

-- Public submission function for token-based self-onboarding
CREATE OR REPLACE FUNCTION public.submit_sales_rep_invite(_token text, _data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _invite public.sales_rep_invites%ROWTYPE;
BEGIN
  SELECT * INTO _invite FROM public.sales_rep_invites WHERE token = _token;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invite not found');
  END IF;
  IF _invite.status = 'submitted' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invite already submitted');
  END IF;
  IF _invite.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invite has expired');
  END IF;
  UPDATE public.sales_rep_invites
  SET submitted_data = _data,
      status = 'submitted',
      submitted_at = now()
  WHERE token = _token;
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Grant execute on the public functions to anon and authenticated
GRANT EXECUTE ON FUNCTION public.get_sales_rep_invite_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_sales_rep_invite(text, jsonb) TO anon, authenticated;