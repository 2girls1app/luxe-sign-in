import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Users, Search, CheckCircle, Trash2, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { useAdminRole } from "@/hooks/useAdminRole";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import NavHeader from "@/components/NavHeader";

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string | null;
  specialty: string | null;
  onboarding_completed: boolean;
  created_at: string;
  last_login?: string | null;
}

const ROLE_FILTERS = [
  { value: "all", label: "All Roles" },
  { value: "surgeon", label: "Surgeon" },
  { value: "admin staff", label: "Admin Staff" },
  { value: "administrative", label: "Administrative" },
  { value: "nurse", label: "Nurse" },
  { value: "physician assistant", label: "Physician Assistant" },
  { value: "anesthesia", label: "Anesthesia" },
  { value: "no-role", label: "No Role" },
];

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
];

const AdminUsers = () => {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAdminRole();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchUsers = async () => {
    const { data: profiles } = await supabase.from("profiles").select("*");
    if (!profiles) return;

    // Fetch last login from audit_logs for all users
    const { data: logins } = await supabase
      .from("audit_logs")
      .select("user_id, created_at")
      .eq("action", "signed_in")
      .order("created_at", { ascending: false });

    const lastLoginMap = new Map<string, string>();
    if (logins) {
      for (const log of logins) {
        if (log.user_id && !lastLoginMap.has(log.user_id)) {
          lastLoginMap.set(log.user_id, log.created_at);
        }
      }
    }

    setUsers(profiles.map((p: any) => ({
      ...p,
      last_login: lastLoginMap.get(p.user_id) || null,
    })));
  };

  useEffect(() => {
    if (!loading && !isAdmin) { navigate("/profile"); return; }
    if (isAdmin) fetchUsers();
  }, [isAdmin, loading]);

  const approveUser = async (u: UserProfile) => {
    const { error } = await supabase.from("profiles").update({ onboarding_completed: true } as any).eq("id", u.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: `${u.display_name || "User"} approved` });
    fetchUsers();
  };

  const removeUser = async (u: UserProfile) => {
    // Delete profile (cascade will handle related data)
    const { error } = await supabase.from("profiles").delete().eq("id", u.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: `${u.display_name || "User"} removed` });
    fetchUsers();
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;
  if (!isAdmin) return null;

  const filtered = users
    .filter(u => {
      // Search
      const q = search.toLowerCase();
      if (q && !(u.display_name || "").toLowerCase().includes(q) && !(u.role || "").toLowerCase().includes(q) && !(u.specialty || "").toLowerCase().includes(q)) return false;
      // Status filter
      if (statusFilter === "pending" && u.onboarding_completed) return false;
      if (statusFilter === "active" && !u.onboarding_completed) return false;
      // Role filter
      if (roleFilter === "no-role" && u.role) return false;
      if (roleFilter !== "all" && roleFilter !== "no-role") {
        if (!(u.role || "").toLowerCase().includes(roleFilter)) return false;
      }
      return true;
    })
    .sort((a, b) => (a.display_name || "").localeCompare(b.display_name || "", undefined, { sensitivity: "base" }));

  const pendingCount = users.filter(u => !u.onboarding_completed).length;

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 pt-16 pb-8">
      <NavHeader />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg mx-auto flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/profile")} className="text-muted-foreground hover:text-foreground transition-colors p-1"><ArrowLeft size={20} /></button>
          <Users size={20} className="text-primary" />
          <h1 className="text-lg font-semibold text-foreground">User Management</h1>
          <Badge variant="secondary" className="ml-auto text-xs">{users.length} users</Badge>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-secondary pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        {/* Status tabs */}
        <div className="flex gap-2">
          {STATUS_TABS.map(t => (
            <button
              key={t.value}
              onClick={() => setStatusFilter(t.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === t.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
              }`}
            >
              {t.label}
              {t.value === "pending" && pendingCount > 0 && (
                <span className="ml-1.5 bg-destructive text-destructive-foreground text-[9px] px-1 py-0 rounded-full">{pendingCount}</span>
              )}
            </button>
          ))}
          {/* Role filter */}
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-8 w-auto min-w-[120px] ml-auto bg-card border-border text-xs gap-1">
              <Filter size={12} className="text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_FILTERS.map(r => (
                <SelectItem key={r.value} value={r.value} className="text-xs">{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* User list */}
        <div className="space-y-2">
          {filtered.map(u => (
            <motion.div key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center gap-3 rounded-xl bg-card border border-border p-4 cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => navigate(`/admin/users/${u.user_id}`)}>
              <Avatar className="h-10 w-10 border border-border shrink-0">
                {u.avatar_url ? <AvatarImage src={u.avatar_url} /> : null}
                <AvatarFallback className="bg-secondary text-foreground text-sm">{(u.display_name || "U").charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{u.display_name || "Unnamed"}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-[10px]">{u.role || "No role"}</Badge>
                  {u.specialty && <span className="text-[10px] text-primary">{u.specialty}</span>}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">Joined {new Date(u.created_at).toLocaleDateString()}</p>
                <p className="text-[10px] text-muted-foreground">
                  Last login: {u.last_login ? new Date(u.last_login).toLocaleDateString() : "No login yet"}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                <Badge variant={u.onboarding_completed ? "default" : "secondary"} className="text-[10px]">
                  {u.onboarding_completed ? "Active" : "Pending"}
                </Badge>
                {!u.onboarding_completed && (
                  <button
                    onClick={() => approveUser(u)}
                    className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                    title="Approve user"
                  >
                    <CheckCircle size={16} />
                  </button>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Remove user">
                      <Trash2 size={14} />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-card border-border">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove {u.display_name || "this user"}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove the user's profile and revoke their access. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => removeUser(u)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No users found</p>}
        </div>
      </motion.div>
    </div>
  );
};

export default AdminUsers;
