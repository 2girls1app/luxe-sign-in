import { useState, useEffect, useCallback } from "react";
import { Music, X, Plus, Search, Check } from "lucide-react";
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
  const [loading, setLoading] = useState(false);
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
    if (open) fetchPreferences();
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
        user_id: user.id,
        type,
        value,
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
      user_id: user.id,
      type: activeTab,
      value: trimmed,
    } as any);
    setCustomInput("");
    fetchPreferences();
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

  const tabs: { key: TabType; label: string }[] = [
    { key: "genre", label: "Genres" },
    { key: "artist", label: "Artists" },
    { key: "mood", label: "Moods" },
  ];

  const totalCount = preferences.length;

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50"
            onClick={() => onOpenChange(false)}
          />
          {/* Drawer */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] rounded-t-3xl bg-card border-t border-border flex flex-col"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3">
              <div className="flex items-center gap-2">
                <Music size={20} className="text-primary" />
                <h2 className="text-foreground font-semibold text-lg">Music Preferences</h2>
                {totalCount > 0 && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {totalCount}
                  </span>
                )}
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-5 pb-3">
              {tabs.map((tab) => {
                const count = preferences.filter((p) => p.type === tab.key).length;
                return (
                  <button
                    key={tab.key}
                    onClick={() => { setActiveTab(tab.key); setSearch(""); }}
                    className={`flex-1 py-2 text-sm font-medium rounded-xl transition-colors ${
                      activeTab === tab.key
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                    {count > 0 && (
                      <span className={`ml-1 text-xs ${activeTab === tab.key ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        ({count})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="px-5 pb-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab === "artist" ? "artists" : activeTab + "s"}...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-border bg-secondary pl-8 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {/* Items grid */}
            <div className="flex-1 overflow-y-auto px-5 pb-3">
              <div className="flex flex-wrap gap-2">
                {allItems.map((item) => {
                  const selected = isSelected(activeTab, item);
                  return (
                    <button
                      key={item}
                      onClick={() => togglePreference(activeTab, item)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all ${
                        selected
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 border border-border"
                      }`}
                    >
                      {selected && <Check size={12} />}
                      {item}
                    </button>
                  );
                })}
              </div>

              {allItems.length === 0 && search && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No matches found
                </p>
              )}
            </div>

            {/* Add custom */}
            <div className="px-5 py-3 border-t border-border">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={`Add custom ${activeTab}...`}
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCustom()}
                  className="flex-1 rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  onClick={addCustom}
                  disabled={!customInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-40 transition-colors flex items-center gap-1"
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
