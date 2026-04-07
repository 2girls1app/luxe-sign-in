import { useState, useEffect, useCallback } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Download, Printer, Image, CheckSquare, Square, X, CheckCircle2 } from "lucide-react";
import { PREFERENCE_CATEGORIES } from "@/components/PreferenceCategoryWidget";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PhotoFile {
  id: string;
  file_name: string;
  file_path: string;
  mime_type: string | null;
  category: string;
}

interface PreferenceSummaryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  procedureName: string;
  providerName: string;
  facilityName: string;
  preferences: Record<string, string>;
  fileCounts: Record<string, number>;
  procedureId: string;
  ownerUserId?: string;
  isComplete?: boolean;
}

const PreferenceSummaryDrawer = ({
  open,
  onOpenChange,
  procedureName,
  providerName,
  facilityName,
  preferences,
  fileCounts,
  procedureId,
  ownerUserId,
  isComplete,
}: PreferenceSummaryDrawerProps) => {
  const { user } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [showPhotoPrint, setShowPhotoPrint] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());

  const fetchPhotos = useCallback(async () => {
    if (!procedureId || !user) return;
    const fileUserId = ownerUserId || user.id;
    const { data } = await supabase
      .from("procedure_files")
      .select("id, file_name, file_path, mime_type, category")
      .eq("procedure_id", procedureId)
      .eq("user_id", fileUserId);

    if (data) {
      const imageFiles = data.filter(
        (f) => f.mime_type && f.mime_type.startsWith("image/")
      );
      setPhotos(imageFiles);
      // Pre-select all
      setSelectedPhotos(new Set(imageFiles.map((f) => f.id)));

      // Get public URLs
      const urls: Record<string, string> = {};
      for (const file of imageFiles) {
        const { data: urlData } = supabase.storage
          .from("procedure-files")
          .getPublicUrl(file.file_path);
        if (urlData?.publicUrl) urls[file.id] = urlData.publicUrl;
      }
      setPhotoUrls(urls);
    }
  }, [procedureId, user, ownerUserId]);

  useEffect(() => {
    if (open) fetchPhotos();
  }, [open, fetchPhotos]);

  const togglePhoto = (id: string) => {
    setSelectedPhotos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedPhotos.size === photos.length) {
      setSelectedPhotos(new Set());
    } else {
      setSelectedPhotos(new Set(photos.map((f) => f.id)));
    }
  };

  const handlePrintPhotos = () => {
    const selected = photos.filter((p) => selectedPhotos.has(p.id));
    if (selected.length === 0) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const imageHtml = selected
      .map(
        (p) => `
        <div style="page-break-inside: avoid; margin-bottom: 24px; text-align: center;">
          <img src="${photoUrls[p.id]}" style="max-width: 100%; max-height: 80vh; object-fit: contain; border-radius: 4px;" />
          <p style="margin-top: 8px; font-size: 12px; color: #666; font-family: sans-serif;">${p.file_name} — ${p.category}</p>
        </div>`
      )
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${procedureName} — Photos</title>
        <style>
          @page { margin: 16mm; }
          body { margin: 0; padding: 16px; font-family: sans-serif; }
          .header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #000; padding-bottom: 12px; }
          .header h1 { font-size: 18px; margin: 0 0 4px; }
          .header p { font-size: 12px; color: #555; margin: 2px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>PREFERENCE CARD — PHOTOS</h1>
          <p><strong>Surgeon:</strong> ${providerName || "N/A"} &nbsp;|&nbsp; <strong>Procedure:</strong> ${procedureName}</p>
          <p><strong>Facility:</strong> ${facilityName || "N/A"} &nbsp;|&nbsp; <strong>Date:</strong> ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        ${imageHtml}
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
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
    } catch { /* legacy free text */ }
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
    } catch { /* not JSON, return as-is */ }
    return val;
  };

  const getDisplayValue = (key: string, val: string): string => {
    if (key === "medication") return formatMedValue(val);
    if (key === "steps") {
      try {
        const steps = JSON.parse(val);
        if (Array.isArray(steps)) return steps.map((s, i) => `${i + 1}. ${s}`).join("\n");
      } catch { /* fallback */ }
      return val;
    }
    // For all other categories, try to parse as item list
    return formatItemList(val);
  };

  const fileCategories = PREFERENCE_CATEGORIES.filter((c) => c.type === "file");

  const sectionOrder = [
    { key: "position", label: "Position" },
    { key: "gloves", label: "Glove Size / Style" },
    { key: "equipment", label: "Equipment" },
    { key: "supplies", label: "Supplies" },
    { key: "instruments", label: "Instrumentation" },
    { key: "robotic_instruments", label: "Robotic Instruments" },
    { key: "trays", label: "Trays" },
    { key: "suture", label: "Suture & Usage" },
    { key: "skinprep", label: "Skin Prep" },
    { key: "medication", label: "Medications" },
    { key: "steps", label: "Procedure Steps" },
  ];

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
        if (y + needed > ph - 18) {
          doc.addPage();
          y = 18;
        }
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
          lines.forEach((line: string) => {
            checkPage(6);
            doc.text(line, ml, y);
            y += 5;
          });
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
        const fileText = count > 0 ? `${count} file${count !== 1 ? "s" : ""}` : "None";
        doc.text(`${cat.label}: ${fileText}`, ml, y);
        y += 5;
      });

      y += 2;
      drawLine(y, 0.2);

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

  const handlePrint = () => {
    window.print();
  };

  // Photo print selector view
  if (showPhotoPrint) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh] bg-background">
          <DrawerHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPhotoPrint(false)}
                className="p-1.5 rounded-full hover:bg-card transition-colors text-muted-foreground"
              >
                <X size={16} />
              </button>
              <DrawerTitle className="text-base font-semibold text-foreground">
                Print Photos
              </DrawerTitle>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={toggleAll}>
                {selectedPhotos.size === photos.length ? (
                  <><CheckSquare size={14} /> Deselect All</>
                ) : (
                  <><Square size={14} /> Select All</>
                )}
              </Button>
              <Button
                size="sm"
                className="gap-1.5 text-xs"
                onClick={handlePrintPhotos}
                disabled={selectedPhotos.size === 0}
              >
                <Printer size={14} />
                Print {selectedPhotos.size > 0 ? `(${selectedPhotos.size})` : ""}
              </Button>
            </div>
          </DrawerHeader>

          <div className="overflow-y-auto px-4 pb-6 max-h-[70vh]">
            {photos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Image size={32} className="mb-2 opacity-40" />
                <p className="text-sm">No photos attached to this preference card</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {photos.map((photo) => (
                  <button
                    key={photo.id}
                    onClick={() => togglePhoto(photo.id)}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                      selectedPhotos.has(photo.id)
                        ? "border-primary shadow-lg shadow-primary/10"
                        : "border-border opacity-60"
                    }`}
                  >
                    <img
                      src={photoUrls[photo.id]}
                      alt={photo.file_name}
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      {selectedPhotos.has(photo.id) ? (
                        <CheckSquare size={18} className="text-primary drop-shadow" />
                      ) : (
                        <Square size={18} className="text-muted-foreground drop-shadow" />
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate px-2 py-1.5 bg-card">
                      {photo.file_name}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] bg-background">
        <DrawerHeader className="flex flex-row items-center justify-between pb-2">
          <DrawerTitle className="text-base font-semibold text-foreground">
            Full Preference Card
          </DrawerTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={() => setShowPhotoPrint(true)}
              disabled={photos.length === 0}
            >
              <Image size={14} />
              Print Photos{photos.length > 0 ? ` (${photos.length})` : ""}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={handlePrint}
            >
              <Printer size={14} />
              Print
            </Button>
            <Button
              size="sm"
              className="gap-1.5 text-xs"
              onClick={generatePDF}
              disabled={generating}
            >
              <Download size={14} />
              {generating ? "Generating…" : "PDF"}
            </Button>
          </div>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 pb-6 max-h-[70vh]">
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

            {[
              { key: "position", label: "Position" },
              { key: "gloves", label: "Glove Size / Style" },
              { key: "equipment", label: "Equipment" },
              { key: "supplies", label: "Supplies" },
              { key: "instruments", label: "Instrumentation" },
              { key: "robotic_instruments", label: "Robotic Instruments" },
              { key: "trays", label: "Trays" },
              { key: "suture", label: "Suture & Usage" },
              { key: "skinprep", label: "Skin Prep" },
              { key: "medication", label: "Medications" },
              { key: "steps", label: "Procedure Steps" },
            ].map((section) => {
              const val = preferences[section.key];
              return (
                <div key={section.key} className="border-b border-gray-200 py-2.5">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-black">{section.label}</p>
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
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default PreferenceSummaryDrawer;
