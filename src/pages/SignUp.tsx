import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import logoImg from "@/assets/logo.png";
import NavHeader from "@/components/NavHeader";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const SignUp = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [captcha, setCaptcha] = useState(false);
  const [signingUp, setSigningUp] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const profession = (location.state as any)?.profession || "";

  const handleSubmit = async () => {
    if (!firstName || !lastName || !email || !password || password !== confirmPassword || !captcha) return;
    const fullName = `${firstName} ${lastName}`;
    setSigningUp(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          first_name: firstName,
          last_name: lastName,
          profession: profession,
        },
      },
    });
    setSigningUp(false);
    if (error) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Check your email", description: "We sent you a confirmation link." });
      navigate("/profile-picture");
    }
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) {
      setGoogleLoading(false);
      toast({ title: "Google sign up failed", description: String(error), variant: "destructive" });
    }
  };

  const handleAppleSignUp = async () => {
    setAppleLoading(true);
    const { error } = await lovable.auth.signInWithOAuth("apple", {
      redirect_uri: window.location.origin,
    });
    if (error) {
      setAppleLoading(false);
      toast({ title: "Apple sign up failed", description: String(error), variant: "destructive" });
    }
  };

  const inputClass =
    "w-full rounded-lg border border-border bg-input px-4 py-3 text-sm text-primary-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 pt-16 pb-12">
      <NavHeader />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm flex flex-col items-center gap-6"
      >
        <img src={logoImg} alt="1st Assist" className="w-40 h-40 object-contain" />
        <h1 className="text-2xl font-light tracking-[0.2em] text-primary text-center uppercase">
          1st Assist
        </h1>

        <div className="w-full flex flex-col items-center gap-1">
          <h2 className="text-2xl font-bold tracking-wide text-foreground">
            Create Account
          </h2>
          {profession && (
            <span className="text-sm font-light text-muted-foreground capitalize">
              {profession.replace("-", " ")}
            </span>
          )}
        </div>

        <div className="w-full flex flex-col gap-4">
          <input type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
          <input type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
          <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} />
          <input type="tel" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
        </div>

        {/* CAPTCHA checkbox */}
        <label className="flex items-center gap-3 self-start cursor-pointer w-full rounded-lg border border-border bg-secondary px-4 py-3">
          <div
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              captcha ? "bg-primary border-primary" : "border-muted-foreground"
            }`}
            onClick={() => setCaptcha(!captcha)}
          >
            {captcha && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6L5 9L10 3" stroke="hsl(0,0%,8%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <span className="text-sm text-foreground" onClick={() => setCaptcha(!captcha)}>
            I'm not a robot
          </span>
        </label>

        <button
          onClick={handleSubmit}
          disabled={!fullName || !email || !password || password !== confirmPassword || !captcha || signingUp}
          className="rounded-lg bg-primary px-10 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-gold-light active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {signingUp ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Sign Up"}
        </button>

        <div className="w-full flex flex-col gap-3">
          <button
            onClick={handleGoogleSignUp}
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
            Sign Up with Google
          </button>
          <button
            onClick={handleAppleSignUp}
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
            Sign Up with Apple
          </button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          By signing up, you agree to our{" "}
          <a href="#" className="text-primary hover:text-gold-light underline">Privacy Policy</a>
          {" "}and{" "}
          <a href="#" className="text-primary hover:text-gold-light underline">Terms of Service</a>
        </p>

        <div className="w-full border-t border-border" />

        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/" className="text-primary hover:text-gold-light underline">
            Sign In Here
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default SignUp;
