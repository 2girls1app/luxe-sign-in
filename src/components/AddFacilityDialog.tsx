import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface FacilityOption {
  id: string;
  name: string;
  location: string | null;
  facility_code: string | null;
}

interface AddFacilityDialogProps {
  onAdded: () => void;
}

const AddFacilityDialog = ({ onAdded }: AddFacilityDialogProps) => {
  const [open, setOpen] = useState(false);
  const [nameQuery, setNameQuery] = useState("");
  const [selectedFacility, setSelectedFacility] = useState<FacilityOption | null>(null);
  const [facilityCode, setFacilityCode] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [allFacilities, setAllFacilities] = useState<FacilityOption[]>([]);
  const [fetchingFacilities, setFetchingFacilities] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch all facilities with demo codes when dialog opens
  useEffect(() => {
    if (!open) return;
    const fetchFacilities = async () => {
      setFetchingFacilities(true);
      const { data } = await supabase
        .from("facilities")
        .select("id, name, location, facility_code")
        .not("facility_code", "is", null)
        .neq("facility_code", "")
        .order("name");
      setAllFacilities((data as FacilityOption[]) || []);
      setFetchingFacilities(false);
    };
    fetchFacilities();
  }, [open]);

  const filteredFacilities = nameQuery.trim().length > 0
    ? allFacilities.filter((f) => {
        const q = nameQuery.toLowerCase();
        return (
          f.name.toLowerCase().includes(q) ||
          (f.location && f.location.toLowerCase().includes(q))
        );
      })
    : allFacilities;

  const resetForm = () => {
    setNameQuery("");
    setSelectedFacility(null);
    setFacilityCode("");
    setNotes("");
    setCodeError("");
    setShowDropdown(false);
  };

  const isValid = selectedFacility && facilityCode.trim();

  const handleSelectFacility = (facility: FacilityOption) => {
    setSelectedFacility(facility);
    setNameQuery(facility.name);
    setShowDropdown(false);
  };

  const handleNameChange = (val: string) => {
    setNameQuery(val);
    setSelectedFacility(null);
    setShowDropdown(true);
  };

  const handleSubmit = async () => {
    if (!user || !selectedFacility) return;
    if (!facilityCode.trim()) {
      setCodeError("Facility Code is required");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("facilities").insert({
      user_id: user.id,
      name: selectedFacility.name,
      location: selectedFacility.location,
      facility_code: facilityCode.trim(),
      notes: notes.trim() || null,
    } as any);
    setLoading(false);
    if (error) {
      toast({ title: "Error adding facility", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Facility added" });
      resetForm();
      setOpen(false);
      onAdded();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus size={16} /> Add Facility
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border text-foreground max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add Facility</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-2">
          <div className="relative" ref={dropdownRef}>
            <label className="text-xs text-muted-foreground mb-1 block">Facility Name *</label>
            <Input
              placeholder="Search facility by name"
              value={nameQuery}
              onChange={(e) => handleNameChange(e.target.value)}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
            {showDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                {fetchingFacilities ? (
                  <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading facilities...
                  </div>
                ) : filteredFacilities.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground text-center">
                    No facilities with demo codes found
                  </div>
                ) : (
                  filteredFacilities.slice(0, 10).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-accent text-sm cursor-pointer"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelectFacility(f)}
                    >
                      <div className="font-medium text-foreground">{f.name}</div>
                      <div className="text-xs text-muted-foreground flex justify-between">
                        <span>{f.location || ""}</span>
                        <span className="font-mono">{f.facility_code}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Facility Code *</label>
            <Input
              placeholder="Enter facility code"
              value={facilityCode}
              onChange={(e) => { setFacilityCode(e.target.value); setCodeError(""); }}
              className={`bg-secondary border-border text-foreground placeholder:text-muted-foreground ${codeError ? "border-destructive" : ""}`}
            />
            {codeError && <p className="text-xs text-destructive mt-1">{codeError}</p>}
          </div>

          <Textarea
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="bg-secondary border-border text-foreground placeholder:text-muted-foreground resize-none"
            rows={2}
          />

          <Button onClick={handleSubmit} disabled={!isValid || loading} className="rounded-full">
            {loading ? "Adding..." : "Save Facility"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddFacilityDialog;