import { useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Download, Printer, FileText } from "lucide-react";
import { PREFERENCE_CATEGORIES } from "@/components/PreferenceCategoryWidget";

interface PreferenceSummaryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  procedureName: string;
  providerName: string;
  preferences: Record<string, string>;
  fileCounts: Record<string, number>;
}

const PreferenceSummaryDrawer = ({
  open,
  onOpenChange,
  procedureName,
  providerName,
  preferences,
  fileCounts,
}: PreferenceSummaryDrawerProps) => {
  const [generating, setGenerating] = useState(false);

  const textCategories = PREFERENCE_CATEGORIES.filter((c) => c.type !== "file");
  const fileCategories = PREFERENCE_CATEGORIES.filter((c) => c.type === "file");

  const generatePDF = async () => {
    setGenerating(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: "letter" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      // Header bar
      doc.setFillColor(24, 24, 27); // zinc-900
      doc.rect(0, 0, pageWidth, 38, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text(procedureName, margin, 18);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Procedure Preference Card", margin, 26);
      doc.setFontSize(9);
      doc.setTextColor(180, 180, 180);
      doc.text(`Provider: ${providerName}`, margin, 33);
      doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, pageWidth - margin, 33, { align: "right" });

      y = 48;
      doc.setTextColor(60, 60, 60);

      const addCategory = (label: string, value: string | null, isFile = false, fileCount = 0) => {
        if (y > pageHeight - 30) {
          doc.addPage();
          y = margin;
        }

        // Category label
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(margin, y, contentWidth, 8, 1, 1, "F");
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(40, 40, 40);
        doc.text(label, margin + 4, y + 5.5);
        y += 11;

        // Value
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);

        if (isFile) {
          const text = fileCount > 0 ? `${fileCount} file${fileCount !== 1 ? "s" : ""} uploaded` : "No files uploaded";
          doc.text(text, margin + 4, y + 4);
          y += 10;
        } else if (value && value.trim()) {
          const lines = doc.splitTextToSize(value, contentWidth - 8);
          lines.forEach((line: string) => {
            if (y > pageHeight - 20) {
              doc.addPage();
              y = margin;
            }
            doc.text(line, margin + 4, y + 4);
            y += 5.5;
          });
          y += 4;
        } else {
          doc.setTextColor(170, 170, 170);
          doc.text("No preference set", margin + 4, y + 4);
          doc.setTextColor(80, 80, 80);
          y += 10;
        }

        y += 2;
      };

      // Text-based preferences
      textCategories.forEach((cat) => {
        addCategory(cat.label, preferences[cat.key] || null);
      });

      // File-based preferences
      if (y > pageHeight - 40) {
        doc.addPage();
        y = margin;
      }
      y += 4;
      doc.setFillColor(24, 24, 27);
      doc.roundedRect(margin, y, contentWidth, 7, 1, 1, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("ATTACHED FILES", margin + 4, y + 5);
      y += 12;
      doc.setTextColor(60, 60, 60);

      fileCategories.forEach((cat) => {
        addCategory(cat.label, null, true, fileCounts[cat.key] || 0);
      });

      // Footer
      const lastPage = doc.getNumberOfPages();
      for (let i = 1; i <= lastPage; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(160, 160, 160);
        doc.text(`Page ${i} of ${lastPage}`, pageWidth / 2, pageHeight - 10, { align: "center" });
      }

      doc.save(`${procedureName.replace(/\s+/g, "_")}_Preferences.pdf`);
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

        <div className="overflow-y-auto px-4 pb-6 space-y-4 max-h-[70vh]">
          {/* Procedure header */}
          <div className="rounded-xl bg-card border border-border p-4">
            <h2 className="text-sm font-semibold text-foreground">{procedureName}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Procedure Preference Summary</p>
          </div>

          {/* Text preferences */}
          {textCategories.map((cat) => {
            const val = preferences[cat.key];
            const Icon = cat.icon;
            return (
              <div key={cat.key} className="rounded-xl bg-card border border-border p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon size={14} className="text-primary" />
                  </div>
                  <span className="text-xs font-semibold text-foreground">{cat.label}</span>
                </div>
                {val && val.trim() ? (
                  <p className="text-xs text-muted-foreground leading-relaxed pl-9 whitespace-pre-wrap">{val}</p>
                ) : (
                  <p className="text-xs text-muted-foreground/50 italic pl-9">No preference set</p>
                )}
              </div>
            );
          })}

          {/* File section header */}
          <div className="flex items-center gap-2 pt-2">
            <FileText size={14} className="text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Attached Files</span>
          </div>

          {fileCategories.map((cat) => {
            const count = fileCounts[cat.key] || 0;
            const Icon = cat.icon;
            return (
              <div key={cat.key} className="rounded-xl bg-card border border-border p-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon size={14} className="text-primary" />
                  </div>
                  <span className="text-xs font-semibold text-foreground">{cat.label}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {count > 0 ? `${count} file${count !== 1 ? "s" : ""}` : "None"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default PreferenceSummaryDrawer;
