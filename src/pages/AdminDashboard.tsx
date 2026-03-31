import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users, Stethoscope, ClipboardList, Bell, Package, History,
  ArrowLeft, Shield, Search, Plus, Send, Trash2, Edit, ToggleLeft,
  ToggleRight, ChevronDown, ChevronUp, CheckCircle, XCircle, Clock
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { useAdminRole } from "@/hooks/useAdminRole";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Types
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
  id: string;
  name: string;
  category: string | null;
  user_id: string;
  created_at: string;
  facility_id: string | null;
}

interface AuditLog {
  id: string;
  user_email: string;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: any;
  created_at: string;
}

interface SupplyItem {
  id: string;
  name: string;
  category: string;
  description: string | null;
  sku: string | null;
  is_active: boolean;
  created_at: string;
}

interface AdminNotification {
  id: string;
  title: string;
  message: string;
  priority: string;
  created_at: string;
}

interface PrefCard {
  id: string;
  procedure_id: string;
  category: string;
  value: string;
  user_id: string;
  updated_at: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useAdminRole();
  const { toast } = useToast();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [prefCards, setPrefCards] = useState<PrefCard[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [supplies, setSupplies] = useState<SupplyItem[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("users");

  // Supply form
  const [supplyDialogOpen, setSupplyDialogOpen] = useState(false);
  const [editingSupply, setEditingSupply] = useState<SupplyItem | null>(null);
  const [supplyForm, setSupplyForm] = useState({ name: "", category: "", description: "", sku: "" });

  // Notification form
  const [notifDialogOpen, setNotifDialogOpen] = useState(false);
  const [notifForm, setNotifForm] = useState({ title: "", message: "", priority: "normal" });

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      navigate("/profile");
      return;
    }
    if (isAdmin) {
      fetchAll();
    }
  }, [isAdmin, roleLoading]);

  const fetchAll = async () => {
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
  };

  const getUserName = (userId: string) => {
    const u = users.find(u => u.user_id === userId);
    return u?.display_name || "Unknown";
  };

  // Supply CRUD
  const handleSaveSupply = async () => {
    if (!supplyForm.name || !supplyForm.category) {
      toast({ title: "Name and category required", variant: "destructive" });
      return;
    }
    if (editingSupply) {
      await supabase.from("supply_library" as any).update({
        name: supplyForm.name,
        category: supplyForm.category,
        description: supplyForm.description || null,
        sku: supplyForm.sku || null,
        updated_at: new Date().toISOString(),
      } as any).eq("id", editingSupply.id);
      toast({ title: "Supply updated" });
    } else {
      await supabase.from("supply_library" as any).insert({
        name: supplyForm.name,
        category: supplyForm.category,
        description: supplyForm.description || null,
        sku: supplyForm.sku || null,
        created_by: user?.id,
      } as any);
      toast({ title: "Supply added" });
    }
    setSupplyDialogOpen(false);
    setEditingSupply(null);
    setSupplyForm({ name: "", category: "", description: "", sku: "" });
    fetchAll();
  };

  const toggleSupplyActive = async (item: SupplyItem) => {
    await supabase.from("supply_library" as any).update({ is_active: !item.is_active } as any).eq("id", item.id);
    toast({ title: item.is_active ? "Supply deactivated" : "Supply activated" });
    fetchAll();
  };

  const deleteSupply = async (id: string) => {
    await supabase.from("supply_library" as any).delete().eq("id", id);
    toast({ title: "Supply removed" });
    fetchAll();
  };

  // Notifications
  const handleSendNotification = async () => {
    if (!notifForm.title || !notifForm.message) {
      toast({ title: "Title and message required", variant: "destructive" });
      return;
    }
    await supabase.from("admin_notifications" as any).insert({
      title: notifForm.title,
      message: notifForm.message,
      priority: notifForm.priority,
      sent_by: user?.id,
    } as any);
    toast({ title: "Notification sent" });
    setNotifDialogOpen(false);
    setNotifForm({ title: "", message: "", priority: "normal" });
    fetchAll();
  };

  const formatDate = (d: string) => new Date(d).toLocaleString();

  const filteredUsers = users.filter(u =>
    (u.display_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.role || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProcedures = procedures.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.category || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const SUPPLY_CATEGORIES = ["Suture", "Instruments", "Equipment", "Supplies", "Trays", "Robotic", "Skin Prep", "Other"];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate("/profile")} className="p-2 rounded-full hover:bg-card text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={20} />
          </button>
          <Shield size={20} className="text-primary" />
          <h1 className="text-lg font-semibold text-foreground">Admin Dashboard</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full px-4 py-6">
        {/* Search */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search across all sections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full flex-wrap h-auto gap-1 bg-card border border-border p-1 mb-6">
            <TabsTrigger value="users" className="flex items-center gap-1.5 text-xs">
              <Users size={14} /> Users
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{users.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="doctors" className="flex items-center gap-1.5 text-xs">
              <Stethoscope size={14} /> Doctors
            </TabsTrigger>
            <TabsTrigger value="prefcards" className="flex items-center gap-1.5 text-xs">
              <ClipboardList size={14} /> Pref Cards
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{prefCards.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-1.5 text-xs">
              <Bell size={14} /> Notifications
            </TabsTrigger>
            <TabsTrigger value="supplies" className="flex items-center gap-1.5 text-xs">
              <Package size={14} /> Supply Library
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{supplies.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-1.5 text-xs">
              <History size={14} /> Audit Logs
            </TabsTrigger>
          </TabsList>

          {/* USERS TAB */}
          <TabsContent value="users" className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">All Users</h2>
            {filteredUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No users found</p>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map(u => (
                  <motion.div key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-center gap-3 rounded-xl bg-card border border-border p-4"
                  >
                    <Avatar className="h-10 w-10 border border-border">
                      {u.avatar_url ? <AvatarImage src={u.avatar_url} /> : null}
                      <AvatarFallback className="bg-secondary text-foreground text-sm">
                        {(u.display_name || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{u.display_name || "Unnamed"}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px]">{u.role || "No role"}</Badge>
                        {u.specialty && <span className="text-[10px] text-primary">{u.specialty}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-muted-foreground">Joined</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</p>
                    </div>
                    <Badge variant={u.onboarding_completed ? "default" : "secondary"} className="text-[10px]">
                      {u.onboarding_completed ? "Active" : "Pending"}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* DOCTORS TAB */}
          <TabsContent value="doctors" className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Doctor Profiles
            </h2>
            {(() => {
              const doctors = users.filter(u =>
                (u.role || "").toLowerCase().includes("doctor") ||
                (u.role || "").toLowerCase().includes("surgeon") ||
                (u.role || "").toLowerCase().includes("physician") ||
                u.specialty
              );
              const filtered = doctors.filter(d =>
                (d.display_name || "").toLowerCase().includes(searchTerm.toLowerCase())
              );
              if (filtered.length === 0) return <p className="text-sm text-muted-foreground text-center py-8">No doctors found</p>;
              return (
                <div className="space-y-2">
                  {filtered.map(d => (
                    <div key={d.id} className="flex items-center gap-3 rounded-xl bg-card border border-border p-4">
                      <Avatar className="h-10 w-10 border border-border">
                        {d.avatar_url ? <AvatarImage src={d.avatar_url} /> : null}
                        <AvatarFallback className="bg-secondary text-foreground text-sm">
                          {(d.display_name || "D").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{d.display_name}</p>
                        <p className="text-xs text-primary">{d.specialty || "No specialty"}</p>
                        <p className="text-[10px] text-muted-foreground">{d.role}</p>
                      </div>
                      <div className="text-right">
                        {(() => {
                          const count = procedures.filter(p => p.user_id === d.user_id).length;
                          return <Badge variant="secondary" className="text-[10px]">{count} procedures</Badge>;
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </TabsContent>

          {/* PREFERENCE CARDS TAB */}
          <TabsContent value="prefcards" className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              All Preference Cards
            </h2>
            {(() => {
              const grouped = procedures.filter(p =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase())
              );
              if (grouped.length === 0) return <p className="text-sm text-muted-foreground text-center py-8">No procedures found</p>;
              return (
                <div className="space-y-2">
                  {grouped.map(proc => {
                    const cards = prefCards.filter(pc => pc.procedure_id === proc.id);
                    return (
                      <div key={proc.id} className="rounded-xl bg-card border border-border p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-sm font-medium text-foreground">{proc.name}</p>
                            <p className="text-[10px] text-muted-foreground">By: {getUserName(proc.user_id)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={cards.length > 0 ? "default" : "secondary"} className="text-[10px]">
                              {cards.length > 0 ? `${cards.length} prefs` : "No prefs"}
                            </Badge>
                            {proc.category && <Badge variant="outline" className="text-[10px]">{proc.category}</Badge>}
                          </div>
                        </div>
                        {cards.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {cards.map(c => (
                              <Badge key={c.id} variant="secondary" className="text-[9px]">{c.category}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </TabsContent>

          {/* NOTIFICATIONS TAB */}
          <TabsContent value="notifications" className="space-y-3">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Team Notifications</h2>
              <Dialog open={notifDialogOpen} onOpenChange={setNotifDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5 text-xs">
                    <Send size={14} /> Send Notification
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader>
                    <DialogTitle>Send Team Notification</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <Input
                      placeholder="Title"
                      value={notifForm.title}
                      onChange={e => setNotifForm(f => ({ ...f, title: e.target.value }))}
                      className="bg-secondary border-border"
                    />
                    <Textarea
                      placeholder="Message..."
                      value={notifForm.message}
                      onChange={e => setNotifForm(f => ({ ...f, message: e.target.value }))}
                      className="bg-secondary border-border min-h-[100px]"
                    />
                    <Select value={notifForm.priority} onValueChange={v => setNotifForm(f => ({ ...f, priority: v }))}>
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low Priority</SelectItem>
                        <SelectItem value="normal">Normal Priority</SelectItem>
                        <SelectItem value="high">High Priority</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleSendNotification} className="gap-1.5">
                      <Send size={14} /> Send
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No notifications sent yet</p>
            ) : (
              <div className="space-y-2">
                {notifications.map(n => (
                  <div key={n.id} className="rounded-xl bg-card border border-border p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
                      </div>
                      <Badge variant={n.priority === "urgent" ? "destructive" : n.priority === "high" ? "default" : "secondary"} className="text-[10px] shrink-0">
                        {n.priority}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">{formatDate(n.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* SUPPLY LIBRARY TAB */}
          <TabsContent value="supplies" className="space-y-3">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Supply Library</h2>
              <Dialog open={supplyDialogOpen} onOpenChange={(open) => {
                setSupplyDialogOpen(open);
                if (!open) { setEditingSupply(null); setSupplyForm({ name: "", category: "", description: "", sku: "" }); }
              }}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5 text-xs" onClick={() => {
                    setEditingSupply(null);
                    setSupplyForm({ name: "", category: "", description: "", sku: "" });
                  }}>
                    <Plus size={14} /> Add Supply
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader>
                    <DialogTitle>{editingSupply ? "Edit Supply" : "Add Supply"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <Input
                      placeholder="Item name"
                      value={supplyForm.name}
                      onChange={e => setSupplyForm(f => ({ ...f, name: e.target.value }))}
                      className="bg-secondary border-border"
                    />
                    <Select value={supplyForm.category} onValueChange={v => setSupplyForm(f => ({ ...f, category: v }))}>
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPLY_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="SKU (optional)"
                      value={supplyForm.sku}
                      onChange={e => setSupplyForm(f => ({ ...f, sku: e.target.value }))}
                      className="bg-secondary border-border"
                    />
                    <Textarea
                      placeholder="Description (optional)"
                      value={supplyForm.description}
                      onChange={e => setSupplyForm(f => ({ ...f, description: e.target.value }))}
                      className="bg-secondary border-border"
                    />
                  </div>
                  <DialogFooter>
                    <Button onClick={handleSaveSupply}>
                      {editingSupply ? "Update" : "Add"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            {supplies.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No supplies in library</p>
            ) : (
              <div className="space-y-2">
                {supplies
                  .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.category.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(s => (
                  <div key={s.id} className={`rounded-xl bg-card border p-4 flex items-center gap-3 ${s.is_active ? 'border-border' : 'border-border opacity-50'}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{s.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px]">{s.category}</Badge>
                        {s.sku && <span className="text-[10px] text-muted-foreground">SKU: {s.sku}</span>}
                      </div>
                      {s.description && <p className="text-[10px] text-muted-foreground mt-1 truncate">{s.description}</p>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => toggleSupplyActive(s)}
                        className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                        title={s.is_active ? "Deactivate" : "Activate"}
                      >
                        {s.is_active ? <ToggleRight size={16} className="text-primary" /> : <ToggleLeft size={16} />}
                      </button>
                      <button
                        onClick={() => {
                          setEditingSupply(s);
                          setSupplyForm({ name: s.name, category: s.category, description: s.description || "", sku: s.sku || "" });
                          setSupplyDialogOpen(true);
                        }}
                        className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => deleteSupply(s.id)}
                        className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* AUDIT LOGS TAB */}
          <TabsContent value="audit" className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Activity / Audit Logs</h2>
            {auditLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No activity logs yet</p>
            ) : (
              <div className="space-y-2">
                {auditLogs
                  .filter(l =>
                    l.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    l.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    l.entity_type?.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(l => (
                  <div key={l.id} className="rounded-xl bg-card border border-border p-3 flex items-start gap-3">
                    <div className="p-1.5 rounded-full bg-secondary shrink-0 mt-0.5">
                      <History size={12} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground">
                        <span className="font-medium">{l.user_name || l.user_email}</span>
                        {" "}
                        <span className="text-muted-foreground">{l.action}</span>
                        {" "}
                        <span className="text-primary">{l.entity_type}</span>
                      </p>
                      {l.entity_id && <p className="text-[10px] text-muted-foreground mt-0.5">ID: {l.entity_id}</p>}
                      <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(l.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
