import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Stethoscope, ClipboardList } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import NavHeader from "@/components/NavHeader";

interface ProcedureInfo {
  id: string;
  name: string;
  category: string | null;
}

const ClinicalDoctorDetail = () => {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [doctor, setDoctor] = useState<{ display_name: string | null; avatar_url: string | null; specialty: string | null } | null>(null);
  const [procedures, setProcedures] = useState<ProcedureInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!doctorId || !profile?.facility_id) return;

    const [docRes, procRes] = await Promise.all([
      supabase.from("profiles").select("display_name, avatar_url, specialty").eq("user_id", doctorId).single(),
      supabase.from("procedures").select("id, name, category").eq("user_id", doctorId).eq("facility_id", profile.facility_id).order("name"),
    ]);

    if (docRes.data) setDoctor(docRes.data);
    if (procRes.data) setProcedures(procRes.data);
    setLoading(false);
  }, [doctorId, profile?.facility_id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 pt-16 pb-8">
      <NavHeader />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm mx-auto flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/clinical/doctors")} className="text-muted-foreground hover:text-foreground transition-colors p-1">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Doctor Detail</h1>
        </div>

        {doctor && (
          <div className="flex items-center gap-4 rounded-xl bg-card border border-border p-4">
            <Avatar className="h-14 w-14 border-2 border-primary/30">
              {doctor.avatar_url ? <AvatarImage src={doctor.avatar_url} /> : null}
              <AvatarFallback className="bg-secondary text-foreground text-lg">
                {(doctor.display_name || "D").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-foreground font-medium">{doctor.display_name || "Unknown"}</p>
              {doctor.specialty && <p className="text-xs text-primary/80">{doctor.specialty}</p>}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <ClipboardList size={16} className="text-primary" />
          <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Preference Cards
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
        ) : procedures.length === 0 ? (
          <div className="rounded-xl bg-card border border-border p-6 text-center">
            <Stethoscope size={32} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No preference cards found</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {procedures.map((proc) => (
              <motion.button
                key={proc.id}
                onClick={() => navigate(`/clinical/procedure/${proc.id}`)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 rounded-xl bg-card border border-border p-4 hover:border-primary/40 transition-all text-left w-full"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <ClipboardList size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{proc.name}</p>
                  {proc.category && <p className="text-xs text-muted-foreground">{proc.category}</p>}
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ClinicalDoctorDetail;
