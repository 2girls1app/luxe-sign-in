import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThumbsUp, ThumbsDown, Search, Music, Disc, Mic } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NavHeader from "@/components/NavHeader";

const OnboardingQuestion = () => {
  const [answer, setAnswer] = useState<"yes" | "no" | null>(null);
  const [step, setStep] = useState<"question" | "playlist">("question");
  const [playlist, setPlaylist] = useState("");
  const navigate = useNavigate();

  const handleNext = () => {
    if (answer === "yes") {
      setStep("playlist");
    } else {
      navigate("/profile");
    }
  };

  const handlePlaylistNext = () => {
    navigate("/profile");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <AnimatePresence mode="wait">
        {step === "question" ? (
          <motion.div
            key="question"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-sm flex flex-col items-center gap-8"
          >
            <h1 className="text-lg font-light tracking-wide text-foreground text-center leading-relaxed">
              Do you prefer to listen to music during your procedures?
            </h1>

            <div className="w-full flex flex-col gap-4">
              <button
                onClick={() => setAnswer("yes")}
                className={`flex items-center gap-4 w-full rounded-lg border px-5 py-4 text-sm font-medium transition-all ${
                  answer === "yes"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-secondary text-foreground hover:bg-muted"
                }`}
              >
                <ThumbsUp size={20} className={answer === "yes" ? "text-green-400" : "text-muted-foreground"} />
                Yes, Definitely 👍
              </button>

              <button
                onClick={() => setAnswer("no")}
                className={`flex items-center gap-4 w-full rounded-lg border px-5 py-4 text-sm font-medium transition-all ${
                  answer === "no"
                    ? "border-destructive bg-destructive/10 text-destructive"
                    : "border-border bg-secondary text-foreground hover:bg-muted"
                }`}
              >
                <ThumbsDown size={20} className={answer === "no" ? "text-red-400" : "text-muted-foreground"} />
                Nope, Never 👎
              </button>
            </div>

            <button
              onClick={handleNext}
              disabled={!answer}
              className="rounded-lg bg-primary px-12 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-gold-light active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next Step
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="playlist"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-sm flex flex-col items-center gap-8"
          >
            <h1 className="text-lg font-light tracking-wide text-foreground text-center leading-relaxed">
              If yes, please provide your Pandora playlist
            </h1>

            <div className="w-full relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search playlists..."
                value={playlist}
                onChange={(e) => setPlaylist(e.target.value)}
                className="w-full rounded-lg border border-border bg-input pl-11 pr-4 py-3 text-sm text-primary-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="w-full flex justify-center gap-8">
              <button className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                <Music size={24} />
                <span className="text-xs">Playlists</span>
              </button>
              <button className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                <Disc size={24} />
                <span className="text-xs">Albums</span>
              </button>
              <button className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                <Mic size={24} />
                <span className="text-xs">Artists</span>
              </button>
            </div>

            <button
              onClick={handlePlaylistNext}
              className="rounded-lg bg-primary px-12 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-gold-light active:scale-95"
            >
              Next Step
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OnboardingQuestion;
