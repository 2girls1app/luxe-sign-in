import { useState, useEffect, useCallback } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Check, X, ChevronDown, ChevronUp, Clock, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { PREFERENCE_CATEGORIES } from "@/components/PreferenceCategoryWidget";

interface PendingChange {
  id: string;
  procedure_id: string;
  category: string;
  old_value: string;
  new_value: string;
  submitted_by: string;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  denial_reason: string | null;
  is_read: boolean;
  created_at: string;
  submitter_name?: string;
  procedure_name?: string;
}

type FilterStatus = "all" | "pending" | "approved" | "denied";

interface NotificationsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCountChange?: (count: number) => void;
}

const NotificationsDrawer = ({ open, onOpenChange, onCountChange }: NotificationsDrawerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [changes, setChanges] = useState<PendingChange[]>([]);
  const [filter, setFilter] = useState<FilterStatus>("pending");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const getCategoryLabel = (key: string) => {
    const cat = PREFERENCE_CATEGORIES.find((c) => c.key === key);
    return cat?.label || key;
  };

  const fetchChanges = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("pending_preference_changes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) return;

    // Enrich with submitter names and procedure names
    const enriched = await Promise.all(
      data.map(async (change: any) => {
        const [{ data: profile }, { data: procedure }] = await Promise.all([
          supabase
            .from("profiles")
            .select("display_name")
            .eq("user_id", change.submitted_by)
            .single(),
          supabase
            .from("procedures")
            .select("name")
            .eq("id", change.procedure_id)
            .single(),
        ]);
        return {
          ...change,
          submitter_name: profile?.display_name || "Unknown",
          procedure_name: procedure?.name || "Unknown",
        };
      })
    );

    setChanges(enriched);
    const pendingCount = enriched.filter((c) => c.status === "pending").length;
    onCountChange?.(pendingCount);
  }, [user, onCountChange]);

  useEffect(() => {
    if (open) fetchChanges();
  }, [open, fetchChanges]);

  const handleApprove = async (change: PendingChange) => {
    if (!user || processing || bulkProcessing) return false;
    setProcessing(change.id);

    try {
      const { data: proc, error: procError } = await supabase
        .from("procedures")
        .select("user_id")
        .eq("id", change.procedure_id)
        .single();

      if (procError || !proc?.user_id) {
        toast({
          title: "Error applying change",
          description: procError?.message || "Procedure owner not found",
          variant: "destructive",
        });
        return false;
      }

      const ownerId = proc.user_id;

      const { error: upsertError } = await supabase
        .from("procedure_preferences")
        .upsert(
          {
            procedure_id: change.procedure_id,
            user_id: ownerId,
            category: change.category,
            value: change.new_value,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "procedure_id,user_id,category" }
        );

      if (upsertError) {
        toast({ title: "Error applying change", description: upsertError.message, variant: "destructive" });
        return false;
      }

      const { error: updateError } = await supabase
        .from("pending_preference_changes")
        .update({
          status: "approved",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          is_read: true,
        })
        .eq("id", change.id);

      if (updateError) {
        toast({ title: "Error updating status", description: updateError.message, variant: "destructive" });
        return false;
      }

      setChanges((prev) => prev.filter((item) => item.id !== change.id));
      onCountChange?.(Math.max(0, pendingCount - 1));
      toast({ title: "Change approved and applied" });
      return true;
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      return false;
    } finally {
      setProcessing(null);
    }
  };

  const handleDeny = async (change: PendingChange, reason?: string) => {
    if (!user || processing || bulkProcessing) return false;
    setProcessing(change.id);

    try {
      const { error } = await supabase
        .from("pending_preference_changes")
        .update({
          status: "denied",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          denial_reason: reason || null,
          is_read: true,
        })
        .eq("id", change.id);

      if (error) {
        toast({ title: "Error denying change", description: error.message, variant: "destructive" });
        return false;
      }

      setChanges((prev) => prev.filter((item) => item.id !== change.id));
      onCountChange?.(Math.max(0, pendingCount - 1));
      toast({ title: "Change denied" });
      return true;
    } finally {
      setProcessing(null);
    }
  };

  const handleApproveAll = async () => {
    if (processing || bulkProcessing) return;
    setBulkProcessing(true);

    const pendingChanges = filtered.filter((c) => c.status === "pending");
    let successCount = 0;

    for (const change of pendingChanges) {
      const success = await handleApprove(change);
      if (success) successCount += 1;
      else break;
    }

    if (successCount > 1) {
      toast({ title: `${successCount} changes approved` });
    }

    await fetchChanges();
    setBulkProcessing(false);
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from("pending_preference_changes")
      .update({ is_read: true })
      .eq("id", id);

    if (error) return;

    setChanges((prev) =>
      prev.map((item) => (item.id === id ? { ...item, is_read: true } : item))
    );
  };

  const formatTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 size={14} className="text-green-500" />;
      case "denied":
        return <XCircle size={14} className="text-destructive" />;
      default:
        return <Clock size={14} className="text-primary" />;
    }
  };

  const getStatusBadgeClasses = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500/10 text-green-500";
      case "denied":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-primary/10 text-primary";
    }
  };

  const filtered = changes.filter((c) => filter === "all" || c.status === filter);
  const pendingCount = changes.filter((c) => c.status === "pending").length;

  const truncateValue = (val: string, max = 60) => {
    if (!val) return "Empty";
    if (val.length <= max) return val;
    return val.substring(0, max) + "…";
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] bg-background">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-base font-semibold text-foreground">
            Notifications
          </DrawerTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {pendingCount > 0
              ? `${pendingCount} pending approval${pendingCount !== 1 ? "s" : ""}`
              : "No pending approvals"}
          </p>
        </DrawerHeader>

        <div className="px-4 pb-6 flex flex-col gap-3 overflow-hidden">
          {/* Filter tabs */}
          <div className="flex gap-1.5">
            {(["pending", "approved", "denied", "all"] as FilterStatus[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors capitalize ${
                  filter === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
                {f === "pending" && pendingCount > 0 && (
                  <span className="ml-1.5 bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5 text-[9px]">
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Approve All button */}
          {filter === "pending" && pendingCount > 1 && (
            <Button
              size="sm"
              className="text-xs h-8"
              onClick={handleApproveAll}
              disabled={bulkProcessing}
            >
              <Check size={14} className="mr-1" />
              {bulkProcessing ? "Processing..." : `Approve All (${pendingCount})`}
            </Button>
          )}

          {/* Changes list */}
          <div className="flex flex-col gap-2 overflow-y-auto max-h-[55vh] pr-1">
            {filtered.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  No {filter === "all" ? "" : filter} changes
                </p>
              </div>
            ) : (
              filtered.map((change) => (
                <div
                  key={change.id}
                  className={`rounded-xl border bg-card p-3 transition-colors ${
                    !change.is_read && change.status === "pending"
                      ? "border-primary/30"
                      : "border-border"
                  }`}
                  onClick={() => {
                    setExpandedId(expandedId === change.id ? null : change.id);
                    if (!change.is_read) markAsRead(change.id);
                  }}
                >
                  {/* Header row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {getStatusIcon(change.status)}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-foreground truncate">
                          {change.submitter_name}
                          <span className="text-muted-foreground font-normal">
                            {" "}edited{" "}
                          </span>
                          {getCategoryLabel(change.category)}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {change.procedure_name} · {formatTimeAgo(change.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-medium capitalize ${getStatusBadgeClasses(
                          change.status
                        )}`}
                      >
                        {change.status}
                      </span>
                      {expandedId === change.id ? (
                        <ChevronUp size={14} className="text-muted-foreground" />
                      ) : (
                        <ChevronDown size={14} className="text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Expanded details */}
                  {expandedId === change.id && (
                    <div className="mt-3 pt-3 border-t border-border space-y-3">
                      {/* Old vs New */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-[10px] font-medium text-muted-foreground mb-1">Previous</p>
                          <div className="bg-destructive/5 border border-destructive/10 rounded-lg p-2">
                            <p className="text-[11px] text-foreground break-words">
                              {truncateValue(change.old_value) || <span className="italic text-muted-foreground">Empty</span>}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-medium text-muted-foreground mb-1">Proposed</p>
                          <div className="bg-green-500/5 border border-green-500/10 rounded-lg p-2">
                            <p className="text-[11px] text-foreground break-words">
                              {truncateValue(change.new_value)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Denial reason */}
                      {change.denial_reason && (
                        <div className="bg-destructive/5 rounded-lg p-2">
                          <p className="text-[10px] text-muted-foreground">Denial reason:</p>
                          <p className="text-[11px] text-foreground">{change.denial_reason}</p>
                        </div>
                      )}

                      {/* Review info */}
                      {change.reviewed_at && (
                        <p className="text-[10px] text-muted-foreground">
                          Reviewed {formatTimeAgo(change.reviewed_at)}
                        </p>
                      )}

                      {/* Actions for pending */}
                      {change.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 h-8 text-xs gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApprove(change);
                            }}
                            disabled={processing === change.id}
                          >
                            <Check size={14} />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 h-8 text-xs gap-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeny(change);
                            }}
                            disabled={processing === change.id}
                          >
                            <X size={14} />
                            Deny
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default NotificationsDrawer;
