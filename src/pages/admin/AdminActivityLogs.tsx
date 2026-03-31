import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, History, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAdminRole } from "@/hooks/useAdminRole";
import { supabase } from "@/integrations/supabase/client";
import NavHeader from "@/components/NavHeader";

interface AuditLog { id: string; user_email: string; user_name: string; action: string; entity_type: string; entity_id: string | null; details: any; created_at: string; }

const AdminActivityLogs = () => {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAdminRole();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!loading && !isAdmin) { navigate("/profile"); return; }
    if (isAdmin) {
      supabase.from("audit_logs" as any).select("*").order("created_at", { ascending: false }).limit(200)
        .then(({ data }) => { if (data) setLogs(data as unknown as AuditLog[]); });
    }
  }, [isAdmin, loading]);

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;
  if (!isAdmin) return null;

  const filtered = logs.filter(l =>
    (l.user_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (l.action || "").toLowerCase().includes(search.toLowerCase()) ||
    (l.entity_type || "").toLowerCase().includes(search.toLowerCase()) ||
    (l.user_email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 pt-16 pb-8">
      <NavHeader />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg mx-auto flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/profile")} className="text-muted-foreground hover:text-foreground transition-colors p-1"><ArrowLeft size={20} /></button>
          <History size={20} className="text-primary" />
          <h1 className="text-lg font-semibold text-foreground">Activity Logs</h1>
          <Badge variant="secondary" className="ml-auto text-xs">{logs.length} entries</Badge>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Search logs..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-secondary pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="space-y-2">
          {filtered.map(l => (
            <div key={l.id} className="rounded-xl bg-card border border-border p-3 flex items-start gap-3">
              <div className="p-1.5 rounded-full bg-secondary shrink-0 mt-0.5">
                <History size={12} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground">
                  <span className="font-medium">{l.user_name || l.user_email}</span>{" "}
                  <span className="text-muted-foreground">{l.action}</span>{" "}
                  <span className="text-primary">{l.entity_type}</span>
                </p>
                {l.entity_id && <p className="text-[10px] text-muted-foreground mt-0.5">ID: {l.entity_id}</p>}
                <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(l.created_at).toLocaleString()}</p>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No activity logs yet</p>}
        </div>
      </motion.div>
    </div>
  );
};

export default AdminActivityLogs;
