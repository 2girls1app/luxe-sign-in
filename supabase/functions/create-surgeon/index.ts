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
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Allow admins OR individual account types
    const isIndividual = caller.user_metadata?.account_type === "individual";

    let authorized = isIndividual;

    if (!authorized) {
      const { data: profileData } = await adminClient
        .from("profiles")
        .select("facility_id")
        .eq("user_id", caller.id)
        .maybeSingle();

      if (profileData && !profileData.facility_id) {
        authorized = true;
      }
    }

    if (!authorized) {
      const { data: roleData } = await adminClient
        .from("user_roles")
        .select("role")
        .eq("user_id", caller.id)
        .eq("role", "admin")
        .maybeSingle();

      if (roleData) {
        authorized = true;
      }
    }

    if (!authorized) {
      return new Response(JSON.stringify({ error: "Admin or Individual account access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { first_name, last_name, credentials, specialty, email, phone, avatar_url, password, facility_id, is_individual_invite, notes } = body;

    console.log("Request payload:", { first_name, last_name, credentials, specialty, email: email ? "provided" : "none", facility_id, is_individual_invite });

    if (!first_name || !last_name) {
      return new Response(JSON.stringify({ error: "First name and last name are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const displayName = credentials
      ? `${first_name} ${last_name}, ${credentials}`
      : `${first_name} ${last_name}`;

    // --- Individual invite flow: create profile record without auth account ---
    if (is_individual_invite) {
      // Generate a random email for the auth account if none provided
      const authEmail = email || `doctor-${crypto.randomUUID()}@placeholder.local`;
      const tempPassword = crypto.randomUUID() + "Aa1!";

      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: authEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: displayName,
          profession: "Surgeon",
        },
      });

      if (createError) {
        console.error("User creation error (individual):", createError);
        if (createError.message?.includes("already been registered")) {
          return new Response(JSON.stringify({ error: "A doctor with this email already exists" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update profile
      const { error: profileError } = await adminClient
        .from("profiles")
        .update({
          display_name: displayName,
          role: "Surgeon",
          specialty: specialty || null,
          avatar_url: avatar_url || null,
        })
        .eq("user_id", newUser.user.id);

      if (profileError) {
        console.error("Profile update error:", profileError);
      }

      // Link to facility
      if (facility_id) {
        const { error: linkError } = await adminClient
          .from("doctor_facilities")
          .insert({
            user_id: newUser.user.id,
            facility_id: facility_id,
          });
        if (linkError) {
          console.error("Facility link error:", linkError);
        }
      }

      console.log("Individual doctor created:", { user_id: newUser.user.id, display_name: displayName });

      return new Response(
        JSON.stringify({ success: true, user_id: newUser.user.id, display_name: displayName }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Facility/admin flow: requires email + password ---
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password are required for facility accounts" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (password.length < 8) {
      return new Response(JSON.stringify({ error: "Password must be at least 8 characters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: displayName,
        profession: "Surgeon",
      },
    });

    if (createError) {
      console.error("User creation error (facility):", createError);
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: profileError } = await adminClient
      .from("profiles")
      .update({
        display_name: displayName,
        role: "Surgeon",
        specialty: specialty || null,
        avatar_url: avatar_url || null,
      })
      .eq("user_id", newUser.user.id);

    if (profileError) {
      console.error("Profile update error:", profileError);
    }

    if (facility_id) {
      const { error: linkError } = await adminClient
        .from("doctor_facilities")
        .insert({
          user_id: newUser.user.id,
          facility_id: facility_id,
        });
      if (linkError) {
        console.error("Facility link error:", linkError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, user_id: newUser.user.id, display_name: displayName }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
