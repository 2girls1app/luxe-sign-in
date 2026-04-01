import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2, Stethoscope, ClipboardList, FileEdit, Bell, ChevronRight, MapPin
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface DoctorProfile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  specialty: string | null;
  role: string | null;
}

const ClinicalDashboardSection = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [facility, setFacility] = useState<{ id: string; name: string; location: string | null } | null>(null);
  const [doctorCount, setDoctorCount] = useState(0);
  const [prefCardCount, setPrefCardCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchData = useCallback(async () => {
    if (!user || !profile?.facility_id) return;

    // Fetch facility info
    const { data: facilityData } = await supabase
      .from("facilities")
      .select("id, name, location")
      .eq("id", profile.facility_id)
      .single();
    if (facilityData) setFacility(facilityData);

    // Fetch procedures at this facility to find doctors
    const { data: procedures } = await supabase
      .from("procedures")
      .select("id, user_id")
      .eq("facility_id", profile.facility_id);

    if (procedures) {
      const uniqueDoctors = new Set(procedures.map(p => p.user_id));
      setDoctorCount(uniqueDoctors.size);
      setPrefCardCount(procedures.length);
    }

    // Fetch pending changes submitted by this user
    const { count } = await supabase
      .from("pending_preference_changes")
      .select("id", { count: "exact", head: true })
      .eq("submitted_by", user.id)
      .eq("status", "pending");
    setPendingCount(count ?? 0);
  }, [user, profile?.facility_id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const widgets = [
    { id: "doctors", icon: Stethoscope, label: "Doctors", desc: "View surgeons at your facility", route: "/clinical/doctors", count: doctorCount },
    { id: "pref-cards", icon: ClipboardList, label: "Preference Cards", desc: "View & print preference cards", route: "/clinical/preference-cards", count: prefCardCount },
    { id: "changes", icon: FileEdit, label: "Requested Changes", desc: "Track your change requests", route: "/clinical/requested-changes", count: pendingCount },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* My Facility */}
      {facility && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Building2 size={16} className="text-primary" />
            <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
              My Facility
            </h2>
          </div>
          <div className="rounded-xl border border-primary/30 bg-card p-4">
            <p className="text-foreground font-medium">{facility.name}</p>
            {facility.location && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin size={12} className="text-primary" /> {facility.location}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Navigation Widgets */}
      <div className="flex flex-col gap-3">
        {widgets.map((w, i) => {
          const Icon = w.icon;
          return (
            <motion.button
              key={w.id}
              onClick={() => navigate(w.route)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group relative flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/5 active:scale-[0.98] text-left w-full"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <Icon size={20} className="text-primary" />
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-sm font-medium text-foreground">{w.label}</p>
                <p className="text-xs text-muted-foreground">{w.desc}</p>
              </div>
              {w.count > 0 && (
                <Badge variant="secondary" className="text-[10px] ml-auto mr-6 shrink-0">
                  {w.count}
                </Badge>
              )}
              <ChevronRight size={16} className="absolute right-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default ClinicalDashboardSection;
