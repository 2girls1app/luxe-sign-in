import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, MapPin, Search, Plus, Stethoscope, User, Bot, Upload, Trash2,
  Heart, Activity, Brain, Bone, Eye, Baby, Scissors, HandMetal, Ear,
  Waypoints, Shield, Flame, Zap, Ribbon, Footprints, Syringe, Cross,
  Building2, CheckCircle2, Music, ChevronDown, ChevronUp,
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
import UploadPreferenceCardDrawer from "@/components/UploadPreferenceCardDrawer";
import MusicPreferencesDrawer from "@/components/MusicPreferencesDrawer";
import LinkFacilityToDoctorDialog from "@/components/LinkFacilityToDoctorDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [facilities, setFacilities] = useState<{ id: string; name: string; location: string | null }[]>([]);
  const [facilitiesLoaded, setFacilitiesLoaded] = useState(false);
  const [expandedFacilities, setExpandedFacilities] = useState<Set<string>>(new Set());
  const [uploadDrawerOpen, setUploadDrawerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [unlinkFacilityTarget, setUnlinkFacilityTarget] = useState<{ id: string; name: string } | null>(null);
  const [musicOpen, setMusicOpen] = useState(false);
  const [musicCount, setMusicCount] = useState(0);

  const fetchMusicCount = useCallback(async () => {
    if (!userId) return;
    const { count } = await supabase
      .from("music_preferences")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    setMusicCount(count || 0);
  }, [userId]);

  const fetchData = useCallback(async () => {
    if (!userId || !user) return;
    fetchMusicCount();

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
        .select("facility_id, facilities(id, name, location)")
        .eq("user_id", userId);
      if (docFacs) {
        const facs = docFacs.map((df: any) => ({
          id: df.facility_id,
          name: df.facilities?.name || "Unknown",
          location: df.facilities?.location || null,
        }));
        setFacilities(facs);
        if (facs.length > 0 && !facilityId) setFacilityId(facs[0].id);
      }
      setFacilitiesLoaded(true);
    } else {
      setFacilitiesLoaded(true);
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

  const deleteProcedure = async () => {
    if (!deleteTarget || !user) return;
    const id = deleteTarget.id;

    // Delete related data first, then the procedure
    await Promise.all([
      supabase.from("procedure_preferences").delete().eq("procedure_id", id),
      supabase.from("procedure_files").delete().eq("procedure_id", id),
      supabase.from("procedure_favorites").delete().eq("procedure_id", id),
      supabase.from("pending_preference_changes").delete().eq("procedure_id", id),
    ]);

    const { error } = await supabase.from("procedures").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete procedure.", variant: "destructive" });
    } else {
      toast({ title: "Procedure deleted", description: `"${deleteTarget.name}" has been removed.` });
      setProcedures(prev => prev.filter(p => p.id !== id));
    }
    setDeleteTarget(null);
  };

  const filtered = procedures
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSpecialty = !doctor?.specialty || !p.category || p.category === doctor.specialty;
      return matchesSearch && matchesSpecialty;
    })
    .sort((a, b) => {
      const aFav = favorites.has(a.id) ? 0 : 1;
      const bFav = favorites.has(b.id) ? 0 : 1;
      if (aFav !== bFav) return aFav - bFav;
      return a.name.localeCompare(b.name);
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
      <NavHeader showHome={false} backTo="/profile" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg mx-auto flex flex-col gap-5"
      >
        {/* Doctor profile header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/profile")}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <Avatar className="h-12 w-12 border-2 border-primary/30 shrink-0">
            {doctor.avatar_url ? <AvatarImage src={doctor.avatar_url} alt={doctor.display_name || ""} /> : null}
            <AvatarFallback className="bg-primary/15 text-primary text-base font-semibold">
              {(doctor.display_name || "?").split(" ").map(n => n.charAt(0).toUpperCase()).slice(0, 2).join("")}
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

        {/* Music Preference */}
        <button
          onClick={() => setMusicOpen(true)}
          className="flex items-center gap-3 rounded-xl bg-card border border-border px-4 py-3 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all active:scale-[0.98]"
        >
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Music size={16} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium text-foreground">Music Preference</p>
            <p className="text-[10px] text-muted-foreground">
              {musicCount > 0 ? `${musicCount} preference${musicCount !== 1 ? "s" : ""} saved` : "Not set"}
            </p>
          </div>
          {musicCount > 0 && (
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
              {musicCount}
            </span>
          )}
        </button>


        {/* My Facilities header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-primary" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">My Facilities</h2>
          </div>
          {canAdd && isIndividual && userId && (
            <LinkFacilityToDoctorDialog
              doctorUserId={userId}
              doctorName={doctor?.display_name || undefined}
              excludeFacilityIds={facilities.map((f) => f.id)}
              onLinked={fetchData}
            />
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

        {/* Per-facility procedure groups */}
        {isIndividual && facilities.length === 0 ? (
          <div className="rounded-xl bg-card border border-border p-6 text-center">
            <Building2 size={28} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No facilities linked to this doctor yet.</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Tap "Add Facility" to associate one.</p>
          </div>
        ) : isIndividual ? (
          <div className="flex flex-col gap-3">
            {facilities.map((fac) => {
              const facProcs = filtered.filter((p) => p.facility_id === fac.id);
              const expanded = expandedFacilities.has(fac.id);
              return (
                <div key={fac.id} className="rounded-xl bg-card border border-border overflow-hidden">
                  <button
                    onClick={() => {
                      setExpandedFacilities((prev) => {
                        const next = new Set(prev);
                        if (next.has(fac.id)) next.delete(fac.id); else next.add(fac.id);
                        return next;
                      });
                    }}
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-secondary/50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 size={16} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{fac.name}</p>
                      {fac.location && (
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 truncate">
                          <MapPin size={9} className="shrink-0" /> {fac.location}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] bg-primary/15 text-primary px-2 py-0.5 rounded-full font-medium shrink-0">
                      {facProcs.length}
                    </span>
                    {canAdd && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setUnlinkFacilityTarget({ id: fac.id, name: fac.name });
                        }}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1 shrink-0"
                        aria-label="Unlink facility"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                    {expanded
                      ? <ChevronUp size={16} className="text-muted-foreground shrink-0" />
                      : <ChevronDown size={16} className="text-muted-foreground shrink-0" />}
                  </button>

                  {expanded && (
                    <div className="border-t border-border p-3 flex flex-col gap-3">
                      {canAdd && (
                        <AddProcedureDialog
                          facilities={[{ id: fac.id, name: fac.name }]}
                          onAdded={fetchData}
                          preselectedFacilityId={fac.id}
                          forUserId={userId}
                          defaultSpecialty={doctor?.specialty || undefined}
                          onUploadClick={() => setUploadDrawerOpen(true)}
                        />
                      )}
                      {facProcs.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-3 text-center">
                          {searchQuery ? "No matching procedures here" : "No procedures at this facility yet"}
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          {facProcs.map((proc) => {
                            const Icon = getIconForProcedure(proc.name, proc.category);
                            const hasRobotic = roboticProcIds.has(proc.id);
                            const isFav = favorites.has(proc.id);
                            return (
                              <motion.div
                                key={proc.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                onClick={() => navigate(`/procedure/${proc.id}/preferences`)}
                                className="group relative flex flex-col rounded-2xl bg-background border border-border overflow-hidden hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 cursor-pointer transition-all"
                              >
                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleFavorite(proc.id); }}
                                  className="absolute top-2 left-2 z-10 p-1.5 rounded-full bg-background/80 transition-all hover:scale-110"
                                  aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
                                >
                                  <Heart size={14} className={isFav ? "text-primary fill-primary" : "text-muted-foreground hover:text-primary"} />
                                </button>
                                {hasRobotic ? (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-primary/20 text-primary">
                                          <Bot size={14} />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="bg-card border-border text-foreground text-xs">Robotic</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                ) : canAdd && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: proc.id, name: proc.name }); }}
                                    className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-background/80 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                                    aria-label="Delete procedure"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                                {proc.is_complete && (
                                  <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/15 border border-green-500/30">
                                    <CheckCircle2 size={10} className="text-green-400" />
                                    <span className="text-[9px] font-semibold text-green-400 whitespace-nowrap">Complete</span>
                                  </div>
                                )}
                                <div className="flex items-center justify-center bg-primary/5 py-5">
                                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Icon size={24} className="text-primary" />
                                  </div>
                                </div>
                                <div className="flex flex-col flex-1 p-3 gap-1">
                                  <p className="text-foreground font-medium text-xs leading-tight line-clamp-2">{proc.name}</p>
                                  {proc.category && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full w-fit bg-primary/10 text-primary">{proc.category}</span>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          // Non-individual roles: keep flat grid (read-only or facility-scoped)
          filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              {searchQuery ? "No procedures match your search" : "No procedures found for this doctor"}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filtered.map((proc) => {
                const Icon = getIconForProcedure(proc.name, proc.category);
                const isFav = favorites.has(proc.id);
                return (
                  <motion.div
                    key={proc.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => navigate(`/doctor/${userId}/procedure/${proc.id}`)}
                    className="group relative flex flex-col rounded-2xl bg-card border border-border overflow-hidden hover:border-primary/40 cursor-pointer transition-all"
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(proc.id); }}
                      className="absolute top-2 left-2 z-10 p-1.5 rounded-full bg-background/80"
                      aria-label="Toggle favorite"
                    >
                      <Heart size={14} className={isFav ? "text-primary fill-primary" : "text-muted-foreground"} />
                    </button>
                    <div className="flex items-center justify-center bg-primary/5 py-6">
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon size={28} className="text-primary" />
                      </div>
                    </div>
                    <div className="flex flex-col flex-1 p-3 gap-1.5">
                      <p className="text-foreground font-medium text-sm leading-tight line-clamp-2">{proc.name}</p>
                      {proc.category && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full w-fit bg-primary/10 text-primary">{proc.category}</span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )
        )}
      </motion.div>

      {/* Upload / AI Import drawer */}
      {isIndividual && (
        <UploadPreferenceCardDrawer
          open={uploadDrawerOpen}
          onOpenChange={setUploadDrawerOpen}
          facilities={facilities}
          onComplete={fetchData}
          forUserId={userId}
          preselectedFacilityId={facilityId || undefined}
        />
      )}

      {/* Doctor Music Preferences */}
      <MusicPreferencesDrawer
        open={musicOpen}
        onOpenChange={(open) => { setMusicOpen(open); if (!open) fetchMusicCount(); }}
        doctorUserId={userId}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Procedure?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently remove <span className="font-semibold text-foreground">"{deleteTarget?.name}"</span> and its related preference card data from your personal workspace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteProcedure} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unlink facility confirmation */}
      <AlertDialog open={!!unlinkFacilityTarget} onOpenChange={(open) => { if (!open) setUnlinkFacilityTarget(null); }}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Remove facility association?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This only removes the link between <span className="font-semibold text-foreground">{doctor?.display_name || "this doctor"}</span> and <span className="font-semibold text-foreground">"{unlinkFacilityTarget?.name}"</span>. The facility itself and any procedures at it will remain.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!unlinkFacilityTarget || !userId) return;
                const { error } = await supabase
                  .from("doctor_facilities")
                  .delete()
                  .eq("user_id", userId)
                  .eq("facility_id", unlinkFacilityTarget.id);
                if (error) {
                  toast({ title: "Error", description: error.message, variant: "destructive" });
                } else {
                  toast({ title: "Facility unlinked" });
                  fetchData();
                }
                setUnlinkFacilityTarget(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Unlink
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DoctorWorkspace;
