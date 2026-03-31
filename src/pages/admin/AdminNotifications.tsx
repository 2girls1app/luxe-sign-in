import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Bell, Send, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminRole } from "@/hooks/useAdminRole";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import NavHeader from "@/components/NavHeader";

interface AdminNotification { id: string; title: string; message: string; priority: string; created_at: string; target_professions?: string | null; }

const PROFESSIONS = [
  "Surgeon",
  "Nurse",
  "Physician Assistant",
  "Anesthesia",
  "Admin Staff",
  "Administrative",
  "Surgical Technologist",
  "CRNA",
];

const AdminNotifications = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, loading } = useAdminRole();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", priority: "normal" });
  const [recipientType, setRecipientType] = useState<"all" | "profession">("all");
  const [selectedProfessions, setSelectedProfessions] = useState<string[]>([]);

  const fetchNotifications = async () => {
    const { data } = await supabase.from("admin_notifications").select("*").order("created_at", { ascending: false });
    if (data) setNotifications(data as unknown as AdminNotification[]);
  };

  useEffect(() => {
    if (!loading && !isAdmin) { navigate("/profile"); return; }
    if (isAdmin) fetchNotifications();
  }, [isAdmin, loading]);

  const toggleProfession = (prof: string) => {
    setSelectedProfessions(prev =>
      prev.includes(prof) ? prev.filter(p => p !== prof) : [...prev, prof]
    );
  };

  const send = async () => {
    if (!form.title || !form.message) { toast({ title: "Title and message required", variant: "destructive" }); return; }
    if (recipientType === "profession" && selectedProfessions.length === 0) {
      toast({ title: "Please select at least one profession", variant: "destructive" });
      return;
    }

    const payload: any = {
      title: form.title,
      message: form.message,
      priority: form.priority,
      sent_by: user?.id,
    };

    // Store target professions in the message metadata if targeting by profession
    if (recipientType === "profession") {
      payload.message = `[To: ${selectedProfessions.join(", ")}] ${form.message}`;
    }

    await supabase.from("admin_notifications").insert(payload as any);
    toast({ title: "Notification sent" });
    setDialogOpen(false);
    setForm({ title: "", message: "", priority: "normal" });
    setRecipientType("all");
    setSelectedProfessions([]);
    fetchNotifications();
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;
  if (!isAdmin) return null;

  const filtered = notifications.filter(n => n.title.toLowerCase().includes(search.toLowerCase()) || n.message.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 pt-16 pb-8">
      <NavHeader />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg mx-auto flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/profile")} className="text-muted-foreground hover:text-foreground transition-colors p-1"><ArrowLeft size={20} /></button>
          <Bell size={20} className="text-primary" />
          <h1 className="text-lg font-semibold text-foreground">Notifications</h1>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) { setRecipientType("all"); setSelectedProfessions([]); }
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="ml-auto gap-1.5 text-xs"><Send size={14} /> New</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Send Team Notification</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="bg-secondary border-border" />
                <Textarea placeholder="Message..." value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} className="bg-secondary border-border min-h-[100px]" />
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Priority</SelectItem>
                    <SelectItem value="normal">Normal Priority</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>

                {/* Recipient Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Recipients</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={recipientType === "all" ? "default" : "outline"}
                      onClick={() => { setRecipientType("all"); setSelectedProfessions([]); }}
                      className="text-xs"
                    >
                      Send to All
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={recipientType === "profession" ? "default" : "outline"}
                      onClick={() => setRecipientType("profession")}
                      className="text-xs"
                    >
                      By Medical Profession
                    </Button>
                  </div>
                </div>

                {recipientType === "profession" && (
                  <div className="space-y-2 rounded-lg border border-border bg-secondary p-3">
                    <Label className="text-xs font-medium text-muted-foreground">Select professions</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {PROFESSIONS.map(prof => (
                        <label
                          key={prof}
                          className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors"
                        >
                          <Checkbox
                            checked={selectedProfessions.includes(prof)}
                            onCheckedChange={() => toggleProfession(prof)}
                          />
                          <span className="text-xs text-foreground">{prof}</span>
                        </label>
                      ))}
                    </div>
                    {selectedProfessions.length === 0 && (
                      <p className="text-[10px] text-destructive">Select at least one profession</p>
                    )}
                  </div>
                )}
              </div>
              <DialogFooter><Button onClick={send} className="gap-1.5"><Send size={14} /> Send</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Search notifications..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-secondary pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-2">
          {filtered.map(n => (
            <div key={n.id} className="rounded-xl bg-card border border-border p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
                </div>
                <Badge variant={n.priority === "urgent" ? "destructive" : n.priority === "high" ? "default" : "secondary"} className="text-[10px] shrink-0">{n.priority}</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">{new Date(n.created_at).toLocaleString()}</p>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No notifications yet</p>}
        </div>
      </motion.div>
    </div>
  );
};

export default AdminNotifications;
