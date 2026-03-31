import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Stethoscope, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAdminRole } from "@/hooks/useAdminRole";
import { supabase } from "@/integrations/supabase/client";
import NavHeader from "@/components/NavHeader";

interface UserProfile {
  id: string; user_id: string; display_name: string | null; avatar_url: string | null;
  role: string | null; specialty: string | null; created_at: string;
}
interface Procedure {
  id: string; name: string; user_id: string; category: string | null;
}

const AdminDoctors = () => {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAdminRole();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!loading && !isAdmin) { navigate("/profile"); return; }
    if (isAdmin) {
      Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("procedures").select("id, name, user_id, category"),
      ]).then(([u, p]) => {
        if (u.data) setUsers(u.data as UserProfile[]);
        if (p.data) setProcedures(p.data as Procedure[]);
      });
    }
  }, [isAdmin, loading]);

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;
  if (!isAdmin) return null;

  const doctors = users.filter(u =>
    (u.role || "").toLowerCase().includes("doctor") ||
    (u.role || "").toLowerCase().includes("surgeon") ||
    (u.role || "").toLowerCase().includes("physician") ||
    u.specialty
  );

  const filtered = doctors.filter(d =>
    (d.display_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (d.specialty || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 pt-16 pb-8">
      <NavHeader />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg mx-auto flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/profile")} className="text-muted-foreground hover:text-foreground transition-colors p-1"><ArrowLeft size={20} /></button>
          <Stethoscope size={20} className="text-primary" />
          <h1 className="text-lg font-semibold text-foreground">Doctors</h1>
          <Badge variant="secondary" className="ml-auto text-xs">{doctors.length} doctors</Badge>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Search doctors..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-secondary pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-2">
          {filtered.map(d => (
            <div key={d.id} className="flex items-center gap-3 rounded-xl bg-card border border-border p-4">
              <Avatar className="h-10 w-10 border border-border">
                {d.avatar_url ? <AvatarImage src={d.avatar_url} /> : null}
                <AvatarFallback className="bg-secondary text-foreground text-sm">{(d.display_name || "D").charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{d.display_name}</p>
                <p className="text-xs text-primary">{d.specialty || "No specialty"}</p>
                <p className="text-[10px] text-muted-foreground">{d.role}</p>
              </div>
              <Badge variant="secondary" className="text-[10px]">
                {procedures.filter(p => p.user_id === d.user_id).length} procedures
              </Badge>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No doctors found</p>}
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDoctors;
