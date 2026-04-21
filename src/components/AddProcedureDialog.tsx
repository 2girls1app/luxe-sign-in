import { useState, useEffect, useRef, forwardRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, FilePlus, Copy, ArrowLeft, Search, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getProceduresBySpecialty } from "@/data/specialtyProcedures";

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
  autoOpen?: boolean;
  onUploadClick?: () => void;
}

type DialogMode = "choose" | "new" | "existing";

interface ProcedureNameAutocompleteProps {
  value: string;
  onChange: (v: string) => void;
  specialty?: string;
}

const ProcedureNameAutocomplete = forwardRef<HTMLDivElement, ProcedureNameAutocompleteProps>(
  ({ value, onChange, specialty }, forwardedRef) => {
    const [open, setOpen] = useState(false);
    const localRef = useRef<HTMLDivElement | null>(null);
    const suggestions = getProceduresBySpecialty(specialty);
    const filtered = value.trim()
      ? suggestions.filter((s) => s.toLowerCase().includes(value.toLowerCase()))
      : suggestions;

    useEffect(() => {
      const handler = (e: MouseEvent) => {
        if (localRef.current && !localRef.current.contains(e.target as Node)) setOpen(false);
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, []);

    const setRefs = (node: HTMLDivElement | null) => {
      localRef.current = node;
      if (typeof forwardedRef === "function") {
        forwardedRef(node);
      } else if (forwardedRef) {
        forwardedRef.current = node;
      }
    };

    return (
      <div className="relative" ref={setRefs}>
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
          <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
            {filtered.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  onChange(s);
                  setOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-primary/10"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  },
);
ProcedureNameAutocomplete.displayName = "ProcedureNameAutocomplete";

const AddProcedureDialog = ({
  facilities,
  onAdded,
  preselectedFacilityId,
  triggerVariant = "default",
  forUserId,
  defaultSpecialty,
  autoOpen = false,
  onUploadClick,
}: AddProcedureDialogProps) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<DialogMode>("choose");
  const [autoOpened, setAutoOpened] = useState(false);
  const [name, setName] = useState("");
  const [facilityId, setFacilityId] = useState<string>(preselectedFacilityId || "");
  const [category, setCategory] = useState<string>(defaultSpecialty || "");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [facilityError, setFacilityError] = useState(false);
  const [existingProcedures, setExistingProcedures] = useState<ExistingProcedure[]>([]);
  const [existingSearch, setExistingSearch] = useState("");
  const [loadingExisting, setLoadingExisting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (autoOpen && !autoOpened) {
      setOpen(true);
      setMode("new");
      setAutoOpened(true);
    }
  }, [autoOpen, autoOpened]);

  useEffect(() => {
    if (preselectedFacilityId) {
      setFacilityId(preselectedFacilityId);
      return;
    }

    if (!facilityId && facilities.length > 0) {
      setFacilityId(facilities[0].id);
    }
  }, [preselectedFacilityId, facilities, facilityId]);

  useEffect(() => {
    if (open && !autoOpened) {
      setMode("choose");
      if (preselectedFacilityId) setFacilityId(preselectedFacilityId);
      if (defaultSpecialty) setCategory(defaultSpecialty);
    }
  }, [open, preselectedFacilityId, defaultSpecialty, autoOpened]);

  const getEffectiveFacilityId = () => preselectedFacilityId || facilityId || facilities[0]?.id || null;

  const resetForm = () => {
    setName("");
    setFacilityId(preselectedFacilityId || facilities[0]?.id || "");
    setCategory(defaultSpecialty || "");
    setNotes("");
    setFacilityError(false);
    setExistingSearch("");
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

    const effectiveFacilityId = getEffectiveFacilityId();
    if (forUserId && !effectiveFacilityId) {
      setFacilityError(true);
      toast({
        title: "Doctor needs a facility link",
        description: "Link this doctor to one of your facilities before adding a procedure.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("procedures").insert({
      user_id: forUserId || user.id,
      name: name.trim(),
      category: defaultSpecialty || category || null,
      facility_id: effectiveFacilityId,
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

    const targetFacility = getEffectiveFacilityId() || source.facility_id;
    if (!targetFacility) {
      setFacilityError(true);
      toast({
        title: "Doctor needs a facility link",
        description: "Link this doctor to one of your facilities before creating a procedure card.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { data: newProc, error: procError } = await supabase
      .from("procedures")
      .insert({
        user_id: forUserId || user.id,
        name: source.name,
        category: source.category || defaultSpecialty || category || null,
        facility_id: targetFacility,
        notes: source.notes,
      })
      .select("id")
      .single();

    if (procError || !newProc) {
      toast({ title: "Error creating procedure", description: procError?.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const { data: prefs } = await supabase
      .from("procedure_preferences")
      .select("category, value")
      .eq("procedure_id", source.id);

    if (prefs && prefs.length > 0) {
      const newPrefs = prefs.map((p) => ({
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

  const filteredExisting = existingProcedures.filter(
    (p) =>
      p.name.toLowerCase().includes(existingSearch.toLowerCase()) ||
      (p.category || "").toLowerCase().includes(existingSearch.toLowerCase()),
  );

  const triggerButton = triggerVariant === "prominent" ? (
    <Button className="w-full gap-2 rounded-xl bg-primary py-3 text-primary-foreground hover:bg-primary/90">
      <Plus size={18} /> Add Procedure
    </Button>
  ) : (
    <Button size="sm" className="gap-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
      <Plus size={16} /> Add Procedure
    </Button>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setFacilityError(false);
          setMode("choose");
        }
      }}
    >
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent className="max-w-sm border-border bg-card text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            {mode !== "choose" && (
              <button
                onClick={() => {
                  setMode("choose");
                  resetForm();
                }}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            {mode === "choose" ? "Add Procedure" : mode === "new" ? "New Procedure" : "Create from Existing"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Add a procedure card for this doctor using specialty-matched suggestions.
          </DialogDescription>
        </DialogHeader>

        {mode === "choose" && (
          <div className="mt-2 flex flex-col gap-3">
            <button
              onClick={() => setMode("new")}
              className="flex items-center gap-4 rounded-xl border border-border bg-secondary p-4 text-left transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
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
              onClick={() => {
                setMode("existing");
                fetchExistingProcedures();
              }}
              className="flex items-center gap-4 rounded-xl border border-border bg-secondary p-4 text-left transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Copy size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Create from Existing</p>
                <p className="text-xs text-muted-foreground">Clone an existing preference card</p>
              </div>
            </button>
            {onUploadClick && (
              <button
                onClick={() => {
                  setOpen(false);
                  onUploadClick();
                }}
                className="flex items-center gap-4 rounded-xl border border-border bg-secondary p-4 text-left transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Upload size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Upload Procedure</p>
                  <p className="text-xs text-muted-foreground">Import a procedure card from a file</p>
                </div>
              </button>
            )}
          </div>
        )}

        {mode === "new" && (
          <div className="mt-2 flex flex-col gap-3">
            <ProcedureNameAutocomplete value={name} onChange={setName} specialty={defaultSpecialty || category} />
            {(defaultSpecialty || category) && (
              <div className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-muted-foreground">
                Specialty: <span className="font-medium text-foreground">{defaultSpecialty || category}</span>
              </div>
            )}
            {facilityError && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                This doctor must be linked to one of your facilities before a procedure can be created.
              </div>
            )}
            <Textarea
              placeholder="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none border-border bg-secondary text-foreground placeholder:text-muted-foreground"
              rows={3}
            />
            <Button onClick={handleSubmit} disabled={!name.trim() || loading} className="rounded-full">
              {loading ? "Adding..." : "Save Procedure"}
            </Button>
          </div>
        )}

        {mode === "existing" && (
          <div className="mt-2 flex flex-col gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search existing procedures..."
                value={existingSearch}
                onChange={(e) => setExistingSearch(e.target.value)}
                className="border-border bg-secondary pl-9 text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {loadingExisting ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Loading...</p>
              ) : filteredExisting.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No existing procedures found</p>
              ) : (
                filteredExisting.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleCloneFromExisting(p)}
                    disabled={loading}
                    className="flex w-full flex-col gap-0.5 rounded-lg border border-border bg-secondary p-3 text-left transition-all hover:border-primary/50 hover:shadow-md disabled:opacity-50"
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
