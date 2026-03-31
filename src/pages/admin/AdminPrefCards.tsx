import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ClipboardList, Search, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import NavHeader from "@/components/NavHeader";
import AddProcedureDialog from "@/components/AddProcedureDialog";

interface UserProfile { user_id: string; display_name: string | null; }
interface Procedure { id: string; name: string; category: string | null; user_id: string; created_at: string; }
interface PrefCard { id: string; procedure_id: string; category: string; value: string; updated_at: string; }

const AdminPrefCards = () => {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAdminRole();
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [prefCards, setPrefCards] = useState<PrefCard[]>([]);
  const [facilities, setFacilities] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!loading && !isAdmin) { navigate("/profile"); return; }
    if (isAdmin) {
      Promise.all([
        supabase.from("profiles").select("user_id, display_name"),
        supabase.from("procedures").select("*").order("created_at", { ascending: false }),
        supabase.from("procedure_preferences").select("*").order("updated_at", { ascending: false }),
        supabase.from("facilities").select("id, name").order("name"),
      ]).then(([u, p, pc, f]) => {
        if (u.data) setUsers(u.data as UserProfile[]);
        if (p.data) setProcedures(p.data as Procedure[]);
        if (pc.data) setPrefCards(pc.data as PrefCard[]);
        if (f.data) setFacilities(f.data);
      });
    }
  }, [isAdmin, loading]);

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;
  if (!isAdmin) return null;

  const getUserName = (userId: string) => users.find(u => u.user_id === userId)?.display_name || "Unknown";

  const filtered = procedures.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    getUserName(p.user_id).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 pt-16 pb-8">
      <NavHeader />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg mx-auto flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/profile")} className="text-muted-foreground hover:text-foreground transition-colors p-1"><ArrowLeft size={20} /></button>
          <ClipboardList size={20} className="text-primary" />
          <h1 className="text-lg font-semibold text-foreground">Preference Cards</h1>
          <Badge variant="secondary" className="ml-auto text-xs">{procedures.length} procedures</Badge>
        </div>

        <AddProcedureDialog
          facilities={facilities}
          onAdded={() => {
            supabase.from("procedures").select("*").order("created_at", { ascending: false }).then(({ data }) => {
              if (data) setProcedures(data as Procedure[]);
            });
          }}
          triggerVariant="prominent"
        />

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Search procedures..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-secondary pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-2">
          {filtered.map(proc => {
            const cards = prefCards.filter(pc => pc.procedure_id === proc.id);
            return (
              <div key={proc.id} className="rounded-xl bg-card border border-border p-4">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <p className="text-sm font-medium text-foreground">{proc.name}</p>
                    <p className="text-[10px] text-muted-foreground">By: {getUserName(proc.user_id)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={cards.length > 0 ? "default" : "secondary"} className="text-[10px]">
                      {cards.length > 0 ? `${cards.length} prefs` : "No prefs"}
                    </Badge>
                    {proc.category && <Badge variant="outline" className="text-[10px]">{proc.category}</Badge>}
                  </div>
                </div>
                {cards.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {cards.map(c => <Badge key={c.id} variant="secondary" className="text-[9px]">{c.category}</Badge>)}
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No procedures found</p>}
        </div>
      </motion.div>
    </div>
  );
};

export default AdminPrefCards;
