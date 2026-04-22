import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UserCheck, Plus, Trash2, Upload, Image as ImageIcon, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface PrefillData {
  company?: string;
  rep_name?: string;
  phone?: string;
  product?: string;
  links?: string[];
  notes?: string;
  images?: { url: string; name: string }[];
}

interface InviteRow {
  id: string;
  procedure_id: string;
  rep_email: string;
  prefill_data: PrefillData;
  status: string;
  expires_at: string;
  submitted_at: string | null;
}

const MAX_IMAGE_MB = 10;

const SalesRepInvite = () => {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<InviteRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [company, setCompany] = useState("");
  const [repName, setRepName] = useState("");
  const [phone, setPhone] = useState("");
  const [product, setProduct] = useState("");
  const [links, setLinks] = useState<string[]>([""]);
  const [notes, setNotes] = useState("");
  const [images, setImages] = useState<{ url: string; name: string }[]>([]);

  useEffect(() => {
    document.title = "Sales Rep Onboarding";
    if (!token) {
      setError("Invalid invite link.");
      setLoading(false);
      return;
    }
    (async () => {
      const { data, error: rpcError } = await supabase.rpc("get_sales_rep_invite_by_token", {
        _token: token,
      });
      if (rpcError) {
        setError("Unable to load invite. Please try again later.");
        setLoading(false);
        return;
      }
      const row = (data as InviteRow[] | null)?.[0];
      if (!row) {
        setError("This invite link is invalid or has been removed.");
        setLoading(false);
        return;
      }
      if (row.status === "submitted") {
        setInvite(row);
        setSubmitted(true);
        setLoading(false);
        return;
      }
      if (new Date(row.expires_at).getTime() < Date.now()) {
        setError("This invite link has expired. Please request a new one.");
        setInvite(row);
        setLoading(false);
        return;
      }
      setInvite(row);
      const p = row.prefill_data || {};
      setCompany(p.company || "");
      setRepName(p.rep_name || "");
      setPhone(p.phone || "");
      setProduct(p.product || "");
      setLinks(Array.isArray(p.links) && p.links.length > 0 ? p.links : [""]);
      setNotes(p.notes || "");
      setImages(Array.isArray(p.images) ? p.images : []);
      setLoading(false);
    })();
  }, [token]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !invite) return;
    setUploading(true);
    const newImages: { url: string; name: string }[] = [];
    for (const file of Array.from(e.target.files)) {
      if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
        toast({ title: "File too large", description: `Max ${MAX_IMAGE_MB}MB`, variant: "destructive" });
        continue;
      }
      const ext = file.name.split(".").pop() || "bin";
      const path = `sales-rep-invites/${invite.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("procedure-files")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) {
        toast({ title: "Upload failed", description: upErr.message, variant: "destructive" });
        continue;
      }
      const { data: urlData } = supabase.storage.from("procedure-files").getPublicUrl(path);
      newImages.push({ url: urlData.publicUrl, name: file.name });
    }
    setImages(prev => [...prev, ...newImages]);
    e.target.value = "";
    setUploading(false);
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const updateLink = (idx: number, val: string) => {
    setLinks(prev => prev.map((l, i) => (i === idx ? val : l)));
  };
  const addLink = () => setLinks(prev => [...prev, ""]);
  const removeLink = (idx: number) => {
    setLinks(prev => {
      const next = prev.filter((_, i) => i !== idx);
      return next.length > 0 ? next : [""];
    });
  };

  const handleSubmit = async () => {
    if (!token || !invite) return;
    if (!company.trim() || !repName.trim()) {
      toast({ title: "Missing info", description: "Company and Rep Name are required.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const payload = {
      company: company.trim(),
      rep_name: repName.trim(),
      phone: phone.trim(),
      email: invite.rep_email,
      product: product.trim(),
      links: links.map(l => l.trim()).filter(Boolean),
      notes: notes.trim(),
      images,
    };
    const { data, error: rpcError } = await supabase.rpc("submit_sales_rep_invite", {
      _token: token,
      _data: payload,
    });
    setSubmitting(false);
    if (rpcError) {
      toast({ title: "Submission failed", description: rpcError.message, variant: "destructive" });
      return;
    }
    const result = data as { success: boolean; error?: string };
    if (!result?.success) {
      toast({ title: "Submission failed", description: result?.error || "Unknown error", variant: "destructive" });
      return;
    }
    setSubmitted(true);
    toast({ title: "Submitted!", description: "Your details have been sent." });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="text-primary animate-spin" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} className="text-destructive" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">Invite Unavailable</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={28} className="text-primary" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">Thank you!</h1>
          <p className="text-sm text-muted-foreground">
            Your details have been sent to the surgical team. You can close this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-xl mx-auto">
        <header className="text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <UserCheck size={28} className="text-primary" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Sales Rep Onboarding</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Confirm your details below. Your email is locked since the team already has it.
          </p>
        </header>

        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Company *</Label>
            <Input
              value={company}
              onChange={e => setCompany(e.target.value)}
              placeholder="e.g. Medtronic"
              className="bg-secondary border-border mt-1"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Rep Name *</Label>
            <Input
              value={repName}
              onChange={e => setRepName(e.target.value)}
              placeholder="e.g. John Smith"
              className="bg-secondary border-border mt-1"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Phone</Label>
              <Input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="555-123-4567"
                className="bg-secondary border-border mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Email (locked)</Label>
              <Input
                value={invite?.rep_email || ""}
                readOnly
                disabled
                className="bg-secondary/50 border-border mt-1 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Product</Label>
            <Input
              value={product}
              onChange={e => setProduct(e.target.value)}
              placeholder="e.g. Spinal Implant System"
              className="bg-secondary border-border mt-1"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Links</Label>
            <div className="space-y-2 mt-1">
              {links.map((link, li) => (
                <div key={li} className="flex gap-2">
                  <Input
                    value={link}
                    onChange={e => updateLink(li, e.target.value)}
                    placeholder="https://..."
                    className="bg-secondary border-border flex-1"
                  />
                  {links.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLink(li)}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addLink}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Plus size={12} /> Add Link
              </button>
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <ImageIcon size={12} /> Images
            </Label>
            <div className="mt-1.5 space-y-1.5">
              {images.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {images.map((img, i) => (
                    <div key={i} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-border">
                      <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-destructive/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={10} className="text-destructive-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-border hover:border-primary/50 px-3 py-2.5 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <Upload size={14} />
                {uploading ? "Uploading..." : "Upload Photo"}
              </button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Notes</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Anything the team should know..."
              className="bg-secondary border-border mt-1 min-h-[80px] resize-none"
            />
          </div>

          <Button onClick={handleSubmit} disabled={submitting} className="w-full">
            {submitting ? "Submitting..." : "Submit Details"}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            This link expires in 72 hours and can be submitted once.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SalesRepInvite;
