import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ClipboardList, AlertTriangle, Check, X, ChevronUp, ChevronDown, Pause } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import NavHeader from "@/components/NavHeader";
import { PREFERENCE_CATEGORIES, type PreferenceCategory } from "@/components/PreferenceCategoryWidget";
import { MULTI_SELECT_CATEGORIES } from "@/data/preferenceOptions";

interface DoctorProfile {
  display_name: string | null; avatar_url: string | null; specialty: string | null;
}
interface PendingChange {
  id: string; category: string; old_value: string | null; new_value: string; status: string; created_at: string;
}

const AdminEditPrefCard = () => {
  const { userId, procedureId } = useParams<{ userId: string; procedureId: string }>();
  const navigate = useNavigate();
  const { isAdmin, loading } = useAdminRole();
  const { user } = useAuth();
  const { toast } = useToast();

  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [procedureName, setProcedureName] = useState("");
  const [preferences, setPreferences] = useState<Record<string, string>>({});
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editItems, setEditItems] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!procedureId || !userId || !isAdmin) return;
    const [docRes, procRes, prefsRes, pendingRes] = await Promise.all([
      supabase.from("profiles").select("display_name, avatar_url, specialty").eq("user_id", userId).single(),
      supabase.from("procedures").select("name").eq("id", procedureId).single(),
      supabase.from("procedure_preferences").select("category, value").eq("procedure_id", procedureId),
      supabase.from("pending_preference_changes").select("*").eq("procedure_id", procedureId).eq("status", "pending"),
    ]);
    if (docRes.data) setDoctor(docRes.data as DoctorProfile);
    if (procRes.data) setProcedureName(procRes.data.name);
    if (prefsRes.data) {
      const map: Record<string, string> = {};
      prefsRes.data.forEach((d: any) => { map[d.category] = d.value; });
      setPreferences(map);
    }
    if (pendingRes.data) setPendingChanges(pendingRes.data as PendingChange[]);
  }, [procedureId, userId, isAdmin]);

  useEffect(() => {
    if (!loading && !isAdmin) { navigate("/profile"); return; }
    if (isAdmin) fetchData();
  }, [isAdmin, loading, fetchData]);

  const parseItems = (value: string): any[] => {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  };

  const openEdit = (catKey: string) => {
    const current = preferences[catKey] || "[]";
    setEditItems(parseItems(current));
    setEditingCategory(catKey);
  };

  const updateQuantity = (idx: number, delta: number) => {
    setEditItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, quantity: Math.max(1, (item.quantity || 1) + delta) } : item
    ));
  };

  const updateHoldQuantity = (idx: number, delta: number) => {
    setEditItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, holdQuantity: Math.max(1, (item.holdQuantity || 1) + delta) } : item
    ));
  };

  const toggleHold = (idx: number) => {
    setEditItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, isHold: !item.isHold, holdQuantity: item.isHold ? undefined : 1 } : item
    ));
  };

  const removeItem = (idx: number) => {
    setEditItems(prev => prev.filter((_, i) => i !== idx));
  };

  const addItem = (name: string, desc: string) => {
    if (editItems.some(i => i.name === name)) return;
    setEditItems(prev => [...prev, { name, desc, quantity: 1, isHold: false }]);
  };

  const saveChanges = async () => {
    if (!procedureId || !user || !editingCategory) return;
    setSaving(true);
    const newValue = JSON.stringify(editItems);
    const oldValue = preferences[editingCategory] || "";

    if (newValue === oldValue) {
      toast({ title: "No changes detected" });
      setSaving(false);
      setEditingCategory(null);
      return;
    }

    const { error } = await supabase.from("pending_preference_changes").insert({
      procedure_id: procedureId,
      category: editingCategory,
      old_value: oldValue,
      new_value: newValue,
      submitted_by: user.id,
      status: "pending",
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Changes submitted", description: "Pending surgeon approval" });
      await fetchData();
      setEditingCategory(null);
    }
    setSaving(false);
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;
  if (!isAdmin) return null;

  const editableCats = PREFERENCE_CATEGORIES.filter(c => c.type !== "file" && MULTI_SELECT_CATEGORIES[c.key]);

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 pt-16 pb-8">
      <NavHeader />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg mx-auto flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/admin/doctors/${userId}`)} className="text-muted-foreground hover:text-foreground transition-colors p-1"><ArrowLeft size={20} /></button>
          {doctor && (
            <Avatar className="h-9 w-9 border border-border shrink-0">
              {doctor.avatar_url ? <AvatarImage src={doctor.avatar_url} /> : null}
              <AvatarFallback className="bg-secondary text-foreground text-sm">{(doctor.display_name || "D").charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-primary truncate">{doctor?.display_name}</p>
            <h1 className="text-base font-medium text-foreground truncate">{procedureName}</h1>
          </div>
        </div>

        {/* Pending changes banner */}
        {pendingChanges.length > 0 && (
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-400 shrink-0" />
            <p className="text-xs text-amber-300">{pendingChanges.length} change{pendingChanges.length !== 1 ? "s" : ""} pending surgeon approval</p>
          </div>
        )}

        {/* Category list or edit view */}
        {editingCategory ? (
          <EditCategoryView
            catKey={editingCategory}
            items={editItems}
            availableItems={MULTI_SELECT_CATEGORIES[editingCategory] || []}
            onUpdateQty={updateQuantity}
            onUpdateHoldQty={updateHoldQuantity}
            onToggleHold={toggleHold}
            onRemove={removeItem}
            onAdd={addItem}
            onSave={saveChanges}
            onCancel={() => setEditingCategory(null)}
            saving={saving}
            hasPending={pendingChanges.some(pc => pc.category === editingCategory)}
          />
        ) : (
          <div className="space-y-2">
            {editableCats.map(cat => {
              const items = parseItems(preferences[cat.key] || "");
              const pending = pendingChanges.filter(pc => pc.category === cat.key);
              const Icon = cat.icon;
              return (
                <button
                  key={cat.key}
                  onClick={() => openEdit(cat.key)}
                  className="w-full flex items-center gap-3 rounded-xl bg-card border border-border p-4 hover:border-primary/50 transition-all text-left"
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon size={16} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{cat.label}</p>
                    <p className="text-[10px] text-muted-foreground">{items.length} items selected</p>
                  </div>
                  {pending.length > 0 && (
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[9px] shrink-0">
                      Pending
                    </Badge>
                  )}
                  {items.length > 0 && pending.length === 0 && (
                    <Badge variant="secondary" className="text-[9px] shrink-0">
                      <Check size={10} className="mr-0.5" /> Set
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};

interface EditCategoryViewProps {
  catKey: string;
  items: any[];
  availableItems: { name: string; desc: string }[];
  onUpdateQty: (idx: number, delta: number) => void;
  onUpdateHoldQty: (idx: number, delta: number) => void;
  onToggleHold: (idx: number) => void;
  onRemove: (idx: number) => void;
  onAdd: (name: string, desc: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  hasPending: boolean;
}

const EditCategoryView = ({ catKey, items, availableItems, onUpdateQty, onUpdateHoldQty, onToggleHold, onRemove, onAdd, onSave, onCancel, saving, hasPending }: EditCategoryViewProps) => {
  const [search, setSearch] = useState("");
  const catLabel = PREFERENCE_CATEGORIES.find(c => c.key === catKey)?.label || catKey;

  const selectedNames = new Set(items.map(i => i.name));
  const unselected = availableItems.filter(a => !selectedNames.has(a.name) && (
    a.name.toLowerCase().includes(search.toLowerCase()) || a.desc.toLowerCase().includes(search.toLowerCase())
  ));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Edit {catLabel}</h2>
        {hasPending && (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[9px]">
            <AlertTriangle size={10} className="mr-0.5" /> Has pending changes
          </Badge>
        )}
      </div>

      {/* Selected items */}
      {items.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] text-muted-foreground font-medium">Selected Items</p>
          {items.map((item, idx) => (
            <div key={idx} className="rounded-lg bg-card border border-border p-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">{item.name}</p>
                  {item.desc && <p className="text-[10px] text-muted-foreground">{item.desc}</p>}
                </div>
                {item.isHold && (
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[9px]">
                    <Pause size={8} className="mr-0.5" /> HOLD
                  </Badge>
                )}
                <button onClick={() => onRemove(idx)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                  <X size={14} />
                </button>
              </div>
              <div className="flex items-center gap-3 mt-2">
                {/* Quantity */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground">Qty:</span>
                  <button onClick={() => onUpdateQty(idx, -1)} className="w-5 h-5 rounded bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"><ChevronDown size={12} /></button>
                  <span className="text-xs font-medium text-foreground w-5 text-center">{item.quantity || 1}</span>
                  <button onClick={() => onUpdateQty(idx, 1)} className="w-5 h-5 rounded bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"><ChevronUp size={12} /></button>
                </div>
                {/* Hold toggle */}
                <button onClick={() => onToggleHold(idx)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${item.isHold ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : "text-muted-foreground border-border hover:border-amber-500/30"}`}>
                  {item.isHold ? "On Hold" : "Hold"}
                </button>
                {/* Hold quantity */}
                {item.isHold && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-amber-400">Hold:</span>
                    <button onClick={() => onUpdateHoldQty(idx, -1)} className="w-5 h-5 rounded bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"><ChevronDown size={12} /></button>
                    <span className="text-xs font-medium text-amber-400 w-5 text-center">{item.holdQuantity || 1}</span>
                    <button onClick={() => onUpdateHoldQty(idx, 1)} className="w-5 h-5 rounded bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"><ChevronUp size={12} /></button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add items */}
      <div className="space-y-1.5">
        <p className="text-[11px] text-muted-foreground font-medium">Available Items</p>
        <div className="relative mb-2">
          <input type="text" placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-secondary pl-3 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="max-h-48 overflow-y-auto space-y-1">
          {unselected.map(item => (
            <button key={item.name} onClick={() => onAdd(item.name, item.desc)}
              className="w-full flex items-center gap-2 rounded-lg bg-secondary/50 border border-border p-2.5 hover:border-primary/50 transition-colors text-left">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground">{item.name}</p>
                <p className="text-[10px] text-muted-foreground">{item.desc}</p>
              </div>
              <span className="text-primary text-lg leading-none">+</span>
            </button>
          ))}
          {unselected.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-3">No more items</p>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 rounded-xl border border-border bg-card py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
          Cancel
        </button>
        <button onClick={onSave} disabled={saving}
          className="flex-1 rounded-xl bg-primary py-2.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
          {saving ? "Submitting..." : "Submit for Approval"}
        </button>
      </div>
    </div>
  );
};

export default AdminEditPrefCard;
