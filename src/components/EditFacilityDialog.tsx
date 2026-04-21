import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  useGooglePlacesAutocomplete,
  fetchPlaceDetails,
  PlaceSuggestion,
} from "@/hooks/useGooglePlacesAutocomplete";

interface EditFacilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facility: {
    id: string;
    name: string;
    location: string | null;
    notes?: string | null;
  } | null;
  onSaved: () => void;
}

const EditFacilityDialog = ({ open, onOpenChange, facility, onSaved }: EditFacilityDialogProps) => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [addressQuery, setAddressQuery] = useState("");
  const [notes, setNotes] = useState("");
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Pre-fill when facility changes / dialog opens
  useEffect(() => {
    if (facility && open) {
      setName(facility.name || "");
      setAddress(facility.location || "");
      setAddressQuery(facility.location || "");
      setNotes(facility.notes || "");
      setCoords({ lat: null, lng: null });
      // Auto-open the suggestions if there is a prefilled address to edit
      setShowAddressDropdown(!!(facility.location && facility.location.trim().length >= 2));
    }
  }, [facility, open]);

  const { results: addressResults, loading: addressLoading } = useGooglePlacesAutocomplete(
    addressQuery,
    addressQuery.length >= 2 && coords.lat === null,
    "address"
  );

  const handleAddressChange = (val: string) => {
    setAddressQuery(val);
    setAddress(val);
    setCoords({ lat: null, lng: null });
    setShowAddressDropdown(true);
  };

  const handleAddressFocus = () => {
    if (addressQuery.length >= 2 && coords.lat === null) {
      setShowAddressDropdown(true);
    }
  };

  const handleSelectAddress = async (suggestion: PlaceSuggestion) => {
    setShowAddressDropdown(false);
    const details = await fetchPlaceDetails(suggestion.placeId);
    if (details) {
      setAddress(details.address);
      setAddressQuery(details.address);
      setCoords({ lat: details.latitude, lng: details.longitude });
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleSave = async () => {
    if (!facility || !name.trim()) return;
    setLoading(true);

    const updatePayload: Record<string, any> = {
      name: name.trim(),
      location: address.trim() || null,
      notes: notes.trim() || null,
    };
    if (coords.lat !== null && coords.lng !== null) {
      updatePayload.latitude = coords.lat;
      updatePayload.longitude = coords.lng;
    }

    const { error } = await supabase
      .from("facilities")
      .update(updatePayload)
      .eq("id", facility.id);

    setLoading(false);

    if (error) {
      toast({ title: "Error updating facility", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Facility updated" });
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-foreground">Edit Facility</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-2">
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

          {/* Address (Google Places autocomplete) */}
          <div className="relative" ref={dropdownRef}>
            <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
              Address
              {coords.lat !== null && (
                <span className="text-[10px] text-primary ml-1">✓ GPS verified</span>
              )}
            </label>
            <div className="relative">
              <Input
                placeholder="Search for an address"
                value={addressQuery}
                onChange={(e) => handleAddressChange(e.target.value)}
                onFocus={() => addressQuery.length >= 2 && coords.lat === null && setShowAddressDropdown(true)}
                onBlur={() => setTimeout(() => setShowAddressDropdown(false), 200)}
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground pr-8"
              />
              {addressQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setAddressQuery("");
                    setAddress("");
                    setCoords({ lat: null, lng: null });
                    setShowAddressDropdown(false);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                  aria-label="Clear address"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            {showAddressDropdown && addressQuery.length >= 2 && coords.lat === null && (
              <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                {addressLoading ? (
                  <div className="p-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 size={14} className="animate-spin" /> Searching addresses...
                  </div>
                ) : addressResults.length === 0 ? null : (
                  addressResults.map((r) => (
                    <button
                      key={r.placeId}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-accent text-sm cursor-pointer"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelectAddress(r)}
                    >
                      <div className="flex items-start gap-2">
                        <MapPin size={14} className="text-primary mt-0.5 shrink-0" />
                        <span className="text-foreground">{r.fullText}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <Textarea
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="bg-secondary border-border text-foreground placeholder:text-muted-foreground resize-none"
            rows={2}
          />

          <div className="flex gap-2 mt-1">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1 rounded-full"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!name.trim() || loading}
              className="flex-1 rounded-full"
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditFacilityDialog;
