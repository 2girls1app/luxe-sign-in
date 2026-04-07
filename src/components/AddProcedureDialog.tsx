import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FilePlus, Copy, ArrowLeft, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getProceduresBySpecialty } from "@/data/specialtyProcedures";

const SURGERY_SPECIALTIES = [
  "General Surgery",
  "Orthopedic Surgery",
  "Neurosurgery",
  "ENT",
  "Cardiothoracic Surgery",
  "Plastic Surgery",
  "OB/GYN",
  "Urology",
  "Vascular Surgery",
  "Pediatric Surgery",
  "Trauma Surgery",
  "Bariatric Surgery",
  "Ophthalmology",
  "Podiatry",
  "Oncologic Surgery",
];

interface Facility {
  id: string;
  name: string;
}

interface ExistingProcedure {
  id: string;
  name: string;
  category: string | null;
  notes: string | null;
  facility_id: string | null;
}

interface AddProcedureDialogProps {
  facilities: Facility[];
  onAdded: () => void;
  preselectedFacilityId?: string;
  triggerVariant?: "default" | "prominent";
  forUserId?: string;
  defaultSpecialty?: string;
}

type DialogMode = "choose" | "new" | "existing";

/** Autocomplete input for procedure names filtered by specialty */
const ProcedureNameAutocomplete = ({
  value,
  onChange,
  specialty,
}: {
  value: string;
  onChange: (v: string) => void;
  specialty?: string;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const suggestions = getProceduresBySpecialty(specialty);
  const filtered = value.trim()
    ? suggestions.filter((s) => s.toLowerCase().includes(value.toLowerCase()))
    : suggestions;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <Input
        placeholder="Procedure name *"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
          {filtered.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                onChange(s);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-primary/10 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const AddProcedureDialog = ({ facilities, onAdded, preselectedFacilityId, triggerVariant = "default", forUserId, defaultSpecialty }: AddProcedureDialogProps) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<DialogMode>("choose");
  const [name, setName] = useState("");
  const [facilityId, setFacilityId] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [facilityError, setFacilityError] = useState(false);
  const [existingProcedures, setExistingProcedures] = useState<ExistingProcedure[]>([]);
  const [existingSearch, setExistingSearch] = useState("");
  const [loadingExisting, setLoadingExisting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setMode("choose");
      if (preselectedFacilityId) setFacilityId(preselectedFacilityId);
      if (defaultSpecialty) setCategory(defaultSpecialty);
    }
  }, [open, preselectedFacilityId, defaultSpecialty]);

  const resetForm = () => {
    setName(""); setFacilityId(preselectedFacilityId || ""); setCategory(defaultSpecialty || ""); setNotes(""); setFacilityError(false); setExistingSearch("");
  };

  const fetchExistingProcedures = async () => {
    setLoadingExisting(true);
    const { data } = await supabase
      .from("procedures")
      .select("id, name, category, notes, facility_id")
      .order("name");
    setExistingProcedures(data || []);
    setLoadingExisting(false);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !user) return;
    setLoading(true);
    const { error } = await supabase.from("procedures").insert({
      user_id: forUserId || user.id,
      name: name.trim(),
      category: defaultSpecialty || null,
      facility_id: preselectedFacilityId || null,
      notes: notes.trim() || null,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error adding procedure", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Procedure added" });
      resetForm();
      setOpen(false);
      onAdded();
    }
  };

  const handleCloneFromExisting = async (source: ExistingProcedure) => {
    if (!user) return;
    const targetFacility = preselectedFacilityId || source.facility_id;
    if (!targetFacility) {
      toast({ title: "No facility available", description: "Please select a facility first.", variant: "destructive" });
      return;
    }
    setLoading(true);

    // Create new procedure
    const { data: newProc, error: procError } = await supabase.from("procedures").insert({
      user_id: forUserId || user.id,
      name: source.name,
      category: source.category || defaultSpecialty || null,
      facility_id: targetFacility,
      notes: source.notes,
    }).select("id").single();

    if (procError || !newProc) {
      toast({ title: "Error creating procedure", description: procError?.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Copy preferences from source
    const { data: prefs } = await supabase
      .from("procedure_preferences")
      .select("category, value")
      .eq("procedure_id", source.id);

    if (prefs && prefs.length > 0) {
      const newPrefs = prefs.map(p => ({
        procedure_id: newProc.id,
        user_id: forUserId || user.id,
        category: p.category,
        value: p.value,
      }));
      await supabase.from("procedure_preferences").insert(newPrefs);
    }

    setLoading(false);
    toast({ title: "Procedure created from existing card" });
    resetForm();
    setOpen(false);
    onAdded();
  };

  const filteredExisting = existingProcedures.filter(p =>
    p.name.toLowerCase().includes(existingSearch.toLowerCase()) ||
    (p.category || "").toLowerCase().includes(existingSearch.toLowerCase())
  );

  const triggerButton = triggerVariant === "prominent" ? (
    <Button className="w-full gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 py-3">
      <Plus size={18} /> Add Procedure
    </Button>
  ) : (
    <Button size="sm" className="gap-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
      <Plus size={16} /> Add Procedure
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setFacilityError(false); setMode("choose"); } }}>
      <DialogTrigger asChild>
        {triggerButton}
      </DialogTrigger>
      <DialogContent className="bg-card border-border text-foreground max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            {mode !== "choose" && (
              <button onClick={() => { setMode("choose"); resetForm(); }} className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft size={18} />
              </button>
            )}
            {mode === "choose" ? "Add Procedure" : mode === "new" ? "New Procedure" : "Create from Existing"}
          </DialogTitle>
        </DialogHeader>

        {mode === "choose" && (
          <div className="flex flex-col gap-3 mt-2">
            <button
              onClick={() => setMode("new")}
              className="flex items-center gap-4 rounded-xl border border-border bg-secondary p-4 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all text-left"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FilePlus size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Add New Procedure</p>
                <p className="text-xs text-muted-foreground">Create a new preference card from scratch</p>
              </div>
            </button>
            <button
              onClick={() => { setMode("existing"); fetchExistingProcedures(); }}
              className="flex items-center gap-4 rounded-xl border border-border bg-secondary p-4 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all text-left"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Copy size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Create from Existing</p>
                <p className="text-xs text-muted-foreground">Clone an existing preference card</p>
              </div>
            </button>
          </div>
        )}

        {mode === "new" && (
          <div className="flex flex-col gap-3 mt-2">
            <ProcedureNameAutocomplete
              value={name}
              onChange={setName}
              specialty={defaultSpecialty}
            />
            {defaultSpecialty && (
              <div className="bg-secondary border border-border rounded-md px-3 py-2 text-sm text-muted-foreground">
                Specialty: <span className="text-foreground font-medium">{defaultSpecialty}</span>
              </div>
            )}
            <Textarea placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-secondary border-border text-foreground placeholder:text-muted-foreground resize-none" rows={3} />
            <Button onClick={handleSubmit} disabled={!name.trim() || loading} className="rounded-full">
              {loading ? "Adding..." : "Save Procedure"}
            </Button>
          </div>
        )}

        {mode === "existing" && (
          <div className="flex flex-col gap-3 mt-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search existing procedures..."
                value={existingSearch}
                onChange={(e) => setExistingSearch(e.target.value)}
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground pl-9"
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {loadingExisting ? (
                <p className="text-sm text-muted-foreground text-center py-6">Loading...</p>
              ) : filteredExisting.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No existing procedures found</p>
              ) : (
                filteredExisting.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleCloneFromExisting(p)}
                    disabled={loading}
                    className="w-full flex flex-col gap-0.5 rounded-lg border border-border bg-secondary p-3 hover:border-primary/50 hover:shadow-md transition-all text-left disabled:opacity-50"
                  >
                    <p className="text-sm font-medium text-foreground">{p.name}</p>
                    {p.category && <p className="text-xs text-primary">{p.category}</p>}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddProcedureDialog;
