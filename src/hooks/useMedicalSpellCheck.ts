import { useCallback } from "react";
import { MEDICAL_DICTIONARY } from "@/data/medicalDictionary";

/**
 * Hook providing medical spell-check utilities.
 * 
 * Usage:
 *   const { validateText, getSuggestions } = useMedicalSpellCheck();
 * 
 * - validateText(text): returns non-medical misspelled candidates
 * - getSuggestions(partial): returns matching medical terms for autocomplete
 */
export function useMedicalSpellCheck() {
  const validateText = useCallback((text: string): string[] => {
    if (!text) return [];
    const words = text.match(/[a-zA-Z]{3,}/g) || [];
    // Return words that might be misspelled but aren't medical terms
    // (Browser spellcheck handles the actual checking; this filters false positives)
    return words.filter(
      (word) => !MEDICAL_DICTIONARY.has(word.toLowerCase())
    );
  }, []);

  const getSuggestions = useCallback((partial: string, limit = 10): string[] => {
    if (!partial || partial.length < 2) return [];
    const lower = partial.toLowerCase();
    const results: string[] = [];
    for (const term of MEDICAL_DICTIONARY) {
      if (term.startsWith(lower)) {
        results.push(term);
        if (results.length >= limit) break;
      }
    }
    return results.sort();
  }, []);

  const isMedicalTerm = useCallback((word: string): boolean => {
    return MEDICAL_DICTIONARY.has(word.toLowerCase().trim());
  }, []);

  return { validateText, getSuggestions, isMedicalTerm };
}
