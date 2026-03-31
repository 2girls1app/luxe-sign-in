import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useAuditLog = () => {
  const { user, profile } = useAuth();

  const log = async (action: string, entityType: string, entityId?: string, details?: Record<string, any>) => {
    if (!user) return;
    await supabase.from("audit_logs" as any).insert({
      user_id: user.id,
      user_email: user.email || "",
      user_name: profile?.display_name || "",
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      details: details || {},
    });
  };

  return { log };
};
