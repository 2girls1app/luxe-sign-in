import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ClipboardList, Clock, AlertTriangle, Building2, ChevronDown, ChevronUp, Trash2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import NavHeader from "@/components/NavHeader";
import AddProcedureDialog from "@/components/AddProcedureDialog";
import UploadPreferenceCardDrawer from "@/components/UploadPreferenceCardDrawer";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DoctorProfile {
  user_id: string; display_name: string | null; avatar_url: string | null;
  role: string | null; specialty: string | null;
}
interface Procedure {
  id: string; name: string; category: string | null; created_at: string; facility_id: string | null;
}
interface PendingChange {
  id: string; procedure_id: string; category: string; status: string;
}
interface Facility {
  id: string; name: string;
}

const AdminDoctorDetail = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { isAdmin, loading } = useAdminRole();
  const { user } = useAuth();
  const { toast } = useToast();
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [prefCounts, setPrefCounts] = useState<Record<string, number>>({});
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [expandedFacilities, setExpandedFacilities] = useState<Set<string>>(new Set());
  const [uploadDrawerOpen, setUploadDrawerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Procedure | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!userId || !isAdmin) return;

    const [profileRes, procsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name, avatar_url, role, specialty, facility_id").eq("user_id", userId).single(),
      supabase.from("procedures").select("id, name, category, created_at, facility_id").eq("user_id", userId).order("name"),
    ]);

    if (profileRes.data) setDoctor(profileRes.data as DoctorProfile);

    const { data: links } = await supabase.from("doctor_facilities").select("facility_id").eq("user_id", userId);
    const facilityIds = (links || []).map((l: any) => l.facility_id);
    if (profileRes.data?.facility_id && !facilityIds.includes((profileRes.data as any).facility_id)) {
      facilityIds.push((profileRes.data as any).facility_id);
    }

    if (facilityIds.length > 0) {
      const { data: facilData } = await supabase.from("facilities").select("id, name").in("id", facilityIds).order("name");
      if (facilData) {
        setFacilities(facilData);
        setExpandedFacilities(new Set(facilData.map((f: any) => f.id)));
      }
    } else {
      setFacilities([]);
    }

    if (procsRes.data) {
      setProcedures(procsRes.data as Procedure[]);
      const procIds = (procsRes.data as Procedure[]).map(p => p.id);
      if (procIds.length > 0) {
        const [prefsRes, pendingRes] = await Promise.all([
          supabase.from("procedure_preferences").select("procedure_id").in("procedure_id", procIds),
          supabase.from("pending_preference_changes").select("id, procedure_id, category, status").eq("status", "pending").in("procedure_id", procIds),
        ]);
        if (prefsRes.data) {
          const counts: Record<string, number> = {};
          prefsRes.data.forEach((p: any) => { counts[p.procedure_id] = (counts[p.procedure_id] || 0) + 1; });
          setPrefCounts(counts);
        }
        if (pendingRes.data) setPendingChanges(pendingRes.data as PendingChange[]);
      }
    }
  }, [userId, isAdmin]);

  useEffect(() => {
    if (!loading && !isAdmin) { navigate("/profile"); return; }
    if (isAdmin) fetchData();
  }, [isAdmin, loading, fetchData]);

  const toggleFacility = (id: string) => {
    setExpandedFacilities(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleDeleteProcedure = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      // Delete preferences, pending changes, and files first
      await Promise.all([
        supabase.from("procedure_preferences").delete().eq("procedure_id", deleteTarget.id),
        supabase.from("pending_preference_changes").delete().eq("procedure_id", deleteTarget.id),
        supabase.from("procedure_files").delete().eq("procedure_id", deleteTarget.id),
      ]);
      // Delete the procedure
      const { error } = await supabase.from("procedures").delete().eq("id", deleteTarget.id);
      if (error) throw error;
      toast({ title: "Preference card deleted", description: `"${deleteTarget.name}" has been removed.` });
      await fetchData();
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  const proceduresByFacility = facilities.map(f => ({
    facility: f,
    procedures: procedures.filter(p => p.facility_id === f.id),
  }));
  const unassignedProcedures = procedures.filter(p => !p.facility_id || !facilities.some(f => f.id === p.facility_id));

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;
  if (!isAdmin) return null;

  const renderProcedure = (proc: Procedure) => {
    const pending = pendingChanges.filter(pc => pc.procedure_id === proc.id);
    return (
      <div key={proc.id} className="flex items-center gap-2">
        <button
          onClick={() => navigate(`/admin/doctors/${userId}/procedure/${proc.id}`)}
          className="flex-1 flex items-center gap-3 rounded-xl bg-card border border-border p-4 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all text-left"
        >
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <ClipboardList size={16} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{proc.name}</p>
            <p className="text-[10px] text-muted-foreground">
              {prefCounts[proc.id] || 0} preferences
              {proc.category && ` · ${proc.category}`}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {pending.length > 0 && (
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[9px]">
                <AlertTriangle size={10} className="mr-0.5" />
                {pending.length} pending
              </Badge>
            )}
          </div>
        </button>
        <button
          onClick={() => setDeleteTarget(proc)}
          className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
          aria-label={`Delete ${proc.name}`}
        >
          <Trash2 size={16} />
        </button>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 pt-16 pb-8">
      <NavHeader />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg mx-auto flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/admin/doctors")} className="text-muted-foreground hover:text-foreground transition-colors p-1"><ArrowLeft size={20} /></button>
          {doctor && (
            <>
              <Avatar className="h-10 w-10 border border-border">
                {doctor.avatar_url ? <AvatarImage src={doctor.avatar_url} /> : null}
                <AvatarFallback className="bg-primary/15 text-primary text-sm font-semibold">
                  {(doctor.display_name || "?").split(" ").map(n => n.charAt(0).toUpperCase()).slice(0, 2).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{doctor.display_name}</p>
                <p className="text-xs text-primary">{doctor.specialty || "No specialty"}</p>
              </div>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-card border border-border p-4 text-center">
            <ClipboardList size={18} className="text-primary mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{procedures.length}</p>
            <p className="text-[10px] text-muted-foreground">Preference Cards</p>
          </div>
          <button
            onClick={() => pendingChanges.length > 0 && navigate(`/admin/doctors/${userId}/pending`)}
            className={`rounded-xl bg-card border border-border p-4 text-center transition-all ${pendingChanges.length > 0 ? "hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/5 cursor-pointer" : "cursor-default"}`}
          >
            <Clock size={18} className="text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{pendingChanges.length}</p>
            <p className="text-[10px] text-muted-foreground">Pending Changes</p>
            {pendingChanges.length > 0 && <p className="text-[9px] text-amber-400 mt-1">Tap to review →</p>}
          </button>
        </div>

        {/* Add Procedure + Upload */}
        <div className="flex gap-2">
          <div className="flex-1">
            <AddProcedureDialog
              facilities={facilities}
              onAdded={fetchData}
              forUserId={userId}
              triggerVariant="prominent"
              defaultSpecialty={doctor?.specialty || undefined}
            />
          </div>
          <button
            onClick={() => setUploadDrawerOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 bg-card hover:border-primary/70 transition-colors px-4 py-3 text-primary"
            aria-label="Upload Preference Card"
          >
            <Upload size={18} />
          </button>
        </div>

        {/* Procedures grouped by facility */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Preference Cards</h2>

          {procedures.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No preference cards found for this doctor</p>
          )}

          {proceduresByFacility.map(({ facility, procedures: facProcs }) => (
            <div key={facility.id} className="mb-3">
              <button
                onClick={() => toggleFacility(facility.id)}
                className="w-full flex items-center gap-2 py-2 text-left"
              >
                <Building2 size={14} className="text-primary" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex-1">
                  {facility.name}
                </span>
                <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full mr-1">
                  {facProcs.length}
                </span>
                {expandedFacilities.has(facility.id)
                  ? <ChevronUp size={14} className="text-muted-foreground" />
                  : <ChevronDown size={14} className="text-muted-foreground" />
                }
              </button>
              {expandedFacilities.has(facility.id) && (
                <div className="space-y-2 ml-1">
                  {facProcs.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-3 text-center">No procedures at this facility</p>
                  ) : (
                    facProcs.map(renderProcedure)
                  )}
                </div>
              )}
            </div>
          ))}

          {unassignedProcedures.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-2">Unassigned</p>
              <div className="space-y-2">
                {unassignedProcedures.map(renderProcedure)}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Upload Preference Card Drawer */}
      <UploadPreferenceCardDrawer
        open={uploadDrawerOpen}
        onOpenChange={setUploadDrawerOpen}
        facilities={facilities}
        onComplete={fetchData}
        forUserId={userId}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Preference Card</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete <span className="font-medium text-foreground">"{deleteTarget?.name}"</span>? This will permanently remove all associated preferences, files, and pending changes. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-foreground" disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProcedure}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDoctorDetail;
