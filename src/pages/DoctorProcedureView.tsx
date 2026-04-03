import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, ClipboardList, User, AlertTriangle, Mic, MicOff, Send,
  ListOrdered, MessageSquare, PenLine, Trash2, Plus, Clock,
  CheckCircle2, XCircle, ChevronRight, Library, Check,
  ArrowUp, ArrowDown,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import PreferenceCategoryWidget, {
  PREFERENCE_CATEGORIES,
  type PreferenceCategory,
} from "@/components/PreferenceCategoryWidget";
import { MULTI_SELECT_CATEGORIES } from "@/data/preferenceOptions";
import PreferenceSummaryDrawer from "@/components/PreferenceSummaryDrawer";
import TeamChatDrawer from "@/components/TeamChatDrawer";
import NavHeader from "@/components/NavHeader";
import ReadOnlyPreferenceViewer from "@/components/ReadOnlyPreferenceViewer";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle,
} from "@/components/ui/drawer";

interface PendingChange {
  id: string;
  category: string;
  new_value: string;
  old_value: string | null;
  status: string;
  created_at: string;
  submitted_by: string;
}

const formatItems = (raw: string): string[] => {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item: any) => {
        if (typeof item === "string") return item;
        const name = item.name || item.label || item.value || item.title;
        const qty = item.quantity || item.qty;
        if (name && qty && qty > 1) return `${name} (×${qty})`;
        return name || String(item);
      }).filter(Boolean);
    }
    if (parsed && typeof parsed === "object") {
      return Object.entries(parsed).map(([k, v]) => `${k}: ${v}`);
    }
  } catch {}
  return raw ? [raw] : [];
};

const statusIcon = (status: string) => {
  if (status === "approved") return <CheckCircle2 size={12} className="text-green-400" />;
  if (status === "denied" || status === "rejected") return <XCircle size={12} className="text-destructive" />;
  return <Clock size={12} className="text-amber-400" />;
};

const statusLabel = (status: string) => {
  if (status === "approved") return "Approved";
  if (status === "denied" || status === "rejected") return "Rejected";
  return "Pending Doctor Approval";
};

const statusColor = (status: string) => {
  if (status === "approved") return "bg-green-500/10 border-green-500/30 text-green-400";
  if (status === "denied" || status === "rejected") return "bg-destructive/10 border-destructive/30 text-destructive";
  return "bg-amber-500/10 border-amber-500/30 text-amber-400";
};

const getPreviewSummary = (raw: string | undefined, key: string, fileCount?: number): string => {
  if (key === "images" || key === "videos" || key === "pdfs") {
    const count = fileCount || 0;
    return count > 0 ? `${count} file${count !== 1 ? "s" : ""}` : "None";
  }
  if (!raw?.trim()) return "Not set";
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      if (parsed.length === 0) return "Not set";
      return `${parsed.length} item${parsed.length !== 1 ? "s" : ""}`;
    }
  } catch {}
  return raw.length > 30 ? raw.slice(0, 30) + "…" : raw;
};

const DoctorProcedureView = () => {
  const { userId, procedureId } = useParams<{ userId: string; procedureId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [procedureName, setProcedureName] = useState("");
  const [procedureCategory, setProcedureCategory] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [doctorAvatar, setDoctorAvatar] = useState("");
  const [facilityName, setFacilityName] = useState("");
  const [preferences, setPreferences] = useState<Record<string, string>>({});
  const [updatedDates, setUpdatedDates] = useState<Record<string, string>>({});
  const [fileCounts, setFileCounts] = useState<Record<string, number>>({});
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [allChanges, setAllChanges] = useState<PendingChange[]>([]);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  // View drawer
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [viewCategory, setViewCategory] = useState<PreferenceCategory | null>(null);

  // Change request
  const [changeDrawerOpen, setChangeDrawerOpen] = useState(false);
  const [changeCategory, setChangeCategory] = useState<PreferenceCategory | null>(null);
  const [changeText, setChangeText] = useState("");
  const [changeType, setChangeType] = useState<"change" | "delete" | "add_step" | "remove_step" | "add_preset">("change");
  const [submitting, setSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  // Steps viewer
  const [stepsOpen, setStepsOpen] = useState(false);
  const [newStepText, setNewStepText] = useState("");
  const [submittingStep, setSubmittingStep] = useState(false);

  // Preset library
  const [presetOpen, setPresetOpen] = useState(false);
  const [presetCategory, setPresetCategory] = useState<PreferenceCategory | null>(null);
  const [presetSubmitting, setPresetSubmitting] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!procedureId || !userId) return;

    const [procRes, profileRes, prefsRes, filesRes, pendingRes, allRes] = await Promise.all([
      supabase.from("procedures").select("name, category, facility_id, facilities(name)").eq("id", procedureId).single(),
      supabase.from("profiles").select("display_name, avatar_url").eq("user_id", userId).single(),
      supabase.from("procedure_preferences").select("category, value, updated_at").eq("procedure_id", procedureId),
      supabase.from("procedure_files").select("category").eq("procedure_id", procedureId),
      supabase.from("pending_preference_changes").select("id, category, new_value, old_value, status, created_at, submitted_by").eq("procedure_id", procedureId).eq("status", "pending"),
      supabase.from("pending_preference_changes").select("id, category, new_value, old_value, status, created_at, submitted_by").eq("procedure_id", procedureId).order("created_at", { ascending: false }).limit(50),
    ]);

    if (procRes.data) {
      setProcedureName(procRes.data.name);
      setProcedureCategory(procRes.data.category || "");
      setFacilityName((procRes.data.facilities as any)?.name || "");
    }
    if (profileRes.data) {
      setDoctorName(profileRes.data.display_name || "");
      setDoctorAvatar(profileRes.data.avatar_url || "");
    }
    if (prefsRes.data) {
      const map: Record<string, string> = {};
      const dates: Record<string, string> = {};
      prefsRes.data.forEach((d: any) => { map[d.category] = d.value; dates[d.category] = d.updated_at; });
      setPreferences(map);
      setUpdatedDates(dates);
    }
    if (filesRes.data) {
      const counts: Record<string, number> = {};
      filesRes.data.forEach((d: any) => { counts[d.category] = (counts[d.category] || 0) + 1; });
      setFileCounts(counts);
    }
    if (pendingRes.data) setPendingChanges(pendingRes.data as PendingChange[]);
    if (allRes.data) setAllChanges(allRes.data as PendingChange[]);
  }, [procedureId, userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Voice-to-text
  const startRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Not supported", description: "Voice input is not supported in this browser.", variant: "destructive" });
      return;
    }
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    let finalTranscript = changeText;
    rec.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += (finalTranscript ? " " : "") + event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setChangeText(finalTranscript + (interim ? " " + interim : ""));
    };
    rec.onerror = () => setIsRecording(false);
    rec.onend = () => setIsRecording(false);
    rec.start();
    setRecognition(rec);
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (recognition) { recognition.stop(); setRecognition(null); }
    setIsRecording(false);
  };

  const handleWidgetClick = (cat: PreferenceCategory) => {
    setViewCategory(cat);
    setViewDrawerOpen(true);
  };

  const openChangeRequest = (cat: PreferenceCategory, type: "change" | "delete" | "add_step" | "remove_step" | "add_preset") => {
    setViewDrawerOpen(false);
    setStepsOpen(false);
    setChangeCategory(cat);
    setChangeType(type);
    setChangeText("");
    setChangeDrawerOpen(true);
  };

  const openPresetLibrary = (cat: PreferenceCategory) => {
    setViewDrawerOpen(false);
    setPresetCategory(cat);
    setPresetOpen(true);
  };

  const getRequestPrefix = () => {
    switch (changeType) {
      case "delete": return "[DELETE REQUEST] ";
      case "add_step": return "[ADD STEP REQUEST] ";
      case "remove_step": return "[REMOVE STEP REQUEST] ";
      case "add_preset": return "[ADD PRESET REQUEST] ";
      default: return "";
    }
  };

  const getRequestTitle = () => {
    switch (changeType) {
      case "delete": return "Request Deletion";
      case "add_step": return "Request Add Step";
      case "remove_step": return "Request Remove Step";
      case "add_preset": return "Request New Preset Item";
      default: return "Request Change";
    }
  };

  const getRequestPlaceholder = () => {
    switch (changeType) {
      case "delete": return "Describe which item(s) to remove and why...";
      case "add_step": return "Describe the step to add and where it should go...";
      case "remove_step": return "Describe which step to remove and why...";
      case "add_preset": return "Describe the new preset item to add to the library...";
      default: return "Describe your suggested change...";
    }
  };

  const handleSubmitChange = async () => {
    if (!changeCategory || !changeText.trim() || !procedureId || !user) return;
    setSubmitting(true);
    const prefixedValue = getRequestPrefix() + changeText.trim();
    const { error } = await supabase.from("pending_preference_changes").insert({
      procedure_id: procedureId,
      category: changeCategory.key,
      old_value: preferences[changeCategory.key] || "",
      new_value: prefixedValue,
      submitted_by: user.id,
      status: "pending",
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Request submitted", description: "Pending doctor approval." });
      setChangeDrawerOpen(false);
      setChangeText("");
      await fetchData();
    }
    setSubmitting(false);
  };

  const handlePresetSelect = async (presetName: string) => {
    if (!presetCategory || !procedureId || !user) return;
    setPresetSubmitting(presetName);
    const { error } = await supabase.from("pending_preference_changes").insert({
      procedure_id: procedureId,
      category: presetCategory.key,
      old_value: preferences[presetCategory.key] || "",
      new_value: `[PRESET ADD REQUEST] ${presetName}`,
      submitted_by: user.id,
      status: "pending",
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Submitted for approval", description: `"${presetName}" is pending doctor approval.` });
      await fetchData();
    }
    setPresetSubmitting(null);
  };

  const categoriesWithPendingCounts = PREFERENCE_CATEGORIES.map(cat => ({
    ...cat,
    pendingCount: pendingChanges.filter(pc => pc.category === cat.key).length,
  }));

  // Parse steps
  const stepsData: string[] = (() => {
    try {
      const parsed = JSON.parse(preferences["steps"] || "[]");
      if (Array.isArray(parsed)) return parsed.map((s: any) => (typeof s === "string" ? s : s.text || s.name || String(s)));
    } catch {}
    return [];
  })();

  const stepsCategory = PREFERENCE_CATEGORIES.find(c => c.key === "steps") || { key: "steps", label: "Steps", icon: ListOrdered };

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 pt-16 pb-8">
      <NavHeader />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm mx-auto flex flex-col gap-5"
      >
        {/* Header */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/doctor/${userId}`)}
            className="p-2 rounded-full hover:bg-card transition-colors text-muted-foreground hover:text-foreground shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <Avatar className="h-9 w-9 shrink-0 border border-border">
            <AvatarImage src={doctorAvatar} alt={doctorName} />
            <AvatarFallback className="bg-card text-muted-foreground">
              <User size={16} />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            {doctorName && <p className="text-[11px] font-medium text-primary truncate">{doctorName}</p>}
            <h1 className="text-base font-medium text-foreground truncate leading-tight">{procedureName}</h1>
            <p className="text-[10px] text-muted-foreground">
              {procedureCategory && `${procedureCategory} · `}Preference Card
            </p>
          </div>
        </div>

        {/* Pending changes banner */}
        {pendingChanges.length > 0 && (
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-400 shrink-0" />
            <p className="text-xs text-amber-300">
              <span className="font-semibold">{pendingChanges.length}</span> pending change{pendingChanges.length !== 1 ? "s" : ""} awaiting doctor approval
            </p>
          </div>
        )}

        {/* Action bars */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setSummaryOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-xs font-medium text-foreground hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all active:scale-[0.98]"
          >
            <ClipboardList size={16} className="text-primary" />
            View Full Preference Card
          </button>
          <button
            onClick={() => setStepsOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-xs font-medium text-foreground hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all active:scale-[0.98]"
          >
            <ListOrdered size={16} className="text-primary" />
            Procedure Steps
            {stepsData.length > 0 && (
              <span className="text-[10px] text-muted-foreground ml-1">({stepsData.length})</span>
            )}
          </button>
          <button
            onClick={() => setChatOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-xs font-medium text-foreground hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all active:scale-[0.98]"
          >
            <MessageSquare size={16} className="text-primary" />
            Team Chat
          </button>
        </div>

        {/* Widget grid */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Preference Categories</h2>
          <div className="grid grid-cols-3 gap-3">
            {categoriesWithPendingCounts.map((cat, i) => (
              <PreferenceCategoryWidget
                key={cat.key}
                category={cat}
                value={preferences[cat.key]}
                fileCount={fileCounts[cat.key]}
                updatedAt={updatedDates[cat.key]}
                onClick={() => handleWidgetClick(cat)}
                index={i}
                pendingCount={cat.pendingCount}
              />
            ))}
          </div>
        </div>
      </motion.div>

      {/* View Preference Drawer */}
      <Drawer open={viewDrawerOpen} onOpenChange={setViewDrawerOpen}>
        <DrawerContent className="bg-card border-border max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle className="text-foreground flex items-center gap-2">
              {viewCategory && (
                <>
                  <viewCategory.icon size={18} className="text-primary" />
                  {viewCategory.label}
                </>
              )}
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 space-y-4 overflow-y-auto">
            {viewCategory && (() => {
              const raw = preferences[viewCategory.key];
              const isFile = viewCategory.type === "file";
              const changesForCat = allChanges.filter(pc => pc.category === viewCategory.key);
              const hasPresets = !!MULTI_SELECT_CATEGORIES[viewCategory.key];

              return (
                <>
                  {/* Rich read-only viewer matching doctor role UIs */}
                  <ReadOnlyPreferenceViewer
                    categoryKey={viewCategory.key}
                    value={raw || ""}
                    fileCount={fileCounts[viewCategory.key]}
                  />

                  {/* Change history */}
                  {changesForCat.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                        Change Requests ({changesForCat.length})
                      </p>
                      {changesForCat.map(pc => (
                        <div key={pc.id} className={`rounded-lg border p-2.5 ${statusColor(pc.status)}`}>
                          <div className="flex items-center gap-1.5 mb-1">
                            {statusIcon(pc.status)}
                            <span className="text-[10px] font-semibold">{statusLabel(pc.status)}</span>
                          </div>
                          <p className="text-xs line-clamp-2">{pc.new_value}</p>
                          <p className="text-[9px] opacity-60 mt-0.5">
                            {new Date(pc.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action buttons */}
                  {!isFile && (
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => openChangeRequest(viewCategory, "change")}
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                      >
                        <PenLine size={14} />
                        Request Change
                      </Button>
                      <Button
                        onClick={() => openChangeRequest(viewCategory, "delete")}
                        variant="outline"
                        className="w-full border-destructive/50 text-destructive hover:bg-destructive/10 gap-2"
                      >
                        <Trash2 size={14} />
                        Request Deletion
                      </Button>
                      {hasPresets && (
                        <Button
                          onClick={() => openPresetLibrary(viewCategory)}
                          variant="outline"
                          className="w-full gap-2"
                        >
                          <Library size={14} />
                          Open Preset Library
                        </Button>
                      )}
                      <Button
                        onClick={() => openChangeRequest(viewCategory, "add_preset")}
                        variant="outline"
                        className="w-full gap-2"
                      >
                        <Plus size={14} />
                        Request New Preset Item
                      </Button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Preset Library Drawer */}
      <Drawer open={presetOpen} onOpenChange={setPresetOpen}>
        <DrawerContent className="bg-card border-border max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle className="text-foreground flex items-center gap-2">
              <Library size={18} className="text-primary" />
              {presetCategory?.label} — Preset Library
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto space-y-2">
            <p className="text-[10px] text-muted-foreground mb-2">
              Select a preset item to submit for doctor approval. It will not go live until approved.
            </p>
            {presetCategory && MULTI_SELECT_CATEGORIES[presetCategory.key]?.map((item) => {
              const isCurrentlySelected = (() => {
                try {
                  const parsed = JSON.parse(preferences[presetCategory.key] || "[]");
                  if (Array.isArray(parsed)) {
                    return parsed.some((p: any) =>
                      (typeof p === "string" ? p : p.name || "") === item.name
                    );
                  }
                } catch {}
                return false;
              })();

              const isPendingForItem = pendingChanges.some(
                pc => pc.category === presetCategory.key && pc.new_value.includes(item.name)
              );

              return (
                <button
                  key={item.name}
                  onClick={() => {
                    if (!isCurrentlySelected && !isPendingForItem) {
                      handlePresetSelect(item.name);
                    }
                  }}
                  disabled={isCurrentlySelected || isPendingForItem || presetSubmitting === item.name}
                  className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                    isCurrentlySelected
                      ? "bg-primary/10 border-primary/30 opacity-70"
                      : isPendingForItem
                      ? "bg-amber-500/10 border-amber-500/30 opacity-70"
                      : "bg-secondary/50 border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                  </div>
                  {isCurrentlySelected ? (
                    <Badge className="bg-primary/20 text-primary border-primary/30 text-[9px] shrink-0">
                      <Check size={10} className="mr-0.5" /> Active
                    </Badge>
                  ) : isPendingForItem ? (
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[9px] shrink-0">
                      <Clock size={10} className="mr-0.5" /> Pending
                    </Badge>
                  ) : presetSubmitting === item.name ? (
                    <span className="text-[10px] text-muted-foreground animate-pulse">Submitting…</span>
                  ) : (
                    <Plus size={16} className="text-muted-foreground shrink-0" />
                  )}
                </button>
              );
            })}

            {presetCategory && !MULTI_SELECT_CATEGORIES[presetCategory.key] && (
              <div className="rounded-lg bg-secondary/50 border border-border p-4 text-center">
                <p className="text-sm text-muted-foreground">No preset library available for {presetCategory.label}</p>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Change / Delete / Add Request Drawer */}
      <Drawer open={changeDrawerOpen} onOpenChange={setChangeDrawerOpen}>
        <DrawerContent className="bg-card border-border">
          <DrawerHeader>
            <DrawerTitle className="text-foreground flex items-center gap-2">
              {changeCategory && (
                <>
                  <changeCategory.icon size={18} className="text-primary" />
                  {getRequestTitle()}: {changeCategory.label}
                </>
              )}
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 space-y-4">
            {changeCategory && preferences[changeCategory.key] && changeType !== "add_preset" && (
              <div className="rounded-lg bg-secondary/50 border border-border p-3">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Current Value</p>
                <p className="text-xs text-foreground line-clamp-3">
                  {formatItems(preferences[changeCategory.key]).join(", ") || preferences[changeCategory.key]}
                </p>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                {changeType === "delete" ? "What should be removed and why?" :
                 changeType === "add_preset" ? "Describe the new preset item" :
                 changeType === "add_step" ? "Describe the step to add" :
                 changeType === "remove_step" ? "Which step should be removed?" :
                 "Describe your suggested change"}
              </label>
              <Textarea
                value={changeText}
                onChange={(e) => setChangeText(e.target.value)}
                placeholder={getRequestPlaceholder()}
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground min-h-[100px] resize-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={isRecording ? stopRecording : startRecording}
                className={`shrink-0 ${isRecording ? "bg-destructive/20 border-destructive/50 text-destructive" : "border-border text-muted-foreground hover:text-primary hover:border-primary/50"}`}
              >
                {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
              </Button>
              {isRecording && (
                <span className="text-[10px] text-destructive animate-pulse">Recording...</span>
              )}
              <div className="flex-1" />
              <Button
                onClick={handleSubmitChange}
                disabled={!changeText.trim() || submitting}
                className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
              >
                <Send size={14} />
                {submitting ? "Submitting..." : "Submit Request"}
              </Button>
            </div>

            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-2.5 flex items-center gap-2">
              <Clock size={14} className="text-amber-400 shrink-0" />
              <p className="text-[10px] text-amber-300">
                This request will be saved as <span className="font-semibold">Pending Doctor Approval</span>. No changes will be applied until approved.
              </p>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Steps Viewer Drawer */}
      <Drawer open={stepsOpen} onOpenChange={setStepsOpen}>
        <DrawerContent className="bg-card border-border max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle className="text-foreground flex items-center gap-2">
              <ListOrdered size={18} className="text-primary" />
              Procedure Steps
              {stepsData.length > 0 && (
                <span className="text-xs text-muted-foreground font-normal">({stepsData.length})</span>
              )}
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto space-y-4">
            {stepsData.length === 0 ? (
              <div className="rounded-lg bg-secondary/50 border border-border p-4 text-center">
                <p className="text-sm text-muted-foreground">No procedure steps defined</p>
              </div>
            ) : (
              <ol className="space-y-2">
                {stepsData.map((step, idx) => {
                  const hasPendingDelete = pendingChanges.some(
                    pc => pc.category === "steps" && pc.new_value.includes("[REMOVE STEP REQUEST]") && pc.new_value.includes(step)
                  );
                  return (
                    <li key={idx} className="flex items-start gap-2 rounded-lg bg-secondary/50 border border-border p-3 group">
                      <div className="flex flex-col items-center gap-0.5 shrink-0 pt-0.5">
                        {idx > 0 && (
                          <button
                            onClick={async () => {
                              if (!procedureId || !user) return;
                              const reordered = [...stepsData];
                              [reordered[idx - 1], reordered[idx]] = [reordered[idx], reordered[idx - 1]];
                              await supabase.from("pending_preference_changes").insert({
                                procedure_id: procedureId,
                                category: "steps",
                                old_value: JSON.stringify(stepsData),
                                new_value: `[REORDER REQUEST] Move step ${idx + 1} ("${step}") up to position ${idx}`,
                                submitted_by: user.id,
                                status: "pending",
                              });
                              toast({ title: "Reorder request submitted", description: "Pending doctor approval." });
                              await fetchData();
                            }}
                            className="p-0.5 rounded hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                            title="Request move up"
                          >
                            <ArrowUp size={12} />
                          </button>
                        )}
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">
                          {idx + 1}
                        </span>
                        {idx < stepsData.length - 1 && (
                          <button
                            onClick={async () => {
                              if (!procedureId || !user) return;
                              await supabase.from("pending_preference_changes").insert({
                                procedure_id: procedureId,
                                category: "steps",
                                old_value: JSON.stringify(stepsData),
                                new_value: `[REORDER REQUEST] Move step ${idx + 1} ("${step}") down to position ${idx + 2}`,
                                submitted_by: user.id,
                                status: "pending",
                              });
                              toast({ title: "Reorder request submitted", description: "Pending doctor approval." });
                              await fetchData();
                            }}
                            className="p-0.5 rounded hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                            title="Request move down"
                          >
                            <ArrowDown size={12} />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-foreground pt-1 flex-1 min-w-0">{step}</p>
                      <div className="flex items-center gap-1 shrink-0 pt-0.5">
                        {hasPendingDelete ? (
                          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[9px]">
                            <Clock size={10} className="mr-0.5" /> Pending
                          </Badge>
                        ) : (
                          <button
                            onClick={async () => {
                              if (!procedureId || !user) return;
                              await supabase.from("pending_preference_changes").insert({
                                procedure_id: procedureId,
                                category: "steps",
                                old_value: step,
                                new_value: `[REMOVE STEP REQUEST] Remove step ${idx + 1}: "${step}"`,
                                submitted_by: user.id,
                                status: "pending",
                              });
                              toast({ title: "Deletion request submitted", description: "Pending doctor approval." });
                              await fetchData();
                            }}
                            className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                            title="Request step deletion"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}

            {/* Add new step inline */}
            <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-2">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Add New Step</p>
              <div className="flex gap-2">
                <Textarea
                  value={newStepText}
                  onChange={(e) => setNewStepText(e.target.value)}
                  placeholder="Describe the new step..."
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground min-h-[60px] resize-none text-sm flex-1"
                />
                <Button
                  onClick={async () => {
                    if (!newStepText.trim() || !procedureId || !user) return;
                    setSubmittingStep(true);
                    await supabase.from("pending_preference_changes").insert({
                      procedure_id: procedureId,
                      category: "steps",
                      old_value: preferences["steps"] || "[]",
                      new_value: `[ADD STEP REQUEST] ${newStepText.trim()}`,
                      submitted_by: user.id,
                      status: "pending",
                    });
                    toast({ title: "Step request submitted", description: "Pending doctor approval." });
                    setNewStepText("");
                    setSubmittingStep(false);
                    await fetchData();
                  }}
                  disabled={!newStepText.trim() || submittingStep}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 self-end"
                  size="sm"
                >
                  <Send size={14} />
                </Button>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={12} className="text-amber-400" />
                <p className="text-[9px] text-amber-400">New steps require doctor approval before going live</p>
              </div>
            </div>

            {/* Pending step changes */}
            {(() => {
              const stepChanges = allChanges.filter(pc => pc.category === "steps");
              if (stepChanges.length === 0) return null;
              return (
                <div className="space-y-2">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Step Change Requests ({stepChanges.length})
                  </p>
                  {stepChanges.map(pc => (
                    <div key={pc.id} className={`rounded-lg border p-2.5 ${statusColor(pc.status)}`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        {statusIcon(pc.status)}
                        <span className="text-[10px] font-semibold">{statusLabel(pc.status)}</span>
                      </div>
                      <p className="text-xs line-clamp-2">{pc.new_value}</p>
                      <p className="text-[9px] opacity-60 mt-0.5">
                        {new Date(pc.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      </p>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Full Preference Card Summary */}
      <PreferenceSummaryDrawer
        open={summaryOpen}
        onOpenChange={setSummaryOpen}
        procedureName={procedureName}
        providerName={doctorName}
        facilityName={facilityName}
        preferences={preferences}
        fileCounts={fileCounts}
        procedureId={procedureId || ""}
        ownerUserId={userId}
      />

      {/* Team Chat */}
      <TeamChatDrawer
        open={chatOpen}
        onOpenChange={setChatOpen}
        procedureId={procedureId || ""}
        procedureName={procedureName}
      />
    </div>
  );
};

export default DoctorProcedureView;
