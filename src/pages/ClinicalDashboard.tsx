import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { LogOut, Building2, User, ClipboardList, Bell, Settings, ChevronRight, Search, Printer } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import NotificationsDrawer from "@/components/NotificationsDrawer";
import { useNavigate } from "react-router-dom";
import NavHeader from "@/components/NavHeader";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface FacilityInfo {
  id: string;
  name: string;
  location: string | null;
}

interface DoctorProfile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  specialty: string | null;
}

interface DoctorProcedure {
  id: string;
  name: string;
  category: string | null;
  user_id: string;
}

const ClinicalDashboard = () => {
  const navigate = useNavigate();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [facility, setFacility] = useState<FacilityInfo | null>(null);
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [procedures, setProcedures] = useState<DoctorProcedure[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const displayName = profile?.display_name || user?.user_metadata?.full_name || "User";
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || null;
  const userRole = profile?.role || "";
  const roleLabel = userRole.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  const fetchFacility = useCallback(async () => {
    if (!profile?.facility_id) return;
    const { data } = await supabase
      .from("facilities")
      .select("id, name, location")
      .eq("id", profile.facility_id)
      .single();
    if (data) setFacility(data);
  }, [profile?.facility_id]);

  const fetchDoctors = useCallback(async () => {
    if (!profile?.facility_id) return;
    const { data } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url, specialty")
      .eq("facility_id", profile.facility_id)
      .eq("role", "surgeon");
    if (data) setDoctors(data.sort((a, b) => (a.display_name || "").localeCompare(b.display_name || "")));
  }, [profile?.facility_id]);

  const fetchProcedures = useCallback(async () => {
    if (!profile?.facility_id) return;
    const { data } = await supabase
      .from("procedures")
      .select("id, name, category, user_id")
      .eq("facility_id", profile.facility_id)
      .order("name");
    if (data) setProcedures(data as DoctorProcedure[]);
  }, [profile?.facility_id]);

  const fetchPendingCount = useCallback(async () => {
    if (!user) return;
    const { count } = await supabase
      .from("pending_preference_changes")
      .select("id", { count: "exact", head: true })
      .eq("submitted_by", user.id)
      .eq("status", "pending");
    setPendingCount(count ?? 0);
  }, [user]);

  useEffect(() => {
    refreshProfile();
    fetchFacility();
    fetchDoctors();
    fetchProcedures();
    fetchPendingCount();
  }, [fetchFacility, fetchDoctors, fetchProcedures, fetchPendingCount]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const doctorProcedures = selectedDoctor
    ? procedures.filter(p => p.user_id === selectedDoctor)
    : procedures;

  const filteredDoctors = doctors.filter(d =>
    (d.display_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.specialty || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDoctorName = (userId: string) =>
    doctors.find(d => d.user_id === userId)?.display_name || "Unknown";

  const selectedDoctorProfile = selectedDoctor
    ? doctors.find(d => d.user_id === selectedDoctor)
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 pt-16 pb-8">
      <NavHeader />
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

        {/* Profile Card */}
        <div className="flex items-center gap-4 rounded-xl bg-card border border-border p-4">
          <Avatar className="h-14 w-14 border-2 border-primary/30">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
            <AvatarFallback className="bg-secondary text-foreground text-lg font-medium">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-foreground font-medium">{displayName}</p>
            <p className="text-sm text-muted-foreground">{roleLabel}</p>
          </div>
        </div>

        {/* Facility Section */}
        <div>
          <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-2 mb-3">
            <Building2 size={16} className="text-primary" /> Assigned Facility
          </h2>
          {facility ? (
            <div className="rounded-xl bg-card border border-border p-4">
              <p className="text-foreground font-medium">{facility.name}</p>
              {facility.location && (
                <p className="text-xs text-muted-foreground mt-1">{facility.location}</p>
              )}
            </div>
          ) : (
            <div className="rounded-xl bg-card border border-border p-6 text-center">
              <Building2 size={32} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No facility assigned</p>
            </div>
          )}
        </div>

        {/* Doctors Section */}
        {!selectedDoctor ? (
          <div>
            <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-2 mb-3">
              <User size={16} className="text-primary" /> Doctors
            </h2>
            {doctors.length > 3 && (
              <div className="relative mb-3">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search doctors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-border bg-secondary pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            )}
            {filteredDoctors.length === 0 ? (
              <div className="rounded-xl bg-card border border-border p-6 text-center">
                <User size={32} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No doctors found at this facility</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filteredDoctors.map((doc) => {
                  const procCount = procedures.filter(p => p.user_id === doc.user_id).length;
                  return (
                    <motion.button
                      key={doc.user_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => setSelectedDoctor(doc.user_id)}
                      className="w-full flex items-center gap-3 rounded-xl bg-card border border-border p-4 hover:border-primary/40 transition-all text-left"
                    >
                      <Avatar className="h-10 w-10 border border-border">
                        {doc.avatar_url ? <AvatarImage src={doc.avatar_url} /> : null}
                        <AvatarFallback className="bg-secondary text-foreground text-sm">
                          {(doc.display_name || "D").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{doc.display_name}</p>
                        <p className="text-xs text-primary">{doc.specialty || "No specialty"}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="secondary" className="text-[10px]">
                          {procCount} {procCount === 1 ? "card" : "cards"}
                        </Badge>
                        <ChevronRight size={16} className="text-muted-foreground" />
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Doctor Detail - Preference Cards */
          <div>
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setSelectedDoctor(null)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                <ChevronRight size={18} className="rotate-180" />
              </button>
              {selectedDoctorProfile && (
                <>
                  <Avatar className="h-8 w-8 border border-border">
                    {selectedDoctorProfile.avatar_url ? <AvatarImage src={selectedDoctorProfile.avatar_url} /> : null}
                    <AvatarFallback className="bg-secondary text-foreground text-xs">
                      {(selectedDoctorProfile.display_name || "D").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-foreground">{selectedDoctorProfile.display_name}</p>
                    <p className="text-[10px] text-primary">{selectedDoctorProfile.specialty}</p>
                  </div>
                </>
              )}
            </div>

            <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-2 mb-3">
              <ClipboardList size={16} className="text-primary" /> Preference Cards
            </h2>

            {doctorProcedures.length === 0 ? (
              <div className="rounded-xl bg-card border border-border p-6 text-center">
                <ClipboardList size={32} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No preference cards found</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {doctorProcedures.map((proc) => (
                  <motion.button
                    key={proc.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => navigate(`/procedure/${proc.id}/preferences`)}
                    className="w-full flex items-center gap-3 rounded-xl bg-card border border-border p-4 hover:border-primary/40 transition-all text-left"
                  >
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <ClipboardList size={16} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{proc.name}</p>
                      {proc.category && (
                        <p className="text-[10px] text-muted-foreground">{proc.category}</p>
                      )}
                    </div>
                    <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pending Changes Status */}
        {pendingCount > 0 && (
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4">
            <p className="text-sm text-amber-400 font-medium">
              You have {pendingCount} pending change {pendingCount === 1 ? "request" : "requests"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Awaiting doctor approval</p>
          </div>
        )}
      </motion.div>

      <NotificationsDrawer
        open={notificationsOpen}
        onOpenChange={setNotificationsOpen}
        onCountChange={setPendingCount}
      />
    </div>
  );
};

export default ClinicalDashboard;
