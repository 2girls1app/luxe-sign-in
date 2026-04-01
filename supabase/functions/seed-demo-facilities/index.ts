import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check admin role
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Seed facilities with codes
    const facilities = [
      { name: "Emory Medical Center", facility_code: "EMC-4827", location: "Atlanta, GA", user_id: caller.id },
      { name: "Northside Hospital Duluth", facility_code: "NSD-6154", location: "Duluth, GA", user_id: caller.id },
      { name: "Northside Hospital Gwinnett", facility_code: "NSG-7309", location: "Lawrenceville, GA", user_id: caller.id },
    ];

    const facilityIds: Record<string, string> = {};

    for (const f of facilities) {
      // Check if facility code already exists
      const { data: existing } = await adminClient
        .from("facilities")
        .select("id")
        .eq("facility_code", f.facility_code)
        .maybeSingle();

      if (existing) {
        facilityIds[f.facility_code] = existing.id;
        continue;
      }

      const { data: inserted, error } = await adminClient
        .from("facilities")
        .insert(f)
        .select("id")
        .single();

      if (error) {
        console.error("Facility insert error:", error);
        continue;
      }
      facilityIds[f.facility_code] = inserted.id;
    }

    // Create demo accounts
    const demoAccounts = [
      { first_name: "Taylor", last_name: "Brooks", email: "firstassist.demo@yourapp.com", role: "First Assist", facility_code: "EMC-4827" },
      { first_name: "Jordan", last_name: "Lee", email: "pa.demo@yourapp.com", role: "Physician Assistant", facility_code: "NSD-6154" },
      { first_name: "Morgan", last_name: "Reed", email: "nurse.demo@yourapp.com", role: "Nurse", facility_code: "NSG-7309" },
      { first_name: "Casey", last_name: "Morgan", email: "anesthesia.demo@yourapp.com", role: "Anesthesia", facility_code: "EMC-4827" },
    ];

    const results: any[] = [];

    for (const acct of demoAccounts) {
      const displayName = `${acct.first_name} ${acct.last_name}`;
      const facilityId = facilityIds[acct.facility_code];

      // Check if user already exists
      const { data: existingUsers } = await adminClient.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === acct.email);
      
      if (existingUser) {
        results.push({ email: acct.email, status: "already_exists" });
        continue;
      }

      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: acct.email,
        password: "TempPass123!",
        email_confirm: true,
        user_metadata: {
          full_name: displayName,
          first_name: acct.first_name,
          last_name: acct.last_name,
          profession: acct.role,
        },
      });

      if (createError) {
        results.push({ email: acct.email, status: "error", error: createError.message });
        continue;
      }

      // Update profile with facility_id
      if (facilityId) {
        await adminClient
          .from("profiles")
          .update({ facility_id: facilityId, role: acct.role })
          .eq("user_id", newUser.user.id);
      }

      results.push({ email: acct.email, status: "created", user_id: newUser.user.id });
    }

    return new Response(
      JSON.stringify({ success: true, facilities: facilityIds, accounts: results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
