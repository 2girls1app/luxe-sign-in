import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Download, Printer, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PREFERENCE_CATEGORIES } from "@/components/PreferenceCategoryWidget";
import PreferenceDetailDrawer from "@/components/PreferenceDetailDrawer";
import type { PreferenceCategory } from "@/components/PreferenceCategoryWidget";

const SharedPreferenceCard = () => {
  const { procedureId } = useParams<{ procedureId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [procedureName, setProcedureName] = useState("");
  const [providerName, setProviderName] = useState("");
  const [facilityName, setFacilityName] = useState("");
  const [preferences, setPreferences] = useState<Record<string, string>>({});
  const [fileCounts, setFileCounts] = useState<Record<string, number>>({});
  const [loadError, setLoadError] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [editingCategory, setEditingCategory] = useState<PreferenceCategory | null>(null);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchSharedData = useCallback(async () => {
    if (!procedureId || !user) return;
    setPageLoading(true);

    // Check if user owns the procedure OR has been shared access
    const { data: procedure } = await supabase
      .from("procedures")
      .select("name, facility_id, user_id, facilities(name)")
      .eq("id", procedureId)
      .single();

    if (!procedure) {
      setLoadError("You don't have access to this preference card.");
      setPageLoading(false);
      return;
    }

    const ownerUserId = procedure.user_id;
    const userIsOwner = ownerUserId === user.id;
    setIsOwner(userIsOwner);

    if (!userIsOwner) {
      // Check shared access
      const { data: shared } = await supabase
        .from("shared_procedure_cards")
        .select("permission")
        .eq("procedure_id", procedureId)
        .eq("shared_with", user.id)
        .limit(1);

      if (!shared || shared.length === 0) {
        setLoadError("You don't have access to this preference card.");
        setPageLoading(false);
        return;
      }

      setCanEdit(shared[0].permission === "edit");
    }

    setProcedureName(procedure.name);
    setFacilityName((procedure.facilities as any)?.name || "");

    // Get provider name
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", ownerUserId)
      .single();
    if (profile?.display_name) setProviderName(profile.display_name);

    // Get preferences
    const { data: prefs } = await supabase
      .from("procedure_preferences")
      .select("category, value")
      .eq("procedure_id", procedureId);
    if (prefs) {
      const map: Record<string, string> = {};
      prefs.forEach((p: any) => { map[p.category] = p.value; });
      setPreferences(map);
    }

    // Get file counts
    const { data: files } = await supabase
      .from("procedure_files")
      .select("category")
      .eq("procedure_id", procedureId);
    if (files) {
      const counts: Record<string, number> = {};
      files.forEach((f: any) => { counts[f.category] = (counts[f.category] || 0) + 1; });
      setFileCounts(counts);
    }

    setPageLoading(false);
  }, [procedureId, user]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/?redirect=/shared/procedure/${procedureId}`);
      return;
    }
    if (user) fetchSharedData();
  }, [user, authLoading, fetchSharedData, navigate, procedureId]);

  const handleSubmitChange = async (category: string, value: string) => {
    if (!procedureId || !user) return;
    setSaving(true);

    const trimmed = value.trim();
    const oldValue = preferences[category] || "";

    if (trimmed === oldValue) {
      setSaving(false);
      setEditDrawerOpen(false);
      return;
    }

    // Submit as pending change
    const { error } = await supabase
      .from("pending_preference_changes")
      .insert({
        procedure_id: procedureId,
        category,
        old_value: oldValue,
        new_value: trimmed,
        submitted_by: user.id,
      });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Change submitted for approval", description: "The doctor will review your suggestion." });
    }

    setSaving(false);
    setEditDrawerOpen(false);
  };

  const formatMedValue = (val: string): string => {
    try {
      const meds = JSON.parse(val);
      if (Array.isArray(meds)) {
        return meds.map((m: any) => {
          let line = m.name;
          const details: string[] = [];
          if (m.dosage) details.push(m.dosage);
          if (m.route) details.push(m.route);
          if (m.notes) details.push(m.notes);
          if (details.length > 0) line += ` — ${details.join(", ")}`;
          return line;
        }).join("\n");
      }
    } catch {}
    return val;
  };

  const formatItemList = (val: string): string => {
    try {
      const items = JSON.parse(val);
      if (Array.isArray(items)) {
        return items.map((item: any) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object" && item.name) {
            let line = item.name;
            if (item.qty && item.qty > 1) line += ` (Qty: ${item.qty})`;
            if (item.hold) line += ` [HOLD${item.holdQty > 1 ? ` x${item.holdQty}` : ""}]`;
            return line;
          }
          return String(item);
        }).join("\n");
      }
    } catch { /* not JSON */ }
    return val;
  };

  const getDisplayValue = (key: string, val: string): string => {
    if (key === "medication") return formatMedValue(val);
    if (key === "steps") {
      try {
        const steps = JSON.parse(val);
        if (Array.isArray(steps)) return steps.map((s, i) => `${i + 1}. ${s}`).join("\n");
      } catch {}
      return val;
    }
    return formatItemList(val);
  };

  const sectionOrder = [
    { key: "position", label: "Position" },
    { key: "gloves", label: "Glove Size / Style" },
    { key: "equipment", label: "Equipment" },
    { key: "supplies", label: "Supplies" },
    { key: "instruments", label: "Instrumentation" },
    { key: "trays", label: "Trays" },
    { key: "suture", label: "Suture & Usage" },
    { key: "skinprep", label: "Skin Prep" },
    { key: "medication", label: "Medications" },
    { key: "steps", label: "Procedure Steps" },
  ];

  const fileCategories = PREFERENCE_CATEGORIES.filter((c) => c.type === "file");

  const generatePDF = async () => {
    setGenerating(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: "letter" });
      const pw = doc.internal.pageSize.getWidth();
      const ph = doc.internal.pageSize.getHeight();
      const ml = 18;
      const mr = 18;
      const cw = pw - ml - mr;
      let y = 18;

      const drawLine = (yPos: number, weight = 0.3) => {
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(weight);
        doc.line(ml, yPos, pw - mr, yPos);
      };

      const checkPage = (needed: number) => {
        if (y + needed > ph - 18) { doc.addPage(); y = 18; }
      };

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text("PREFERENCE CARD", pw / 2, y, { align: "center" });
      y += 8;
      drawLine(y, 0.6);
      y += 6;

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Surgeon:", ml, y);
      doc.setFont("helvetica", "normal");
      doc.text(providerName || "Not specified", ml + 22, y);
      y += 6;
      doc.setFont("helvetica", "bold");
      doc.text("Procedure:", ml, y);
      doc.setFont("helvetica", "normal");
      doc.text(procedureName || "Not specified", ml + 26, y);
      y += 6;
      doc.setFont("helvetica", "bold");
      doc.text("Facility:", ml, y);
      doc.setFont("helvetica", "normal");
      doc.text(facilityName || "Not specified", ml + 20, y);
      y += 6;
      doc.setFont("helvetica", "bold");
      doc.text("Date:", ml, y);
      doc.setFont("helvetica", "normal");
      doc.text(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), ml + 14, y);
      y += 4;
      drawLine(y, 0.6);
      y += 6;

      sectionOrder.forEach((section) => {
        const val = preferences[section.key];
        checkPage(18);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(section.label.toUpperCase(), ml, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        if (val && val.trim()) {
          const displayVal = getDisplayValue(section.key, val);
          doc.setTextColor(30, 30, 30);
          const lines = doc.splitTextToSize(displayVal, cw);
          lines.forEach((line: string) => { checkPage(6); doc.text(line, ml, y); y += 5; });
        } else {
          doc.setTextColor(140, 140, 140);
          doc.text("Not specified", ml, y);
          y += 5;
        }
        y += 2;
        drawLine(y, 0.2);
        y += 5;
      });

      checkPage(14);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text("ATTACHED FILES", ml, y);
      y += 5;
      fileCategories.forEach((cat) => {
        checkPage(7);
        const count = fileCounts[cat.key] || 0;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(30, 30, 30);
        doc.text(`${cat.label}: ${count > 0 ? `${count} file${count !== 1 ? "s" : ""}` : "None"}`, ml, y);
        y += 5;
      });

      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(160, 160, 160);
        doc.setFont("helvetica", "normal");
        doc.text(`Page ${i} of ${totalPages}`, pw / 2, ph - 10, { align: "center" });
      }

      doc.save(`${procedureName.replace(/\s+/g, "_")}_Preference_Card.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      setGenerating(false);
    }
  };

  if (authLoading || pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Loading preference card…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-4 px-6">
        <p className="text-muted-foreground text-sm text-center">{loadError}</p>
        <Button variant="outline" onClick={() => navigate("/profile")}>Go to Profile</Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 pt-8 pb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-2xl mx-auto flex flex-col gap-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-card transition-colors text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-lg font-medium text-foreground">{procedureName}</h1>
              <p className="text-xs text-muted-foreground">
                Shared Preference Card
                {canEdit && !isOwner && (
                  <span className="ml-1.5 text-primary">· Can suggest edits</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => window.print()}>
              <Printer size={14} />
              Print
            </Button>
            <Button size="sm" className="gap-1.5 text-xs" onClick={generatePDF} disabled={generating}>
              <Download size={14} />
              {generating ? "Generating…" : "PDF"}
            </Button>
          </div>
        </div>

        {/* Card content */}
        <div className="bg-white text-black rounded-lg border border-gray-200 p-6 space-y-0">
          <div className="text-center border-b border-black pb-3 mb-4">
            <h2 className="text-lg font-bold tracking-wide text-black">PREFERENCE CARD</h2>
          </div>

          <div className="space-y-1 text-sm border-b border-black pb-3 mb-4">
            <p><span className="font-bold">Surgeon:</span> {providerName || "Not specified"}</p>
            <p><span className="font-bold">Procedure:</span> {procedureName}</p>
            <p><span className="font-bold">Facility:</span> {facilityName || "Not specified"}</p>
            <p><span className="font-bold">Date:</span> {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
          </div>

          {sectionOrder.map((section) => {
            const val = preferences[section.key];
            const prefCategory = PREFERENCE_CATEGORIES.find((c) => c.key === section.key);
            const canEditSection = canEdit && !isOwner && prefCategory && prefCategory.type !== "file";

            return (
              <div key={section.key} className="border-b border-gray-200 py-2.5 group">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-black">{section.label}</p>
                  {canEditSection && (
                    <button
                      onClick={() => {
                        if (prefCategory) {
                          setEditingCategory(prefCategory);
                          setEditDrawerOpen(true);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100"
                    >
                      <Pencil size={12} className="text-gray-500" />
                    </button>
                  )}
                </div>
                {val && val.trim() ? (
                  <p className="text-sm text-gray-800 whitespace-pre-wrap mt-0.5">{getDisplayValue(section.key, val)}</p>
                ) : (
                  <p className="text-sm text-gray-400 italic mt-0.5">Not specified</p>
                )}
              </div>
            );
          })}

          <div className="pt-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-black mb-2">Attached Files</p>
            {fileCategories.map((cat) => {
              const count = fileCounts[cat.key] || 0;
              return (
                <p key={cat.key} className="text-sm text-gray-800">
                  {cat.label}: {count > 0 ? `${count} file${count !== 1 ? "s" : ""}` : "None"}
                </p>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Edit drawer for suggesting changes */}
      {editingCategory && (
        <PreferenceDetailDrawer
          open={editDrawerOpen}
          onOpenChange={setEditDrawerOpen}
          category={editingCategory}
          currentValue={preferences[editingCategory.key] || ""}
          onSave={handleSubmitChange}
          saving={saving}
        />
      )}
    </div>
  );
};

export default SharedPreferenceCard;
