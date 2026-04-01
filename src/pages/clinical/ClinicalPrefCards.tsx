import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Search, ClipboardList } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import NavHeader from "@/components/NavHeader";

interface ProcedureWithDoctor {
  id: string;
  name: string;
  category: string | null;
  user_id: string;
  doctor_name: string | null;
}

const ClinicalPrefCards = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [cards, setCards] = useState<ProcedureWithDoctor[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!profile?.facility_id) return;

    const { data: procedures } = await supabase
      .from("procedures")
      .select("id, name, category, user_id")
      .eq("facility_id", profile.facility_id)
      .order("name");

    if (!procedures || procedures.length === 0) { setCards([]); setLoading(false); return; }

    const doctorIds = [...new Set(procedures.map(p => p.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", doctorIds);

    const nameMap: Record<string, string> = {};
    profiles?.forEach(p => { nameMap[p.user_id] = p.display_name || "Unknown"; });

    setCards(procedures.map(p => ({ ...p, doctor_name: nameMap[p.user_id] || "Unknown" })));
    setLoading(false);
  }, [profile?.facility_id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = cards.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.doctor_name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 pt-16 pb-8">
      <NavHeader />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm mx-auto flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/profile")} className="text-muted-foreground hover:text-foreground transition-colors p-1">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Preference Cards</h1>
        </div>

        {cards.length > 0 && (
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by procedure or doctor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-secondary pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl bg-card border border-border p-6 text-center">
            <ClipboardList size={32} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No preference cards found</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((card) => (
              <motion.button
                key={card.id}
                onClick={() => navigate(`/clinical/procedure/${card.id}`)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 rounded-xl bg-card border border-border p-4 hover:border-primary/40 transition-all text-left w-full"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <ClipboardList size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{card.name}</p>
                  <p className="text-xs text-muted-foreground">{card.doctor_name}</p>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ClinicalPrefCards;
