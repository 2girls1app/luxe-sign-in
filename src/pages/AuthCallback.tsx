import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        navigate("/", { replace: true });
        return;
      }

      // Check if user has completed onboarding
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, onboarding_completed, display_name")
        .eq("user_id", session.user.id)
        .single();

      // Send welcome email after email verification (idempotent — keyed on user id,
      // so multiple callback runs only ever produce one send).
      try {
        const recipientEmail = session.user.email;
        if (recipientEmail) {
          const displayName =
            profile?.display_name ||
            (session.user.user_metadata?.first_name
              ? `${session.user.user_metadata.first_name}${
                  session.user.user_metadata?.last_name
                    ? " " + session.user.user_metadata.last_name
                    : ""
                }`
              : undefined);

          await supabase.functions.invoke("send-transactional-email", {
            body: {
              templateName: "welcome",
              recipientEmail,
              idempotencyKey: `welcome-${session.user.id}`,
              templateData: displayName ? { name: displayName } : {},
            },
          });
        }
      } catch (err) {
        // Non-fatal — never block sign-in on email send issues.
        console.warn("Welcome email enqueue failed", err);
      }

      if (!profile?.role) {
        navigate("/select-profession", { replace: true });
      } else {
        navigate("/profile", { replace: true });
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
        <p className="text-sm text-muted-foreground">Signing you in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
