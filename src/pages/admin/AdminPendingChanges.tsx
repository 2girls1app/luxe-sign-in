import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, AlertTriangle, Bell, Clock, ClipboardList, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import NavHeader from "@/components/NavHeader";

interface PendingChangeDetail {
  id: string;
  procedure_id: string;
  category: string;
  old_value: string | null;
  new_value: string;
  status: string;
  created_at: string;
  submitted_by: string;
}
interface Procedure {
  id: string;
  name: string;
}
interface SubmitterProfile {
  user_id: string;
  display_name: string | null;
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const parseItems = (val: string | null): any[] => {
  if (!val) return [];
  try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; } catch { return []; }
};

const AdminPendingChanges = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { isAdmin, loading } = useAdminRole();
  const { user } = useAuth();
  const { toast } = useToast();
  const [changes, setChanges] = useState<PendingChangeDetail[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [submitters, setSubmitters] = useState<SubmitterProfile[]>([]);
  const [nudging, setNudging] = useState(false);
  const [doctorName, setDoctorName] = useState("");

  const fetchData = useCallback(async () => {
    if (!userId || !isAdmin) return;

    const [profileRes, procsRes] = await Promise.all([
      supabase.from("profiles").select("display_name").eq("user_id", userId).single(),
      supabase.from("procedures").select("id, name").eq("user_id", userId),
    ]);

    if (profileRes.data) setDoctorName(profileRes.data.display_name || "Doctor");
    if (procsRes.data) {
      setProcedures(procsRes.data as Procedure[]);
      const procIds = (procsRes.data as Procedure[]).map(p => p.id);
      if (procIds.length > 0) {
        const { data: pendingData } = await supabase
          .from("pending_preference_changes")
          .select("id, procedure_id, category, old_value, new_value, status, created_at, submitted_by")
          .eq("status", "pending")
          .in("procedure_id", procIds)
          .order("created_at", { ascending: false });
        if (pendingData) {
          setChanges(pendingData as PendingChangeDetail[]);
          const submitterIds = [...new Set(pendingData.map((c: any) => c.submitted_by))];
          if (submitterIds.length > 0) {
            const { data: subs } = await supabase
              .from("profiles")
              .select("user_id, display_name")
              .in("user_id", submitterIds);
            if (subs) setSubmitters(subs as SubmitterProfile[]);
          }
        }
      }
    }
  }, [userId, isAdmin]);

  useEffect(() => {
    if (!loading && !isAdmin) { navigate("/profile"); return; }
    if (isAdmin) fetchData();
  }, [isAdmin, loading, fetchData]);

  const sendNudge = async () => {
    if (!user || !userId) return;
    setNudging(true);
    const { error } = await supabase.from("admin_notifications").insert({
      title: "Pending Preference Card Updates",
      message: `You have ${changes.length} pending preference card update${changes.length !== 1 ? "s" : ""} awaiting your approval. Please review them at your earliest convenience.`,
      priority: "high",
      sent_by: user.id,
    });

    // Also log the nudge
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "nudge_sent",
      entity_type: "pending_changes",
      entity_id: userId,
      details: { surgeon_name: doctorName, pending_count: changes.length },
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Nudge sent!", description: `Reminder sent to ${doctorName}` });
    }
    setNudging(false);
  };

  const getProcName = (procId: string) => procedures.find(p => p.id === procId)?.name || "Unknown";
  const getSubmitterName = (subId: string) => submitters.find(s => s.user_id === subId)?.display_name || "Admin";

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;
  if (!isAdmin) return null;

  // Group changes by procedure
  const grouped = changes.reduce<Record<string, PendingChangeDetail[]>>((acc, c) => {
    (acc[c.procedure_id] = acc[c.procedure_id] || []).push(c);
    return acc;
  }, {});

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 pt-16 pb-8">
      <NavHeader />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg mx-auto flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/admin/doctors/${userId}`)} className="text-muted-foreground hover:text-foreground transition-colors p-1">
            <ArrowLeft size={20} />
          </button>
          <AlertTriangle size={20} className="text-amber-400" />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-foreground">Pending Changes</h1>
            <p className="text-xs text-muted-foreground">{doctorName}</p>
          </div>
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
            {changes.length} pending
          </Badge>
        </div>

        {/* Nudge button */}
        {changes.length > 0 && (
          <button
            onClick={sendNudge}
            disabled={nudging}
            className="flex items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs font-medium text-amber-300 hover:bg-amber-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <Bell size={16} />
            {nudging ? "Sending..." : "Send Reminder to Surgeon"}
          </button>
        )}

        {/* Changes grouped by procedure */}
        {Object.entries(grouped).map(([procId, procChanges]) => (
          <div key={procId} className="space-y-2">
            <div className="flex items-center gap-2">
              <ClipboardList size={14} className="text-primary" />
              <h2 className="text-sm font-semibold text-foreground">{getProcName(procId)}</h2>
              <Badge variant="secondary" className="text-[9px] ml-auto">{procChanges.length} changes</Badge>
            </div>

            {procChanges.map(change => {
              const oldItems = parseItems(change.old_value);
              const newItems = parseItems(change.new_value);
              const added = newItems.filter(n => !oldItems.some(o => o.name === n.name));
              const removed = oldItems.filter(o => !newItems.some(n => n.name === o.name));
              const modified = newItems.filter(n => {
                const old = oldItems.find(o => o.name === n.name);
                return old && JSON.stringify(old) !== JSON.stringify(n);
              });

              return (
                <div key={change.id} className="rounded-xl bg-card border border-border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[9px]">
                        {change.category.replace(/_/g, " ")}
                      </Badge>
                      <Badge variant="outline" className="text-[9px] text-amber-300 border-amber-500/30">
                        Pending Approval
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock size={10} />
                      {formatDate(change.created_at)}
                    </div>
                  </div>

                  <p className="text-[10px] text-muted-foreground">
                    Changed by: <span className="text-foreground">{getSubmitterName(change.submitted_by)}</span>
                  </p>

                  {/* Change summary */}
                  <div className="space-y-1.5">
                    {added.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        <span className="text-[10px] text-green-400 font-medium">Added:</span>
                        {added.map(a => (
                          <span key={a.name} className="text-[10px] bg-green-500/10 text-green-300 rounded px-1.5 py-0.5">
                            {a.name}{a.quantity > 1 ? ` ×${a.quantity}` : ""}
                            {a.isHold ? " (Hold)" : ""}
                          </span>
                        ))}
                      </div>
                    )}
                    {removed.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        <span className="text-[10px] text-red-400 font-medium">Removed:</span>
                        {removed.map(r => (
                          <span key={r.name} className="text-[10px] bg-red-500/10 text-red-300 rounded px-1.5 py-0.5 line-through">
                            {r.name}
                          </span>
                        ))}
                      </div>
                    )}
                    {modified.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        <span className="text-[10px] text-blue-400 font-medium">Modified:</span>
                        {modified.map(m => {
                          const old = oldItems.find(o => o.name === m.name);
                          return (
                            <span key={m.name} className="text-[10px] bg-blue-500/10 text-blue-300 rounded px-1.5 py-0.5">
                              {m.name}
                              {old?.quantity !== m.quantity && ` qty: ${old?.quantity || 1}→${m.quantity || 1}`}
                              {!old?.isHold && m.isHold && " +Hold"}
                              {old?.isHold && !m.isHold && " -Hold"}
                            </span>
                          );
                        })}
                      </div>
                    )}
                    {added.length === 0 && removed.length === 0 && modified.length === 0 && (
                      <p className="text-[10px] text-muted-foreground italic">Changes detected</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {changes.length === 0 && (
          <div className="text-center py-12">
            <Check size={32} className="text-primary mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">All caught up!</p>
            <p className="text-xs text-muted-foreground mt-1">No pending changes for this surgeon</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AdminPendingChanges;
