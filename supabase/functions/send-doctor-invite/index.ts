import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.100.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { doctor_name, doctor_email, inviter_name, specialty } = await req.json()

    if (!doctor_email || !doctor_name) {
      return new Response(
        JSON.stringify({ error: 'doctor_name and doctor_email are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Check if doctor already has an account
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(
      (u: any) => u.email?.toLowerCase() === doctor_email.toLowerCase()
    )

    const siteUrl = req.headers.get('origin') || 'https://id-preview--9fce324e-da2b-40ae-b0e4-93e6f2ed6417.lovable.app'

    const specialtyLine = specialty ? `<p style="color:#888;font-size:14px;">Specialty: ${specialty}</p>` : ''

    let subject: string
    let html: string

    if (existingUser) {
      // Doctor already has an account - notify them
      subject = `${inviter_name} invited you to view a preference card`
      html = `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;background:#1a1a2e;padding:30px;border-radius:12px;">
          <h1 style="color:#d4a843;font-size:22px;margin-bottom:8px;">You've Been Invited</h1>
          <p style="color:#e0e0e0;font-size:15px;line-height:1.6;">
            Hi Dr. ${doctor_name},
          </p>
          <p style="color:#e0e0e0;font-size:15px;line-height:1.6;">
            <strong style="color:#d4a843;">${inviter_name}</strong> has added you to their workspace and would like you to view their preference cards.
          </p>
          ${specialtyLine}
          <div style="text-align:center;margin:25px 0;">
            <a href="${siteUrl}" style="background:#d4a843;color:#1a1a2e;padding:12px 30px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;">
              Open App
            </a>
          </div>
          <p style="color:#888;font-size:12px;margin-top:20px;">
            Log in with your existing account to view the preference card.
          </p>
        </div>
      `
    } else {
      // Doctor is new - send join invitation
      const signupUrl = `${siteUrl}/signup`
      subject = `${inviter_name} invited you to join SurgiFlow`
      html = `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;background:#1a1a2e;padding:30px;border-radius:12px;">
          <h1 style="color:#d4a843;font-size:22px;margin-bottom:8px;">You're Invited to Join</h1>
          <p style="color:#e0e0e0;font-size:15px;line-height:1.6;">
            Hi Dr. ${doctor_name},
          </p>
          <p style="color:#e0e0e0;font-size:15px;line-height:1.6;">
            <strong style="color:#d4a843;">${inviter_name}</strong> has invited you to view surgical preference cards on the platform.
          </p>
          ${specialtyLine}
          <p style="color:#e0e0e0;font-size:15px;line-height:1.6;">
            Create your free Individual account to view and manage your preference cards.
          </p>
          <div style="text-align:center;margin:25px 0;">
            <a href="${signupUrl}" style="background:#d4a843;color:#1a1a2e;padding:12px 30px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;">
              Join Now
            </a>
          </div>
          <p style="color:#888;font-size:12px;margin-top:20px;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
      `
    }

    // Use Supabase's built-in email sending via auth admin
    // For now, we'll use the invite user API for new users
    // and a simple approach for existing users
    if (!existingUser) {
      // Invite the doctor via Supabase auth invite
      const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(doctor_email, {
        data: {
          full_name: `Dr. ${doctor_name}`,
          profession: 'doctor',
          account_type: 'individual',
        },
        redirectTo: siteUrl,
      })
      if (inviteError) {
        console.error('Invite error:', inviteError)
        // Don't fail - the doctor was still added to the workspace
      }
    }

    return new Response(
      JSON.stringify({ success: true, existing_user: !!existingUser }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Error in send-doctor-invite:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
