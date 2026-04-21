import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Loader2, X, Building2 } from "lucide-react";
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

  // Name search (hospitals in Georgia) — mirrors AddFacilityDialog
  const [nameQuery, setNameQuery] = useState("");
  const [selectedHospital, setSelectedHospital] = useState<PlaceSuggestion | null>(null);
  const [showHospitalDropdown, setShowHospitalDropdown] = useState(false);

  // Address fallback search
  const [address, setAddress] = useState("");
  const [addressQuery, setAddressQuery] = useState("");
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);

  const [notes, setNotes] = useState("");
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Pre-fill when facility changes / dialog opens
  useEffect(() => {
    if (facility && open) {
      setNameQuery(facility.name || "");
      setAddress(facility.location || "");
      setAddressQuery(facility.location || "");
      setNotes(facility.notes || "");
      setCoords({ lat: null, lng: null });
      setSelectedHospital(null);
      setShowHospitalDropdown(false);
      setShowAddressDropdown(false);
    }
  }, [facility, open]);

  // Google Places: hospital search (Georgia, USA) — disabled once a hospital is picked
  const { results: hospitalResults, loading: hospitalLoading } = useGooglePlacesAutocomplete(
    nameQuery,
    !selectedHospital,
    "hospital"
  );

  // Google Places: address fallback — disabled once GPS-verified
  const { results: addressResults, loading: addressLoading } = useGooglePlacesAutocomplete(
    addressQuery,
    addressQuery.length >= 2 && coords.lat === null,
    "address"
  );

  const handleNameChange = (val: string) => {
    setNameQuery(val);
    setSelectedHospital(null);
    setShowHospitalDropdown(true);
  };

  const handleSelectHospital = async (suggestion: PlaceSuggestion) => {
    setSelectedHospital(suggestion);
    setNameQuery(suggestion.mainText);
    setShowHospitalDropdown(false);
    const details = await fetchPlaceDetails(suggestion.placeId);
    if (details) {
      // Overwrite both name + address with verified Google Places data
      setAddress(details.address);
      setAddressQuery(details.address);
      setCoords({ lat: details.latitude, lng: details.longitude });
    }
  };

  const handleAddressChange = (val: string) => {
    setAddressQuery(val);
    setAddress(val);
    setCoords({ lat: null, lng: null });
    setShowAddressDropdown(true);
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
    if (!facility || !nameQuery.trim()) return;
    setLoading(true);

    const updatePayload: Record<string, any> = {
      name: nameQuery.trim(),
      location: address.trim() || null,
      notes: notes.trim() || null,
    };
    // Only overwrite GPS if the user picked a verified place this session
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
          <DialogDescription className="text-muted-foreground">
            Search to update with verified Google Places data, or edit fields directly. Changes save instantly.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-2">
          {/* Facility Name (Google Places hospital search) */}
          <div className="relative" ref={dropdownRef}>
            <label className="text-xs text-muted-foreground mb-1 block">Facility Name *</label>
            <Input
              placeholder="Search Georgia hospitals & surgery centers..."
              value={nameQuery}
              onChange={(e) => handleNameChange(e.target.value)}
              onFocus={() => !selectedHospital && nameQuery.trim().length >= 2 && setShowHospitalDropdown(true)}
              onBlur={() => setTimeout(() => setShowHospitalDropdown(false), 200)}
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />

            {showHospitalDropdown && nameQuery.trim().length >= 2 && (
              <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                {hospitalLoading ? (
                  <div className="p-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 size={14} className="animate-spin" /> Searching Georgia facilities...
                  </div>
                ) : hospitalResults.length === 0 ? (
                  <div className="p-3 text-xs text-muted-foreground text-center">
                    No facilities found — try "surgery center", "ASC", or a hospital name
                  </div>
                ) : (
                  hospitalResults.map((r) => (
                    <button
                      key={r.placeId}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-accent text-sm cursor-pointer"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelectHospital(r)}
                    >
                      <div className="flex items-start gap-2">
                        <Building2 size={14} className="text-primary mt-0.5 shrink-0" />
                        <div>
                          <div className="font-medium text-foreground">{r.mainText}</div>
                          {r.secondaryText && (
                            <div className="text-xs text-muted-foreground">{r.secondaryText}</div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* GPS verification warning when user typed a new name without selecting */}
            {facility && nameQuery.trim() !== (facility.name || "").trim() && coords.lat === null && (
              <p className="text-[11px] text-amber-500 mt-1.5 leading-snug">
                ⚠ Please select a verified facility from the list to ensure accurate location data.
              </p>
            )}
          </div>

          {/* Address (Google Places address autocomplete fallback) */}
          <div className="relative">
            <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
              Address
              {coords.lat !== null && (
                <span className="text-[10px] text-primary ml-1">✓ GPS verified</span>
              )}
            </label>
            <div className="relative">
              <Input
                placeholder="Auto-filled or search address"
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
              disabled={
                !nameQuery.trim() ||
                loading ||
                // Block save when the user changed the name but didn't pick a verified place
                (!!facility &&
                  nameQuery.trim() !== (facility.name || "").trim() &&
                  coords.lat === null)
              }
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
