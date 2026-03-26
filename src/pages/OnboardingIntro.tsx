import { motion } from "framer-motion";
import { User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NavHeader from "@/components/NavHeader";

const OnboardingIntro = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm flex flex-col items-center gap-8"
      >
        <div className="w-32 h-32 rounded-full overflow-hidden bg-card border-2 border-primary flex items-center justify-center">
          <User size={56} className="text-primary" />
        </div>

        <h1 className="text-2xl font-light tracking-wide text-foreground text-center">
          Just A Few More Questions!
        </h1>

        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Help us personalize your experience by answering a few quick questions.
        </p>

        <button
          onClick={() => navigate("/onboarding-question")}
          className="rounded-lg bg-primary px-16 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-gold-light active:scale-95"
        >
          Start
        </button>
      </motion.div>
    </div>
  );
};

export default OnboardingIntro;
