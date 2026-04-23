import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, MapPin, Loader2, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  useGooglePlacesAutocomplete,
  fetchPlaceDetails,
  PlaceSuggestion,
} from "@/hooks/useGooglePlacesAutocomplete";

// Preset facilities that require a verification code (e.g. enterprise-managed sites)
const APPROVED_FACILITIES: { name: string; code: string; facilityId: string }[] = [
  { name: "Northside Hospital Duluth", code: "NSD-6154", facilityId: "6e5219ec-9ab4-42d7-a98e-75181416f917" },
];

interface AddFacilityDialogProps {
  onAdded: () => void;
  existingFacilityIds?: string[];
  isIndividual?: boolean;
  /** When set, the doctor_facilities row is created for this user_id instead of the logged-in user. */
  forUserId?: string;
  triggerLabel?: string;
}

const AddFacilityDialog = ({ onAdded, existingFacilityIds = [], isIndividual = false, forUserId, triggerLabel = "Add Facility" }: AddFacilityDialogProps) => {
  const [open, setOpen] = useState(false);
  const [nameQuery, setNameQuery] = useState("");
  const [address, setAddress] = useState("");
  const [addressQuery, setAddressQuery] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [showHospitalDropdown, setShowHospitalDropdown] = useState(false);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });
  const [selectedHospital, setSelectedHospital] = useState<PlaceSuggestion | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Preset facility (code-verified) state
  const [matchedPreset, setMatchedPreset] = useState<typeof APPROVED_FACILITIES[0] | null>(null);
  const [facilityCode, setFacilityCode] = useState("");
  const [codeError, setCodeError] = useState("");

  // Google Places: hospital search by name (Georgia, USA) — for all users
  const { results: hospitalResults, loading: hospitalLoading } = useGooglePlacesAutocomplete(
    nameQuery,
    !selectedHospital,
    "hospital"
  );

  // Google Places: address fallback — for all users
  const { results: addressResults, loading: addressLoading } = useGooglePlacesAutocomplete(
    addressQuery,
    addressQuery.length >= 2 && coords.lat === null,
    "address"
  );

  const resetForm = () => {
    setNameQuery("");
    setAddress("");
    setAddressQuery("");
    setMatchedPreset(null);
    setSelectedHospital(null);
    setFacilityCode("");
    setCodeError("");
    setNotes("");
    setCoords({ lat: null, lng: null });
    setShowHospitalDropdown(false);
    setShowAddressDropdown(false);
  };

  const detectPresetMatch = (name: string) => {
    const match = APPROVED_FACILITIES.find(
      (f) =>
        !existingFacilityIds.includes(f.facilityId) &&
        f.name.toLowerCase() === name.trim().toLowerCase()
    );
    setMatchedPreset(match ?? null);
    if (!match) {
      setFacilityCode("");
      setCodeError("");
    }
  };

  const handleSelectHospital = async (suggestion: PlaceSuggestion) => {
    setSelectedHospital(suggestion);
    setNameQuery(suggestion.mainText);
    setShowHospitalDropdown(false);
    detectPresetMatch(suggestion.mainText);
    const details = await fetchPlaceDetails(suggestion.placeId);
    if (details) {
      setAddress(details.address);
      setAddressQuery(details.address);
      setCoords({ lat: details.latitude, lng: details.longitude });
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

  const handleNameChange = (val: string) => {
    setNameQuery(val);
    setSelectedHospital(null);
    setShowHospitalDropdown(true);
    detectPresetMatch(val);
  };

  const handleAddressChange = (val: string) => {
    setAddressQuery(val);
    setAddress(val);
    setCoords({ lat: null, lng: null });
    setShowAddressDropdown(true);
  };

  const handleCodeChange = (val: string) => {
    setFacilityCode(val);
    if (codeError) setCodeError("");
  };

  const codeMatches =
    matchedPreset && facilityCode.trim().toUpperCase() === matchedPreset.code.toUpperCase();

  const isValid = (() => {
    if (!nameQuery.trim()) return false;
    // If user typed/selected a preset facility name, require valid code
    if (matchedPreset) return !!facilityCode.trim() && !!codeMatches;
    // Otherwise require a Google Places verified selection (GPS coords)
    return coords.lat !== null && coords.lng !== null;
  })();

  const handleSubmit = async () => {
    if (!user || !nameQuery.trim()) return;

    // Preset (code-verified) flow → just link the existing facility
    if (matchedPreset) {
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
        facility_id: matchedPreset.facilityId,
      } as any);
      setLoading(false);

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Already added",
            description: "This facility is already linked to your profile.",
            variant: "destructive",
          });
        } else {
          toast({ title: "Error adding facility", description: error.message, variant: "destructive" });
        }
        return;
      }
      toast({ title: "Facility added" });
      resetForm();
      setOpen(false);
      onAdded();
      return;
    }

    // Generic flow → create a new facility owned by this user (with GPS if available)
    setLoading(true);
    const { data: newFacility, error: createError } = await supabase
      .from("facilities")
      .insert({
        name: nameQuery.trim(),
        location: address.trim() || null,
        notes: notes.trim() || null,
        user_id: user.id,
        latitude: coords.lat,
        longitude: coords.lng,
      })
      .select("id")
      .single();

    if (createError) {
      setLoading(false);
      toast({ title: "Error creating facility", description: createError.message, variant: "destructive" });
      return;
    }

    const { error: linkError } = await supabase.from("doctor_facilities" as any).insert({
      user_id: user.id,
      facility_id: newFacility.id,
    } as any);

    setLoading(false);
    if (linkError && linkError.code !== "23505") {
      toast({ title: "Error linking facility", description: linkError.message, variant: "destructive" });
      return;
    }

    toast({ title: "Facility added" });
    resetForm();
    setOpen(false);
    onAdded();
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
          {/* Facility Name (Google Places hospital search) */}
          <div className="relative" ref={dropdownRef}>
            <label className="text-xs text-muted-foreground mb-1 block">Facility Name *</label>
            <Input
              placeholder="Search Georgia hospitals & surgery centers..."
              value={nameQuery}
              onChange={(e) => handleNameChange(e.target.value)}
              onFocus={() => !selectedHospital && setShowHospitalDropdown(true)}
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

            {/* GPS verification warning */}
            {nameQuery.trim().length >= 2 && coords.lat === null && !matchedPreset && (
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
            <Input
              placeholder="Auto-filled or search address"
              value={addressQuery}
              onChange={(e) => handleAddressChange(e.target.value)}
              onFocus={() => addressQuery.length >= 2 && coords.lat === null && setShowAddressDropdown(true)}
              onBlur={() => setTimeout(() => setShowAddressDropdown(false), 200)}
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
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

          {/* Facility Code — only when name matches a preset enterprise facility */}
          {matchedPreset && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Facility Code * <span className="text-[10px] text-primary">(verification required)</span>
              </label>
              <Input
                placeholder="Enter facility code"
                value={facilityCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                className={`bg-secondary border-border text-foreground placeholder:text-muted-foreground ${codeError ? "border-destructive" : ""}`}
              />
              {codeError && <p className="text-xs text-destructive mt-1">{codeError}</p>}
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!isValid || loading}
            className="rounded-full"
          >
            {loading ? "Adding..." : "Save Facility"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddFacilityDialog;
