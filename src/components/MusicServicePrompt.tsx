import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, CheckCircle2, Radio } from "lucide-react";

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
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="mx-5 mb-3 rounded-2xl border border-border bg-secondary/50 p-4"
      >
        {connected ? (
          <div className="flex items-center gap-3">
            <CheckCircle2 size={20} className="text-primary shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Pandora opened!</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Search for {topPrefs.join(", ")} to start listening.
              </p>
            </div>
            <button onClick={onDismiss} className="text-xs text-muted-foreground hover:text-foreground">
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Radio size={20} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Play on Pandora</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Listen to {topPrefs.length > 0 ? topPrefs.join(", ") : "music"} based on your preferences.
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleConnect}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <ExternalLink size={14} />
                Open Pandora
              </button>
              <button
                onClick={onDismiss}
                className="px-4 py-2.5 rounded-xl bg-secondary text-muted-foreground text-sm font-medium hover:text-foreground border border-border transition-colors"
              >
                Later
              </button>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default MusicServicePrompt;
