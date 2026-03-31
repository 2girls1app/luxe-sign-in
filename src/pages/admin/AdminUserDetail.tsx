import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, User, Search, History, LogIn } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAdminRole } from "@/hooks/useAdminRole";
import { supabase } from "@/integrations/supabase/client";
import NavHeader from "@/components/NavHeader";

interface UserProfile {
  display_name: string | null;
  avatar_url: string | null;
  role: string | null;
  specialty: string | null;
  created_at: string;
}

interface AuditEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: any;
  created_at: string;
}

const FILTER_OPTIONS = [
  { value: "all", label: "All Activity" },
  { value: "login", label: "Logins" },
  { value: "edits", label: "Edits & Changes" },
];

const AdminUserDetail = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { isAdmin, loading } = useAdminRole();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!loading && !isAdmin) { navigate("/profile"); return; }
    if (isAdmin && userId) {
      // Fetch profile and audit logs in parallel
      supabase.from("profiles").select("*").eq("user_id", userId).single()
        .then(({ data }) => { if (data) setProfile(data as any); });

      supabase.from("audit_logs").select("*").eq("user_id", userId)
        .order("created_at", { ascending: false }).limit(500)
        .then(({ data }) => { if (data) setLogs(data as unknown as AuditEntry[]); });
    }
  }, [isAdmin, loading, userId]);

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;
  if (!isAdmin) return null;

  const filtered = logs.filter(l => {
    const q = search.toLowerCase();
    const matchesSearch = !q || (l.action || "").toLowerCase().includes(q) || (l.entity_type || "").toLowerCase().includes(q);
    if (!matchesSearch) return false;
    if (filter === "login") return l.action === "signed_in" || l.action === "login";
    if (filter === "edits") return l.action !== "signed_in" && l.action !== "login";
    return true;
  });

  const isLogin = (action: string) => action === "signed_in" || action === "login";

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 pt-16 pb-8">
      <NavHeader />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg mx-auto flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/admin/users")} className="text-muted-foreground hover:text-foreground transition-colors p-1">
            <ArrowLeft size={20} />
          </button>
          <User size={20} className="text-primary" />
          <h1 className="text-lg font-semibold text-foreground">User Audit History</h1>
        </div>

        {/* User info card */}
        {profile && (
          <div className="rounded-xl bg-card border border-border p-4 flex items-center gap-4">
            <Avatar className="h-12 w-12 border border-border">
              {profile.avatar_url ? <AvatarImage src={profile.avatar_url} /> : null}
              <AvatarFallback className="bg-secondary text-foreground">
                {(profile.display_name || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{profile.display_name || "Unnamed"}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-[10px]">{profile.role || "No role"}</Badge>
                {profile.specialty && <span className="text-[10px] text-primary">{profile.specialty}</span>}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Joined {new Date(profile.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        )}

        {/* Search + filters */}
        <div className="space-y-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search activity..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-secondary pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex gap-2">
            {FILTER_OPTIONS.map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filter === f.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                }`}
              >
                {f.label}
              </button>
            ))}
            <Badge variant="secondary" className="ml-auto text-xs self-center">{filtered.length} entries</Badge>
          </div>
        </div>

        {/* Activity list */}
        <div className="space-y-2">
          {filtered.map(l => (
            <div key={l.id} className="rounded-xl bg-card border border-border p-3 flex items-start gap-3">
              <div className={`p-1.5 rounded-full shrink-0 mt-0.5 ${isLogin(l.action) ? "bg-primary/10" : "bg-secondary"}`}>
                {isLogin(l.action) ? <LogIn size={12} className="text-primary" /> : <History size={12} className="text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground">
                  <span className="font-medium">{l.action}</span>{" "}
                  <span className="text-primary">{l.entity_type}</span>
                </p>
                {l.entity_id && <p className="text-[10px] text-muted-foreground mt-0.5">ID: {l.entity_id}</p>}
                <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(l.created_at).toLocaleString()}</p>
              </div>
              <Badge variant={isLogin(l.action) ? "default" : "secondary"} className="text-[9px] shrink-0">
                {isLogin(l.action) ? "Login" : "Action"}
              </Badge>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No activity found</p>}
        </div>
      </motion.div>
    </div>
  );
};

export default AdminUserDetail;
