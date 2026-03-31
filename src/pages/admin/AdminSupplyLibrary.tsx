import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Package, Search, Plus, Edit, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminRole } from "@/hooks/useAdminRole";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import NavHeader from "@/components/NavHeader";

interface SupplyItem { id: string; name: string; category: string; description: string | null; sku: string | null; is_active: boolean; created_at: string; }
const SUPPLY_CATEGORIES = ["Suture", "Instruments", "Equipment", "Supplies", "Trays", "Robotic", "Skin Prep", "Other"];

const AdminSupplyLibrary = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, loading } = useAdminRole();
  const { toast } = useToast();
  const [supplies, setSupplies] = useState<SupplyItem[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SupplyItem | null>(null);
  const [form, setForm] = useState({ name: "", category: "", description: "", sku: "" });

  const fetchSupplies = async () => {
    const { data } = await supabase.from("supply_library" as any).select("*").order("created_at", { ascending: false });
    if (data) setSupplies(data as unknown as SupplyItem[]);
  };

  useEffect(() => {
    if (!loading && !isAdmin) { navigate("/profile"); return; }
    if (isAdmin) fetchSupplies();
  }, [isAdmin, loading]);

  const save = async () => {
    if (!form.name || !form.category) { toast({ title: "Name and category required", variant: "destructive" }); return; }
    if (editing) {
      await supabase.from("supply_library" as any).update({ name: form.name, category: form.category, description: form.description || null, sku: form.sku || null, updated_at: new Date().toISOString() } as any).eq("id", editing.id);
      toast({ title: "Supply updated" });
    } else {
      await supabase.from("supply_library" as any).insert({ name: form.name, category: form.category, description: form.description || null, sku: form.sku || null, created_by: user?.id } as any);
      toast({ title: "Supply added" });
    }
    setDialogOpen(false); setEditing(null); setForm({ name: "", category: "", description: "", sku: "" }); fetchSupplies();
  };

  const toggle = async (item: SupplyItem) => {
    await supabase.from("supply_library" as any).update({ is_active: !item.is_active } as any).eq("id", item.id);
    toast({ title: item.is_active ? "Deactivated" : "Activated" }); fetchSupplies();
  };

  const remove = async (id: string) => {
    await supabase.from("supply_library" as any).delete().eq("id", id);
    toast({ title: "Supply removed" }); fetchSupplies();
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;
  if (!isAdmin) return null;

  const filtered = supplies.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.category.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 pt-16 pb-8">
      <NavHeader />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg mx-auto flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/profile")} className="text-muted-foreground hover:text-foreground transition-colors p-1"><ArrowLeft size={20} /></button>
          <Package size={20} className="text-primary" />
          <h1 className="text-lg font-semibold text-foreground">Supply Library</h1>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditing(null); setForm({ name: "", category: "", description: "", sku: "" }); } }}>
            <DialogTrigger asChild>
              <Button size="sm" className="ml-auto gap-1.5 text-xs" onClick={() => { setEditing(null); setForm({ name: "", category: "", description: "", sku: "" }); }}>
                <Plus size={14} /> Add
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader><DialogTitle>{editing ? "Edit Supply" : "Add Supply"}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Item name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="bg-secondary border-border" />
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>{SUPPLY_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
                <Input placeholder="SKU (optional)" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} className="bg-secondary border-border" />
                <Textarea placeholder="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="bg-secondary border-border" />
              </div>
              <DialogFooter><Button onClick={save}>{editing ? "Update" : "Add"}</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Search supplies..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-secondary pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-2">
          {filtered.map(s => (
            <div key={s.id} className={`rounded-xl bg-card border border-border p-4 flex items-center gap-3 ${!s.is_active ? 'opacity-50' : ''}`}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{s.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-[10px]">{s.category}</Badge>
                  {s.sku && <span className="text-[10px] text-muted-foreground">SKU: {s.sku}</span>}
                </div>
                {s.description && <p className="text-[10px] text-muted-foreground mt-1 truncate">{s.description}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => toggle(s)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground transition-colors" title={s.is_active ? "Deactivate" : "Activate"}>
                  {s.is_active ? <ToggleRight size={16} className="text-primary" /> : <ToggleLeft size={16} />}
                </button>
                <button onClick={() => { setEditing(s); setForm({ name: s.name, category: s.category, description: s.description || "", sku: s.sku || "" }); setDialogOpen(true); }} className="p-1.5 rounded hover:bg-secondary text-muted-foreground transition-colors">
                  <Edit size={14} />
                </button>
                <button onClick={() => remove(s.id)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No supplies found</p>}
        </div>
      </motion.div>
    </div>
  );
};

export default AdminSupplyLibrary;
