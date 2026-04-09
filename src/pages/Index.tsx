import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import logoImg from "@/assets/logo.png";
import PasswordInput from "@/components/PasswordInput";


const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const handleSignIn = async () => {
    if (!username || !password) {
      toast({ title: "Please enter username and password", variant: "destructive" });
      return;
    }
    setSigningIn(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: username,
      password,
    });
    setSigningIn(false);
    if (error) {
      toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
    } else {
      localStorage.setItem("rememberMe", remember ? "true" : "false");
      sessionStorage.setItem("activeSession", "true");
      // Check profile for redirect
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, onboarding_completed")
          .eq("user_id", session.user.id)
          .single();
        if (!profile?.role) {
          navigate("/select-profession");
        } else {
          navigate("/profile");
        }
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) {
      setGoogleLoading(false);
      toast({ title: "Google sign in failed", description: String(error), variant: "destructive" });
    }
    // If redirected, page will reload and AuthCallback handles routing
  };

  const handleAppleSignIn = async () => {
    setAppleLoading(true);
    const { error } = await lovable.auth.signInWithOAuth("apple", {
      redirect_uri: window.location.origin,
    });
    if (error) {
      setAppleLoading(false);
      toast({ title: "Apple sign in failed", description: String(error), variant: "destructive" });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm flex flex-col items-center gap-6"
      >
        <img src={logoImg} alt="1st Assist" className="w-36 h-36 object-contain" />
        <h1 className="text-2xl font-bold italic tracking-[0.25em] text-gold text-center uppercase">
          1st Assist
        </h1>

        <p className="text-3xl font-light tracking-wide text-foreground">
          Welcome Back!
        </p>

        <div className="w-full flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-lg border border-border bg-input px-4 py-3 text-sm text-primary-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold"
          />
          <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        <div className="w-full flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                remember ? "bg-gold border-gold" : "border-muted-foreground"
              }`}
              onClick={() => setRemember(!remember)}
            >
              {remember && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6L5 9L10 3" stroke="hsl(0,0%,8%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className="text-sm text-muted-foreground" onClick={() => setRemember(!remember)}>
              Remember Me
            </span>
          </label>
          <Link to="/forgot-password" className="text-xs text-gold underline hover:text-gold-light transition-colors">
            Forgot Password?
          </Link>
        </div>

        <button
          onClick={handleSignIn}
          disabled={signingIn}
          className="rounded-lg bg-gold px-10 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-gold-light active:scale-95 disabled:opacity-50"
        >
          {signingIn ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Sign In"}
        </button>

        <div className="w-full flex flex-col gap-3">
          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            {googleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            Sign In with Google
          </button>
          <button
            onClick={handleAppleSignIn}
            disabled={appleLoading}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            {appleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
            )}
            Sign In with Apple
          </button>
        </div>

        <div className="w-full border-t border-border" />

        <p className="text-sm text-muted-foreground">
          Do not have an account,{" "}
          <Link to="/select-account-type" className="text-primary hover:text-gold-light underline">
            Sign Up Here
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Index;
