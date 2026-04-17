import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ClipboardList, ListOrdered, Share2, MessageSquare, CheckCircle2, Music, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useSmartSuggestions } from "@/hooks/useSmartSuggestions";
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
import MusicPreferencesDrawer from "@/components/MusicPreferencesDrawer";
import SalesRepDrawer from "@/components/SalesRepDrawer";
import AnesthesiaDrawer from "@/components/AnesthesiaDrawer";

const ProcedurePreferences = () => {
  const { procedureId } = useParams<{ procedureId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  // Track procedure owner for individual users editing doctor's procedures
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [ownerResolved, setOwnerResolved] = useState(false);
  const accountType = user?.user_metadata?.account_type;
  const isIndividual = accountType === "individual" || (!profile?.facility_id && !accountType);
  // effectiveUserId: for individual users editing another user's procedure, use the owner's id
  const effectiveUserId = (isIndividual && ownerId && ownerId !== user?.id) ? ownerId : user?.id;

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
  const [chatOpen, setChatOpen] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [togglingComplete, setTogglingComplete] = useState(false);
  const [musicOpen, setMusicOpen] = useState(false);
  const [musicCount, setMusicCount] = useState(0);
  const [salesRepOpen, setSalesRepOpen] = useState(false);
  const [anesthesiaOpen, setAnesthesiaOpen] = useState(false);
  const [specialty, setSpecialty] = useState("");
  const [procedureFacilityId, setProcedureFacilityId] = useState<string | null>(null);
  const [aiPrefilling, setAiPrefilling] = useState(false);
  const [aiPrefilled, setAiPrefilled] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  // Step 1: Fetch procedure (resolves ownerId)
  const fetchProcedure = useCallback(async () => {
    if (!procedureId || !user) return;
    setPageLoading(true);
    setPageError(null);
    try {
      const { data, error } = await supabase
        .from("procedures")
        .select("name, facility_id, user_id, is_complete, category, facilities(name)")
        .eq("id", procedureId)
        .single();
      if (error) throw error;
      if (data) {
        setProcedureName(data.name);
        setFacilityName((data.facilities as { name: string } | null)?.name || "");
        setIsComplete(data.is_complete);
        setIsOwner(data.user_id === user.id);
        setOwnerId(data.user_id);
        setSpecialty(data.category || "");
        setProcedureFacilityId(data.facility_id);
        setOwnerResolved(true);
      } else {
        navigate("/profile");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load procedure";
      setPageError(message);
      console.error("fetchProcedure error:", err);
    } finally {
      setPageLoading(false);
    }
  }, [procedureId, user, navigate]);

  // Step 2: Dependent fetches — only run after ownerId is resolved
  const fetchPreferences = useCallback(async () => {
    if (!procedureId || !effectiveUserId || !ownerResolved) return;
    const { data } = await supabase
      .from("procedure_preferences")
      .select("category, value, updated_at")
      .eq("procedure_id", procedureId)
      .eq("user_id", effectiveUserId);
    if (data) {
      const map: Record<string, string> = {};
      const dates: Record<string, string> = {};
      data.forEach((d) => { map[d.category] = d.value; dates[d.category] = d.updated_at; });
      setPreferences(map);
      setUpdatedDates(dates);
    }
  }, [procedureId, effectiveUserId, ownerResolved]);

  const fetchFileCounts = useCallback(async () => {
    if (!procedureId || !effectiveUserId || !ownerResolved) return;
    const { data } = await supabase
      .from("procedure_files")
      .select("category")
      .eq("procedure_id", procedureId)
      .eq("user_id", effectiveUserId);
    if (data) {
      const counts: Record<string, number> = {};
      data.forEach((d) => { counts[d.category] = (counts[d.category] || 0) + 1; });
      setFileCounts(counts);
    }
  }, [procedureId, effectiveUserId, ownerResolved]);

  const fetchProviderName = useCallback(async () => {
    if (!effectiveUserId || !ownerResolved) return;
    const { data } = await supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("user_id", effectiveUserId)
      .single();
    if (data?.display_name) setProviderName(data.display_name);
    if (data?.avatar_url) setProviderAvatar(data.avatar_url);
  }, [effectiveUserId, ownerResolved]);

  const fetchMusicCount = useCallback(async () => {
    if (!effectiveUserId || !ownerResolved) return;
    const { count } = await supabase
      .from("music_preferences")
      .select("id", { count: "exact", head: true })
      .eq("user_id", effectiveUserId);
    setMusicCount(count || 0);
  }, [effectiveUserId, ownerResolved]);

  // Fetch procedure first (resolves owner)
  useEffect(() => {
    fetchProcedure();
  }, [fetchProcedure]);

  // Dependent fetches: wait for ownerResolved
  useEffect(() => {
    if (!ownerResolved) return;
    fetchPreferences();
    fetchFileCounts();
    fetchProviderName();
    fetchMusicCount();
  }, [ownerResolved, fetchPreferences, fetchFileCounts, fetchProviderName, fetchMusicCount]);

  // Smart suggestions: only fetch when a drawer needing suggestions is open
  const isDrawerWithSuggestionsOpen = drawerOpen || medicationOpen;
  const activeCategoryKey = selectedCategory?.key || "";
  const { procedureSuggestions, specialtySuggestions } = useSmartSuggestions(
    procedureName,
    specialty,
    activeCategoryKey,
    procedureFacilityId,
    isDrawerWithSuggestionsOpen
  );

  const handleSave = async (category: string, value: string) => {
    if (!procedureId || !user || !effectiveUserId) return;
    setSaving(true);
    
    const trimmed = value.trim();
    
    if (!trimmed) {
      await supabase
        .from("procedure_preferences")
        .delete()
        .eq("procedure_id", procedureId)
        .eq("category", category)
        .eq("user_id", effectiveUserId);
    } else {
      const { error } = await supabase
        .from("procedure_preferences")
        .upsert(
          {
            procedure_id: procedureId,
            user_id: effectiveUserId,
            category,
            value: trimmed,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "procedure_id,user_id,category" }
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
    if (cat.key === "anesthesia") {
      setAnesthesiaOpen(true);
    } else if (cat.key === "medication") {
      setMedicationOpen(true);
    } else if (cat.key === "steps") {
      setStepsOpen(true);
    } else if (cat.key === "sales_rep") {
      setSalesRepOpen(true);
    } else if (cat.type === "file") {
      setFileDrawerOpen(true);
    } else {
      setDrawerOpen(true);
    }
  };

  const handleAiPrefill = async () => {
    if (!procedureId || !user || !effectiveUserId || aiPrefilling) return;
    setAiPrefilling(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-prefill-preferences", {
        body: { procedureName, specialty },
      });
      if (error) throw error;
      const suggestions = data?.suggestions;
      if (!suggestions) throw new Error("No suggestions returned");

      const categoryMap: Record<string, string> = {};

      for (const key of ["skinprep", "equipment", "instruments", "trays", "supplies", "medication"]) {
        if (suggestions[key] && Array.isArray(suggestions[key]) && suggestions[key].length > 0) {
          categoryMap[key] = JSON.stringify(suggestions[key].map((name: string) => ({ name })));
        }
      }

      if (suggestions.suture && Array.isArray(suggestions.suture) && suggestions.suture.length > 0) {
        categoryMap["suture"] = JSON.stringify(suggestions.suture.map((name: string) => ({ name })));
      }

      if (suggestions.position) categoryMap["position"] = suggestions.position;
      if (suggestions.gloves) categoryMap["gloves"] = suggestions.gloves;

      const upserts = Object.entries(categoryMap).map(([category, value]) => ({
        procedure_id: procedureId,
        user_id: effectiveUserId,
        category,
        value,
        updated_at: new Date().toISOString(),
      }));

      if (upserts.length > 0) {
        const { error: upsertError } = await supabase
          .from("procedure_preferences")
          .upsert(upserts, { onConflict: "procedure_id,user_id,category" });
        if (upsertError) throw upsertError;
      }

      await fetchPreferences();
      setAiPrefilled(true);
      toast({ title: "AI Suggestions Applied", description: `${upserts.length} categories prefilled. Review and edit as needed.` });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Please try again.";
      console.error("AI prefill error:", err);
      toast({ title: "AI prefill failed", description: message, variant: "destructive" });
    } finally {
      setAiPrefilling(false);
    }
  };

  const canManageCard = isOwner || isIndividual;

  const toggleComplete = async () => {
    if (!procedureId || !user || !canManageCard || !effectiveUserId) return;
    setTogglingComplete(true);
    const newVal = !isComplete;
    const { error } = await supabase
      .from("procedures")
      .update({
        is_complete: newVal,
        completed_at: newVal ? new Date().toISOString() : null,
        completed_by: newVal ? user.id : null,
      })
      .eq("id", procedureId)
      .eq("user_id", effectiveUserId);
    if (!error) {
      setIsComplete(newVal);
      toast({ title: newVal ? "Card marked complete" : "Card marked incomplete" });
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        user_email: user.email || "",
        user_name: providerName,
        action: newVal ? "marked_card_complete" : "marked_card_incomplete",
        entity_type: "procedure",
        entity_id: procedureId,
        details: { procedure_name: procedureName },
      });
    }
    setTogglingComplete(false);
  };

  // Loading state
  if (pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (pageError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-4 px-6">
        <AlertCircle size={40} className="text-destructive" />
        <p className="text-sm text-muted-foreground text-center">{pageError}</p>
        <button
          onClick={() => { setPageError(null); fetchProcedure(); }}
          className="text-sm text-primary underline"
        >
          Retry
        </button>
      </div>
    );
  }

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
            <Avatar className="h-9 w-9 shrink-0 border border-primary/30">
              <AvatarFallback className="bg-primary/15 text-primary text-sm font-semibold">
                {(providerName || "?").split(" ").map(n => n.charAt(0).toUpperCase()).slice(0, 2).join("")}
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
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={() => setMusicOpen(true)}
              className="relative p-2 rounded-full hover:bg-card transition-colors text-muted-foreground hover:text-primary"
              aria-label="Music preferences"
            >
              <Music size={18} />
              {musicCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-primary text-[9px] font-semibold text-primary-foreground flex items-center justify-center">
                  {musicCount}
                </span>
              )}
            </button>
            {canManageCard && (
              <button
                onClick={handleAiPrefill}
                disabled={aiPrefilling}
                className="p-2 rounded-full hover:bg-card transition-colors text-muted-foreground hover:text-primary disabled:opacity-50"
                aria-label="Prefill with AI"
              >
                {aiPrefilling ? (
                  <Loader2 size={18} className="animate-spin text-primary" />
                ) : (
                  <Sparkles size={18} className={aiPrefilled ? "text-primary" : ""} />
                )}
              </button>
            )}
            <button
              onClick={() => setShareOpen(true)}
              className="p-2 rounded-full hover:bg-card transition-colors text-muted-foreground hover:text-primary"
              aria-label="Share preference card"
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>

        {/* Complete status - hidden for Individual users */}
        {!isIndividual && isComplete && (
          <div
            onClick={canManageCard ? toggleComplete : undefined}
            className={`flex items-center justify-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-2.5 ${canManageCard ? "cursor-pointer hover:bg-green-500/20 transition-colors" : ""}`}
          >
            <CheckCircle2 size={16} className="text-green-400" />
            <span className="text-xs font-medium text-green-400">Card Complete</span>
            {canManageCard && <span className="text-[10px] text-green-400/60 ml-1">(click to undo)</span>}
          </div>
        )}

        {!isIndividual && canManageCard && !isComplete && (
          <button
            onClick={toggleComplete}
            disabled={togglingComplete}
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-medium text-muted-foreground hover:border-green-500/50 hover:text-green-400 transition-all active:scale-[0.98]"
          >
            <CheckCircle2 size={16} />
            Mark Card Complete
          </button>
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
            {preferences["steps"] && (() => {
              try {
                const parsed = JSON.parse(preferences["steps"]);
                if (Array.isArray(parsed) && parsed.length > 0)
                  return <span className="text-[10px] text-muted-foreground ml-1">({parsed.length})</span>;
              } catch {}
              return null;
            })()}
          </button>
          {!isIndividual && (
            <button
              onClick={() => setChatOpen(true)}
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-xs font-medium text-foreground hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all active:scale-[0.98]"
            >
              <MessageSquare size={16} className="text-primary" />
              Team Chat
            </button>
          )}
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
        procedureSuggestions={procedureSuggestions}
        specialtySuggestions={specialtySuggestions}
        procedureName={procedureName}
        specialtyName={specialty}
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
        procedureSuggestions={procedureSuggestions}
        specialtySuggestions={specialtySuggestions}
        procedureName={procedureName}
        specialtyName={specialty}
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
        isComplete={isComplete}
      />

      <SharePreferenceCardDrawer
        open={shareOpen}
        onOpenChange={setShareOpen}
        procedureId={procedureId || ""}
        procedureName={procedureName}
      />

      <TeamChatDrawer
        open={chatOpen}
        onOpenChange={setChatOpen}
        procedureId={procedureId || ""}
        procedureName={procedureName}
      />

      <MusicPreferencesDrawer
        open={musicOpen}
        onOpenChange={(open) => { setMusicOpen(open); if (!open) fetchMusicCount(); }}
        doctorUserId={effectiveUserId}
      />

      <SalesRepDrawer
        open={salesRepOpen}
        onOpenChange={(open) => { setSalesRepOpen(open); }}
        currentValue={preferences["sales_rep"] || ""}
        onSave={handleSave}
        saving={saving}
        procedureId={procedureId || ""}
      />

      <AnesthesiaDrawer
        open={anesthesiaOpen}
        onOpenChange={setAnesthesiaOpen}
        currentValue={preferences["anesthesia"] || ""}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
};

export default ProcedurePreferences;
