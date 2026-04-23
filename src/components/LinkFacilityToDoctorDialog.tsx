import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Building2, MapPin, ArrowLeft, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface FacilityOption {
  id: string;
  name: string;
  location: string | null;
}

interface ProcedureOption {
  id: string;
  name: string;
  category: string | null;
  facility_id: string | null;
  notes: string | null;
}

interface LinkFacilityToDoctorDialogProps {
  /** Doctor to link a facility to. */
  doctorUserId: string;
  doctorName?: string;
  /** Facility IDs the doctor is already linked to — excluded from the search list. */
  excludeFacilityIds?: string[];
  /** Called after the link + (optional) procedure clones complete. */
  onLinked: () => void;
}

/**
 * Lets an Individual user link an existing facility (from their workspace) to a doctor,
 * then immediately prompts to assign which of the doctor's procedures apply at that facility.
 */
const LinkFacilityToDoctorDialog = ({
  doctorUserId,
  doctorName,
  excludeFacilityIds = [],
  onLinked,
}: LinkFacilityToDoctorDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"pick" | "assign">("pick");
  const [search, setSearch] = useState("");
  const [facilities, setFacilities] = useState<FacilityOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [pickedFacility, setPickedFacility] = useState<FacilityOption | null>(null);
  const [doctorProcedures, setDoctorProcedures] = useState<ProcedureOption[]>([]);
  const [selectedProcIds, setSelectedProcIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const loadFacilities = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("facilities")
      .select("id, name, location")
      .eq("user_id", user.id)
      .order("name");
    const filtered = ((data || []) as FacilityOption[]).filter((f) => !excludeFacilityIds.includes(f.id));
    setFacilities(filtered);
    setLoading(false);
  }, [user, excludeFacilityIds]);

  useEffect(() => {
    if (open && step === "pick") loadFacilities();
  }, [open, step, loadFacilities]);

  const reset = () => {
    setStep("pick");
    setSearch("");
    setPickedFacility(null);
    setDoctorProcedures([]);
    setSelectedProcIds(new Set());
  };

  const handlePickFacility = async (fac: FacilityOption) => {
    setPickedFacility(fac);
    // Load doctor's procedures NOT already at this facility (so we can clone them in)
    const { data: procs } = await supabase
      .from("procedures")
      .select("id, name, category, facility_id, notes")
      .eq("user_id", doctorUserId)
      .order("name");
    const candidates = (procs || []).filter((p) => p.facility_id !== fac.id) as ProcedureOption[];
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
    if (!user || !pickedFacility) return;
    setSubmitting(true);

    const { error: linkErr } = await supabase.from("doctor_facilities").insert({
      user_id: doctorUserId,
      facility_id: pickedFacility.id,
    });
    if (linkErr && linkErr.code !== "23505") {
      toast({ title: "Could not link facility", description: linkErr.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    const sources = doctorProcedures.filter((p) => selectedProcIds.has(p.id));
    let cloned = 0;
    for (const src of sources) {
      const { data: newProc, error: procErr } = await supabase
        .from("procedures")
        .insert({
          user_id: doctorUserId,
          name: src.name,
          category: src.category,
          facility_id: pickedFacility.id,
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
            user_id: doctorUserId,
            category: p.category,
            value: p.value,
          }))
        );
      }
      cloned++;
    }

    setSubmitting(false);
    toast({
      title: "Facility linked",
      description: cloned > 0
        ? `${cloned} procedure${cloned !== 1 ? "s" : ""} added at ${pickedFacility.name}.`
        : "No procedures assigned yet.",
    });
    reset();
    setOpen(false);
    onLinked();
  };

  const filtered = facilities.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      (f.location || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus size={16} /> Add Facility
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm border-border bg-card text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            {step === "assign" && (
              <button
                onClick={() => { setStep("pick"); setPickedFacility(null); }}
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Back"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            {step === "pick" ? "Link Facility" : "Assign Procedures"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            {step === "pick"
              ? `Choose an existing facility to associate with ${doctorName || "this doctor"}.`
              : `Select which of ${doctorName || "the doctor"}'s procedures apply at ${pickedFacility?.name}.`}
          </DialogDescription>
        </DialogHeader>

        {step === "pick" && (
          <div className="mt-2 flex flex-col gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search facilities..."
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
                  <Building2 size={28} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {facilities.length === 0
                      ? "No more facilities to link — add a facility from your dashboard first."
                      : "No matches"}
                  </p>
                </div>
              ) : (
                filtered.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => handlePickFacility(f)}
                    className="flex w-full items-center gap-3 rounded-lg border border-border bg-secondary p-3 text-left transition-all hover:border-primary/50"
                  >
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 size={16} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{f.name}</p>
                      {f.location && (
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 truncate">
                          <MapPin size={9} className="shrink-0" /> {f.location}
                        </p>
                      )}
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
                This doctor has no other procedures to copy — link the facility now and add procedures later.
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
            <Button onClick={handleConfirm} disabled={submitting} className="rounded-full">
              {submitting
                ? "Linking..."
                : selectedProcIds.size > 0
                  ? `Link & Add ${selectedProcIds.size} Procedure${selectedProcIds.size !== 1 ? "s" : ""}`
                  : "Link Facility Only"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LinkFacilityToDoctorDialog;
