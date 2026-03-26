import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSendReset = async () => {
    if (!email.trim()) {
      toast({ title: "Please enter your email address", variant: "destructive" });
      return;
    }
    setSending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSending(false);
    if (error) {
      toast({ title: "Failed to send reset email", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
      toast({ title: "Reset email sent", description: "Check your inbox for a password reset link." });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm flex flex-col items-center gap-6"
      >
        <button
          onClick={() => navigate("/")}
          className="self-start flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>

        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
          <Mail className="w-7 h-7 text-gold" />
        </div>

        <h1 className="text-2xl font-semibold text-foreground">Forgot Password?</h1>

        {!sent ? (
          <>
            <p className="text-sm text-muted-foreground text-center leading-relaxed">
              Enter the email address associated with your account and we'll send you a link to reset your password.
            </p>

            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendReset()}
              className="w-full rounded-lg border border-border bg-input px-4 py-3 text-sm text-primary-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold"
            />

            <button
              onClick={handleSendReset}
              disabled={sending}
              className="w-full rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-gold-light active:scale-95 disabled:opacity-50"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Send Reset Link"}
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground text-center leading-relaxed">
              We've sent a password reset link to <span className="text-foreground font-medium">{email}</span>. Check your inbox and follow the link to reset your password.
            </p>

            <button
              onClick={() => setSent(false)}
              className="text-sm text-gold hover:text-gold-light underline transition-colors"
            >
              Didn't receive it? Send again
            </button>

            <button
              onClick={() => navigate("/")}
              className="w-full rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-gold-light active:scale-95"
            >
              Back to Sign In
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
