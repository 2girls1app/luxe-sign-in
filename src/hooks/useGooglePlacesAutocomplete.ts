import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PlaceSuggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
  fullText: string;
}

export interface PlaceDetails {
  placeId: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}

export const useGooglePlacesAutocomplete = (
  query: string,
  enabled: boolean,
  mode: "hospital" | "address" = "hospital"
) => {
  const [results, setResults] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!enabled || query.trim().length < 2) {
      setResults([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("google-places", {
          body: { action: "autocomplete", input: query, mode },
        });
        if (error) throw error;
        const suggestions = (data?.suggestions ?? [])
          .map((s: any) => s.placePrediction)
          .filter(Boolean)
          .map((p: any) => ({
            placeId: p.placeId,
            mainText: p.structuredFormat?.mainText?.text ?? p.text?.text ?? "",
            secondaryText: p.structuredFormat?.secondaryText?.text ?? "",
            fullText: p.text?.text ?? "",
          }));
        setResults(suggestions);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, enabled, mode]);

  return { results, loading };
};

export const fetchPlaceDetails = async (placeId: string): Promise<PlaceDetails | null> => {
  try {
    const { data, error } = await supabase.functions.invoke("google-places", {
      body: { action: "details", placeId },
    });
    if (error) throw error;
    return {
      placeId: data.id,
      name: data.displayName?.text ?? "",
      address: data.formattedAddress ?? "",
      latitude: data.location?.latitude ?? null,
      longitude: data.location?.longitude ?? null,
    };
  } catch {
    return null;
  }
};
