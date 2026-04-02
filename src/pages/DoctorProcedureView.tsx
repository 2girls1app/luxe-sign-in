import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ClipboardList, User, AlertTriangle, Mic, MicOff, Send } from "lucide-react";
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
import PreferenceSummaryDrawer from "@/components/PreferenceSummaryDrawer";
import NavHeader from "@/components/NavHeader";
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
  const [summaryOpen, setSummaryOpen] = useState(false);

  // Change request state
  const [changeDrawerOpen, setChangeDrawerOpen] = useState(false);
  const [changeCategory, setChangeCategory] = useState<PreferenceCategory | null>(null);
  const [changeText, setChangeText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  const fetchData = useCallback(async () => {
    if (!procedureId || !userId) return;

    const [procRes, profileRes, prefsRes, filesRes, pendingRes] = await Promise.all([
      supabase.from("procedures").select("name, category, facility_id, facilities(name)").eq("id", procedureId).single(),
      supabase.from("profiles").select("display_name, avatar_url").eq("user_id", userId).single(),
      supabase.from("procedure_preferences").select("category, value, updated_at").eq("procedure_id", procedureId),
      supabase.from("procedure_files").select("category").eq("procedure_id", procedureId),
      supabase.from("pending_preference_changes").select("id, category, new_value, old_value, status, created_at, submitted_by").eq("procedure_id", procedureId).eq("status", "pending"),
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
  }, [procedureId, userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Voice-to-text setup
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
    rec.onerror = () => { setIsRecording(false); };
    rec.onend = () => { setIsRecording(false); };
    rec.start();
    setRecognition(rec);
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (recognition) {
      recognition.stop();
      setRecognition(null);
    }
    setIsRecording(false);
  };

  const handleOpenChangeRequest = (cat: PreferenceCategory) => {
    setChangeCategory(cat);
    setChangeText("");
    setChangeDrawerOpen(true);
  };

  const handleSubmitChange = async () => {
    if (!changeCategory || !changeText.trim() || !procedureId || !user) return;
    setSubmitting(true);

    const { error } = await supabase.from("pending_preference_changes").insert({
      procedure_id: procedureId,
      category: changeCategory.key,
      old_value: preferences[changeCategory.key] || "",
      new_value: changeText.trim(),
      submitted_by: user.id,
      status: "pending",
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Change request submitted", description: "The doctor will review your suggestion." });
      setChangeDrawerOpen(false);
      setChangeText("");
      await fetchData();
    }
    setSubmitting(false);
  };

  const categoriesWithPendingCounts = PREFERENCE_CATEGORIES.map(cat => ({
    ...cat,
    pendingCount: pendingChanges.filter(pc => pc.category === cat.key).length,
  }));

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
            {doctorName && (
              <p className="text-[11px] font-medium text-primary truncate">{doctorName}</p>
            )}
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

        {/* View Full Card */}
        <button
          onClick={() => setSummaryOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-xs font-medium text-foreground hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all active:scale-[0.98]"
        >
          <ClipboardList size={16} className="text-primary" />
          View Full Preference Card
        </button>

        {/* Widget grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Preference Categories</h2>
            <p className="text-[10px] text-muted-foreground">Tap to request a change</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {categoriesWithPendingCounts.map((cat, i) => (
              <div key={cat.key} className="relative">
                <PreferenceCategoryWidget
                  category={cat}
                  value={preferences[cat.key]}
                  fileCount={fileCounts[cat.key]}
                  updatedAt={updatedDates[cat.key]}
                  onClick={() => handleOpenChangeRequest(cat)}
                  index={i}
                />
                {cat.pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-[9px] font-bold text-amber-950 z-10">
                    {cat.pendingCount}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Change Request Drawer */}
      <Drawer open={changeDrawerOpen} onOpenChange={setChangeDrawerOpen}>
        <DrawerContent className="bg-card border-border">
          <DrawerHeader>
            <DrawerTitle className="text-foreground flex items-center gap-2">
              {changeCategory && (
                <>
                  <changeCategory.icon size={18} className="text-primary" />
                  Request Change: {changeCategory.label}
                </>
              )}
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 space-y-4">
            {/* Current value preview */}
            {changeCategory && preferences[changeCategory.key] && (
              <div className="rounded-lg bg-secondary/50 border border-border p-3">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Current Value</p>
                <p className="text-xs text-foreground line-clamp-3">
                  {(() => {
                    try {
                      const parsed = JSON.parse(preferences[changeCategory.key]);
                      if (Array.isArray(parsed)) {
                        const names = parsed.map((item: any) => item.name || item.label || item.value || String(item)).filter(Boolean);
                        return names.join(", ") || "Items set";
                      }
                      return preferences[changeCategory.key];
                    } catch {
                      return preferences[changeCategory.key];
                    }
                  })()}
                </p>
              </div>
            )}

            {/* Change description input */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Describe your suggested change
              </label>
              <Textarea
                value={changeText}
                onChange={(e) => setChangeText(e.target.value)}
                placeholder="e.g., Please add 10-blade scalpel to instruments..."
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground min-h-[100px] resize-none"
              />
            </div>

            {/* Voice + Submit */}
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

            <p className="text-[10px] text-muted-foreground text-center">
              Your change request will be sent to the doctor for approval. It will not update the preference card until approved.
            </p>
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
      />
    </div>
  );
};

export default DoctorProcedureView;
