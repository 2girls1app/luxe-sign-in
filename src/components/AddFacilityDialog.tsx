import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const APPROVED_FACILITIES: { name: string; code: string; facilityId: string }[] = [
  { name: "Northside Hospital Duluth", code: "NSD-6154", facilityId: "6e5219ec-9ab4-42d7-a98e-75181416f917" },
];

interface AddFacilityDialogProps {
  onAdded: () => void;
  existingFacilityIds?: string[];
}

const AddFacilityDialog = ({ onAdded, existingFacilityIds = [] }: AddFacilityDialogProps) => {
  const [open, setOpen] = useState(false);
  const [nameQuery, setNameQuery] = useState("");
  const [selectedFacility, setSelectedFacility] = useState<typeof APPROVED_FACILITIES[0] | null>(null);
  const [facilityCode, setFacilityCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const availableFacilities = APPROVED_FACILITIES.filter(
    (f) => !existingFacilityIds.includes(f.facilityId)
  );

  const filteredFacilities = nameQuery.trim().length > 0
    ? availableFacilities.filter((f) => f.name.toLowerCase().includes(nameQuery.toLowerCase()))
    : availableFacilities;

  const resetForm = () => {
    setNameQuery("");
    setSelectedFacility(null);
    setFacilityCode("");
    setCodeError("");
    setNotes("");
    setShowDropdown(false);
  };

  const handleSelectFacility = (facility: typeof APPROVED_FACILITIES[0]) => {
    setSelectedFacility(facility);
    setNameQuery(facility.name);
    setFacilityCode("");
    setCodeError("");
    setShowDropdown(false);
  };

  const handleNameChange = (val: string) => {
    setNameQuery(val);
    setSelectedFacility(null);
    setFacilityCode("");
    setCodeError("");
    setShowDropdown(true);
  };

  const handleCodeChange = (val: string) => {
    setFacilityCode(val);
    if (codeError) setCodeError("");
  };

  const codeMatches = selectedFacility && facilityCode.trim().toUpperCase() === selectedFacility.code.toUpperCase();
  const isValid = selectedFacility && facilityCode.trim() && codeMatches;

  const handleSubmit = async () => {
    if (!user || !selectedFacility) return;
    if (!facilityCode.trim()) {
      setCodeError("Facility Code is required");
      return;
    }
    if (!codeMatches) {
      setCodeError("Facility code does not match selected facility");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("doctor_facilities" as any).insert({
      user_id: user.id,
      facility_id: selectedFacility.facilityId,
    } as any);
    setLoading(false);
    if (error) {
      if (error.code === "23505") {
        toast({ title: "Already added", description: "This facility is already linked to your profile.", variant: "destructive" });
      } else {
        toast({ title: "Error adding facility", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Facility added" });
      resetForm();
      setOpen(false);
      onAdded();
    }
  };

  const allAssigned = availableFacilities.length === 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={allAssigned}>
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
                {filteredFacilities.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground text-center">
                    No facilities available
                  </div>
                ) : (
                  filteredFacilities.map((f) => (
                    <button
                      key={f.facilityId}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-accent text-sm cursor-pointer"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelectFacility(f)}
                    >
                      <div className="font-medium text-foreground">{f.name}</div>
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
              onChange={(e) => handleCodeChange(e.target.value)}
              disabled={!selectedFacility}
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