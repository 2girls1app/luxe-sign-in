import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, Mail } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

type Status =
  | "validating"
  | "valid"
  | "already_unsubscribed"
  | "invalid"
  | "submitting"
  | "success"
  | "error";

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("validating");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    const validate = async () => {
      if (!token) {
        setStatus("invalid");
        setErrorMsg("No unsubscribe token provided.");
        return;
      }

      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(
            token
          )}`,
          { headers: { apikey: SUPABASE_ANON_KEY } }
        );
        const json = await res.json();

        if (!res.ok) {
          setStatus("invalid");
          setErrorMsg(json.error ?? "Invalid or expired link.");
          return;
        }

        if (json.valid === false && json.reason === "already_unsubscribed") {
          setStatus("already_unsubscribed");
          return;
        }

        if (json.valid === true) {
          setStatus("valid");
          return;
        }

        setStatus("invalid");
        setErrorMsg("Unable to validate this link.");
      } catch (err) {
        setStatus("invalid");
        setErrorMsg("Network error while validating your link.");
      }
    };

    validate();
  }, [token]);

  const handleConfirm = async () => {
    if (!token) return;
    setStatus("submitting");
    try {
      const { data, error } = await supabase.functions.invoke(
        "handle-email-unsubscribe",
        { body: { token } }
      );
      if (error) {
        setStatus("error");
        setErrorMsg(error.message);
        return;
      }
      if (data?.success) {
        setStatus("success");
      } else if (data?.reason === "already_unsubscribed") {
        setStatus("already_unsubscribed");
      } else {
        setStatus("error");
        setErrorMsg("Unable to complete unsubscribe.");
      }
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err?.message ?? "Unexpected error.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md p-8 bg-card/80 backdrop-blur border-border/50 shadow-2xl">
        <div className="flex flex-col items-center text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center">
            {status === "validating" || status === "submitting" ? (
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            ) : status === "success" || status === "already_unsubscribed" ? (
              <CheckCircle2 className="w-6 h-6 text-primary" />
            ) : status === "invalid" || status === "error" ? (
              <XCircle className="w-6 h-6 text-destructive" />
            ) : (
              <Mail className="w-6 h-6 text-primary" />
            )}
          </div>

          {status === "validating" && (
            <>
              <h1 className="text-xl font-semibold">Validating your link…</h1>
              <p className="text-sm text-muted-foreground">
                Hang tight while we look this up.
              </p>
            </>
          )}

          {status === "valid" && (
            <>
              <h1 className="text-xl font-semibold">Unsubscribe from emails</h1>
              <p className="text-sm text-muted-foreground">
                You'll stop receiving app emails from First Assist. You can still
                receive essential account emails like password resets.
              </p>
              <Button
                onClick={handleConfirm}
                className="w-full mt-2"
                size="lg"
              >
                Confirm Unsubscribe
              </Button>
            </>
          )}

          {status === "submitting" && (
            <>
              <h1 className="text-xl font-semibold">Processing…</h1>
              <p className="text-sm text-muted-foreground">One moment.</p>
            </>
          )}

          {status === "success" && (
            <>
              <h1 className="text-xl font-semibold">You're unsubscribed</h1>
              <p className="text-sm text-muted-foreground">
                We won't send you any more app emails. Thanks for letting us
                know.
              </p>
            </>
          )}

          {status === "already_unsubscribed" && (
            <>
              <h1 className="text-xl font-semibold">Already unsubscribed</h1>
              <p className="text-sm text-muted-foreground">
                This email address is already opted out — no further action
                needed.
              </p>
            </>
          )}

          {(status === "invalid" || status === "error") && (
            <>
              <h1 className="text-xl font-semibold">Something went wrong</h1>
              <p className="text-sm text-muted-foreground">
                {errorMsg || "This link is invalid or has expired."}
              </p>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Unsubscribe;
