import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, MapPin, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNominatimAutocomplete, formatAddress, NominatimResult } from "@/hooks/useNominatimAutocomplete";

interface AddFacilityDialogProps {
  onAdded: () => void;
}

const AddFacilityDialog = ({ onAdded }: AddFacilityDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const locationInputRef = useRef<HTMLInputElement>(null);

  const { results, loading: searching } = useNominatimAutocomplete(location, showSuggestions);

  const handleSelectSuggestion = (result: NominatimResult) => {
    const addr = formatAddress(result);
    setLocation(addr);
    setLatitude(parseFloat(result.lat));
    setLongitude(parseFloat(result.lon));
    // Use display_name for facility name if empty
    if (!name.trim()) {
      const facilityName = result.display_name.split(",")[0].trim();
      setName(facilityName);
    }
    setShowSuggestions(false);
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocation(e.target.value);
    setLatitude(null);
    setLongitude(null);
    setShowSuggestions(true);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !user) return;
    setLoading(true);
    const { error } = await supabase.from("facilities").insert({
      user_id: user.id,
      name: name.trim(),
      location: location.trim() || null,
      notes: notes.trim() || null,
      latitude,
      longitude,
    } as any);
    setLoading(false);
    if (error) {
      toast({ title: "Error adding facility", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Facility added" });
      setName(""); setLocation(""); setNotes(""); setLatitude(null); setLongitude(null);
      setOpen(false);
      onAdded();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
          <Input placeholder="Facility name *" value={name} onChange={(e) => setName(e.target.value)} className="bg-secondary border-border text-foreground placeholder:text-muted-foreground" />
          
          <div className="relative">
            <Input
              ref={locationInputRef}
              placeholder="Search address or location"
              value={location}
              onChange={handleLocationChange}
              onFocus={() => location.length >= 3 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground pr-8"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
              {searching ? (
                <Loader2 size={14} className="text-muted-foreground animate-spin" />
              ) : (
                <MapPin size={14} className="text-muted-foreground" />
              )}
            </div>

            {showSuggestions && results.length > 0 && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                {results.map((r) => (
                  <button
                    key={r.place_id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectSuggestion(r)}
                    className="w-full text-left px-3 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors flex items-start gap-2 border-b border-border last:border-0"
                  >
                    <MapPin size={14} className="text-primary mt-0.5 shrink-0" />
                    <span className="line-clamp-2">{r.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {latitude !== null && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin size={10} /> Coordinates: {latitude.toFixed(4)}, {longitude?.toFixed(4)}
            </p>
          )}

          <Textarea placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-secondary border-border text-foreground placeholder:text-muted-foreground resize-none" rows={3} />
          <Button onClick={handleSubmit} disabled={!name.trim() || loading} className="rounded-full">
            {loading ? "Adding..." : "Save Facility"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddFacilityDialog;
