import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users, Stethoscope, ClipboardList, Bell, Package, History,
  Shield, Search, Plus, Send, Trash2, Edit, ToggleLeft,
  ToggleRight, ChevronDown, ChevronUp
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string | null;
  specialty: string | null;
  onboarding_completed: boolean;
  created_at: string;
}
interface Procedure {
  id: string; name: string; category: string | null; user_id: string; created_at: string; facility_id: string | null;
}
interface AuditLog {
  id: string; user_email: string; user_name: string; action: string; entity_type: string; entity_id: string | null; details: any; created_at: string;
}
interface SupplyItem {
  id: string; name: string; category: string; description: string | null; sku: string | null; is_active: boolean; created_at: string;
}
interface AdminNotification {
  id: string; title: string; message: string; priority: string; created_at: string;
}
interface PrefCard {
  id: string; procedure_id: string; category: string; value: string; user_id: string; updated_at: string;
}

const SUPPLY_CATEGORIES = ["Suture", "Instruments", "Equipment", "Supplies", "Trays", "Robotic", "Skin Prep", "Other"];

type WidgetId = "users" | "doctors" | "prefcards" | "notifications" | "supplies" | "audit" | null;

const WIDGETS = [
  { id: "users" as const, icon: Users, label: "Users", desc: "Manage all users & access" },
  { id: "doctors" as const, icon: Stethoscope, label: "Doctors", desc: "Doctor profiles & procedures" },
  { id: "prefcards" as const, icon: ClipboardList, label: "Preference Cards", desc: "View & manage pref cards" },
  { id: "notifications" as const, icon: Bell, label: "Notifications", desc: "Send team announcements" },
  { id: "supplies" as const, icon: Package, label: "Supply Library", desc: "Manage supply items" },
  { id: "audit" as const, icon: History, label: "Activity Logs", desc: "Login & edit history" },
];

const AdminDashboardSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [prefCards, setPrefCards] = useState<PrefCard[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [supplies, setSupplies] = useState<SupplyItem[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [expandedWidget, setExpandedWidget] = useState<WidgetId>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loaded, setLoaded] = useState(false);

  // Supply form
  const [supplyDialogOpen, setSupplyDialogOpen] = useState(false);
  const [editingSupply, setEditingSupply] = useState<SupplyItem | null>(null);
  const [supplyForm, setSupplyForm] = useState({ name: "", category: "", description: "", sku: "" });

  // Notification form
  const [notifDialogOpen, setNotifDialogOpen] = useState(false);
  const [notifForm, setNotifForm] = useState({ title: "", message: "", priority: "normal" });

  const fetchAll = useCallback(async () => {
    const [usersRes, procsRes, prefsRes, logsRes, suppliesRes, notifsRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("procedures").select("*").order("created_at", { ascending: false }),
      supabase.from("procedure_preferences").select("*").order("updated_at", { ascending: false }),
      supabase.from("audit_logs" as any).select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("supply_library" as any).select("*").order("created_at", { ascending: false }),
      supabase.from("admin_notifications" as any).select("*").order("created_at", { ascending: false }),
    ]);
    if (usersRes.data) setUsers(usersRes.data as UserProfile[]);
    if (procsRes.data) setProcedures(procsRes.data as Procedure[]);
    if (prefsRes.data) setPrefCards(prefsRes.data as PrefCard[]);
    if (logsRes.data) setAuditLogs(logsRes.data as unknown as AuditLog[]);
    if (suppliesRes.data) setSupplies(suppliesRes.data as unknown as SupplyItem[]);
    if (notifsRes.data) setNotifications(notifsRes.data as unknown as AdminNotification[]);
    setLoaded(true);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const getUserName = (userId: string) => users.find(u => u.user_id === userId)?.display_name || "Unknown";
  const formatDate = (d: string) => new Date(d).toLocaleString();

  const toggleWidget = (id: WidgetId) => {
    setExpandedWidget(expandedWidget === id ? null : id);
    setSearchTerm("");
  };

  // Supply CRUD
  const handleSaveSupply = async () => {
    if (!supplyForm.name || !supplyForm.category) { toast({ title: "Name and category required", variant: "destructive" }); return; }
    if (editingSupply) {
      await supabase.from("supply_library" as any).update({ name: supplyForm.name, category: supplyForm.category, description: supplyForm.description || null, sku: supplyForm.sku || null, updated_at: new Date().toISOString() } as any).eq("id", editingSupply.id);
      toast({ title: "Supply updated" });
    } else {
      await supabase.from("supply_library" as any).insert({ name: supplyForm.name, category: supplyForm.category, description: supplyForm.description || null, sku: supplyForm.sku || null, created_by: user?.id } as any);
      toast({ title: "Supply added" });
    }
    setSupplyDialogOpen(false); setEditingSupply(null); setSupplyForm({ name: "", category: "", description: "", sku: "" }); fetchAll();
  };

  const toggleSupplyActive = async (item: SupplyItem) => {
    await supabase.from("supply_library" as any).update({ is_active: !item.is_active } as any).eq("id", item.id);
    toast({ title: item.is_active ? "Supply deactivated" : "Supply activated" }); fetchAll();
  };

  const deleteSupply = async (id: string) => {
    await supabase.from("supply_library" as any).delete().eq("id", id);
    toast({ title: "Supply removed" }); fetchAll();
  };

  const handleSendNotification = async () => {
    if (!notifForm.title || !notifForm.message) { toast({ title: "Title and message required", variant: "destructive" }); return; }
    await supabase.from("admin_notifications" as any).insert({ title: notifForm.title, message: notifForm.message, priority: notifForm.priority, sent_by: user?.id } as any);
    toast({ title: "Notification sent" }); setNotifDialogOpen(false); setNotifForm({ title: "", message: "", priority: "normal" }); fetchAll();
  };

  const getWidgetCount = (id: string) => {
    switch (id) {
      case "users": return users.length;
      case "doctors": return users.filter(u => (u.role || "").toLowerCase().includes("doctor") || (u.role || "").toLowerCase().includes("surgeon") || (u.role || "").toLowerCase().includes("physician") || u.specialty).length;
      case "prefcards": return procedures.length;
      case "notifications": return notifications.length;
      case "supplies": return supplies.length;
      case "audit": return auditLogs.length;
      default: return 0;
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <Shield size={16} className="text-primary" />
        <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
          Admin Dashboard
        </h2>
      </div>

      {/* Widget grid */}
      <div className="grid grid-cols-2 gap-3">
        {WIDGETS.map((w) => {
          const Icon = w.icon;
          const isExpanded = expandedWidget === w.id;
          const count = loaded ? getWidgetCount(w.id) : null;
          return (
            <motion.button
              key={w.id}
              onClick={() => toggleWidget(w.id)}
              className={`relative flex flex-col items-center gap-1.5 rounded-xl border p-4 transition-all text-center ${
                isExpanded
                  ? "border-primary/50 bg-primary/5 col-span-2"
                  : "border-border bg-card hover:border-primary/30 hover:bg-card/80"
              }`}
              layout
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isExpanded ? "bg-primary/20" : "bg-primary/10"}`}>
                <Icon size={18} className="text-primary" />
              </div>
              <p className="text-xs font-medium text-foreground">{w.label}</p>
              {count !== null && count > 0 && (
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 absolute top-2 right-2">
                  {count}
                </Badge>
              )}
              <p className="text-[10px] text-muted-foreground leading-tight">{w.desc}</p>
            </motion.button>
          );
        })}
      </div>

      {/* Expanded content */}
      {expandedWidget && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3"
        >
          {/* Search within expanded section */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-border bg-secondary pl-8 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* USERS */}
          {expandedWidget === "users" && (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {users
                .filter(u => (u.display_name || "").toLowerCase().includes(searchTerm.toLowerCase()) || (u.role || "").toLowerCase().includes(searchTerm.toLowerCase()))
                .map(u => (
                <div key={u.id} className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
                  <Avatar className="h-8 w-8 border border-border">
                    {u.avatar_url ? <AvatarImage src={u.avatar_url} /> : null}
                    <AvatarFallback className="bg-secondary text-foreground text-xs">
                      {(u.display_name || "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">{u.display_name || "Unnamed"}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge variant="outline" className="text-[9px] px-1 py-0">{u.role || "No role"}</Badge>
                      {u.specialty && <span className="text-[9px] text-primary">{u.specialty}</span>}
                    </div>
                  </div>
                  <Badge variant={u.onboarding_completed ? "default" : "secondary"} className="text-[9px] px-1.5 py-0">
                    {u.onboarding_completed ? "Active" : "Pending"}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {/* DOCTORS */}
          {expandedWidget === "doctors" && (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {users
                .filter(u => (u.role || "").toLowerCase().includes("doctor") || (u.role || "").toLowerCase().includes("surgeon") || (u.role || "").toLowerCase().includes("physician") || u.specialty)
                .filter(d => (d.display_name || "").toLowerCase().includes(searchTerm.toLowerCase()))
                .map(d => (
                <div key={d.id} className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
                  <Avatar className="h-8 w-8 border border-border">
                    {d.avatar_url ? <AvatarImage src={d.avatar_url} /> : null}
                    <AvatarFallback className="bg-secondary text-foreground text-xs">
                      {(d.display_name || "D").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">{d.display_name}</p>
                    <p className="text-[10px] text-primary">{d.specialty || "No specialty"}</p>
                  </div>
                  <Badge variant="secondary" className="text-[9px]">
                    {procedures.filter(p => p.user_id === d.user_id).length} procedures
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {/* PREFERENCE CARDS */}
          {expandedWidget === "prefcards" && (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {procedures
                .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(proc => {
                  const cards = prefCards.filter(pc => pc.procedure_id === proc.id);
                  return (
                    <div key={proc.id} className="rounded-lg bg-secondary/50 p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-foreground">{proc.name}</p>
                          <p className="text-[10px] text-muted-foreground">By: {getUserName(proc.user_id)}</p>
                        </div>
                        <Badge variant={cards.length > 0 ? "default" : "secondary"} className="text-[9px]">
                          {cards.length > 0 ? `${cards.length} prefs` : "No prefs"}
                        </Badge>
                      </div>
                      {cards.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {cards.map(c => <Badge key={c.id} variant="secondary" className="text-[8px]">{c.category}</Badge>)}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}

          {/* NOTIFICATIONS */}
          {expandedWidget === "notifications" && (
            <div className="space-y-2">
              <Dialog open={notifDialogOpen} onOpenChange={setNotifDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="w-full gap-1.5 text-xs">
                    <Send size={14} /> Send Team Notification
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader><DialogTitle>Send Team Notification</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <Input placeholder="Title" value={notifForm.title} onChange={e => setNotifForm(f => ({ ...f, title: e.target.value }))} className="bg-secondary border-border" />
                    <Textarea placeholder="Message..." value={notifForm.message} onChange={e => setNotifForm(f => ({ ...f, message: e.target.value }))} className="bg-secondary border-border min-h-[100px]" />
                    <Select value={notifForm.priority} onValueChange={v => setNotifForm(f => ({ ...f, priority: v }))}>
                      <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low Priority</SelectItem>
                        <SelectItem value="normal">Normal Priority</SelectItem>
                        <SelectItem value="high">High Priority</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter><Button onClick={handleSendNotification} className="gap-1.5"><Send size={14} /> Send</Button></DialogFooter>
                </DialogContent>
              </Dialog>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {notifications.map(n => (
                  <div key={n.id} className="rounded-lg bg-secondary/50 p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium text-foreground">{n.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{n.message}</p>
                      </div>
                      <Badge variant={n.priority === "urgent" ? "destructive" : n.priority === "high" ? "default" : "secondary"} className="text-[9px] shrink-0">{n.priority}</Badge>
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-1">{formatDate(n.created_at)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUPPLY LIBRARY */}
          {expandedWidget === "supplies" && (
            <div className="space-y-2">
              <Dialog open={supplyDialogOpen} onOpenChange={(open) => {
                setSupplyDialogOpen(open);
                if (!open) { setEditingSupply(null); setSupplyForm({ name: "", category: "", description: "", sku: "" }); }
              }}>
                <DialogTrigger asChild>
                  <Button size="sm" className="w-full gap-1.5 text-xs" onClick={() => { setEditingSupply(null); setSupplyForm({ name: "", category: "", description: "", sku: "" }); }}>
                    <Plus size={14} /> Add Supply Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader><DialogTitle>{editingSupply ? "Edit Supply" : "Add Supply"}</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <Input placeholder="Item name" value={supplyForm.name} onChange={e => setSupplyForm(f => ({ ...f, name: e.target.value }))} className="bg-secondary border-border" />
                    <Select value={supplyForm.category} onValueChange={v => setSupplyForm(f => ({ ...f, category: v }))}>
                      <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Category" /></SelectTrigger>
                      <SelectContent>{SUPPLY_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input placeholder="SKU (optional)" value={supplyForm.sku} onChange={e => setSupplyForm(f => ({ ...f, sku: e.target.value }))} className="bg-secondary border-border" />
                    <Textarea placeholder="Description (optional)" value={supplyForm.description} onChange={e => setSupplyForm(f => ({ ...f, description: e.target.value }))} className="bg-secondary border-border" />
                  </div>
                  <DialogFooter><Button onClick={handleSaveSupply}>{editingSupply ? "Update" : "Add"}</Button></DialogFooter>
                </DialogContent>
              </Dialog>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {supplies
                  .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.category.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(s => (
                  <div key={s.id} className={`rounded-lg bg-secondary/50 p-3 flex items-center gap-2 ${!s.is_active ? 'opacity-50' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">{s.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge variant="outline" className="text-[9px] px-1 py-0">{s.category}</Badge>
                        {s.sku && <span className="text-[9px] text-muted-foreground">SKU: {s.sku}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button onClick={() => toggleSupplyActive(s)} className="p-1 rounded hover:bg-card text-muted-foreground transition-colors">
                        {s.is_active ? <ToggleRight size={14} className="text-primary" /> : <ToggleLeft size={14} />}
                      </button>
                      <button onClick={() => { setEditingSupply(s); setSupplyForm({ name: s.name, category: s.category, description: s.description || "", sku: s.sku || "" }); setSupplyDialogOpen(true); }} className="p-1 rounded hover:bg-card text-muted-foreground transition-colors">
                        <Edit size={12} />
                      </button>
                      <button onClick={() => deleteSupply(s.id)} className="p-1 rounded hover:bg-card text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AUDIT LOGS */}
          {expandedWidget === "audit" && (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {auditLogs
                .filter(l => l.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) || l.action?.toLowerCase().includes(searchTerm.toLowerCase()) || l.entity_type?.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(l => (
                <div key={l.id} className="rounded-lg bg-secondary/50 p-3 flex items-start gap-2">
                  <div className="p-1 rounded-full bg-card shrink-0 mt-0.5">
                    <History size={10} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-foreground">
                      <span className="font-medium">{l.user_name || l.user_email}</span>{" "}
                      <span className="text-muted-foreground">{l.action}</span>{" "}
                      <span className="text-primary">{l.entity_type}</span>
                    </p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">{formatDate(l.created_at)}</p>
                  </div>
                </div>
              ))}
              {auditLogs.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No activity logs yet</p>}
            </div>
          )}

          {/* Close button */}
          <button
            onClick={() => setExpandedWidget(null)}
            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors text-center py-1"
          >
            Close
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default AdminDashboardSection;
