import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNPPESFacilitySearch, type NPPESFacility } from "@/hooks/useNPPESFacilitySearch";

interface AddFacilityDialogProps {
  onAdded: () => void;
}

const AddFacilityDialog = ({ onAdded }: AddFacilityDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [facilityCode, setFacilityCode] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const { results: searchResults, loading: searching } = useNPPESFacilitySearch(name, showDropdown);

  const resetForm = () => {
    setName("");
    setLocation("");
    setFacilityCode("");
    setNotes("");
    setCodeError("");
    setShowDropdown(false);
  };

  const isValid = name.trim() && location.trim() && facilityCode.trim();

  const handleSelectFacility = (facility: NPPESFacility) => {
    setName(facility.name);
    const fullAddress = [facility.address, facility.city, facility.state, facility.zip].filter(Boolean).join(", ");
    setLocation(fullAddress);
    setShowDropdown(false);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    setShowDropdown(val.trim().length >= 3);
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!facilityCode.trim()) {
      setCodeError("Facility Code is required");
      return;
    }
    if (!isValid) return;

    setLoading(true);
    const { error } = await supabase.from("facilities").insert({
      user_id: user.id,
      name: name.trim(),
      location: location.trim(),
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
          {/* Facility Name with autocomplete */}
          <div className="relative">
            <label className="text-xs text-muted-foreground mb-1 block">Facility Name *</label>
            <Input
              ref={inputRef}
              placeholder="Search facility by name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              onFocus={() => { if (name.trim().length >= 3) setShowDropdown(true); }}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              autoComplete="off"
            />
            {showDropdown && (searching || searchResults.length > 0) && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                {searching && (
                  <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
                    <Loader2 size={12} className="animate-spin" /> Searching…
                  </div>
                )}
                {searchResults.map((facility) => (
                  <button
                    key={facility.npi}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectFacility(facility)}
                    className="w-full text-left px-3 py-2 hover:bg-accent/50 transition-colors border-b border-border last:border-0"
                  >
                    <p className="text-sm font-medium text-foreground truncate">{facility.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {[facility.address, facility.city, facility.state, facility.zip].filter(Boolean).join(", ")}
                    </p>
                  </button>
                ))}
                {!searching && searchResults.length === 0 && name.trim().length >= 3 && (
                  <p className="px-3 py-2 text-xs text-muted-foreground">No matches — enter details manually</p>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Address *</label>
            <Input
              placeholder="Facility address"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
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
