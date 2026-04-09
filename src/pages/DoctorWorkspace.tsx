import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, MapPin, Search, Plus, Stethoscope, User, Bot,
  Heart, Activity, Brain, Bone, Eye, Baby, Scissors, HandMetal, Ear,
  Waypoints, Shield, Flame, Zap, Ribbon, Footprints, Syringe, Cross,
  Building2, CheckCircle2,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import NavHeader from "@/components/NavHeader";
import AddProcedureDialog from "@/components/AddProcedureDialog";

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
  is_complete: boolean;
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
  const [searchParams] = useSearchParams();
  const shouldAutoOpenProcedure = searchParams.get("addProcedure") === "true";
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [facilityName, setFacilityName] = useState("");
  const [facilityLocation, setFacilityLocation] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [roboticProcIds, setRoboticProcIds] = useState<Set<string>>(new Set());
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const accountType = user?.user_metadata?.account_type;
  const isIndividual = accountType === "individual" || (!profile?.facility_id && !accountType);
  const isDoctor = profile?.role === "doctor" || profile?.role === "surgeon";
  const canAdd = (isDoctor && user?.id === userId) || isIndividual;
  const [facilityId, setFacilityId] = useState<string | null>(null);
  const [facilities, setFacilities] = useState<{ id: string; name: string }[]>([]);
  const [facilitiesLoaded, setFacilitiesLoaded] = useState(false);

  const fetchData = useCallback(async () => {
    if (!userId || !user) return;

    const [profileRes, procsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name, avatar_url, role, specialty, facility_id").eq("user_id", userId).maybeSingle(),
      supabase.from("procedures").select("id, name, category, facility_id, created_at, is_complete").eq("user_id", userId).order("name"),
    ]);

    if (profileRes.data) {
      setDoctor(profileRes.data as unknown as DoctorProfile);
      const fId = profileRes.data.facility_id;
      if (fId) {
        setFacilityId(fId);
        // Fetch facility details separately
        const { data: facData } = await supabase.from("facilities").select("name, location").eq("id", fId).maybeSingle();
        if (facData) {
          setFacilityName(facData.name || "");
          setFacilityLocation(facData.location || "");
        }
      }
    }

    // For individual users, fetch facilities linked to this doctor
    if (isIndividual && userId) {
      const { data: docFacs } = await supabase
        .from("doctor_facilities")
        .select("facility_id, facilities(id, name)")
        .eq("user_id", userId);
      if (docFacs) {
        const facs = docFacs.map((df: any) => ({
          id: df.facility_id,
          name: df.facilities?.name || "Unknown",
        }));
        setFacilities(facs);
        if (facs.length > 0 && !facilityId) setFacilityId(facs[0].id);
      }
    }

    if (procsRes.data) {
      const procs = procsRes.data as Procedure[];
      setProcedures(procs);

      const procIds = procs.map(p => p.id);
      if (procIds.length > 0) {
        // Fetch robotic preferences and favorites in parallel
        const [roboticRes, favRes] = await Promise.all([
          supabase.from("procedure_preferences")
            .select("procedure_id, value")
            .in("procedure_id", procIds)
            .eq("category", "robotic_instruments"),
          supabase.from("procedure_favorites")
            .select("procedure_id")
            .eq("user_id", user.id)
            .in("procedure_id", procIds),
        ]);

        if (roboticRes.data) {
          const ids = new Set<string>();
          roboticRes.data.forEach((r: any) => {
            try {
              const parsed = JSON.parse(r.value);
              if (Array.isArray(parsed) && parsed.length > 0) ids.add(r.procedure_id);
            } catch {
              if (r.value?.trim()) ids.add(r.procedure_id);
            }
          });
          setRoboticProcIds(ids);
        }

        if (favRes.data) {
          setFavorites(new Set(favRes.data.map((f: any) => f.procedure_id)));
        }
      }
    }
  }, [userId, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleFavorite = async (procId: string) => {
    if (!user) return;
    const isFav = favorites.has(procId);

    // Optimistic update
    setFavorites(prev => {
      const next = new Set(prev);
      if (isFav) next.delete(procId); else next.add(procId);
      return next;
    });

    if (isFav) {
      await supabase.from("procedure_favorites").delete()
        .eq("user_id", user.id).eq("procedure_id", procId);
    } else {
      const { error } = await supabase.from("procedure_favorites").insert({
        user_id: user.id,
        procedure_id: procId,
      });
      if (error) {
        // Revert
        setFavorites(prev => { const next = new Set(prev); next.delete(procId); return next; });
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    }
  };

  const filtered = procedures.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    // Filter by doctor's specialty if set
    const matchesSpecialty = !doctor?.specialty || !p.category || p.category === doctor.specialty;
    return matchesSearch && matchesSpecialty;
  });

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
        {/* Doctor profile header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <Avatar className="h-12 w-12 border-2 border-primary/30 shrink-0">
            {doctor.avatar_url ? <AvatarImage src={doctor.avatar_url} alt={doctor.display_name || ""} /> : null}
            <AvatarFallback className="bg-primary/10 text-primary text-base font-semibold">
              {(doctor.display_name || "D").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-foreground truncate">
              {doctor.display_name || "Doctor"}
            </p>
            <p className="text-xs text-primary font-medium">
              {doctor.specialty || "No specialty"}
            </p>
          </div>
        </div>

        {/* Facility bar */}
        {facilityName && (
          <div className="rounded-xl bg-card border border-border px-4 py-3 flex items-center gap-2">
            <Building2 size={14} className="text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{facilityName}</p>
              {facilityLocation && (
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <MapPin size={8} className="shrink-0" />
                  {facilityLocation}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Section header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Stethoscope size={16} className="text-primary" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Procedures</h2>
          </div>
          {canAdd && isIndividual && (
            <AddProcedureDialog
              facilities={facilities}
              onAdded={fetchData}
              preselectedFacilityId={facilityId || undefined}
              forUserId={userId}
              defaultSpecialty={doctor?.specialty || undefined}
              autoOpen={shouldAutoOpenProcedure}
            />
          )}
          {canAdd && !isIndividual && (
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
              const hasRobotic = roboticProcIds.has(proc.id);
              const isFav = favorites.has(proc.id);

              return (
                <motion.div
                  key={proc.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => navigate(isIndividual ? `/procedure/${proc.id}/preferences` : `/doctor/${userId}/procedure/${proc.id}`)}
                  className="group relative flex flex-col rounded-2xl bg-card border border-border overflow-hidden hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 cursor-pointer transition-all"
                >
                  {/* Favorite button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(proc.id); }}
                    className="absolute top-2 left-2 z-10 p-1.5 rounded-full bg-background/80 transition-all hover:scale-110"
                    aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Heart
                      size={14}
                      className={isFav
                        ? "text-primary fill-primary"
                        : "text-muted-foreground hover:text-primary"
                      }
                    />
                  </button>

                  {/* Robotic indicator */}
                  {hasRobotic && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-primary/20 text-primary">
                            <Bot size={14} />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-card border-border text-foreground text-xs">
                          Robotic
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  {/* Card Complete badge */}
                  {proc.is_complete && (
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/15 border border-green-500/30">
                      <CheckCircle2 size={10} className="text-green-400" />
                      <span className="text-[9px] font-semibold text-green-400 whitespace-nowrap">Card Complete</span>
                    </div>
                  )}

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
