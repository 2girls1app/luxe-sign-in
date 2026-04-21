import { corsHeaders } from "@supabase/supabase-js/cors";

// Google Places (New) API proxy
// Actions:
//   - autocomplete: search hospitals biased to Georgia, USA
//   - details: fetch place details including coordinates
const API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!API_KEY) {
      return new Response(
        JSON.stringify({ error: "GOOGLE_PLACES_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action as string | undefined;

    if (action === "autocomplete") {
      const input = String(body.input ?? "").trim();
      const mode = String(body.mode ?? "hospital"); // "hospital" | "address"
      if (!input) {
        return new Response(JSON.stringify({ suggestions: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const reqBody: Record<string, unknown> = {
        input,
        // Bias to Georgia, USA (rectangle covering the state)
        locationBias: {
          rectangle: {
            low: { latitude: 30.355, longitude: -85.605 },
            high: { latitude: 35.001, longitude: -80.84 },
          },
        },
        includedRegionCodes: ["us"],
      };

      if (mode === "hospital") {
        // Restrict to hospitals / health establishments
        reqBody.includedPrimaryTypes = ["hospital"];
      }

      const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": API_KEY,
        },
        body: JSON.stringify(reqBody),
      });

      const data = await res.json();
      if (!res.ok) {
        return new Response(JSON.stringify({ error: data }), {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "details") {
      const placeId = String(body.placeId ?? "").trim();
      if (!placeId) {
        return new Response(JSON.stringify({ error: "placeId required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
        method: "GET",
        headers: {
          "X-Goog-Api-Key": API_KEY,
          "X-Goog-FieldMask": "id,displayName,formattedAddress,location,types",
        },
      });

      const data = await res.json();
      if (!res.ok) {
        return new Response(JSON.stringify({ error: data }), {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
