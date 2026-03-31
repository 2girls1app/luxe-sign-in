import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, User, ClipboardList, Clock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAdminRole } from "@/hooks/useAdminRole";
import { supabase } from "@/integrations/supabase/client";
import NavHeader from "@/components/NavHeader";

interface DoctorProfile {
  user_id: string; display_name: string | null; avatar_url: string | null;
  role: string | null; specialty: string | null;
}
interface Procedure {
  id: string; name: string; category: string | null; created_at: string; facility_id: string | null;
}
interface PendingChange {
  id: string; procedure_id: string; category: string; status: string;
}

const AdminDoctorDetail = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { isAdmin, loading } = useAdminRole();
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [prefCounts, setPrefCounts] = useState<Record<string, number>>({});

  const fetchData = useCallback(async () => {
    if (!userId || !isAdmin) return;

    const [profileRes, procsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name, avatar_url, role, specialty").eq("user_id", userId).single(),
      supabase.from("procedures").select("id, name, category, created_at, facility_id").eq("user_id", userId).order("name"),
    ]);

    if (profileRes.data) setDoctor(profileRes.data as DoctorProfile);
    if (procsRes.data) {
      setProcedures(procsRes.data as Procedure[]);
      const procIds = (procsRes.data as Procedure[]).map(p => p.id);
      if (procIds.length > 0) {
        const [prefsRes, pendingRes] = await Promise.all([
          supabase.from("procedure_preferences").select("procedure_id").in("procedure_id", procIds),
          supabase.from("pending_preference_changes").select("id, procedure_id, category, status").eq("status", "pending").in("procedure_id", procIds),
        ]);
        if (prefsRes.data) {
          const counts: Record<string, number> = {};
          prefsRes.data.forEach((p: any) => { counts[p.procedure_id] = (counts[p.procedure_id] || 0) + 1; });
          setPrefCounts(counts);
        }
        if (pendingRes.data) setPendingChanges(pendingRes.data as PendingChange[]);
      }
    }
  }, [userId, isAdmin]);

  useEffect(() => {
    if (!loading && !isAdmin) { navigate("/profile"); return; }
    if (isAdmin) fetchData();
  }, [isAdmin, loading, fetchData]);

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;
  if (!isAdmin) return null;

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 pt-16 pb-8">
      <NavHeader />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg mx-auto flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/admin/doctors")} className="text-muted-foreground hover:text-foreground transition-colors p-1"><ArrowLeft size={20} /></button>
          {doctor && (
            <>
              <Avatar className="h-10 w-10 border border-border">
                {doctor.avatar_url ? <AvatarImage src={doctor.avatar_url} /> : null}
                <AvatarFallback className="bg-secondary text-foreground text-sm">
                  {(doctor.display_name || "D").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{doctor.display_name}</p>
                <p className="text-xs text-primary">{doctor.specialty || "No specialty"}</p>
              </div>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-card border border-border p-4 text-center">
            <ClipboardList size={18} className="text-primary mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{procedures.length}</p>
            <p className="text-[10px] text-muted-foreground">Preference Cards</p>
          </div>
          <button
            onClick={() => pendingChanges.length > 0 && navigate(`/admin/doctors/${userId}/pending`)}
            className={`rounded-xl bg-card border border-border p-4 text-center transition-all ${pendingChanges.length > 0 ? "hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/5 cursor-pointer" : "cursor-default"}`}
          >
            <Clock size={18} className="text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{pendingChanges.length}</p>
            <p className="text-[10px] text-muted-foreground">Pending Changes</p>
            {pendingChanges.length > 0 && <p className="text-[9px] text-amber-400 mt-1">Tap to review →</p>}
          </button>
        </div>

        {/* Procedures list */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Preference Cards</h2>
          <div className="space-y-2">
            {procedures.map(proc => {
              const pending = pendingChanges.filter(pc => pc.procedure_id === proc.id);
              return (
                <button
                  key={proc.id}
                  onClick={() => navigate(`/admin/doctors/${userId}/procedure/${proc.id}`)}
                  className="w-full flex items-center gap-3 rounded-xl bg-card border border-border p-4 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all text-left"
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <ClipboardList size={16} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{proc.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {prefCounts[proc.id] || 0} preferences
                      {proc.category && ` · ${proc.category}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {pending.length > 0 && (
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[9px]">
                        <AlertTriangle size={10} className="mr-0.5" />
                        {pending.length} pending
                      </Badge>
                    )}
                  </div>
                </button>
              );
            })}
            {procedures.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No preference cards found for this doctor</p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDoctorDetail;
