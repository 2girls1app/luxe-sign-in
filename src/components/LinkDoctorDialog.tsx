import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Search, User, ArrowLeft, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface DoctorOption {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  specialty: string | null;
}

interface ProcedureOption {
  id: string;
  name: string;
  category: string | null;
  facility_id: string | null;
  notes: string | null;
}

interface LinkDoctorDialogProps {
  /** Facility to link the chosen doctor to. */
  facilityId: string;
  facilityName?: string;
  /** Doctor IDs already linked — excluded from the search list. */
  excludeDoctorIds?: string[];
  /** Called after the link + (optional) procedure clones complete. */
  onLinked: () => void;
  triggerLabel?: string;
}

/**
 * Lets an Individual user link one of their existing doctors to a facility,
 * then prompts to clone any of that doctor's procedures into this facility.
 */
const LinkDoctorDialog = ({
  facilityId,
  facilityName,
  excludeDoctorIds = [],
  onLinked,
  triggerLabel = "Add Doctor",
}: LinkDoctorDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"pick" | "assign">("pick");
  const [search, setSearch] = useState("");
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [pickedDoctor, setPickedDoctor] = useState<DoctorOption | null>(null);
  const [doctorProcedures, setDoctorProcedures] = useState<ProcedureOption[]>([]);
  const [selectedProcIds, setSelectedProcIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const loadDoctors = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    // Doctors in the user's workspace = all profiles linked to any facility owned by user
    const { data: ownedFacs } = await supabase.from("facilities").select("id").eq("user_id", user.id);
    const facIds = (ownedFacs || []).map((f) => f.id);
    if (facIds.length === 0) { setDoctors([]); setLoading(false); return; }

    const { data: links } = await supabase
      .from("doctor_facilities")
      .select("user_id")
      .in("facility_id", facIds);
    const userIds = Array.from(new Set((links || []).map((l) => l.user_id)))
      .filter((id) => id !== user.id && !excludeDoctorIds.includes(id));
    if (userIds.length === 0) { setDoctors([]); setLoading(false); return; }

    const { data: profs } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url, specialty")
      .in("user_id", userIds);
    setDoctors(((profs || []) as DoctorOption[]).sort((a, b) => (a.display_name || "").localeCompare(b.display_name || "")));
    setLoading(false);
  }, [user, excludeDoctorIds]);

  useEffect(() => {
    if (open && step === "pick") loadDoctors();
  }, [open, step, loadDoctors]);

  const reset = () => {
    setStep("pick");
    setSearch("");
    setPickedDoctor(null);
    setDoctorProcedures([]);
    setSelectedProcIds(new Set());
  };

  const handlePickDoctor = async (doc: DoctorOption) => {
    setPickedDoctor(doc);
    // Fetch procedures the doctor already has — show ones NOT already at this facility
    const { data: procs } = await supabase
      .from("procedures")
      .select("id, name, category, facility_id, notes")
      .eq("user_id", doc.user_id)
      .order("name");
    const candidates = (procs || []).filter((p) => p.facility_id !== facilityId) as ProcedureOption[];
    setDoctorProcedures(candidates);
    setSelectedProcIds(new Set());
    setStep("assign");
  };

  const toggleProc = (id: string) => {
    setSelectedProcIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleConfirm = async () => {
    if (!user || !pickedDoctor) return;
    setSubmitting(true);

    // 1. Create the doctor↔facility link (idempotent — ignore unique violation)
    const { error: linkErr } = await supabase.from("doctor_facilities").insert({
      user_id: pickedDoctor.user_id,
      facility_id: facilityId,
    });
    if (linkErr && linkErr.code !== "23505") {
      toast({ title: "Could not link doctor", description: linkErr.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    // 2. Clone selected procedures (with their preferences) into this facility
    const sources = doctorProcedures.filter((p) => selectedProcIds.has(p.id));
    let cloned = 0;
    for (const src of sources) {
      const { data: newProc, error: procErr } = await supabase
        .from("procedures")
        .insert({
          user_id: pickedDoctor.user_id,
          name: src.name,
          category: src.category,
          facility_id: facilityId,
          notes: src.notes,
        })
        .select("id")
        .single();
      if (procErr || !newProc) continue;

      const { data: prefs } = await supabase
        .from("procedure_preferences")
        .select("category, value")
        .eq("procedure_id", src.id);
      if (prefs && prefs.length > 0) {
        await supabase.from("procedure_preferences").insert(
          prefs.map((p) => ({
            procedure_id: newProc.id,
            user_id: pickedDoctor.user_id,
            category: p.category,
            value: p.value,
          }))
        );
      }
      cloned++;
    }

    setSubmitting(false);
    toast({
      title: "Doctor linked",
      description: cloned > 0 ? `${cloned} procedure${cloned !== 1 ? "s" : ""} added at ${facilityName || "this facility"}.` : "No procedures assigned yet.",
    });
    reset();
    setOpen(false);
    onLinked();
  };

  const filtered = doctors.filter(
    (d) =>
      (d.display_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (d.specialty || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus size={16} /> {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm border-border bg-card text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            {step === "assign" && (
              <button
                onClick={() => { setStep("pick"); setPickedDoctor(null); }}
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Back"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            {step === "pick" ? "Link Doctor" : "Assign Procedures"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            {step === "pick"
              ? "Choose a doctor from your workspace to associate with this facility."
              : `Select which of ${pickedDoctor?.display_name || "the doctor"}'s procedures apply at ${facilityName || "this facility"}.`}
          </DialogDescription>
        </DialogHeader>

        {step === "pick" && (
          <div className="mt-2 flex flex-col gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search doctors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-border bg-secondary pl-9 text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="max-h-72 space-y-2 overflow-y-auto">
              {loading ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Loading...</p>
              ) : filtered.length === 0 ? (
                <div className="py-8 text-center">
                  <User size={28} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {doctors.length === 0 ? "No other doctors in your workspace" : "No matches"}
                  </p>
                </div>
              ) : (
                filtered.map((d) => (
                  <button
                    key={d.user_id}
                    onClick={() => handlePickDoctor(d)}
                    className="flex w-full items-center gap-3 rounded-lg border border-border bg-secondary p-3 text-left transition-all hover:border-primary/50"
                  >
                    <Avatar className="h-9 w-9">
                      {d.avatar_url ? <AvatarImage src={d.avatar_url} /> : null}
                      <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
                        {(d.display_name || "?").split(" ").map((n) => n.charAt(0).toUpperCase()).slice(0, 2).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{d.display_name || "Unnamed"}</p>
                      <p className="text-xs text-primary truncate">{d.specialty || "No specialty"}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {step === "assign" && (
          <div className="mt-2 flex flex-col gap-3">
            {doctorProcedures.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                This doctor has no other procedures yet — you can link them now and add procedures later.
              </p>
            ) : (
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {doctorProcedures.map((p) => {
                  const checked = selectedProcIds.has(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => toggleProc(p.id)}
                      className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                        checked ? "border-primary bg-primary/10" : "border-border bg-secondary hover:border-primary/40"
                      }`}
                    >
                      <div className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 ${
                        checked ? "border-primary bg-primary" : "border-muted-foreground/40"
                      }`}>
                        {checked && <Check size={12} className="text-primary-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                        {p.category && <p className="text-xs text-primary truncate">{p.category}</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            <Button
              onClick={handleConfirm}
              disabled={submitting}
              className="rounded-full"
            >
              {submitting
                ? "Linking..."
                : selectedProcIds.size > 0
                  ? `Link & Add ${selectedProcIds.size} Procedure${selectedProcIds.size !== 1 ? "s" : ""}`
                  : "Link Doctor Only"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LinkDoctorDialog;
