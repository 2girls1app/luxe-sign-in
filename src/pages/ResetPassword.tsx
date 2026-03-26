import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Lock, CheckCircle, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const passwordStrength = (pw: string) => {
    if (pw.length < 8) return { label: "Too short", color: "text-destructive" };
    let score = 0;
    if (/[a-z]/.test(pw)) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^a-zA-Z0-9]/.test(pw)) score++;
    if (score <= 2) return { label: "Weak", color: "text-destructive" };
    if (score === 3) return { label: "Good", color: "text-gold" };
    return { label: "Strong", color: "text-green-400" };
  };

  const handleReset = async () => {
    if (password.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      toast({ title: "Failed to reset password", description: error.message, variant: "destructive" });
    } else {
      setSuccess(true);
      toast({ title: "Password updated successfully" });
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm flex flex-col items-center gap-6"
        >
          <CheckCircle className="w-16 h-16 text-green-400" />
          <h1 className="text-2xl font-semibold text-foreground">Password Reset!</h1>
          <p className="text-sm text-muted-foreground text-center">
            Your password has been updated successfully. You can now sign in with your new password.
          </p>
          <button
            onClick={() => navigate("/")}
            className="w-full rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-gold-light active:scale-95"
          >
            Sign In
          </button>
        </motion.div>
      </div>
    );
  }

  const strength = passwordStrength(password);

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
          <Lock className="w-7 h-7 text-gold" />
        </div>

        <h1 className="text-2xl font-semibold text-foreground">Reset Password</h1>
        <p className="text-sm text-muted-foreground text-center">
          Enter your new password below.
        </p>

        <div className="w-full flex flex-col gap-4">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-input px-4 py-3 pr-10 text-sm text-primary-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {password && (
            <p className={`text-xs ${strength.color}`}>
              Password strength: {strength.label}
            </p>
          )}

          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleReset()}
              className="w-full rounded-lg border border-border bg-input px-4 py-3 pr-10 text-sm text-primary-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {confirmPassword && password !== confirmPassword && (
            <p className="text-xs text-destructive">Passwords do not match</p>
          )}
        </div>

        <button
          onClick={handleReset}
          disabled={saving || !password || !confirmPassword}
          className="w-full rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-gold-light active:scale-95 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Save Password"}
        </button>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
