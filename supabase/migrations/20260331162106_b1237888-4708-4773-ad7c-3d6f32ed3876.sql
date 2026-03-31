
-- Chat sessions table
CREATE TABLE public.procedure_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_id uuid NOT NULL REFERENCES public.procedures(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  is_active boolean NOT NULL DEFAULT true
);

ALTER TABLE public.procedure_chats ENABLE ROW LEVEL SECURITY;

-- Chat messages table
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES public.procedure_chats(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_name text NOT NULL DEFAULT '',
  sender_role text,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Message views tracking
CREATE TABLE public.chat_message_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL,
  viewer_name text NOT NULL DEFAULT '',
  viewed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(message_id, viewer_id)
);

ALTER TABLE public.chat_message_views ENABLE ROW LEVEL SECURITY;

-- Enable realtime for messages and views
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_message_views;

-- RLS: procedure_chats - accessible by procedure owner and shared users
CREATE POLICY "Owners can manage chats" ON public.procedure_chats
  FOR ALL TO authenticated
  USING (owns_procedure(auth.uid(), procedure_id) OR EXISTS (
    SELECT 1 FROM shared_procedure_cards WHERE procedure_id = procedure_chats.procedure_id AND shared_with = auth.uid()
  ))
  WITH CHECK (owns_procedure(auth.uid(), procedure_id) OR EXISTS (
    SELECT 1 FROM shared_procedure_cards WHERE procedure_id = procedure_chats.procedure_id AND shared_with = auth.uid()
  ));

-- RLS: chat_messages - accessible if user can access the chat
CREATE POLICY "Chat participants can manage messages" ON public.chat_messages
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM procedure_chats pc WHERE pc.id = chat_messages.chat_id
    AND (owns_procedure(auth.uid(), pc.procedure_id) OR EXISTS (
      SELECT 1 FROM shared_procedure_cards WHERE procedure_id = pc.procedure_id AND shared_with = auth.uid()
    ))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM procedure_chats pc WHERE pc.id = chat_messages.chat_id
    AND (owns_procedure(auth.uid(), pc.procedure_id) OR EXISTS (
      SELECT 1 FROM shared_procedure_cards WHERE procedure_id = pc.procedure_id AND shared_with = auth.uid()
    ))
  ));

-- RLS: chat_message_views
CREATE POLICY "Chat participants can manage views" ON public.chat_message_views
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM chat_messages cm
    JOIN procedure_chats pc ON pc.id = cm.chat_id
    WHERE cm.id = chat_message_views.message_id
    AND (owns_procedure(auth.uid(), pc.procedure_id) OR EXISTS (
      SELECT 1 FROM shared_procedure_cards WHERE procedure_id = pc.procedure_id AND shared_with = auth.uid()
    ))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM chat_messages cm
    JOIN procedure_chats pc ON pc.id = cm.chat_id
    WHERE cm.id = chat_message_views.message_id
    AND (owns_procedure(auth.uid(), pc.procedure_id) OR EXISTS (
      SELECT 1 FROM shared_procedure_cards WHERE procedure_id = pc.procedure_id AND shared_with = auth.uid()
    ))
  ));
