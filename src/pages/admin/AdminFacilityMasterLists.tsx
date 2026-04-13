import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ClipboardList, Search, Plus, Trash2, Upload, FileSpreadsheet, Pill, Scissors, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminRole } from "@/hooks/useAdminRole";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import NavHeader from "@/components/NavHeader";

interface MedItem { id: string; name: string; category: string | null; notes: string | null; }
interface SutureItem { id: string; name: string; size: string | null; type: string | null; notes: string | null; }
interface SupplyItem { id: string; name: string; category: string | null; notes: string | null; }

const FACILITY_ID = "6e5219ec-9ab4-42d7-a98e-75181416f917";

const AdminFacilityMasterLists = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, loading } = useAdminRole();
  const { toast } = useToast();
  const [tab, setTab] = useState("medications");

  // Medications state
  const [meds, setMeds] = useState<MedItem[]>([]);
  const [medSearch, setMedSearch] = useState("");
  const [medDialog, setMedDialog] = useState(false);
  const [medForm, setMedForm] = useState({ name: "", category: "", notes: "" });

  // Sutures state
  const [sutures, setSutures] = useState<SutureItem[]>([]);
  const [sutureSearch, setSutureSearch] = useState("");
  const [sutureDialog, setSutureDialog] = useState(false);
  const [sutureForm, setSutureForm] = useState({ name: "", size: "", type: "", notes: "" });

  // Supplies state
  const [supplies, setSupplies] = useState<SupplyItem[]>([]);
  const [supplySearch, setSupplySearch] = useState("");
  const [supplyDialog, setSupplyDialog] = useState(false);
  const [supplyForm, setSupplyForm] = useState({ name: "", category: "", notes: "" });

  // Bulk upload
  const [uploadDialog, setUploadDialog] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<"medications" | "sutures" | "supplies">("medications");
  const [uploadResult, setUploadResult] = useState<{ added: number; skipped: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchMeds = useCallback(async () => {
    const { data } = await supabase.from("facility_medications" as any).select("id, name, category, notes").eq("facility_id", FACILITY_ID).order("name");
    if (data) setMeds(data as unknown as MedItem[]);
  }, []);

  const fetchSutures = useCallback(async () => {
    const { data } = await supabase.from("facility_sutures" as any).select("id, name, size, type, notes").eq("facility_id", FACILITY_ID).order("name");
    if (data) setSutures(data as unknown as SutureItem[]);
  }, []);

  const fetchSupplies = useCallback(async () => {
    const { data } = await supabase.from("facility_supplies" as any).select("id, name, category, notes").eq("facility_id", FACILITY_ID).order("name");
    if (data) setSupplies(data as unknown as SupplyItem[]);
  }, []);

  useEffect(() => {
    if (!loading && !isAdmin) { navigate("/profile"); return; }
    if (isAdmin) { fetchMeds(); fetchSutures(); fetchSupplies(); }
  }, [isAdmin, loading]);

  // Add individual items
  const addMed = async () => {
    if (!medForm.name.trim()) { toast({ title: "Name required", variant: "destructive" }); return; }
    await supabase.from("facility_medications" as any).insert({ facility_id: FACILITY_ID, name: medForm.name.trim(), category: medForm.category || null, notes: medForm.notes || null, created_by: user?.id } as any);
    toast({ title: "Medication added" });
    setMedDialog(false); setMedForm({ name: "", category: "", notes: "" }); fetchMeds();
  };

  const addSuture = async () => {
    if (!sutureForm.name.trim()) { toast({ title: "Name required", variant: "destructive" }); return; }
    await supabase.from("facility_sutures" as any).insert({ facility_id: FACILITY_ID, name: sutureForm.name.trim(), size: sutureForm.size || null, type: sutureForm.type || null, notes: sutureForm.notes || null, created_by: user?.id } as any);
    toast({ title: "Suture added" });
    setSutureDialog(false); setSutureForm({ name: "", size: "", type: "", notes: "" }); fetchSutures();
  };

  const addSupply = async () => {
    if (!supplyForm.name.trim()) { toast({ title: "Name required", variant: "destructive" }); return; }
    await supabase.from("facility_supplies" as any).insert({ facility_id: FACILITY_ID, name: supplyForm.name.trim(), category: supplyForm.category || null, notes: supplyForm.notes || null, created_by: user?.id } as any);
    toast({ title: "Supply added" });
    setSupplyDialog(false); setSupplyForm({ name: "", category: "", notes: "" }); fetchSupplies();
  };

  // Remove items
  const removeMed = async (id: string) => {
    await supabase.from("facility_medications" as any).delete().eq("id", id);
    toast({ title: "Medication removed" }); fetchMeds();
  };
  const removeSuture = async (id: string) => {
    await supabase.from("facility_sutures" as any).delete().eq("id", id);
    toast({ title: "Suture removed" }); fetchSutures();
  };
  const removeSupply = async (id: string) => {
    await supabase.from("facility_supplies" as any).delete().eq("id", id);
    toast({ title: "Supply removed" }); fetchSupplies();
  };

  // Bulk upload handler
  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    // Skip header if it looks like one
    const startIdx = lines[0]?.toLowerCase().includes("name") ? 1 : 0;
    let added = 0;
    let skipped = 0;

    const existingNames = new Set<string>();
    if (uploadCategory === "medications") {
      meds.forEach(m => existingNames.add(m.name.toLowerCase()));
    } else if (uploadCategory === "sutures") {
      sutures.forEach(s => existingNames.add(s.name.toLowerCase()));
    } else {
      supplies.forEach(s => existingNames.add(s.name.toLowerCase()));
    }

    const rows: any[] = [];
    for (let i = startIdx; i < lines.length; i++) {
      const parts = lines[i].split(/[,\t]/).map(p => p.trim().replace(/^"|"$/g, ""));
      const name = parts[0];
      if (!name || existingNames.has(name.toLowerCase())) { skipped++; continue; }
      existingNames.add(name.toLowerCase());

      if (uploadCategory === "medications") {
        rows.push({ facility_id: FACILITY_ID, name, category: parts[1] || null, notes: parts[2] || null, created_by: user?.id });
      } else if (uploadCategory === "sutures") {
        rows.push({ facility_id: FACILITY_ID, name, size: parts[1] || null, type: parts[2] || null, notes: parts[3] || null, created_by: user?.id });
      } else {
        rows.push({ facility_id: FACILITY_ID, name, category: parts[1] || null, notes: parts[2] || null, created_by: user?.id });
      }
      added++;
    }

    if (rows.length > 0) {
      const table = uploadCategory === "medications" ? "facility_medications" : uploadCategory === "sutures" ? "facility_sutures" : "facility_supplies";
      await supabase.from(table as any).insert(rows as any);
    }

    setUploadResult({ added, skipped });
    if (uploadCategory === "medications") fetchMeds();
    else if (uploadCategory === "sutures") fetchSutures();
    else fetchSupplies();
    if (fileRef.current) fileRef.current.value = "";
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;
  if (!isAdmin) return null;

  const filteredMeds = meds.filter(m => m.name.toLowerCase().includes(medSearch.toLowerCase()));
  const filteredSutures = sutures.filter(s => s.name.toLowerCase().includes(sutureSearch.toLowerCase()));
  const filteredSupplies = supplies.filter(s => s.name.toLowerCase().includes(supplySearch.toLowerCase()));

  const SearchBar = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) => (
    <div className="relative">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <input type="text" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-secondary pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
    </div>
  );

  const ItemRow = ({ name, subtitle, onRemove }: { name: string; subtitle?: string; onRemove: () => void }) => (
    <div className="rounded-xl bg-card border border-border p-3.5 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{name}</p>
        {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
      </div>
      <button onClick={onRemove} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-destructive transition-colors shrink-0">
        <Trash2 size={14} />
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 pt-16 pb-8">
      <NavHeader />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg mx-auto flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/profile")} className="text-muted-foreground hover:text-foreground transition-colors p-1"><ArrowLeft size={20} /></button>
          <ClipboardList size={20} className="text-primary" />
          <h1 className="text-lg font-semibold text-foreground">Facility Master Lists</h1>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 bg-secondary/50">
            <TabsTrigger value="medications" className="gap-1.5 text-xs"><Pill size={14} />Medications</TabsTrigger>
            <TabsTrigger value="sutures" className="gap-1.5 text-xs"><Scissors size={14} />Sutures</TabsTrigger>
            <TabsTrigger value="supplies" className="gap-1.5 text-xs"><Package size={14} />Supplies</TabsTrigger>
          </TabsList>

          {/* MEDICATIONS */}
          <TabsContent value="medications" className="flex flex-col gap-3 mt-4">
            <div className="flex gap-2">
              <Button size="sm" className="gap-1.5 text-xs" onClick={() => { setMedForm({ name: "", category: "", notes: "" }); setMedDialog(true); }}><Plus size={14} />Add</Button>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => { setUploadCategory("medications"); setUploadResult(null); setUploadDialog(true); }}><Upload size={14} />Upload List</Button>
              <Badge variant="secondary" className="ml-auto text-[10px] self-center">{meds.length} items</Badge>
            </div>
            <SearchBar value={medSearch} onChange={setMedSearch} placeholder="Search medications..." />
            <div className="space-y-2">
              {filteredMeds.map(m => (
                <ItemRow key={m.id} name={m.name} subtitle={[m.category, m.notes].filter(Boolean).join(" · ")} onRemove={() => removeMed(m.id)} />
              ))}
              {filteredMeds.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No medications found</p>}
            </div>
          </TabsContent>

          {/* SUTURES */}
          <TabsContent value="sutures" className="flex flex-col gap-3 mt-4">
            <div className="flex gap-2">
              <Button size="sm" className="gap-1.5 text-xs" onClick={() => { setSutureForm({ name: "", size: "", type: "", notes: "" }); setSutureDialog(true); }}><Plus size={14} />Add</Button>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => { setUploadCategory("sutures"); setUploadResult(null); setUploadDialog(true); }}><Upload size={14} />Upload List</Button>
              <Badge variant="secondary" className="ml-auto text-[10px] self-center">{sutures.length} items</Badge>
            </div>
            <SearchBar value={sutureSearch} onChange={setSutureSearch} placeholder="Search sutures..." />
            <div className="space-y-2">
              {filteredSutures.map(s => (
                <ItemRow key={s.id} name={s.name} subtitle={[s.size, s.type, s.notes].filter(Boolean).join(" · ")} onRemove={() => removeSuture(s.id)} />
              ))}
              {filteredSutures.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No sutures found</p>}
            </div>
          </TabsContent>

          {/* SUPPLIES */}
          <TabsContent value="supplies" className="flex flex-col gap-3 mt-4">
            <div className="flex gap-2">
              <Button size="sm" className="gap-1.5 text-xs" onClick={() => { setSupplyForm({ name: "", category: "", notes: "" }); setSupplyDialog(true); }}><Plus size={14} />Add</Button>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => { setUploadCategory("supplies"); setUploadResult(null); setUploadDialog(true); }}><Upload size={14} />Upload List</Button>
              <Badge variant="secondary" className="ml-auto text-[10px] self-center">{supplies.length} items</Badge>
            </div>
            <SearchBar value={supplySearch} onChange={setSupplySearch} placeholder="Search supplies..." />
            <div className="space-y-2">
              {filteredSupplies.map(s => (
                <ItemRow key={s.id} name={s.name} subtitle={[s.category, s.notes].filter(Boolean).join(" · ")} onRemove={() => removeSupply(s.id)} />
              ))}
              {filteredSupplies.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No supplies found</p>}
            </div>
          </TabsContent>
        </Tabs>

        {/* Add Medication Dialog */}
        <Dialog open={medDialog} onOpenChange={setMedDialog}>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>Add Medication</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Medication name" value={medForm.name} onChange={e => setMedForm(f => ({ ...f, name: e.target.value }))} className="bg-secondary border-border" />
              <Input placeholder="Category (optional)" value={medForm.category} onChange={e => setMedForm(f => ({ ...f, category: e.target.value }))} className="bg-secondary border-border" />
              <Textarea placeholder="Notes (optional)" value={medForm.notes} onChange={e => setMedForm(f => ({ ...f, notes: e.target.value }))} className="bg-secondary border-border" />
            </div>
            <DialogFooter><Button onClick={addMed}>Add</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Suture Dialog */}
        <Dialog open={sutureDialog} onOpenChange={setSutureDialog}>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>Add Suture</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Suture name" value={sutureForm.name} onChange={e => setSutureForm(f => ({ ...f, name: e.target.value }))} className="bg-secondary border-border" />
              <Input placeholder="Size (optional)" value={sutureForm.size} onChange={e => setSutureForm(f => ({ ...f, size: e.target.value }))} className="bg-secondary border-border" />
              <Input placeholder="Type (optional)" value={sutureForm.type} onChange={e => setSutureForm(f => ({ ...f, type: e.target.value }))} className="bg-secondary border-border" />
              <Textarea placeholder="Notes (optional)" value={sutureForm.notes} onChange={e => setSutureForm(f => ({ ...f, notes: e.target.value }))} className="bg-secondary border-border" />
            </div>
            <DialogFooter><Button onClick={addSuture}>Add</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Supply Dialog */}
        <Dialog open={supplyDialog} onOpenChange={setSupplyDialog}>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>Add Supply</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Supply name" value={supplyForm.name} onChange={e => setSupplyForm(f => ({ ...f, name: e.target.value }))} className="bg-secondary border-border" />
              <Input placeholder="Category (optional)" value={supplyForm.category} onChange={e => setSupplyForm(f => ({ ...f, category: e.target.value }))} className="bg-secondary border-border" />
              <Textarea placeholder="Notes (optional)" value={supplyForm.notes} onChange={e => setSupplyForm(f => ({ ...f, notes: e.target.value }))} className="bg-secondary border-border" />
            </div>
            <DialogFooter><Button onClick={addSupply}>Add</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Upload Dialog */}
        <Dialog open={uploadDialog} onOpenChange={(o) => { setUploadDialog(o); if (!o) setUploadResult(null); }}>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><FileSpreadsheet size={18} className="text-primary" />Upload {uploadCategory.charAt(0).toUpperCase() + uploadCategory.slice(1)} List</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">Upload a CSV or text file. Each line should contain an item name, with optional columns separated by commas or tabs.</p>
              <p className="text-[10px] text-muted-foreground font-mono bg-secondary/50 rounded-lg p-3">
                {uploadCategory === "medications" && "Name, Category, Notes"}
                {uploadCategory === "sutures" && "Name, Size, Type, Notes"}
                {uploadCategory === "supplies" && "Name, Category, Notes"}
              </p>
              <input ref={fileRef} type="file" accept=".csv,.txt,.tsv" onChange={handleBulkUpload}
                className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer" />
              {uploadResult && (
                <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 space-y-1">
                  <p className="text-sm font-medium text-primary">{uploadResult.added} items added</p>
                  {uploadResult.skipped > 0 && <p className="text-xs text-muted-foreground">{uploadResult.skipped} duplicates skipped</p>}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
};

export default AdminFacilityMasterLists;
