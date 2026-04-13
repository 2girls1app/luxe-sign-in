import { useState, useEffect } from "react";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UserCheck, Plus, Trash2 } from "lucide-react";

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

interface SalesRepDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentValue: string;
  onSave: (category: string, value: string) => void;
  saving: boolean;
}

const SalesRepDrawer = ({ open, onOpenChange, currentValue, onSave, saving }: SalesRepDrawerProps) => {
  const [reps, setReps] = useState<SalesRepEntry[]>([emptySalesRep()]);
  const [activeIndex, setActiveIndex] = useState(0);

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
        return;
      }
    } catch { /* empty */ }
    setReps([emptySalesRep()]);
    setActiveIndex(0);
  }, [currentValue, open]);

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
  };

  const removeRep = (idx: number) => {
    if (reps.length <= 1) {
      setReps([emptySalesRep()]);
      setActiveIndex(0);
      return;
    }
    const updated = reps.filter((_, i) => i !== idx);
    setReps(updated);
    setActiveIndex(Math.min(activeIndex, updated.length - 1));
  };

  const handleSave = () => {
    const cleaned = reps
      .map(r => ({
        ...r,
        links: r.links.filter(l => l.trim()),
      }))
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

        {/* Rep tabs */}
        {reps.length > 1 && (
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
            {reps.map((r, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  i === activeIndex
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "bg-secondary text-muted-foreground border border-border hover:border-primary/30"
                }`}
              >
                {r.company.trim() || r.rep_name.trim() || `Rep ${i + 1}`}
              </button>
            ))}
          </div>
        )}

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
          <div>
            <Label className="text-xs text-muted-foreground">Notes</Label>
            <Textarea value={rep.notes} onChange={e => updateField("notes", e.target.value)} placeholder="Additional notes..." className="bg-secondary border-border mt-1 min-h-[80px] resize-none" />
          </div>
        </div>

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
