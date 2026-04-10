import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { procedureId } = await req.json();

    if (!procedureId) {
      return new Response(JSON.stringify({ error: "Missing procedureId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check that a share record exists for this procedure
    const { data: shareRecord } = await supabase
      .from("shared_procedure_cards")
      .select("id")
      .eq("procedure_id", procedureId)
      .limit(1);

    if (!shareRecord || shareRecord.length === 0) {
      return new Response(JSON.stringify({ error: "No shared card found" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch procedure info
    const { data: procedure } = await supabase
      .from("procedures")
      .select("name, facility_id, user_id")
      .eq("id", procedureId)
      .single();

    if (!procedure) {
      return new Response(JSON.stringify({ error: "Procedure not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch facility name
    let facilityName = "";
    if (procedure.facility_id) {
      const { data: facility } = await supabase
        .from("facilities")
        .select("name")
        .eq("id", procedure.facility_id)
        .single();
      facilityName = facility?.name || "";
    }

    // Fetch provider name
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", procedure.user_id)
      .single();

    // Fetch preferences
    const { data: prefs } = await supabase
      .from("procedure_preferences")
      .select("category, value")
      .eq("procedure_id", procedureId);

    const preferences: Record<string, string> = {};
    if (prefs) {
      prefs.forEach((p: any) => { preferences[p.category] = p.value; });
    }

    // Fetch file counts
    const { data: files } = await supabase
      .from("procedure_files")
      .select("category")
      .eq("procedure_id", procedureId);

    const fileCounts: Record<string, number> = {};
    if (files) {
      files.forEach((f: any) => { fileCounts[f.category] = (fileCounts[f.category] || 0) + 1; });
    }

    return new Response(JSON.stringify({
      procedureName: procedure.name,
      providerName: profile?.display_name || "",
      facilityName,
      preferences,
      fileCounts,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
