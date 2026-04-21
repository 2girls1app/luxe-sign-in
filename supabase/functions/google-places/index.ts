// Google Places (New) API proxy
// Actions:
//   - autocomplete: search hospitals biased to Georgia, USA
//   - details: fetch place details including coordinates

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!API_KEY) {
      console.error("GOOGLE_PLACES_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "API_KEY_MISSING", suggestions: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action as string | undefined;
    console.log("google-places request:", action, body.input ?? body.placeId);

    if (action === "autocomplete") {
      const input = String(body.input ?? "").trim();
      const mode = String(body.mode ?? "hospital");
      if (!input) {
        return new Response(JSON.stringify({ suggestions: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const reqBody: Record<string, unknown> = {
        input,
        // Bias to Georgia, USA
        locationBias: {
          rectangle: {
            low: { latitude: 30.355, longitude: -85.605 },
            high: { latitude: 35.001, longitude: -80.84 },
          },
        },
        includedRegionCodes: ["us"],
      };

      if (mode === "hospital") {
        // Broaden beyond just hospitals to include surgical centers,
        // ambulatory surgery centers, outpatient surgery, medical centers,
        // and specialty procedure clinics. Google Places (New) Autocomplete
        // accepts up to 5 included primary types from Table A.
        reqBody.includedPrimaryTypes = [
          "hospital",
          "medical_lab",
          "doctor",
          "dental_clinic",
          "wellness_center",
        ];
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
        console.error("Places autocomplete error:", res.status, JSON.stringify(data));
        return new Response(JSON.stringify({ error: data, suggestions: [] }), {
          status: 200,
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

      const res = await fetch(
        `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
        {
          method: "GET",
          headers: {
            "X-Goog-Api-Key": API_KEY,
            "X-Goog-FieldMask": "id,displayName,formattedAddress,location,types",
          },
        }
      );

      const data = await res.json();
      if (!res.ok) {
        console.error("Places details error:", res.status, JSON.stringify(data));
        return new Response(JSON.stringify({ error: data }), {
          status: 200,
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
    console.error("google-places exception:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
