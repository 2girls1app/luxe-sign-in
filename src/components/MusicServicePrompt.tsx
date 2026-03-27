import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, CheckCircle2, Headphones, Play } from "lucide-react";

interface MusicServicePromptProps {
  preferences: { type: string; value: string }[];
  onDismiss: () => void;
}

const MusicServicePrompt = ({ preferences, onDismiss }: MusicServicePromptProps) => {
  const [connected, setConnected] = useState(false);

  const buildPandoraUrl = () => {
    const artists = preferences.filter((p) => p.type === "artist").map((p) => p.value);
    const genres = preferences.filter((p) => p.type === "genre").map((p) => p.value);
    const searchTerm = artists.length > 0 ? artists[0] : genres[0] || "relaxing music";
    return `https://www.pandora.com/search/${encodeURIComponent(searchTerm)}/all`;
  };

  const handleConnect = () => {
    window.open(buildPandoraUrl(), "_blank", "noopener,noreferrer");
    setConnected(true);
  };

  const topPrefs = preferences.slice(0, 3).map((p) => p.value);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.25 }}
        className="mx-6 mb-3 rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, hsl(0 0% 14%) 0%, hsl(0 0% 10%) 100%)",
          border: "1px solid hsl(0 0% 20%)",
        }}
      >
        {connected ? (
          <div className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--gold-dark)) 100%)" }}>
              <CheckCircle2 size={18} className="text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Now Playing</p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {topPrefs.join(" · ")}
              </p>
            </div>
            <button
              onClick={onDismiss}
              className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-xl bg-muted/40 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="p-4">
            {/* Header row */}
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--gold-dark)) 100%)" }}>
                  <Headphones size={22} className="text-primary-foreground" />
                </div>
                {/* Animated pulse ring */}
                <div className="absolute inset-0 rounded-2xl animate-ping opacity-20" style={{ background: "hsl(var(--primary))" }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">Ready to Listen?</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Play {topPrefs.length > 0 ? topPrefs.join(", ") : "music"} on Pandora
                </p>
              </div>
            </div>

            {/* Preview pills */}
            {topPrefs.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {topPrefs.map((pref) => (
                  <span key={pref} className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-muted/40 text-muted-foreground">
                    {pref}
                  </span>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleConnect}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold text-primary-foreground transition-all hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--gold-dark)) 100%)" }}
              >
                <Play size={14} fill="currentColor" />
                Play on Pandora
              </button>
              <button
                onClick={onDismiss}
                className="px-4 py-3 rounded-2xl bg-muted/30 text-muted-foreground text-sm font-medium hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default MusicServicePrompt;
