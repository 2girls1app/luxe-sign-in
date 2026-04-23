import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { Building2, User, ArrowLeft, Search, MapPin, ChevronRight, Plus, Trash2, Stethoscope, ChevronDown, ChevronUp } from "lucide-react";
import NavHeader from "@/components/NavHeader";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import CreateSurgeonDialog from "@/components/CreateSurgeonDialog";
import LinkDoctorDialog from "@/components/LinkDoctorDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

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

const FacilityDetails = () => {
  const navigate = useNavigate();
  const { facilityId } = useParams<{ facilityId: string }>();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [facility, setFacility] = useState<FacilityInfo | null>(null);
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [doctorProcs, setDoctorProcs] = useState<Record<string, { id: string; name: string; category: string | null }[]>>({});
  const [expandedDoctors, setExpandedDoctors] = useState<Set<string>>(new Set());
  const [unlinkTarget, setUnlinkTarget] = useState<{ id: string; name: string } | null>(null);

  const accountType = user?.user_metadata?.account_type;
  // Strict: only explicit Individual accounts get the association UI.
  const isIndividual = accountType === "individual";

  const displayName = profile?.display_name || user?.user_metadata?.full_name || "User";
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || null;
  const userRole = profile?.role || "";
  const roleLabel = userRole.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());

  const fetchFacility = useCallback(async () => {
    if (!facilityId) return;
    const { data } = await supabase
      .from("facilities")
      .select("id, name, location")
      .eq("id", facilityId)
      .single();
    if (data) setFacility(data);
  }, [facilityId]);

  const fetchDoctors = useCallback(async () => {
    if (!facilityId) return;
    const { data: links } = await supabase
      .from("doctor_facilities")
      .select("user_id")
      .eq("facility_id", facilityId);
    if (!links || links.length === 0) { setDoctors([]); setDoctorProcs({}); return; }
    // Exclude the logged-in user from the doctors list
    const userIds = links.map(l => l.user_id).filter(id => id !== user?.id);
    if (userIds.length === 0) { setDoctors([]); setDoctorProcs({}); return; }
    const { data } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url, specialty")
      .in("user_id", userIds);
    if (data) setDoctors(data.sort((a, b) => (a.display_name || "").localeCompare(b.display_name || "")));

    // Per-doctor procedures at THIS facility (Individual association view)
    if (isIndividual) {
      const { data: procs } = await supabase
        .from("procedures")
        .select("id, name, category, user_id")
        .eq("facility_id", facilityId)
        .in("user_id", userIds);
      const grouped: Record<string, { id: string; name: string; category: string | null }[]> = {};
      (procs || []).forEach((p: any) => {
        if (!grouped[p.user_id]) grouped[p.user_id] = [];
        grouped[p.user_id].push({ id: p.id, name: p.name, category: p.category });
      });
      Object.values(grouped).forEach((arr) => arr.sort((a, b) => a.name.localeCompare(b.name)));
      setDoctorProcs(grouped);
    }
  }, [facilityId, user?.id, isIndividual]);

  useEffect(() => {
    fetchFacility();
    fetchDoctors();
  }, [fetchFacility, fetchDoctors]);

  const toggleDoctorExpanded = (id: string) => {
    setExpandedDoctors((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const confirmRemoveDoctor = async () => {
    if (!facilityId || !unlinkTarget) return;
    const { error } = await supabase
      .from("doctor_facilities" as any)
      .delete()
      .eq("user_id", unlinkTarget.id)
      .eq("facility_id", facilityId);
    if (!error) {
      fetchDoctors();
      toast({
        title: "Doctor unlinked",
        description: `${unlinkTarget.name} is no longer associated with this facility.`,
      });
    } else {
      toast({ title: "Error", description: (error as any).message, variant: "destructive" });
    }
    setUnlinkTarget(null);
  };

  const filteredDoctors = doctors.filter(d =>
    (d.display_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.specialty || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 pt-16 pb-8">
      <NavHeader />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm mx-auto flex flex-col gap-6"
      >
        {/* Back + Facility Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-primary transition-colors p-1"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-medium text-foreground">{facility?.name || "Facility"}</h1>
            {facility?.location && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin size={12} className="text-primary" /> {facility.location}
              </p>
            )}
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 size={18} className="text-primary" />
          </div>
        </div>

        {/* Individual User Profile Card */}
        {isIndividual && (
          <div className="flex items-center gap-4 rounded-xl bg-card border border-border p-4">
            <Avatar className="h-14 w-14 border-2 border-primary/30">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
              <AvatarFallback className="bg-primary/15 text-primary text-lg font-semibold">
                {(displayName || "?").split(" ").map(n => n.charAt(0).toUpperCase()).slice(0, 2).join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-foreground font-medium">{displayName}</p>
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary tracking-wide uppercase">
                  <User size={10} />
                  Individual
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{roleLabel}</p>
            </div>
          </div>
        )}

        {/* Doctors Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-2">
              <User size={16} className="text-primary" /> Doctors
            </h2>
          </div>

          {isIndividual && facilityId && (
            <div className="mb-3 flex flex-wrap gap-2">
              <LinkDoctorDialog
                facilityId={facilityId}
                facilityName={facility?.name}
                excludeDoctorIds={doctors.map((d) => d.user_id)}
                onLinked={fetchDoctors}
              />
              <CreateSurgeonDialog onCreated={fetchDoctors} facilityId={facilityId} isIndividual={isIndividual} />
            </div>
          )}

          <p className="text-xs text-muted-foreground/70 mb-3">
            {isIndividual
              ? "Link existing doctors or create new ones, and assign which procedures they perform here."
              : "Doctors associated with this facility."}
          </p>

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
              <p className="text-sm text-muted-foreground">
                {isIndividual ? "No doctors linked yet" : "No doctors available for this facility"}
              </p>
              {isIndividual && (
                <p className="text-xs text-muted-foreground/70 mt-2">
                  Tap "Add Doctor" to link an existing one or create a new surgeon.
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredDoctors.map((doc) => {
                const procs = doctorProcs[doc.user_id] || [];
                const expanded = expandedDoctors.has(doc.user_id);
                return (
                  <motion.div
                    key={doc.user_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full rounded-xl bg-card border border-border overflow-hidden hover:border-primary/40 transition-all"
                  >
                    <div className="flex items-center gap-3 p-4">
                      <button
                        onClick={() => navigate(`/doctor/${doc.user_id}`)}
                        className="flex items-center gap-3 flex-1 min-w-0 text-left"
                      >
                        <Avatar className="h-10 w-10 border border-border">
                          {doc.avatar_url ? <AvatarImage src={doc.avatar_url} /> : null}
                          <AvatarFallback className="bg-primary/15 text-primary text-sm font-semibold">
                            {(doc.display_name || "?").split(" ").map(n => n.charAt(0).toUpperCase()).slice(0, 2).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{doc.display_name}</p>
                          <p className="text-xs text-primary truncate">{doc.specialty || "No specialty"}</p>
                        </div>
                      </button>
                      <div className="flex items-center gap-1 shrink-0">
                        {isIndividual && (
                          <>
                            <span className="text-[10px] bg-primary/15 text-primary px-2 py-0.5 rounded-full font-medium">
                              {procs.length}
                            </span>
                            <button
                              onClick={() => toggleDoctorExpanded(doc.user_id)}
                              className="text-muted-foreground hover:text-foreground transition-colors p-1.5"
                              aria-label={expanded ? "Hide procedures" : "Show procedures"}
                            >
                              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                            <button
                              onClick={() => setUnlinkTarget({ id: doc.user_id, name: doc.display_name || "this doctor" })}
                              className="text-muted-foreground hover:text-destructive transition-colors p-1.5"
                              aria-label="Unlink doctor from facility"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                        {!isIndividual && <ChevronRight size={16} className="text-muted-foreground" />}
                      </div>
                    </div>

                    {isIndividual && expanded && (
                      <div className="border-t border-border bg-secondary/30 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                          Procedures at {facility?.name || "this facility"}
                        </p>
                        {procs.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic py-2">
                            No procedures yet — add some from the doctor's workspace.
                          </p>
                        ) : (
                          <div className="flex flex-col gap-1.5">
                            {procs.map((p) => (
                              <button
                                key={p.id}
                                onClick={() => navigate(`/procedure/${p.id}/preferences`)}
                                className="flex items-center gap-2 rounded-lg bg-card border border-border px-3 py-2 hover:border-primary/40 transition-all text-left"
                              >
                                <Stethoscope size={13} className="text-primary shrink-0" />
                                <span className="text-xs font-medium text-foreground flex-1 min-w-0 truncate">{p.name}</span>
                                {p.category && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
                                    {p.category}
                                  </span>
                                )}
                                <ChevronRight size={12} className="text-muted-foreground shrink-0" />
                              </button>
                            ))}
                          </div>
                        )}
                        <button
                          onClick={() => navigate(`/doctor/${doc.user_id}`)}
                          className="mt-2 w-full text-[11px] text-primary hover:text-primary/80 transition-colors text-center py-1.5"
                        >
                          + Manage procedures in doctor workspace
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Unlink doctor confirmation */}
        <AlertDialog open={!!unlinkTarget} onOpenChange={(open) => { if (!open) setUnlinkTarget(null); }}>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">Remove doctor association?</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                This only removes the link between <span className="font-semibold text-foreground">{unlinkTarget?.name}</span> and <span className="font-semibold text-foreground">{facility?.name || "this facility"}</span>. The doctor's profile and procedures at other facilities will remain.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmRemoveDoctor}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Unlink
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Info banner for Individual users */}
        {isIndividual && (
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              As an <span className="text-primary font-medium">Individual</span> user, you can freely add doctors, create procedures, and manage preference cards. All changes save instantly.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default FacilityDetails;
