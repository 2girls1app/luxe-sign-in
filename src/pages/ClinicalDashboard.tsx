import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { LogOut, Building2, Bell, Settings, ChevronRight, Plus, Trash2, MapPin, User } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import NotificationsDrawer from "@/components/NotificationsDrawer";
import { useNavigate } from "react-router-dom";
import NavHeader from "@/components/NavHeader";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AddFacilityDialog from "@/components/AddFacilityDialog";
import { useToast } from "@/hooks/use-toast";

interface FacilityInfo {
  id: string;
  name: string;
  location: string | null;
}

const ClinicalDashboard = () => {
  const navigate = useNavigate();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [facilities, setFacilities] = useState<FacilityInfo[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const displayName = profile?.display_name || user?.user_metadata?.full_name || "User";
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || null;
  const userRole = profile?.role || "";
  const roleLabel = userRole.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());

  // Detect individual account type
  const accountType = user?.user_metadata?.account_type;
  const isIndividual = accountType === "individual" || (!profile?.facility_id && !accountType);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  const fetchFacilities = useCallback(async () => {
    if (!user) return;

    if (isIndividual) {
      // Individual users: fetch from doctor_facilities join table
      const { data: links } = await supabase
        .from("doctor_facilities" as any)
        .select("facility_id")
        .eq("user_id", user.id);
      const facilityIds = (links as any[] || []).map((l: any) => l.facility_id);

      if (facilityIds.length === 0) {
        setFacilities([]);
        return;
      }

      const { data } = await supabase
        .from("facilities")
        .select("id, name, location")
        .in("id", facilityIds);
      setFacilities(
        (data || []).sort((a: any, b: any) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
        ) as FacilityInfo[]
      );
    } else {
      // Facility-linked users: show assigned facility
      if (!profile?.facility_id) {
        setFacilities([]);
        return;
      }
      const { data } = await supabase
        .from("facilities")
        .select("id, name, location")
        .eq("id", profile.facility_id)
        .single();
      if (data) setFacilities([data]);
      else setFacilities([]);
    }
  }, [user, profile?.facility_id, isIndividual]);

  const fetchPendingCount = useCallback(async () => {
    if (!user || isIndividual) {
      setPendingCount(0);
      return;
    }
    const { count } = await supabase
      .from("pending_preference_changes")
      .select("id", { count: "exact", head: true })
      .eq("submitted_by", user.id)
      .eq("status", "pending");
    setPendingCount(count ?? 0);
  }, [user, isIndividual]);

  useEffect(() => {
    refreshProfile();
    fetchFacilities();
    fetchPendingCount();
  }, [fetchFacilities, fetchPendingCount]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const deleteFacility = async (facilityId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("doctor_facilities" as any)
      .delete()
      .eq("user_id", user.id)
      .eq("facility_id", facilityId);
    if (!error) fetchFacilities();
    else toast({ title: "Error", description: (error as any).message, variant: "destructive" });
  };

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
            <div className="flex items-center gap-2">
              <p className="text-foreground font-medium">{displayName}</p>
              {isIndividual && (
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary tracking-wide uppercase">
                  <User size={10} />
                  Individual
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{roleLabel}</p>
          </div>
        </div>

        {/* Facility Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-2">
              <Building2 size={16} className="text-primary" />
              {isIndividual ? "My Facilities" : "Assigned Facility"}
            </h2>
            {isIndividual && (
              <AddFacilityDialog
                onAdded={fetchFacilities}
                existingFacilityIds={facilities.map((f) => f.id)}
              />
            )}
          </div>

          {facilities.length > 0 ? (
            <div className="flex flex-col gap-2">
              {facilities.map((f) => (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between rounded-xl bg-card border border-border p-4 hover:border-primary/40 transition-all cursor-pointer"
                  onClick={() => navigate(`/facility/${f.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-medium text-sm">{f.name}</p>
                    {f.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin size={12} className="text-primary" /> {f.location}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isIndividual && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFacility(f.id);
                        }}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                        aria-label="Remove facility"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                    <ChevronRight size={16} className="text-muted-foreground" />
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-card border border-border p-6 text-center">
              <Building2 size={32} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {isIndividual ? "No facilities added yet" : "No facility assigned"}
              </p>
              {isIndividual && (
                <p className="text-xs text-muted-foreground/70 mt-2">
                  Add facilities and doctors to manage your personal workflow. Changes save instantly and do not require approval.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Info banner for Individual users */}
        {isIndividual && facilities.length > 0 && (
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              As an <span className="text-primary font-medium">Individual</span> user, your changes save instantly. No approval workflow required.
            </p>
          </div>
        )}

        {/* Pending Changes Status - only for facility-linked users */}
        {!isIndividual && pendingCount > 0 && (
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
