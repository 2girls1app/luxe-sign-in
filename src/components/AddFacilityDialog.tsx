import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2, Search, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNPPESFacilitySearch, NPPESFacility } from "@/hooks/useNPPESFacilitySearch";

interface AddFacilityDialogProps {
  onAdded: () => void;
}

const AddFacilityDialog = ({ onAdded }: AddFacilityDialogProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [facilityCode, setFacilityCode] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [codeError, setCodeError] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  const { results, loading: searching } = useNPPESFacilitySearch(searchQuery, showSuggestions);

  const handleSelectFacility = (facility: NPPESFacility) => {
    setName(facility.name);
    const fullAddress = [facility.address, facility.city, facility.state, facility.zip].filter(Boolean).join(", ");
    setLocation(fullAddress);
    // Facility code is NEVER auto-filled
    setFacilityCode("");
    setCodeError("");
    setShowSuggestions(false);
    setSearchQuery(facility.name);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowSuggestions(true);
  };

  const resetForm = () => {
    setSearchQuery("");
    setName("");
    setLocation("");
    setFacilityCode("");
    setNotes("");
    setCodeError("");
  };

  const isValid = name.trim() && location.trim() && facilityCode.trim();

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
          {/* Search field */}
          <div className="relative">
            <Input
              placeholder="Search facility by name or address"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchQuery.trim().length >= 3 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground pr-8"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
              {searching ? (
                <Loader2 size={14} className="text-muted-foreground animate-spin" />
              ) : (
                <Search size={14} className="text-muted-foreground" />
              )}
            </div>

            {showSuggestions && results.length > 0 && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden max-h-60 overflow-y-auto">
                {results.map((f) => (
                  <button
                    key={f.npi}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectFacility(f)}
                    className="w-full text-left px-3 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors flex items-start gap-2 border-b border-border last:border-0"
                  >
                    <Building2 size={14} className="text-primary mt-0.5 shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-medium">{f.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {[f.address, f.city, f.state, f.zip].filter(Boolean).join(", ")}
                      </span>
                      <span className="text-xs text-muted-foreground/70 italic">{f.facilityType}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Facility Name */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Facility Name *</label>
            <Input
              placeholder="Facility name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Address */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Address *</label>
            <Input
              placeholder="Facility address"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Facility Code - always manual */}
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
