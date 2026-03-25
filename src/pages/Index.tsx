import { useState } from "react";
import { motion } from "framer-motion";
import { Facebook } from "lucide-react";
import { Link } from "react-router-dom";
import logoImg from "@/assets/logo.png";


const Index = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm flex flex-col items-center gap-6"
      >
        <img src={logoImg} alt="Advanced Surgical Solutions" className="w-40 h-40 object-contain" />
        <h1 className="text-2xl font-light tracking-[0.2em] text-primary text-center uppercase">
          Advanced Surgical Solutions
        </h1>

        <p className="text-2xl font-light tracking-wide text-primary">
          Welcome back!
        </p>

        <div className="w-full flex flex-col gap-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-lg border border-border bg-input px-4 py-3 text-sm text-primary-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-border bg-input px-4 py-3 text-sm text-primary-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold"
          />
        </div>

        <label className="flex items-center gap-2 self-start cursor-pointer">
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

        <button className="rounded-lg bg-gold px-10 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-gold-light active:scale-95">
          Sign In
        </button>

        <div className="w-full flex flex-col gap-3">
          <button className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted">
            <Facebook size={18} />
            Sign In with Facebook
          </button>
          <button className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign In with Google
          </button>
        </div>

        <div className="w-full border-t border-border" />

        <p className="text-sm text-muted-foreground">
          Do not have an account,{" "}
          <Link to="/select-profession" className="text-primary hover:text-gold-light underline">
            Sign Up Here
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Index;
