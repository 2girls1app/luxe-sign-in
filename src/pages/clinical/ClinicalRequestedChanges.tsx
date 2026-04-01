import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, FileEdit, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import NavHeader from "@/components/NavHeader";

interface ChangeRequest {
  id: string;
  category: string;
  old_value: string | null;
  new_value: string;
  status: string;
  created_at: string;
  denial_reason: string | null;
  procedure_id: string;
  procedure_name?: string;
}

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  pending: { icon: Clock, color: "text-yellow-500", label: "Pending" },
  approved: { icon: CheckCircle2, color: "text-green-500", label: "Approved" },
  denied: { icon: XCircle, color: "text-destructive", label: "Denied" },
};

const ClinicalRequestedChanges = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [changes, setChanges] = useState<ChangeRequest[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const fetchChanges = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase
      .from("pending_preference_changes")
      .select("id, category, old_value, new_value, status, created_at, denial_reason, procedure_id")
      .eq("submitted_by", user.id)
      .order("created_at", { ascending: false });

    if (!data) { setLoading(false); return; }

    // Get procedure names
    const procIds = [...new Set(data.map(d => d.procedure_id))];
    const { data: procs } = await supabase
      .from("procedures")
      .select("id, name")
      .in("id", procIds);

    const nameMap: Record<string, string> = {};
    procs?.forEach(p => { nameMap[p.id] = p.name; });

    setChanges(data.map(d => ({ ...d, procedure_name: nameMap[d.procedure_id] || "Unknown" })));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchChanges(); }, [fetchChanges]);

  const filtered = filter === "all" ? changes : changes.filter(c => c.status === filter);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 pt-16 pb-8">
      <NavHeader />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm mx-auto flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/profile")} className="text-muted-foreground hover:text-foreground transition-colors p-1">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Requested Changes</h1>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {["all", "pending", "approved", "denied"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl bg-card border border-border p-6 text-center">
            <FileEdit size={32} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No change requests found</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((change) => {
              const config = statusConfig[change.status] || statusConfig.pending;
              const StatusIcon = config.icon;
              return (
                <motion.div
                  key={change.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-xl bg-card border border-border p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{change.procedure_name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{change.category.replace(/_/g, " ")}</p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] shrink-0 ${config.color}`}>
                      <StatusIcon size={10} className="mr-1" />
                      {config.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{formatDate(change.created_at)}</p>
                  {change.denial_reason && (
                    <p className="text-xs text-destructive mt-1">Reason: {change.denial_reason}</p>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ClinicalRequestedChanges;
