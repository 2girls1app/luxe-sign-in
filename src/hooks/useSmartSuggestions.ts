import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SuggestionResult {
  procedureSuggestions: string[];
  specialtySuggestions: string[];
  loading: boolean;
}

/**
 * Hook that provides smart suggestions for preference categories
 * based on procedure name and specialty usage history.
 * 
 * Priority: procedure-specific > specialty-level > master list
 */
export const useSmartSuggestions = (
  procedureName: string,
  specialty: string,
  category: string,
  facilityId?: string | null
): SuggestionResult => {
  const [procedureSuggestions, setProcedureSuggestions] = useState<string[]>([]);
  const [specialtySuggestions, setSpecialtySuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSuggestions = useCallback(async () => {
    if (!category || !procedureName) return;
    setLoading(true);

    try {
      // 1. Get all procedure IDs with the same name (procedure-level memory)
      let procQuery = supabase
        .from("procedures")
        .select("id")
        .ilike("name", procedureName);
      if (facilityId) procQuery = procQuery.eq("facility_id", facilityId);

      const { data: sameProcedures } = await procQuery;
      const procIds = sameProcedures?.map((p) => p.id) || [];

      // 2. Get preferences for this category from matching procedures
      let procItems: Record<string, number> = {};
      if (procIds.length > 0) {
        const { data: procPrefs } = await supabase
          .from("procedure_preferences")
          .select("value")
          .in("procedure_id", procIds)
          .eq("category", category);

        if (procPrefs) {
          procPrefs.forEach((pref) => {
            extractItemNames(pref.value).forEach((name) => {
              procItems[name] = (procItems[name] || 0) + 1;
            });
          });
        }
      }

      // 3. Get specialty-level suggestions (different procedure names, same specialty)
      let specItems: Record<string, number> = {};
      if (specialty) {
        let specQuery = supabase
          .from("procedures")
          .select("id")
          .eq("category", specialty);
        if (facilityId) specQuery = specQuery.eq("facility_id", facilityId);

        const { data: specProcedures } = await specQuery;
        const specIds = (specProcedures?.map((p) => p.id) || [])
          .filter((id) => !procIds.includes(id));

        if (specIds.length > 0) {
          const { data: specPrefs } = await supabase
            .from("procedure_preferences")
            .select("value")
            .in("procedure_id", specIds)
            .eq("category", category);

          if (specPrefs) {
            specPrefs.forEach((pref) => {
              extractItemNames(pref.value).forEach((name) => {
                specItems[name] = (specItems[name] || 0) + 1;
              });
            });
          }
        }
      }

      // Sort by frequency descending
      const sortByFreq = (items: Record<string, number>) =>
        Object.entries(items)
          .sort((a, b) => b[1] - a[1])
          .map(([name]) => name);

      setProcedureSuggestions(sortByFreq(procItems));
      // Only include specialty suggestions that aren't already in procedure suggestions
      const procSet = new Set(Object.keys(procItems));
      const filteredSpec: Record<string, number> = {};
      Object.entries(specItems).forEach(([name, count]) => {
        if (!procSet.has(name)) filteredSpec[name] = count;
      });
      setSpecialtySuggestions(sortByFreq(filteredSpec));
    } catch (err) {
      console.error("Smart suggestions error:", err);
    } finally {
      setLoading(false);
    }
  }, [procedureName, specialty, category, facilityId]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  return { procedureSuggestions, specialtySuggestions, loading };
};

/**
 * Extract item names from a preference value string.
 * Handles JSON arrays (with name property or plain strings) and comma-separated strings.
 */
function extractItemNames(value: string): string[] {
  if (!value || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item: any) => (typeof item === "string" ? item : item.name))
        .filter(Boolean);
    }
  } catch {
    // Plain string value - could be comma-separated or single value
    return value.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

export default useSmartSuggestions;
