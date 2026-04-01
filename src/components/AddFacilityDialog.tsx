import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, MapPin, Loader2, Search, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface AddFacilityDialogProps {
  onAdded: () => void;
}

interface FacilityResult {
  id: string;
  name: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
}

const AddFacilityDialog = ({ onAdded }: AddFacilityDialogProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [facilityCode, setFacilityCode] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchResults, setSearchResults] = useState<FacilityResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
  const [codeError, setCodeError] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Search facilities from DB
  useEffect(() => {
    if (!showSuggestions || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const q = searchQuery.trim();
        const { data } = await supabase
          .from("facilities")
          .select("id, name, location, latitude, longitude")
          .or(`name.ilike.%${q}%,location.ilike.%${q}%`)
          .limit(8);
        setSearchResults((data as FacilityResult[]) || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, showSuggestions]);

  const handleSelectFacility = (facility: FacilityResult) => {
    setName(facility.name);
    setLocation(facility.location || "");
    setLatitude(facility.latitude);
    setLongitude(facility.longitude);
    setSelectedFacilityId(facility.id);
    // Facility code is NEVER auto-filled
    setFacilityCode("");
    setCodeError("");
    setShowSuggestions(false);
    setSearchQuery(facility.name);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowSuggestions(true);
    // If user changes search, clear selection
    setSelectedFacilityId(null);
  };

  const resetForm = () => {
    setSearchQuery("");
    setName("");
    setLocation("");
    setFacilityCode("");
    setNotes("");
    setLatitude(null);
    setLongitude(null);
    setSelectedFacilityId(null);
    setSearchResults([]);
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
      latitude,
      longitude,
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
              onFocus={() => searchQuery.trim().length >= 2 && setShowSuggestions(true)}
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

            {showSuggestions && searchResults.length > 0 && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                {searchResults.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectFacility(f)}
                    className="w-full text-left px-3 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors flex items-start gap-2 border-b border-border last:border-0"
                  >
                    <Building2 size={14} className="text-primary mt-0.5 shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-medium">{f.name}</span>
                      {f.location && (
                        <span className="text-xs text-muted-foreground line-clamp-1">{f.location}</span>
                      )}
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

          {latitude !== null && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin size={10} /> Coordinates: {latitude.toFixed(4)}, {longitude?.toFixed(4)}
            </p>
          )}

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
