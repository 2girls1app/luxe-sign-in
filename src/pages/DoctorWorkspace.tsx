import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Search, Plus, Stethoscope,
  Heart, Activity, Brain, Bone, Eye, Baby, Scissors, HandMetal, Ear,
  Waypoints, Shield, Flame, Zap, Ribbon, Footprints, Syringe, Cross,
  Building2,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import NavHeader from "@/components/NavHeader";

interface DoctorProfile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string | null;
  specialty: string | null;
}

interface Procedure {
  id: string;
  name: string;
  category: string | null;
  facility_id: string | null;
  created_at: string;
}

const PROCEDURE_ICON_MAP: Record<string, React.ElementType> = {
  breast: Heart, cardiac: Activity, cardio: Activity, heart: Activity,
  neuro: Brain, brain: Brain, spine: Brain,
  ortho: Bone, bone: Bone, joint: Bone, knee: Bone, hip: Bone, shoulder: Bone, fracture: Bone,
  eye: Eye, ophthalm: Eye, lasik: Eye, cataract: Eye,
  pediatric: Baby,
  cosmetic: Scissors, plastic: Scissors, rhinoplasty: Scissors, facelift: Scissors,
  hand: HandMetal, ear: Ear, ent: Ear, sinus: Ear,
  vascular: Waypoints, transplant: Shield,
  bariatric: Flame, gastric: Flame,
  trauma: Zap, emergency: Zap,
  oncol: Ribbon, cancer: Ribbon, tumor: Ribbon, biopsy: Ribbon,
  foot: Footprints, ankle: Footprints,
  injection: Syringe, botox: Syringe,
  hernia: Cross, appendix: Cross, gallbladder: Cross, cholecyst: Cross, laparo: Cross, abdomin: Cross,
};

function getIconForProcedure(name: string, category: string | null): React.ElementType {
  const searchText = `${name} ${category || ""}`.toLowerCase();
  for (const [keyword, Icon] of Object.entries(PROCEDURE_ICON_MAP)) {
    if (searchText.includes(keyword)) return Icon;
  }
  return Stethoscope;
}

const DoctorWorkspace = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [facilityName, setFacilityName] = useState("");
  const [facilityLocation, setFacilityLocation] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const isDoctor = profile?.role === "doctor" || profile?.role === "surgeon";
  const canAdd = isDoctor && user?.id === userId;

  const fetchData = useCallback(async () => {
    if (!userId || !user) return;

    const [profileRes, procsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name, avatar_url, role, specialty, facility_id, facilities(name, location)").eq("user_id", userId).single(),
      supabase.from("procedures").select("id, name, category, facility_id, created_at").eq("user_id", userId).order("name"),
    ]);

    if (profileRes.data) {
      setDoctor(profileRes.data as unknown as DoctorProfile);
      const fac = (profileRes.data as any).facilities;
      if (fac) {
        setFacilityName(fac.name || "");
        setFacilityLocation(fac.location || "");
      }
    }

    if (procsRes.data) {
      setProcedures(procsRes.data as Procedure[]);
    }
  }, [userId, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = procedures.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!doctor) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 pt-16 pb-8">
      <NavHeader />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg mx-auto flex flex-col gap-5"
      >
        {/* Facility / Doctor Header */}
        <div className="rounded-2xl bg-card border border-border p-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-foreground truncate">
              {facilityName || doctor.display_name || "Doctor"}
            </p>
            {facilityLocation && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin size={10} className="shrink-0" />
                {facilityLocation}
              </p>
            )}
            {!facilityLocation && doctor.specialty && (
              <p className="text-xs text-primary">{doctor.specialty}</p>
            )}
          </div>
        </div>

        {/* Section header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Stethoscope size={16} className="text-primary" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Procedures</h2>
          </div>
          {canAdd && (
            <Button
              size="sm"
              className="gap-1.5 rounded-full text-xs"
              onClick={() => navigate("/profile")}
            >
              <Plus size={14} />
              Add Procedure
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search procedures..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card border-border rounded-xl text-sm"
          />
        </div>

        {/* Procedure grid */}
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            {searchQuery ? "No procedures match your search" : "No procedures found for this doctor"}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((proc, i) => {
              const Icon = getIconForProcedure(proc.name, proc.category);
              return (
                <motion.div
                  key={proc.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => navigate(`/doctor/${userId}/procedure/${proc.id}`)}
                  className="group relative flex flex-col rounded-2xl bg-card border border-border overflow-hidden hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 cursor-pointer transition-all"
                >
                  {/* Icon area */}
                  <div className="flex items-center justify-center bg-primary/5 py-6">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon size={28} className="text-primary" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex flex-col flex-1 p-3 gap-1.5">
                    <p className="text-foreground font-medium text-sm leading-tight line-clamp-2">
                      {proc.name}
                    </p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full w-fit ${
                      proc.category
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground italic"
                    }`}>
                      {proc.category || "Specialty not assigned"}
                    </span>
                    {facilityName && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Building2 size={10} /> {facilityName}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default DoctorWorkspace;
