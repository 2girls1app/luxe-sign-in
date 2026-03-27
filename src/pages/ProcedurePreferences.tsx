import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ClipboardList } from "lucide-react";
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
  const [saving, setSaving] = useState(false);
  const [fileCounts, setFileCounts] = useState<Record<string, number>>({});
  const [providerName, setProviderName] = useState("");
  const [facilityName, setFacilityName] = useState("");
  const [summaryOpen, setSummaryOpen] = useState(false);

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
      .select("display_name")
      .eq("user_id", user.id)
      .single();
    if (data?.display_name) setProviderName(data.display_name);
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
  };

  const openCategory = (cat: PreferenceCategory) => {
    setSelectedCategory(cat);
    if (cat.type === "file") {
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
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/profile")}
            className="p-2 rounded-full hover:bg-card transition-colors text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-medium text-foreground truncate">{procedureName}</h1>
            <p className="text-xs text-muted-foreground">Procedure Preferences</p>
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
              return <p className="text-[10px] text-muted-foreground/60">Last update: {formatUpdatedDate(latest)}</p>;
            })()}
          </div>
        </div>

        {/* View All button */}
        <button
          onClick={() => setSummaryOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-xs font-medium text-foreground hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all active:scale-[0.98]"
        >
          <ClipboardList size={16} className="text-primary" />
          View All Preferences
        </button>

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

      <PreferenceSummaryDrawer
        open={summaryOpen}
        onOpenChange={setSummaryOpen}
        procedureName={procedureName}
        providerName={providerName}
        preferences={preferences}
        fileCounts={fileCounts}
      />
    </div>
  );
};

export default ProcedurePreferences;
