import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Search, Stethoscope } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import NavHeader from "@/components/NavHeader";

interface DoctorInfo {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  specialty: string | null;
  procedureCount: number;
}

const ClinicalDoctors = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [doctors, setDoctors] = useState<DoctorInfo[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchDoctors = useCallback(async () => {
    if (!profile?.facility_id) return;

    // Get all procedures at this facility
    const { data: procedures } = await supabase
      .from("procedures")
      .select("id, user_id")
      .eq("facility_id", profile.facility_id);

    if (!procedures || procedures.length === 0) {
      setDoctors([]);
      setLoading(false);
      return;
    }

    // Count procedures per doctor
    const doctorProcCounts: Record<string, number> = {};
    procedures.forEach(p => {
      doctorProcCounts[p.user_id] = (doctorProcCounts[p.user_id] || 0) + 1;
    });

    const doctorIds = Object.keys(doctorProcCounts);

    // Fetch profiles for these doctors
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url, specialty")
      .in("user_id", doctorIds);

    if (profiles) {
      const result: DoctorInfo[] = profiles.map(p => ({
        ...p,
        procedureCount: doctorProcCounts[p.user_id] || 0,
      }));
      result.sort((a, b) => (a.display_name || "").localeCompare(b.display_name || "", undefined, { sensitivity: "base" }));
      setDoctors(result);
    }
    setLoading(false);
  }, [profile?.facility_id]);

  useEffect(() => { fetchDoctors(); }, [fetchDoctors]);

  const filtered = doctors.filter(d =>
    (d.display_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (d.specialty || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 pt-16 pb-8">
      <NavHeader />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm mx-auto flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/profile")} className="text-muted-foreground hover:text-foreground transition-colors p-1">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Doctors</h1>
        </div>

        {doctors.length > 0 && (
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search doctors..."
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
            <Stethoscope size={32} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No doctors found at your facility</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((doc) => (
              <motion.button
                key={doc.user_id}
                onClick={() => navigate(`/clinical/doctors/${doc.user_id}`)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 rounded-xl bg-card border border-border p-4 hover:border-primary/40 transition-all text-left w-full"
              >
                <Avatar className="h-10 w-10 border border-border">
                  {doc.avatar_url ? <AvatarImage src={doc.avatar_url} /> : null}
                  <AvatarFallback className="bg-secondary text-foreground text-sm">
                    {(doc.display_name || "D").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{doc.display_name || "Unknown"}</p>
                  {doc.specialty && <p className="text-xs text-primary/80">{doc.specialty}</p>}
                  <p className="text-xs text-muted-foreground">{doc.procedureCount} procedure{doc.procedureCount !== 1 ? "s" : ""}</p>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ClinicalDoctors;
