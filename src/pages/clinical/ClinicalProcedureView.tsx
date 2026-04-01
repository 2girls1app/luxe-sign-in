import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ClipboardList, User, FileEdit, Mic, MicOff, Send } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import NavHeader from "@/components/NavHeader";
import PreferenceSummaryDrawer from "@/components/PreferenceSummaryDrawer";
import { PREFERENCE_CATEGORIES } from "@/components/PreferenceCategoryWidget";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

const ClinicalProcedureView = () => {
  const { procedureId } = useParams<{ procedureId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [procedureName, setProcedureName] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [doctorAvatar, setDoctorAvatar] = useState("");
  const [facilityName, setFacilityName] = useState("");
  const [preferences, setPreferences] = useState<Record<string, string>>({});
  const [fileCounts, setFileCounts] = useState<Record<string, number>>({});
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestCategory, setRequestCategory] = useState("");
  const [requestNote, setRequestNote] = useState("");
  const [requestNewValue, setRequestNewValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  const fetchData = useCallback(async () => {
    if (!procedureId) return;

    const { data: proc } = await supabase
      .from("procedures")
      .select("name, user_id, facility_id, facilities(name)")
      .eq("id", procedureId)
      .single();

    if (proc) {
      setProcedureName(proc.name);
      setFacilityName((proc.facilities as any)?.name || "");

      // Fetch doctor profile
      const { data: docProfile } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("user_id", proc.user_id)
        .single();
      if (docProfile) {
        setDoctorName(docProfile.display_name || "");
        setDoctorAvatar(docProfile.avatar_url || "");
      }

      // Fetch preferences
      const { data: prefs } = await supabase
        .from("procedure_preferences")
        .select("category, value")
        .eq("procedure_id", procedureId);
      if (prefs) {
        const map: Record<string, string> = {};
        prefs.forEach((p: any) => { map[p.category] = p.value; });
        setPreferences(map);
      }

      // Fetch file counts
      const { data: files } = await supabase
        .from("procedure_files")
        .select("category")
        .eq("procedure_id", procedureId);
      if (files) {
        const counts: Record<string, number> = {};
        files.forEach((f: any) => { counts[f.category] = (counts[f.category] || 0) + 1; });
        setFileCounts(counts);
      }
    }
  }, [procedureId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Voice-to-text
  useEffect(() => {
    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = (event: any) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setRequestNote(transcript);
      };
      rec.onend = () => setIsListening(false);
      setRecognition(rec);
    }
  }, []);

  const toggleVoice = () => {
    if (!recognition) return;
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const openRequestChange = (categoryKey: string) => {
    setRequestCategory(categoryKey);
    setRequestNewValue(preferences[categoryKey] || "");
    setRequestNote("");
    setRequestOpen(true);
  };

  const submitChangeRequest = async () => {
    if (!procedureId || !user || !requestCategory) return;
    setSubmitting(true);

    const { error } = await supabase
      .from("pending_preference_changes")
      .insert({
        procedure_id: procedureId,
        submitted_by: user.id,
        category: requestCategory,
        old_value: preferences[requestCategory] || "",
        new_value: requestNote ? `${requestNewValue}\n\n[Note: ${requestNote}]` : requestNewValue,
        status: "pending",
      });

    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Change request submitted", description: "The doctor will review your request." });
      setRequestOpen(false);
      // Log audit
      supabase.from("audit_logs").insert({
        user_id: user.id,
        user_email: user.email || "",
        user_name: profile?.display_name || "",
        action: "submitted_change_request",
        entity_type: "preference_card",
        entity_id: procedureId,
        details: { category: requestCategory },
      } as any).then(() => {});
    }
  };

  const getCategoryLabel = (key: string) => {
    return PREFERENCE_CATEGORIES.find(c => c.key === key)?.label || key;
  };

  // Parse preference items for display
  const parseItems = (value: string): string[] => {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => {
          if (typeof item === "string") return item;
          if (item.name) return item.qty && item.qty > 1 ? `${item.name} (×${item.qty})` : item.name;
          return JSON.stringify(item);
        });
      }
    } catch {}
    return value ? [value] : [];
  };

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 pt-16 pb-8">
      <NavHeader />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm mx-auto flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-card transition-colors text-muted-foreground hover:text-foreground shrink-0">
            <ArrowLeft size={20} />
          </button>
          <Avatar className="h-9 w-9 shrink-0 border border-border">
            <AvatarImage src={doctorAvatar} alt={doctorName} />
            <AvatarFallback className="bg-card text-muted-foreground"><User size={16} /></AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            {doctorName && <p className="text-[11px] font-medium text-primary truncate">{doctorName}</p>}
            <h1 className="text-base font-medium text-foreground truncate leading-tight">{procedureName}</h1>
            <p className="text-[10px] text-muted-foreground">Preference Card</p>
          </div>
        </div>

        {/* View Full Card + Print */}
        <button
          onClick={() => setSummaryOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-xs font-medium text-foreground hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all active:scale-[0.98]"
        >
          <ClipboardList size={16} className="text-primary" />
          View Full Preference Card & Print
        </button>

        {/* Preference categories with request change */}
        <div className="flex flex-col gap-3">
          {PREFERENCE_CATEGORIES.filter(c => c.type !== "file").map((cat) => {
            const items = parseItems(preferences[cat.key] || "");
            return (
              <div key={cat.key} className="rounded-xl bg-card border border-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <cat.icon size={16} className="text-primary" />
                    <p className="text-sm font-medium text-foreground">{cat.label}</p>
                  </div>
                  <button
                    onClick={() => openRequestChange(cat.key)}
                    className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 transition-colors"
                  >
                    <FileEdit size={12} />
                    Request Change
                  </button>
                </div>
                {items.length > 0 ? (
                  <ul className="space-y-1">
                    {items.slice(0, 5).map((item, i) => (
                      <li key={i} className="text-xs text-muted-foreground">• {item}</li>
                    ))}
                    {items.length > 5 && (
                      <li className="text-xs text-muted-foreground/60">+{items.length - 5} more</li>
                    )}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground/60 italic">No items set</p>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Summary / Print Drawer */}
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

      {/* Request Change Drawer */}
      <Drawer open={requestOpen} onOpenChange={setRequestOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>Request Change — {getCategoryLabel(requestCategory)}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 flex flex-col gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Suggested Change</label>
              <textarea
                value={requestNewValue}
                onChange={(e) => setRequestNewValue(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                placeholder="Describe the change you'd like to make..."
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 flex items-center gap-2">
                Notes / Comments
                {recognition && (
                  <button onClick={toggleVoice} className={`p-1 rounded-full transition-colors ${isListening ? "text-destructive" : "text-muted-foreground hover:text-primary"}`}>
                    {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                  </button>
                )}
              </label>
              <textarea
                value={requestNote}
                onChange={(e) => setRequestNote(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                placeholder="Add notes or speak using the mic..."
              />
              {isListening && <p className="text-xs text-destructive mt-1 animate-pulse">🎙️ Listening...</p>}
            </div>
            <button
              onClick={submitChangeRequest}
              disabled={submitting || !requestNewValue.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Send size={14} />
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
            <p className="text-[10px] text-muted-foreground text-center">
              This request will be sent to the doctor for approval
            </p>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default ClinicalProcedureView;
