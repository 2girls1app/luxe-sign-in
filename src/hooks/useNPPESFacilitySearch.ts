import { useState, useEffect, useRef } from "react";

export interface NPPESFacility {
  npi: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  facilityType: string;
}

export const useNPPESFacilitySearch = (query: string, enabled: boolean = true) => {
  const [results, setResults] = useState<NPPESFacility[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!enabled || query.trim().length < 3) {
      setResults([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        // NPPES NPI Registry API - searches organization providers (enumeration_type=NPI-2 = organizations)
        const url = `https://npiregistry.cms.hhs.gov/api/?version=2.1&enumeration_type=NPI-2&limit=10&organization_name=${encodeURIComponent(query.trim())}&country_code=US`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("NPPES fetch failed");
        const data = await res.json();

        if (data.results && Array.isArray(data.results)) {
          const facilities: NPPESFacility[] = data.results
            .filter((r: any) => r.basic?.organization_name)
            .map((r: any) => {
              const addr = r.addresses?.[0] || {};
              const taxonomy = r.taxonomies?.[0]?.desc || "Healthcare Facility";
              return {
                npi: r.number,
                name: r.basic.organization_name,
                address: [addr.address_1, addr.address_2].filter(Boolean).join(", "),
                city: addr.city || "",
                state: addr.state || "",
                zip: addr.postal_code?.substring(0, 5) || "",
                facilityType: taxonomy,
              };
            });
          setResults(facilities);
        } else {
          setResults([]);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, enabled]);

  return { results, loading };
};
