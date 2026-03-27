import { useState, useEffect, useCallback } from "react";
import { Headphones, X, Plus, Search, Check, Disc3, AudioLines, Mic2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import MusicServicePrompt from "./MusicServicePrompt";

interface MusicPreference {
  id: string;
  type: string;
  value: string;
}

const GENRES = [
  "Classical", "Jazz", "Lo-Fi", "Ambient", "R&B", "Soul",
  "Pop", "Rock", "Hip-Hop", "Country", "Electronic", "Indie",
  "Latin", "Blues", "Folk", "Reggae", "Metal", "Funk",
];

const MOODS = [
  "Calm", "Focused", "Energetic", "Uplifting", "Relaxed",
  "Motivating", "Peaceful", "Intense", "Chill", "Meditative",
];

const POPULAR_ARTISTS = [
  "Hans Zimmer", "Ludovico Einaudi", "Norah Jones", "Miles Davis",
  "Yo-Yo Ma", "Enya", "Brian Eno", "Adele", "John Legend",
  "Billie Eilish", "The Weeknd", "Coldplay", "Ed Sheeran",
  "Drake", "Taylor Swift", "Kendrick Lamar",
];

type TabType = "genre" | "artist" | "mood";

const TAB_META: Record<TabType, { label: string; icon: React.ElementType }> = {
  genre: { label: "Genres", icon: Disc3 },
  artist: { label: "Artists", icon: Mic2 },
  mood: { label: "Moods", icon: Sparkles },
};

interface MusicPreferencesDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MusicPreferencesDrawer = ({ open, onOpenChange }: MusicPreferencesDrawerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<MusicPreference[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("genre");
  const [search, setSearch] = useState("");
  const [customInput, setCustomInput] = useState("");
  const [showPandoraPrompt, setShowPandoraPrompt] = useState(false);

  const fetchPreferences = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("music_preferences")
      .select("id, type, value")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    if (data) setPreferences(data as MusicPreference[]);
  }, [user]);

  useEffect(() => {
    if (open) {
      fetchPreferences();
      setShowPandoraPrompt(false);
    }
  }, [open, fetchPreferences]);

  const isSelected = (type: string, value: string) =>
    preferences.some((p) => p.type === type && p.value === value);

  const togglePreference = async (type: TabType, value: string) => {
    if (!user) return;
    const existing = preferences.find((p) => p.type === type && p.value === value);
    if (existing) {
      await supabase.from("music_preferences").delete().eq("id", existing.id);
    } else {
      await supabase.from("music_preferences").insert({
        user_id: user.id, type, value,
      } as any);
    }
    await fetchPreferences();
    setShowPandoraPrompt(true);
  };

  const addCustom = async () => {
    if (!customInput.trim() || !user) return;
    const trimmed = customInput.trim();
    if (isSelected(activeTab, trimmed)) {
      toast({ title: "Already added" });
      return;
    }
    await supabase.from("music_preferences").insert({
      user_id: user.id, type: activeTab, value: trimmed,
    } as any);
    setCustomInput("");
    await fetchPreferences();
    setShowPandoraPrompt(true);
  };

  const getItemsForTab = () => {
    switch (activeTab) {
      case "genre": return GENRES;
      case "mood": return MOODS;
      case "artist": return POPULAR_ARTISTS;
    }
  };

  const filtered = getItemsForTab().filter((item) =>
    item.toLowerCase().includes(search.toLowerCase())
  );

  const prefsForTab = preferences.filter((p) => p.type === activeTab);
  const customItems = prefsForTab
    .filter((p) => !getItemsForTab().includes(p.value))
    .map((p) => p.value);

  const allItems = [...filtered, ...customItems.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase()) && !filtered.includes(c)
  )];

  const totalCount = preferences.length;

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={() => onOpenChange(false)}
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] rounded-t-[28px] flex flex-col overflow-hidden"
            style={{
              background: "linear-gradient(180deg, hsl(0 0% 10%) 0%, hsl(0 0% 6%) 100%)",
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
            </div>

            {/* Header with gradient accent */}
            <div className="relative px-6 pb-4 pt-1">
              {/* Subtle glow behind header */}
              <div
                className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full opacity-15 blur-3xl pointer-events-none"
                style={{ background: "hsl(var(--primary))" }}
              />

              <div className="flex items-center justify-between relative">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--gold-dark)) 100%)" }}>
                    <Headphones size={20} className="text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="text-foreground font-bold text-lg tracking-tight">Your Sound</h2>
                    <p className="text-muted-foreground text-xs">
                      {totalCount > 0 ? `${totalCount} preference${totalCount !== 1 ? "s" : ""} selected` : "Curate your listening experience"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onOpenChange(false)}
                  className="w-8 h-8 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors"
                >
                  <X size={16} className="text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Tabs - pill style */}
            <div className="flex gap-2 px-6 pb-4">
              {(Object.keys(TAB_META) as TabType[]).map((key) => {
                const meta = TAB_META[key];
                const TabIcon = meta.icon;
                const count = preferences.filter((p) => p.type === key).length;
                const active = activeTab === key;
                return (
                  <button
                    key={key}
                    onClick={() => { setActiveTab(key); setSearch(""); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold rounded-2xl transition-all duration-200 ${
                      active
                        ? "text-primary-foreground shadow-lg"
                        : "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    }`}
                    style={active ? { background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--gold-dark)) 100%)" } : undefined}
                  >
                    <TabIcon size={14} />
                    {meta.label}
                    {count > 0 && (
                      <span className={`text-[10px] ml-0.5 font-bold ${active ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="px-6 pb-3">
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab === "artist" ? "artists" : activeTab + "s"}...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-2xl border-0 bg-muted/40 pl-9 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-shadow"
                />
              </div>
            </div>

            {/* Items grid */}
            <div className="flex-1 overflow-y-auto px-6 pb-3">
              <div className="flex flex-wrap gap-2">
                {allItems.map((item) => {
                  const selected = isSelected(activeTab, item);
                  return (
                    <motion.button
                      key={item}
                      layout
                      whileTap={{ scale: 0.95 }}
                      onClick={() => togglePreference(activeTab, item)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 ${
                        selected
                          ? "text-primary-foreground shadow-lg shadow-primary/20"
                          : "bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-border/50"
                      }`}
                      style={selected ? { background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--gold-dark)) 100%)" } : undefined}
                    >
                      {selected && <Check size={12} className="text-primary-foreground" />}
                      {item}
                    </motion.button>
                  );
                })}
              </div>

              {allItems.length === 0 && search && (
                <div className="text-center py-8">
                  <AudioLines size={32} className="mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No matches found</p>
                </div>
              )}
            </div>

            {/* Pandora prompt */}
            {showPandoraPrompt && preferences.length > 0 && (
              <MusicServicePrompt
                preferences={preferences}
                onDismiss={() => setShowPandoraPrompt(false)}
              />
            )}

            {/* Add custom */}
            <div className="px-6 py-4 border-t border-border/30">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={`Add custom ${activeTab}...`}
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCustom()}
                  className="flex-1 rounded-2xl border-0 bg-muted/40 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-shadow"
                />
                <button
                  onClick={addCustom}
                  disabled={!customInput.trim()}
                  className="px-5 py-3 rounded-2xl text-sm font-semibold disabled:opacity-30 transition-all flex items-center gap-1.5 text-primary-foreground hover:shadow-lg hover:shadow-primary/20"
                  style={{ background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--gold-dark)) 100%)" }}
                >
                  <Plus size={14} /> Add
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MusicPreferencesDrawer;
