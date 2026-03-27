import { useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import { PREFERENCE_CATEGORIES } from "@/components/PreferenceCategoryWidget";

interface PreferenceSummaryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  procedureName: string;
  providerName: string;
  facilityName: string;
  preferences: Record<string, string>;
  fileCounts: Record<string, number>;
}

const PreferenceSummaryDrawer = ({
  open,
  onOpenChange,
  procedureName,
  providerName,
  facilityName,
  preferences,
  fileCounts,
}: PreferenceSummaryDrawerProps) => {
  const [generating, setGenerating] = useState(false);

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

  const getDisplayValue = (key: string, val: string): string => {
    if (key === "medication") return formatMedValue(val);
    return val;
  };

  const fileCategories = PREFERENCE_CATEGORIES.filter((c) => c.type === "file");

  // Ordered sections for the preference card
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

  const generatePDF = async () => {
    setGenerating(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: "letter" });
      const pw = doc.internal.pageSize.getWidth();
      const ph = doc.internal.pageSize.getHeight();
      const ml = 18; // left margin
      const mr = 18; // right margin
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

      // === TITLE ===
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text("PREFERENCE CARD", pw / 2, y, { align: "center" });
      y += 8;
      drawLine(y, 0.6);
      y += 6;

      // === Surgeon & Procedure ===
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

      // === Sections ===
      sectionOrder.forEach((section) => {
        const val = preferences[section.key];
        checkPage(18);

        // Label
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(section.label.toUpperCase(), ml, y);
        y += 5;

        // Value
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

      // === Attached Files Section ===
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

      // === Footer on all pages ===
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

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] bg-background">
        <DrawerHeader className="flex flex-row items-center justify-between pb-2">
          <DrawerTitle className="text-base font-semibold text-foreground">
            All Preferences
          </DrawerTitle>
          <div className="flex gap-2">
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
            {/* PDF-style header */}
            <div className="text-center border-b border-black pb-3 mb-4">
              <h2 className="text-lg font-bold tracking-wide text-black">PREFERENCE CARD</h2>
            </div>

            <div className="space-y-1 text-sm border-b border-black pb-3 mb-4">
              <p><span className="font-bold">Surgeon:</span> {providerName || "Not specified"}</p>
              <p><span className="font-bold">Procedure:</span> {procedureName}</p>
              <p><span className="font-bold">Facility:</span> {facilityName || "Not specified"}</p>
              <p><span className="font-bold">Date:</span> {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
            </div>

            {/* Sections */}
            {[
              { key: "position", label: "Position" },
              { key: "gloves", label: "Glove Size / Style" },
              { key: "equipment", label: "Equipment" },
              { key: "supplies", label: "Supplies" },
              { key: "instruments", label: "Instrumentation" },
              { key: "trays", label: "Trays" },
              { key: "suture", label: "Suture & Usage" },
              { key: "skin_prep", label: "Skin Prep" },
              { key: "medication", label: "Medications" },
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

            {/* Files */}
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
