import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { file_url, mime_type } = await req.json();
    if (!file_url) {
      return new Response(JSON.stringify({ error: "file_url is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download the file and convert to base64
    const fileResponse = await fetch(file_url);
    if (!fileResponse.ok) throw new Error("Failed to download file");
    const fileBuffer = await fileResponse.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));

    const mediaType = mime_type || "image/jpeg";
    const isImage = mediaType.startsWith("image/");

    const systemPrompt = `You are an expert surgical preference card data extractor. You analyze images and PDFs of surgical preference cards and extract structured data.

Extract ALL preference information you can find and map them to these categories:
- medication: Medications, drugs, antibiotics, local anesthetics (e.g. Marcaine, Lidocaine, Ancef, Cefazolin)
- gloves: Glove type, size, brand (e.g. "Biogel 7.5", "Latex-free 8")
- position: Patient positioning (e.g. Supine, Prone, Lateral, Lithotomy, Beach Chair)
- skinprep: Skin preparation (e.g. Betadine, Chlorhexidine, ChloraPrep, DuraPrep, Alcohol)
- equipment: Equipment needed (e.g. Bovie/Cautery, Bipolar, Harmonic Scalpel, C-Arm, Tourniquet, Headlight, Loupes, Microscope)
- instruments: Surgical instruments (e.g. Metzenbaum Scissors, Mayo Scissors, DeBakey Forceps, Kocher Clamp, Kelly Clamp, Retractors, Needle Driver)
- robotic_instruments: Robotic instruments if applicable (e.g. Cadiere Forceps, Maryland Bipolar, Monopolar Curved Scissors, Large Needle Driver)
- trays: Instrument trays (e.g. Basic/Minor Tray, Major Tray, Laparoscopic Tray, Vascular Tray)
- supplies: Supplies (e.g. 4x4 Gauze, Lap Sponges, Suction Tubing, Bovie Pencil, Blades, Foley Catheter, Drains)
- suture: Sutures with sizes (e.g. "2-0 Vicryl", "3-0 Monocryl", "4-0 PDS", "3-0 Prolene")

Also extract:
- procedure_name: The name of the procedure if visible
- surgeon_name: The surgeon's name if visible

For each category, return an array of items. Each item should have:
- name: the item name (matched to standard names when possible)
- quantity: number (default 1)
- confidence: "high", "medium", or "low" based on how certain you are

Return ONLY valid JSON with this structure, no markdown:
{
  "procedure_name": "string or null",
  "surgeon_name": "string or null",
  "categories": {
    "medication": [{"name": "...", "quantity": 1, "confidence": "high"}],
    "gloves": [...],
    "position": [...],
    "skinprep": [...],
    "equipment": [...],
    "instruments": [...],
    "robotic_instruments": [...],
    "trays": [...],
    "supplies": [...],
    "suture": [...]
  },
  "raw_text": "full extracted text from the document"
}

If a category has no items, return an empty array. Always try to match items to their standard names.`;

    let messages: any[];

    if (isImage) {
      messages = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:${mediaType};base64,${base64}` },
            },
            {
              type: "text",
              text: "Extract all preference card information from this image. Return structured JSON only.",
            },
          ],
        },
      ];
    } else {
      // For PDFs, encode as base64 and send as image (Gemini supports PDF via image_url)
      messages = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:application/pdf;base64,${base64}` },
            },
            {
              type: "text",
              text: "Extract all preference card information from this PDF document. Return structured JSON only.",
            },
          ],
        },
      ];
    }

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages,
        }),
      }
    );

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error("AI extraction failed");
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || "";

    // Strip markdown code fences if present
    content = content.replace(/^```json\s*\n?/, "").replace(/\n?```\s*$/, "").trim();

    let extracted;
    try {
      extracted = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(
        JSON.stringify({ error: "Failed to parse extraction results", raw: content }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ success: true, data: extracted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-preference-card error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
