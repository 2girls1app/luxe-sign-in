import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { procedureName, specialty } = await req.json();
    if (!procedureName) {
      return new Response(JSON.stringify({ error: "procedureName is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a surgical preference card assistant. Given a procedure name and specialty, generate realistic, clinically appropriate preference card suggestions.

Return a JSON object using this tool. Each field should contain a JSON array of item names (strings) that are commonly used for this procedure. Only include categories where you have reasonable clinical knowledge. Use real product/item names that OR staff would recognize.

Guidelines:
- skinprep: 1-2 items from [Betadine, Chlorhexidine, ChloraPrep, DuraPrep, Alcohol, Hibiclens, Techni-Care]
- equipment: 3-8 items from [Bovie/Cautery, Bipolar, Harmonic Scalpel, LigaSure, Suction, Headlight, Loupes, Microscope, C-Arm, Laser, Tourniquet, Cell Saver, Nerve Stimulator, Sequential Compression, Warming Blanket]
- instruments: 3-8 items from [Metzenbaum Scissors, Mayo Scissors, DeBakey Forceps, Adson Forceps, Russian Forceps, Kocher Clamp, Kelly Clamp, Allis Clamp, Babcock Clamp, Army-Navy Retractor, Richardson Retractor, Deaver Retractor, Weitlaner Retractor, Gelpi Retractor, Skin Hooks, Needle Driver, Castroviejo, Bovie Tip Cleaner]
- trays: 1-3 items from [Basic/Minor Tray, Major Tray, Plastic Tray, Ortho Tray, Vascular Tray, Laparoscopic Tray, GYN Tray, Neuro Tray, ENT Tray, Cardiac Tray, Microsurgery Tray, Bone Tray]
- supplies: 3-8 items from [4x4 Gauze, Lap Sponges, Raytec, Suction Tubing, Bovie Pencil, Bovie Tip, Blade #10, Blade #15, Blade #11, Skin Marker, Foley Catheter, NG Tube, Irrigation Syringe, Normal Saline, Antibiotic Irrigation, Hemostatic Agent, Drains (JP/Blake), Vessel Loops, Bone Wax, Stapler]
- suture: 2-5 items from [Vicryl (Polyglactin), Monocryl (Poliglecaprone), PDS (Polydioxanone), Chromic Gut, Plain Gut, Prolene (Polypropylene), Nylon (Ethilon), Silk, Ethibond, V-Loc, Stratafix, Quill, Steel Wire]
- medication: 2-5 items (common local anesthetics, analgesics for this procedure)
- position: a single string like "Supine", "Prone", "Lateral", "Lithotomy", etc.
- gloves: a string like "Dr: 7, FA: 6.5" (common default)`;

    const userPrompt = `Generate surgical preference card suggestions for:
Procedure: ${procedureName}
${specialty ? `Specialty: ${specialty}` : ""}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_preferences",
              description: "Return suggested preference card items for a surgical procedure",
              parameters: {
                type: "object",
                properties: {
                  skinprep: { type: "array", items: { type: "string" } },
                  equipment: { type: "array", items: { type: "string" } },
                  instruments: { type: "array", items: { type: "string" } },
                  trays: { type: "array", items: { type: "string" } },
                  supplies: { type: "array", items: { type: "string" } },
                  suture: { type: "array", items: { type: "string" } },
                  medication: { type: "array", items: { type: "string" } },
                  position: { type: "string" },
                  gloves: { type: "string" },
                },
                required: ["skinprep", "equipment", "instruments", "supplies", "suture"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_preferences" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "No suggestions generated" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const suggestions = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-prefill error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
