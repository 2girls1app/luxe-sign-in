import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Stethoscope, Search, ChevronRight, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAdminRole } from "@/hooks/useAdminRole";
import { supabase } from "@/integrations/supabase/client";
import NavHeader from "@/components/NavHeader";
import CreateSurgeonDialog from "@/components/CreateSurgeonDialog";

interface UserProfile {
  id: string; user_id: string; display_name: string | null; avatar_url: string | null;
  role: string | null; specialty: string | null; created_at: string;
}
interface Procedure {
  id: string; name: string; user_id: string; category: string | null;
}

const SPECIALTIES = [
  "All Specialties",
  "Cosmetic Surgery",
  "Bariatric Surgery",
  "Orthopedic Surgery",
  "Neurosurgery",
  "Cardiothoracic Surgery",
  "Vascular Surgery",
  "General Surgery",
  "Plastic Surgery",
  "Urologic Surgery",
  "ENT Surgery",
  "Gynecologic Surgery",
];

const AdminDoctors = () => {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAdminRole();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [search, setSearch] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("All Specialties");

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

  const filtered = doctors
    .filter(d =>
      ((d.display_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (d.specialty || "").toLowerCase().includes(search.toLowerCase())) &&
      (specialtyFilter === "All Specialties" || (d.specialty || "").toLowerCase() === specialtyFilter.toLowerCase())
    )
    .sort((a, b) => (a.display_name || "").localeCompare(b.display_name || "", undefined, { sensitivity: "base" }));

  const uniqueSpecialties = [...new Set(doctors.map(d => d.specialty).filter(Boolean))] as string[];

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

        {/* Specialty Filter */}
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-muted-foreground shrink-0" />
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {SPECIALTIES.filter(s => s === "All Specialties" || uniqueSpecialties.some(us => us.toLowerCase() === s.toLowerCase()) || s === specialtyFilter).map(s => (
              <button key={s} onClick={() => setSpecialtyFilter(s)}
                className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium border transition-colors ${
                  specialtyFilter === s
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-primary/50"
                }`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {filtered.map(d => (
            <button
              key={d.id}
              onClick={() => navigate(`/admin/doctors/${d.user_id}`)}
              className="w-full flex items-center gap-3 rounded-xl bg-card border border-border p-4 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all text-left"
            >
              <Avatar className="h-10 w-10 border border-border">
                {d.avatar_url ? <AvatarImage src={d.avatar_url} /> : null}
                <AvatarFallback className="bg-secondary text-foreground text-sm">{(d.display_name || "D").charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{d.display_name}</p>
                <p className="text-xs text-primary">{d.specialty || "No specialty"}</p>
                <p className="text-[10px] text-muted-foreground">{d.role}</p>
              </div>
              <Badge variant="secondary" className="text-[10px] shrink-0">
                {procedures.filter(p => p.user_id === d.user_id).length} cards
              </Badge>
              <ChevronRight size={16} className="text-muted-foreground shrink-0" />
            </button>
          ))}
          {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No doctors found</p>}
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDoctors;
