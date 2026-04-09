import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus, Eye, EyeOff, Mail, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const SPECIALTIES = [
  "Cosmetic Surgery",
  "Bariatric Surgery",
  "Orthopedic Surgery",
  "Neurosurgery",
  "Cardiothoracic Surgery",
  "Vascular Surgery",
  "General Surgery",
  "Plastic Surgery",
  "Urologic Surgery",
  "ENT Surgery",
  "Gynecologic Surgery",
];

interface CreateSurgeonDialogProps {
  onCreated: () => void;
  facilityId?: string;
  isIndividual?: boolean;
}

const CreateSurgeonDialog = ({ onCreated, facilityId, isIndividual = false }: CreateSurgeonDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    credentials: "",
    specialty: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
    notes: "",
  });

  const update = (field: string, value: string) =>
    setForm(f => ({ ...f, [field]: value }));

  const resetForm = () => {
    setForm({ first_name: "", last_name: "", credentials: "", specialty: "", email: "", phone: "", password: "", confirm_password: "", notes: "" });
    setShowPassword(false);
    setShowConfirm(false);
  };

  const handleIndividualSubmit = async () => {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      toast({ title: "First name and last name are required", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await supabase.functions.invoke("create-surgeon", {
        body: {
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          credentials: form.credentials.trim(),
          specialty: form.specialty,
          email: form.email.trim() || undefined,
          phone: form.phone.trim(),
          facility_id: facilityId || undefined,
          is_individual_invite: true,
          notes: form.notes.trim() || undefined,
        },
      });

      if (res.error || res.data?.error) {
        throw new Error(res.data?.error || res.error?.message || "Failed to add doctor");
      }

      // Send invitation email if email was provided
      if (form.email.trim()) {
        try {
          await supabase.functions.invoke("send-doctor-invite", {
            body: {
              doctor_name: `${form.first_name.trim()} ${form.last_name.trim()}`,
              doctor_email: form.email.trim(),
              inviter_name: session.user.user_metadata?.full_name || session.user.email || "A team member",
              specialty: form.specialty || undefined,
            },
          });
        } catch (emailErr) {
          // Don't block the flow if email fails
          console.warn("Invitation email could not be sent:", emailErr);
        }

        toast({
          title: "Doctor added and invitation sent",
          description: `${form.first_name} ${form.last_name} has been added and an invite was sent to ${form.email}`,
        });
      } else {
        toast({
          title: "Doctor added successfully",
          description: `${form.first_name} ${form.last_name} has been added to your workspace`,
        });
      }

      resetForm();
      setOpen(false);
      onCreated();
    } catch (err: any) {
      toast({ title: "Error adding doctor", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleFacilitySubmit = async () => {
    if (!form.first_name.trim() || !form.last_name.trim() || !form.email.trim()) {
      toast({ title: "First name, last name, and email are required", variant: "destructive" });
      return;
    }
    if (!form.password || form.password.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    if (form.password !== form.confirm_password) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await supabase.functions.invoke("create-surgeon", {
        body: {
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          credentials: form.credentials.trim(),
          specialty: form.specialty,
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
          facility_id: facilityId || undefined,
        },
      });

      if (res.error || res.data?.error) {
        throw new Error(res.data?.error || res.error?.message || "Failed to create surgeon");
      }

      toast({
        title: "Surgeon account and profile created successfully",
        description: "Temporary password set — user should change password at first sign-in",
      });
      resetForm();
      setOpen(false);
      onCreated();
    } catch (err: any) {
      toast({ title: "Error creating surgeon", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = isIndividual ? handleIndividualSubmit : handleFacilitySubmit;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button className="w-full gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 py-3">
          <UserPlus size={18} /> Add Surgeon
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border text-foreground max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isIndividual ? "Add Doctor" : "Create Surgeon Profile"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-2">
          <div>
            <Label className="text-xs text-muted-foreground">First Name *</Label>
            <Input placeholder="First name" value={form.first_name} onChange={e => update("first_name", e.target.value)} className="bg-secondary border-border mt-1" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Last Name *</Label>
            <Input placeholder="Last name" value={form.last_name} onChange={e => update("last_name", e.target.value)} className="bg-secondary border-border mt-1" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Credentials</Label>
            <Input placeholder="e.g. MD, DO, FACS" value={form.credentials} onChange={e => update("credentials", e.target.value)} className="bg-secondary border-border mt-1" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Specialty</Label>
            <Select value={form.specialty} onValueChange={v => update("specialty", v)}>
              <SelectTrigger className="bg-secondary border-border mt-1"><SelectValue placeholder="Select specialty" /></SelectTrigger>
              <SelectContent className="bg-card border-border">
                {SPECIALTIES.map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">
              Email {isIndividual ? "(optional)" : "*"}
            </Label>
            <Input type="email" placeholder="surgeon@example.com" value={form.email} onChange={e => update("email", e.target.value)} className="bg-secondary border-border mt-1" />
            {isIndividual && (
              <div className="flex items-start gap-1.5 mt-1.5">
                <Mail size={12} className="text-primary mt-0.5 shrink-0" />
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Adding an email will send the doctor an invite to view preference cards or join the app.
                </p>
              </div>
            )}
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Phone Number</Label>
            <Input type="tel" placeholder="(555) 123-4567" value={form.phone} onChange={e => update("phone", e.target.value)} className="bg-secondary border-border mt-1" />
          </div>

          {isIndividual && (
            <div>
              <Label className="text-xs text-muted-foreground">Notes</Label>
              <Textarea
                placeholder="Optional notes about this doctor"
                value={form.notes}
                onChange={e => update("notes", e.target.value)}
                className="bg-secondary border-border mt-1 min-h-[60px] resize-none"
              />
            </div>
          )}

          {!isIndividual && (
            <div className="border-t border-border pt-3 mt-1">
              <p className="text-xs font-medium text-foreground mb-2">Account Credentials</p>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Password *</Label>
                  <div className="relative mt-1">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimum 8 characters"
                      value={form.password}
                      onChange={e => update("password", e.target.value)}
                      className="bg-secondary border-border pr-10"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Confirm Password *</Label>
                  <div className="relative mt-1">
                    <Input
                      type={showConfirm ? "text" : "password"}
                      placeholder="Re-enter password"
                      value={form.confirm_password}
                      onChange={e => update("confirm_password", e.target.value)}
                      className={`bg-secondary border-border pr-10 ${form.confirm_password && form.confirm_password !== form.password ? "border-destructive" : ""}`}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {form.confirm_password && form.confirm_password !== form.password && (
                    <p className="text-[10px] text-destructive mt-1">Passwords do not match</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {isIndividual && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
              <Info size={14} className="text-primary mt-0.5 shrink-0" />
              <p className="text-[10px] text-muted-foreground leading-tight">
                This doctor will be added to your personal workspace immediately. No approval required.
              </p>
            </div>
          )}
        </div>
        <DialogFooter className="mt-2">
          {isIndividual ? (
            <Button onClick={handleSubmit} disabled={loading || !form.first_name.trim() || !form.last_name.trim()} className="w-full gap-2">
              <UserPlus size={14} />
              {loading ? "Adding..." : "Add Doctor"}
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading || !form.password || form.password !== form.confirm_password} className="w-full gap-2">
              <UserPlus size={14} />
              {loading ? "Creating..." : "Create Surgeon"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSurgeonDialog;
