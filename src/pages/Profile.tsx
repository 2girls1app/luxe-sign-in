import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, LogOut, MapPin, Building2, Stethoscope, Trash2, Music, Bell, Settings, ArrowLeft, Upload } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import MusicPreferencesDrawer from "@/components/MusicPreferencesDrawer";
import NotificationsDrawer from "@/components/NotificationsDrawer";
import { useNavigate, useSearchParams } from "react-router-dom";

import AddFacilityDialog from "@/components/AddFacilityDialog";
import AddProcedureDialog from "@/components/AddProcedureDialog";
import ProcedureCard from "@/components/ProcedureCard";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminDashboardSection from "@/components/AdminDashboardSection";
import ThemeSelectionDialog from "@/components/ThemeSelectionDialog";
import UploadPreferenceCardDrawer from "@/components/UploadPreferenceCardDrawer";
interface Facility {
  id: string;
  name: string;
  location: string | null;
  notes: string | null;
}

interface Procedure {
  id: string;
  name: string;
  category: string | null;
  facility_id: string | null;
  notes: string | null;
  is_favorite: boolean;
}

const CLINICAL_ROLES = ["first-assist", "first assist", "nurse", "physician-assist", "physician assist", "physician assistant", "anesthesia"];

const Profile = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const facilityFilter = searchParams.get("facility");
  const { user, profile, signOut, refreshProfile } = useAuth();

  // Redirect clinical staff to their dedicated dashboard
  useEffect(() => {
    if (profile?.role && CLINICAL_ROLES.includes(profile.role.toLowerCase())) {
      navigate("/clinical-dashboard", { replace: true });
    }
  }, [profile?.role, navigate]);
  const { toast } = useToast();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [roboticProcedureIds, setRoboticProcedureIds] = useState<Set<string>>(new Set());
  const [searchProcedures, setSearchProcedures] = useState("");
  const [musicDrawerOpen, setMusicDrawerOpen] = useState(false);
  const [hasMusicPrefs, setHasMusicPrefs] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [showThemeDialog, setShowThemeDialog] = useState(() => {
    return localStorage.getItem("hasChosenTheme") !== "true";
  });
  const [uploadCardOpen, setUploadCardOpen] = useState(false);

  const SPECIALTIES = [
    "Bariatric Surgery", "Breast Surgery", "Cardiothoracic Surgery", "Colon and Rectal Surgery",
    "Cosmetic Surgery", "Critical Care Surgery", "Endocrine Surgery", "General Surgery",
    "Gynecologic Surgery", "Hand Surgery", "Head and Neck Surgery", "Hepatobiliary Surgery",
    "Maxillofacial Surgery", "Minimally Invasive Surgery", "Neurosurgery", "Obstetric Surgery",
    "Oncologic Surgery", "Ophthalmic Surgery", "Oral Surgery", "Orthopedic Surgery",
    "Otolaryngology Surgery", "Pediatric Surgery", "Plastic Surgery", "Podiatric Surgery",
    "Reconstructive Surgery", "Spine Surgery", "Surgical Oncology", "Thoracic Surgery",
    "Transplant Surgery", "Trauma Surgery", "Urologic Surgery", "Vascular Surgery",
  ];

  const emailUsername = user?.email?.split("@")[0] || "";
  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.user_metadata?.name || emailUsername || "User";
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || null;
  const userRole = profile?.role || user?.user_metadata?.profession || "";
  const roleLabel = userRole ? userRole.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) : "";
  const isAdmin = ["administrative", "admin", "admin-staff", "admin staff"].includes(userRole.toLowerCase());
  const username = emailUsername || displayName.toLowerCase().replace(/\s+/g, "");
  const specialty = profile?.specialty || "";

  const fetchFacilities = useCallback(async () => {
    if (!user) return;
    // Fetch facilities via doctor_facilities join table
    const { data: links } = await supabase.from("doctor_facilities" as any).select("facility_id").eq("user_id", user.id);
    const facilityIds = (links as any[] || []).map((l: any) => l.facility_id);
    
    // Also include profile.facility_id for backwards compat
    if (profile?.facility_id && !facilityIds.includes(profile.facility_id)) {
      facilityIds.push(profile.facility_id);
    }

    if (facilityIds.length === 0) {
      setFacilities([]);
      return;
    }

    const { data } = await supabase.from("facilities").select("id, name, location, notes").in("id", facilityIds);
    setFacilities((data || []).sort((a: any, b: any) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })) as Facility[]);
  }, [user, profile?.facility_id]);

  const fetchProcedures = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("procedures").select("id, name, category, facility_id, notes, is_favorite").eq("user_id", user.id);
    if (data) {
      setProcedures(data as Procedure[]);
      const procIds = data.map((p: any) => p.id);
      if (procIds.length > 0) {
        const { data: roboticData } = await supabase
          .from("procedure_preferences")
          .select("procedure_id, value")
          .in("procedure_id", procIds)
          .eq("category", "robotic_instruments");
        const validIds = new Set<string>();
        roboticData?.forEach((r: any) => {
          try {
            const val = JSON.parse(r.value);
            if (Array.isArray(val) && val.length > 0) validIds.add(r.procedure_id);
          } catch {
            if (r.value && r.value.trim() && r.value.trim() !== '[]') validIds.add(r.procedure_id);
          }
        });
        setRoboticProcedureIds(validIds);
      }
    }
  }, [user]);


  const fetchMusicPrefsCount = useCallback(async () => {
    if (!user) return;
    const { count } = await supabase
      .from("music_preferences")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    setHasMusicPrefs((count ?? 0) > 0);
  }, [user]);

  const fetchPendingCount = useCallback(async () => {
    if (!user) return;
    const { count } = await supabase
      .from("pending_preference_changes")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    setPendingCount(count ?? 0);
  }, [user]);

  useEffect(() => {
    refreshProfile();
    fetchFacilities();
    fetchProcedures();
    fetchMusicPrefsCount();
    fetchPendingCount();
  }, [fetchFacilities, fetchProcedures, fetchMusicPrefsCount, fetchPendingCount]);


  const deleteFacility = async (id: string) => {
    // Remove the join table link, not the facility itself
    const { error } = await supabase.from("doctor_facilities" as any).delete().eq("user_id", user!.id).eq("facility_id", id);
    if (!error) fetchFacilities();
    else toast({ title: "Error", description: error.message, variant: "destructive" });
  };

  const deleteProcedure = async (id: string) => {
    const { error } = await supabase.from("procedures").delete().eq("id", id);
    if (!error) fetchProcedures();
    else toast({ title: "Error", description: error.message, variant: "destructive" });
  };

  const toggleFavorite = async (id: string, current: boolean) => {
    const { error } = await supabase.from("procedures").update({ is_favorite: !current } as any).eq("id", id);
    if (!error) {
      setProcedures((prev) => prev.map((p) => p.id === id ? { ...p, is_favorite: !current } : p));
    } else {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const filteredProcedures = procedures
    .filter((p) => {
      if (facilityFilter && p.facility_id !== facilityFilter) return false;
      return p.name.toLowerCase().includes(searchProcedures.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(searchProcedures.toLowerCase()));
    })
    .sort((a, b) => {
      if (a.is_favorite && !b.is_favorite) return -1;
      if (!a.is_favorite && b.is_favorite) return 1;
      return 0;
    });

  const activeFacility = facilityFilter ? facilities.find(f => f.id === facilityFilter) : null;

  const getFacilityName = (facilityId: string | null) => {
    if (!facilityId) return null;
    return facilities.find((f) => f.id === facilityId)?.name || null;
  };

  // Determine greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 pt-8 pb-8">
      <ThemeSelectionDialog open={showThemeDialog} onComplete={() => setShowThemeDialog(false)} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm mx-auto flex flex-col gap-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-light text-foreground">
            {greeting},{" "}
            <span className="text-primary font-medium">{displayName}</span>
          </h1>
          <TooltipProvider delayDuration={300}>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setNotificationsOpen(true)}
                    className="relative text-muted-foreground hover:text-foreground transition-colors p-1"
                    aria-label="Notifications"
                  >
                    <Bell size={20} />
                    {pendingCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold px-1">
                        {pendingCount}
                      </span>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">Notifications</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={() => navigate("/settings")} className="text-muted-foreground hover:text-foreground transition-colors p-1" aria-label="Settings">
                    <Settings size={20} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">Settings</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={handleSignOut} className="text-muted-foreground hover:text-foreground transition-colors p-1" aria-label="Sign Out">
                    <LogOut size={20} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">Sign Out</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>

        {/* Facility filter banner */}
        {activeFacility && (
          <div className="flex items-center gap-3 rounded-xl bg-card border border-primary/30 p-4">
            <button
              onClick={() => navigate("/profile")}
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="Back to all"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-foreground font-medium">{activeFacility.name}</p>
              {activeFacility.location && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin size={12} className="text-primary" /> {activeFacility.location}
                </p>
              )}
            </div>
          </div>
        )}

        {!facilityFilter && (
          <>
            {/* Profile Card */}
            <div className="relative flex items-center gap-4 rounded-xl bg-card border border-border p-4">
              {!isAdmin && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setMusicDrawerOpen(true)}
                      className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-primary/10 transition-colors group"
                      aria-label="Music Preference"
                    >
                      <Music size={16} className={hasMusicPrefs ? "text-primary" : "text-muted-foreground group-hover:text-primary"} />
                      {hasMusicPrefs && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Music Preference</TooltipContent>
                </Tooltip>
              )}
              <Avatar className="h-14 w-14 border-2 border-primary/30">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={displayName} />
                ) : null}
                <AvatarFallback className="bg-secondary text-foreground text-lg font-medium">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-foreground font-medium">{displayName}</p>
                <p className="text-sm text-muted-foreground">{roleLabel || username}</p>
                {!isAdmin && specialty && (
                  <p className="text-xs text-primary/80 mt-0.5">{specialty}</p>
                )}
              </div>
            </div>

            {/* Admin Dashboard - embedded */}
            {isAdmin && <AdminDashboardSection />}

            {/* Quick Add Procedure - non-admin only */}
            {!isAdmin && (
              <div className="flex gap-2">
                <div className="flex-1">
                  <AddProcedureDialog facilities={facilities} onAdded={fetchProcedures} triggerVariant="prominent" defaultSpecialty={profile?.specialty || undefined} />
                </div>
                <button
                  onClick={() => setUploadCardOpen(true)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 bg-card hover:border-primary/70 transition-colors px-4 py-3 text-primary"
                  aria-label="Upload Preference Card"
                >
                  <Upload size={18} />
                </button>
              </div>
            )}

            {/* Facilities Section - non-admin only */}
            {!isAdmin && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-2">
                    <Building2 size={16} className="text-primary" /> Facilities
                  </h2>
                  <AddFacilityDialog onAdded={fetchFacilities} existingFacilityIds={facilities.map((f: any) => f.id)} />
                </div>
                {facilities.length === 0 ? (
                  <div className="rounded-xl bg-card border border-border p-6 text-center">
                    <Building2 size={32} className="mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No facilities added yet</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {facilities.map((f) => (
                      <motion.div key={f.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start justify-between rounded-xl bg-card border border-border p-4 cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate(`/profile?facility=${f.id}`)}>
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground font-medium text-sm">{f.name}</p>
                          {f.location && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin size={12} /> {f.location}
                            </p>
                          )}
                          {f.notes && <p className="text-xs text-muted-foreground mt-1 truncate">{f.notes}</p>}
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); deleteFacility(f.id); }} className="text-muted-foreground hover:text-destructive transition-colors ml-2 mt-0.5">
                          <Trash2 size={14} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Procedures Section - only when viewing a specific facility */}
        {facilityFilter && !isAdmin && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-2">
                <Stethoscope size={16} className="text-primary" /> Procedures
              </h2>
              <AddProcedureDialog facilities={facilities} onAdded={fetchProcedures} preselectedFacilityId={facilityFilter} defaultSpecialty={profile?.specialty || undefined} />
            </div>

            {filteredProcedures.length > 0 && (
              <div className="relative mb-3">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search procedures..."
                  value={searchProcedures}
                  onChange={(e) => setSearchProcedures(e.target.value)}
                  className="w-full rounded-lg border border-border bg-secondary pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            )}

            {filteredProcedures.length === 0 ? (
              <div className="rounded-xl bg-card border border-border p-6 text-center">
                <Stethoscope size={32} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No procedures added yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredProcedures.map((p) => (
                  <ProcedureCard
                    key={p.id}
                    id={p.id}
                    name={p.name}
                    category={p.category}
                    facilityName={getFacilityName(p.facility_id)}
                    notes={p.notes}
                    isFavorite={p.is_favorite}
                    hasRoboticItems={roboticProcedureIds.has(p.id)}
                    onDelete={deleteProcedure}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>
      {!isAdmin && (
        <MusicPreferencesDrawer
          open={musicDrawerOpen}
          onOpenChange={(open) => {
            setMusicDrawerOpen(open);
            if (!open) fetchMusicPrefsCount();
          }}
        />
      )}
      <NotificationsDrawer
        open={notificationsOpen}
        onOpenChange={setNotificationsOpen}
        onCountChange={setPendingCount}
      />
      {!isAdmin && (
        <UploadPreferenceCardDrawer
          open={uploadCardOpen}
          onOpenChange={setUploadCardOpen}
          facilities={facilities}
          onComplete={fetchProcedures}
        />
      )}
    </div>
  );
};

export default Profile;
