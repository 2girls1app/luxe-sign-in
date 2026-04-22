import { useState, useEffect, useRef } from "react";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UserCheck, Plus, Trash2, Upload, Image, Video, X, Pencil, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import SelectedItemCard, { SelectedCountHeader } from "@/components/SelectedItemCard";

interface SalesRepEntry {
  company: string;
  rep_name: string;
  phone: string;
  email: string;
  product: string;
  links: string[];
  notes: string;
}

const emptySalesRep = (): SalesRepEntry => ({
  company: "",
  rep_name: "",
  phone: "",
  email: "",
  product: "",
  links: [""],
  notes: "",
});

interface RepFile {
  id: string;
  file_name: string;
  file_path: string;
  mime_type: string | null;
  category: string;
}

interface SalesRepDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentValue: string;
  onSave: (category: string, value: string) => void;
  saving: boolean;
  procedureId: string;
}

const MAX_SIZE_MB = 50;

const SalesRepDrawer = ({ open, onOpenChange, currentValue, onSave, saving, procedureId }: SalesRepDrawerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reps, setReps] = useState<SalesRepEntry[]>([emptySalesRep()]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showEditor, setShowEditor] = useState(true);
  const [repImages, setRepImages] = useState<RepFile[]>([]);
  const [repVideos, setRepVideos] = useState<RepFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    try {
      const parsed = JSON.parse(currentValue);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setReps(parsed.map((r: any) => ({
          company: r.company || "",
          rep_name: r.rep_name || "",
          phone: r.phone || "",
          email: r.email || "",
          product: r.product || "",
          links: Array.isArray(r.links) && r.links.length > 0 ? r.links : [""],
          notes: r.notes || "",
        })));
        setActiveIndex(0);
        // Collapse editor by default when reps already exist
        setShowEditor(false);
      } else {
        setReps([emptySalesRep()]);
        setActiveIndex(0);
        setShowEditor(true);
      }
    } catch {
      setReps([emptySalesRep()]);
      setActiveIndex(0);
      setShowEditor(true);
    }
    fetchFiles();
  }, [currentValue, open]);

  const fetchFiles = async () => {
    if (!user || !procedureId) return;
    const { data } = await supabase
      .from("procedure_files")
      .select("id, file_name, file_path, mime_type, category")
      .eq("procedure_id", procedureId)
      .eq("user_id", user.id)
      .in("category", ["sales_rep_images", "sales_rep_videos"])
      .order("created_at", { ascending: false });
    if (data) {
      setRepImages(data.filter(f => f.category === "sales_rep_images"));
      setRepVideos(data.filter(f => f.category === "sales_rep_videos"));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, cat: "sales_rep_images" | "sales_rep_videos") => {
    if (!e.target.files || !user) return;
    setUploading(true);
    for (const file of Array.from(e.target.files)) {
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        toast({ title: "File too large", description: `Max ${MAX_SIZE_MB}MB`, variant: "destructive" });
        continue;
      }
      const ext = file.name.split(".").pop() || "bin";
      const path = `${user.id}/${procedureId}/${cat}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("procedure-files").upload(path, file);
      if (uploadError) {
        toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
        continue;
      }
      await supabase.from("procedure_files").insert({
        procedure_id: procedureId,
        user_id: user.id,
        category: cat,
        file_name: file.name,
        file_path: path,
        file_size: file.size,
        mime_type: file.type,
      });
    }
    e.target.value = "";
    await fetchFiles();
    setUploading(false);
  };

  const deleteFile = async (file: RepFile) => {
    await supabase.storage.from("procedure-files").remove([file.file_path]);
    await supabase.from("procedure_files").delete().eq("id", file.id);
    await fetchFiles();
  };

  const getPublicUrl = (path: string) =>
    supabase.storage.from("procedure-files").getPublicUrl(path).data.publicUrl;

  const updateField = (field: keyof SalesRepEntry, val: any) => {
    setReps(prev => prev.map((r, i) => i === activeIndex ? { ...r, [field]: val } : r));
  };

  const updateLink = (linkIdx: number, val: string) => {
    setReps(prev => prev.map((r, i) => {
      if (i !== activeIndex) return r;
      const newLinks = [...r.links];
      newLinks[linkIdx] = val;
      return { ...r, links: newLinks };
    }));
  };

  const addLink = () => updateField("links", [...reps[activeIndex].links, ""]);
  const removeLink = (linkIdx: number) => {
    const newLinks = reps[activeIndex].links.filter((_, i) => i !== linkIdx);
    updateField("links", newLinks.length > 0 ? newLinks : [""]);
  };

  const addRep = () => {
    setReps(prev => [...prev, emptySalesRep()]);
    setActiveIndex(reps.length);
    setShowEditor(true);
  };

  const removeRep = (idx: number) => {
    if (reps.length <= 1) {
      setReps([emptySalesRep()]);
      setActiveIndex(0);
      setShowEditor(true);
      return;
    }
    const updated = reps.filter((_, i) => i !== idx);
    setReps(updated);
    setActiveIndex(Math.min(activeIndex, updated.length - 1));
  };

  const handleSave = () => {
    const cleaned = reps
      .map(r => ({ ...r, links: r.links.filter(l => l.trim()) }))
      .filter(r => r.company.trim() || r.rep_name.trim() || r.phone.trim() || r.email.trim() || r.product.trim() || r.notes.trim());
    onSave("sales_rep", cleaned.length > 0 ? JSON.stringify(cleaned) : "");
  };

  const rep = reps[activeIndex] || emptySalesRep();

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-card border-border max-h-[92vh]">
        <DrawerHeader className="text-center pb-2">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <UserCheck size={28} className="text-primary" />
          </div>
          <DrawerTitle className="text-foreground">Sales Rep</DrawerTitle>
          <DrawerDescription className="text-muted-foreground">
            Vendor and representative details
          </DrawerDescription>
        </DrawerHeader>

        {/* ── Selected Sales Reps (unified card rows) ── */}
        {(reps.length > 1 || (reps.length === 1 && (reps[0].company.trim() || reps[0].rep_name.trim() || reps[0].email.trim()))) && (
          <div className="px-4 pb-2 space-y-2">
            <SelectedCountHeader
              count={reps.length}
              label="Sales Reps"
              icon={<Check size={12} />}
            />
            <div className="space-y-2">
              {reps.map((r, i) => {
                const displayName =
                  r.rep_name.trim() ||
                  r.company.trim() ||
                  r.email.trim() ||
                  `Rep ${i + 1}`;
                const subline = [r.company.trim(), r.product.trim(), r.email.trim()]
                  .filter(Boolean)
                  .join(" • ");
                const isActive = i === activeIndex;
                const hasEmail = !!r.email.trim();
                const hasContent =
                  r.company.trim() || r.rep_name.trim() || r.phone.trim() ||
                  r.email.trim() || r.product.trim();
                const badges = (
                  <>
                    {isActive && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-primary/15 border border-primary/40 text-[10px] font-semibold text-primary px-1.5 py-0.5 uppercase tracking-wider">
                        <Pencil size={9} />Editing
                      </span>
                    )}
                    {hasEmail && !isActive && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-[10px] font-semibold text-amber-400 px-1.5 py-0.5 uppercase tracking-wider">
                        Awaiting rep response
                      </span>
                    )}
                    {!hasContent && (
                      <span className="inline-flex items-center rounded-md bg-secondary border border-border/60 text-[10px] font-semibold text-muted-foreground px-1.5 py-0.5 uppercase tracking-wider">
                        Empty
                      </span>
                    )}
                  </>
                );

                return (
                  <SelectedItemCard
                    key={i}
                    name={displayName}
                    notes={subline || r.notes}
                    badges={badges}
                    onClick={() => { setActiveIndex(i); setShowEditor(true); }}
                    onRemove={reps.length > 1 ? () => removeRep(i) : undefined}
                    removeLabel={`Remove ${displayName}`}
                    highlighted={isActive && showEditor}
                  />
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground/70 italic px-1">
              Tap a rep to edit company, product, links, or notes
            </p>
          </div>
        )}

        {/* "+ Select more reps" button (collapsed state) */}
        {!showEditor && (
          <div className="px-4 pb-2">
            <button
              type="button"
              onClick={addRep}
              className="flex items-center justify-center gap-2 w-full rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-sm font-medium text-primary hover:bg-primary/10 hover:border-primary/60 transition-all active:scale-[0.98]"
            >
              <Plus size={16} />
              Select more reps
            </button>
          </div>
        )}

        {showEditor && (
        <div className="px-4 pb-2 overflow-y-auto max-h-[50vh] space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Company</Label>
            <Input value={rep.company} onChange={e => updateField("company", e.target.value)} placeholder="e.g. Medtronic" className="bg-secondary border-border mt-1" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Rep Name</Label>
            <Input value={rep.rep_name} onChange={e => updateField("rep_name", e.target.value)} placeholder="e.g. John Smith" className="bg-secondary border-border mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Phone</Label>
              <Input type="tel" value={rep.phone} onChange={e => updateField("phone", e.target.value)} placeholder="555-123-4567" className="bg-secondary border-border mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <Input type="email" value={rep.email} onChange={e => updateField("email", e.target.value)} placeholder="rep@company.com" className="bg-secondary border-border mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Product</Label>
            <Input value={rep.product} onChange={e => updateField("product", e.target.value)} placeholder="e.g. Spinal Implant System" className="bg-secondary border-border mt-1" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Links</Label>
            <div className="space-y-2 mt-1">
              {rep.links.map((link, li) => (
                <div key={li} className="flex gap-2">
                  <Input value={link} onChange={e => updateLink(li, e.target.value)} placeholder="https://..." className="bg-secondary border-border flex-1" />
                  {rep.links.length > 1 && (
                    <button onClick={() => removeLink(li)} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={addLink} className="text-xs text-primary hover:underline flex items-center gap-1">
                <Plus size={12} /> Add Link
              </button>
            </div>
          </div>

          {/* Images */}
          <div>
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Image size={12} /> Images
            </Label>
            <div className="mt-1.5 space-y-1.5">
              {repImages.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {repImages.map(f => (
                    <div key={f.id} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-border">
                      <img src={getPublicUrl(f.file_path)} alt={f.file_name} className="w-full h-full object-cover" />
                      <button
                        onClick={() => deleteFile(f)}
                        className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-destructive/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={10} className="text-destructive-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => imageInputRef.current?.click()}
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-border hover:border-primary/50 px-3 py-2.5 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <Upload size={14} />
                {uploading ? "Uploading..." : "Upload Photo"}
              </button>
            </div>
            <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="hidden" onChange={e => handleFileUpload(e, "sales_rep_images")} />
          </div>

          {/* Videos */}
          <div>
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Video size={12} /> Videos
            </Label>
            <div className="mt-1.5 space-y-1.5">
              {repVideos.map(f => (
                <div key={f.id} className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2">
                  <Video size={14} className="text-primary shrink-0" />
                  <span className="text-xs text-foreground truncate flex-1">{f.file_name}</span>
                  <button onClick={() => deleteFile(f)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => videoInputRef.current?.click()}
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-border hover:border-primary/50 px-3 py-2.5 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <Upload size={14} />
                {uploading ? "Uploading..." : "Upload Video"}
              </button>
            </div>
            <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/quicktime" multiple className="hidden" onChange={e => handleFileUpload(e, "sales_rep_videos")} />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Notes</Label>
            <Textarea value={rep.notes} onChange={e => updateField("notes", e.target.value)} placeholder="Additional notes..." className="bg-secondary border-border mt-1 min-h-[80px] resize-none" />
          </div>
        </div>
        )}

        <DrawerFooter className="pt-2">
          <div className="flex gap-2 w-full">
            <Button variant="outline" size="sm" onClick={addRep} className="border-primary/30 text-primary hover:bg-primary/10">
              <Plus size={14} className="mr-1" /> Add Rep
            </Button>
            {reps.length > 1 && (
              <Button variant="outline" size="sm" onClick={() => removeRep(activeIndex)} className="border-destructive/30 text-destructive hover:bg-destructive/10">
                <Trash2 size={14} className="mr-1" /> Remove
              </Button>
            )}
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Saving..." : "Save Preference"}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
            Cancel
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default SalesRepDrawer;
