import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ClipboardList, ListOrdered, Share2, User, MessageSquare } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import PreferenceCategoryWidget, {
  PREFERENCE_CATEGORIES,
  type PreferenceCategory,
} from "@/components/PreferenceCategoryWidget";
import PreferenceDetailDrawer from "@/components/PreferenceDetailDrawer";
import FileUploadDrawer from "@/components/FileUploadDrawer";
import PreferenceSummaryDrawer from "@/components/PreferenceSummaryDrawer";
import MedicationSelector from "@/components/MedicationSelector";
import StepsDrawer from "@/components/StepsDrawer";
import SharePreferenceCardDrawer from "@/components/SharePreferenceCardDrawer";
import TeamChatDrawer from "@/components/TeamChatDrawer";

const ProcedurePreferences = () => {
  const { procedureId } = useParams<{ procedureId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [procedureName, setProcedureName] = useState("");
  const [preferences, setPreferences] = useState<Record<string, string>>({});
  const [updatedDates, setUpdatedDates] = useState<Record<string, string>>({});
  const [selectedCategory, setSelectedCategory] = useState<PreferenceCategory | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [fileDrawerOpen, setFileDrawerOpen] = useState(false);
  const [medicationOpen, setMedicationOpen] = useState(false);
  const [stepsOpen, setStepsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fileCounts, setFileCounts] = useState<Record<string, number>>({});
  const [providerName, setProviderName] = useState("");
  const [providerAvatar, setProviderAvatar] = useState("");
  const [facilityName, setFacilityName] = useState("");
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const fetchProcedure = useCallback(async () => {
    if (!procedureId || !user) return;
    const { data } = await supabase
      .from("procedures")
      .select("name, facility_id, facilities(name)")
      .eq("id", procedureId)
      .eq("user_id", user.id)
      .single();
    if (data) {
      setProcedureName(data.name);
      setFacilityName((data.facilities as any)?.name || "");
    } else navigate("/profile");
  }, [procedureId, user, navigate]);

  const fetchPreferences = useCallback(async () => {
    if (!procedureId || !user) return;
    const { data } = await supabase
      .from("procedure_preferences")
      .select("category, value, updated_at")
      .eq("procedure_id", procedureId)
      .eq("user_id", user.id);
    if (data) {
      const map: Record<string, string> = {};
      const dates: Record<string, string> = {};
      data.forEach((d: any) => { map[d.category] = d.value; dates[d.category] = d.updated_at; });
      setPreferences(map);
      setUpdatedDates(dates);
    }
  }, [procedureId, user]);

  const fetchFileCounts = useCallback(async () => {
    if (!procedureId || !user) return;
    const { data } = await supabase
      .from("procedure_files")
      .select("category")
      .eq("procedure_id", procedureId)
      .eq("user_id", user.id);
    if (data) {
      const counts: Record<string, number> = {};
      data.forEach((d: any) => { counts[d.category] = (counts[d.category] || 0) + 1; });
      setFileCounts(counts);
    }
  }, [procedureId, user]);

  const fetchProviderName = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("user_id", user.id)
      .single();
    if (data?.display_name) setProviderName(data.display_name);
    if (data?.avatar_url) setProviderAvatar(data.avatar_url);
  }, [user]);

  useEffect(() => {
    fetchProcedure();
    fetchPreferences();
    fetchFileCounts();
    fetchProviderName();
  }, [fetchProcedure, fetchPreferences, fetchFileCounts, fetchProviderName]);

  const handleSave = async (category: string, value: string) => {
    if (!procedureId || !user) return;
    setSaving(true);
    
    const trimmed = value.trim();
    
    if (!trimmed) {
      // Delete if empty
      await supabase
        .from("procedure_preferences")
        .delete()
        .eq("procedure_id", procedureId)
        .eq("category", category)
        .eq("user_id", user.id);
    } else {
      // Upsert
      const { error } = await supabase
        .from("procedure_preferences")
        .upsert(
          {
            procedure_id: procedureId,
            user_id: user.id,
            category,
            value: trimmed,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "procedure_id,category" }
        );
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        setSaving(false);
        return;
      }
    }

    toast({ title: "Preference saved" });
    await fetchPreferences();
    setSaving(false);
    setDrawerOpen(false);
    setMedicationOpen(false);
  };

  const openCategory = (cat: PreferenceCategory) => {
    setSelectedCategory(cat);
    if (cat.key === "medication") {
      setMedicationOpen(true);
    } else if (cat.key === "steps") {
      setStepsOpen(true);
    } else if (cat.type === "file") {
      setFileDrawerOpen(true);
    } else {
      setDrawerOpen(true);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 pt-8 pb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm mx-auto flex flex-col gap-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/profile")}
              className="p-2 rounded-full hover:bg-card transition-colors text-muted-foreground hover:text-foreground shrink-0"
            >
              <ArrowLeft size={20} />
            </button>
            <Avatar className="h-9 w-9 shrink-0 border border-border">
              <AvatarImage src={providerAvatar} alt={providerName} />
              <AvatarFallback className="bg-card text-muted-foreground">
                <User size={16} />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              {providerName && (
                <p className="text-[11px] font-medium text-primary truncate">{providerName}</p>
              )}
              <h1 className="text-base font-medium text-foreground truncate leading-tight">{procedureName}</h1>
              <div className="flex items-center gap-1.5">
                <p className="text-[10px] text-muted-foreground">Procedure Preferences</p>
                {(() => {
                  const allDates = Object.values(updatedDates).filter(Boolean);
                  if (allDates.length === 0) return null;
                  const latest = allDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
                  const formatUpdatedDate = (dateStr: string) => {
                    const diffMs = new Date().getTime() - new Date(dateStr).getTime();
                    const diffMins = Math.floor(diffMs / 60000);
                    const diffHours = Math.floor(diffMs / 3600000);
                    const diffDays = Math.floor(diffMs / 86400000);
                    if (diffMins < 1) return "Just now";
                    if (diffMins < 60) return `${diffMins}m ago`;
                    if (diffHours < 24) return `${diffHours}h ago`;
                    if (diffDays < 7) return `${diffDays}d ago`;
                    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  };
                  return (
                    <>
                      <span className="text-[10px] text-muted-foreground/40">·</span>
                      <p className="text-[10px] text-muted-foreground/60">{formatUpdatedDate(latest)}</p>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
          <button
            onClick={() => setShareOpen(true)}
            className="p-2 rounded-full hover:bg-card transition-colors text-muted-foreground hover:text-primary shrink-0"
          >
            <Share2 size={20} />
          </button>
        </div>

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
            {preferences["steps"] && (() => {
              try {
                const parsed = JSON.parse(preferences["steps"]);
                if (Array.isArray(parsed) && parsed.length > 0)
                  return <span className="text-[10px] text-muted-foreground ml-1">({parsed.length})</span>;
              } catch {}
              return null;
            })()}
          </button>
        </div>

        {/* Widget grid - 3 per row */}
        <div className="grid grid-cols-3 gap-3">
          {PREFERENCE_CATEGORIES.map((cat, i) => (
              <PreferenceCategoryWidget
                key={cat.key}
                category={cat}
                value={preferences[cat.key]}
                fileCount={fileCounts[cat.key]}
                updatedAt={updatedDates[cat.key]}
                onClick={() => openCategory(cat)}
                index={i}
              />
          ))}
        </div>
      </motion.div>

      <PreferenceDetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        category={selectedCategory}
        currentValue={selectedCategory ? (preferences[selectedCategory.key] || "") : ""}
        onSave={handleSave}
        saving={saving}
      />

      <FileUploadDrawer
        open={fileDrawerOpen}
        onOpenChange={setFileDrawerOpen}
        category={selectedCategory}
        procedureId={procedureId || ""}
        onFilesChanged={fetchFileCounts}
      />

      <MedicationSelector
        open={medicationOpen}
        onOpenChange={setMedicationOpen}
        currentValue={preferences["medication"] || ""}
        onSave={handleSave}
        saving={saving}
      />

      <StepsDrawer
        open={stepsOpen}
        onOpenChange={setStepsOpen}
        currentValue={preferences["steps"] || ""}
        onSave={handleSave}
        saving={saving}
      />

      <PreferenceSummaryDrawer
        open={summaryOpen}
        onOpenChange={setSummaryOpen}
        procedureName={procedureName}
        providerName={providerName}
        facilityName={facilityName}
        preferences={preferences}
        fileCounts={fileCounts}
        procedureId={procedureId || ""}
      />

      <SharePreferenceCardDrawer
        open={shareOpen}
        onOpenChange={setShareOpen}
        procedureId={procedureId || ""}
        procedureName={procedureName}
      />
    </div>
  );
};

export default ProcedurePreferences;
