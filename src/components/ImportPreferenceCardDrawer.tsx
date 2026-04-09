import { useState, useRef } from "react";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Upload, Camera, FileText, Image, AlertCircle, Check, X, RefreshCw, Loader2, ChevronDown, ChevronUp,
} from "lucide-react";
import { PREFERENCE_CATEGORIES } from "@/components/PreferenceCategoryWidget";

interface ExtractedItem {
  name: string;
  quantity: number;
  confidence: "high" | "medium" | "low";
}

interface ExtractionResult {
  procedure_name: string | null;
  surgeon_name: string | null;
  categories: Record<string, ExtractedItem[]>;
  raw_text: string;
}

type Step = "upload" | "processing" | "review" | "saving" | "error";

interface ImportPreferenceCardDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  procedureId: string;
  effectiveUserId: string;
  onComplete: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {};
PREFERENCE_CATEGORIES.forEach((c) => {
  CATEGORY_LABELS[c.key] = c.label;
});

const ImportPreferenceCardDrawer = ({
  open, onOpenChange, procedureId, effectiveUserId, onComplete,
}: ImportPreferenceCardDrawerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [progress, setProgress] = useState(0);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);
  const [editedCategories, setEditedCategories] = useState<Record<string, ExtractedItem[]>>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const reset = () => {
    setStep("upload");
    setProgress(0);
    setFilePreviewUrl(null);
    setFileName("");
    setExtraction(null);
    setEditedCategories({});
    setErrorMessage("");
    setExpandedCategories(new Set());
  };

  const handleClose = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  const handleFileSelect = async (file: File) => {
    if (!user) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];
    if (!validTypes.includes(file.type) && !file.name.toLowerCase().endsWith(".heic")) {
      toast({ title: "Unsupported file type", description: "Please upload JPG, PNG, or PDF", variant: "destructive" });
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum 20MB", variant: "destructive" });
      return;
    }

    setFileName(file.name);
    setStep("processing");
    setProgress(10);

    if (file.type.startsWith("image/")) {
      setFilePreviewUrl(URL.createObjectURL(file));
    } else {
      setFilePreviewUrl(null);
    }

    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${effectiveUserId}/preference-card-uploads/${crypto.randomUUID()}.${ext}`;
      setProgress(20);

      const { error: uploadError } = await supabase.storage
        .from("procedure-files")
        .upload(path, file);

      if (uploadError) throw new Error(uploadError.message);
      setProgress(40);

      const { data: urlData } = supabase.storage
        .from("procedure-files")
        .getPublicUrl(path);

      setProgress(50);

      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-preference-card`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            file_url: urlData.publicUrl,
            mime_type: file.type || "image/jpeg",
          }),
        }
      );

      setProgress(80);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (response.status === 429) throw new Error("Rate limit exceeded. Please try again shortly.");
        if (response.status === 402) throw new Error("AI credits exhausted. Please add funds.");
        throw new Error(errData.error || "Extraction failed");
      }

      const result = await response.json();
      if (!result.success || !result.data) throw new Error("No data extracted");

      setExtraction(result.data);
      setEditedCategories(result.data.categories || {});
      setProgress(100);

      setTimeout(() => setStep("review"), 500);
    } catch (err: any) {
      console.error("Extraction error:", err);
      setErrorMessage(err.message || "Failed to extract preference card data");
      setStep("error");
    }
  };

  const handleSave = async () => {
    if (!user || !procedureId || !effectiveUserId) return;

    setStep("saving");

    try {
      // Upsert preferences for each category into the existing procedure
      for (const [category, items] of Object.entries(editedCategories)) {
        if (items.length === 0) continue;

        const formatted = items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
        }));

        const { error } = await supabase
          .from("procedure_preferences")
          .upsert(
            {
              procedure_id: procedureId,
              user_id: effectiveUserId,
              category,
              value: JSON.stringify(formatted),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "procedure_id,category" }
          );
        if (error) throw error;
      }

      toast({ title: "Preference card imported!", description: "AI-extracted data has been saved to your procedure." });
      onComplete();
      handleClose(false);
    } catch (err: any) {
      console.error("Save error:", err);
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
      setStep("review");
    }
  };

  const toggleCategory = (key: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const removeItem = (category: string, index: number) => {
    setEditedCategories((prev) => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index),
    }));
  };

  const updateItemName = (category: string, index: number, name: string) => {
    setEditedCategories((prev) => ({
      ...prev,
      [category]: prev[category].map((item, i) =>
        i === index ? { ...item, name } : item
      ),
    }));
  };

  const updateItemQuantity = (category: string, index: number, quantity: number) => {
    setEditedCategories((prev) => ({
      ...prev,
      [category]: prev[category].map((item, i) =>
        i === index ? { ...item, quantity: Math.max(1, quantity) } : item
      ),
    }));
  };

  const totalItems = Object.values(editedCategories).reduce((sum, items) => sum + items.length, 0);
  const lowConfidenceCount = Object.values(editedCategories)
    .flat()
    .filter((i) => i.confidence === "low" || i.confidence === "medium").length;

  const categoriesWithItems = Object.entries(editedCategories).filter(
    ([, items]) => items.length > 0
  );

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent className="bg-card border-border max-h-[92vh]">
        <DrawerHeader className="text-center pb-2">
          <DrawerTitle className="text-foreground">
            {step === "upload" && "Import Preference Card"}
            {step === "processing" && "Analyzing Card..."}
            {step === "review" && "Review Imported Data"}
            {step === "saving" && "Saving..."}
            {step === "error" && "Import Failed"}
          </DrawerTitle>
          <DrawerDescription className="text-muted-foreground text-xs">
            {step === "upload" && "Upload a photo or PDF to auto-fill your preference card"}
            {step === "processing" && "AI is extracting preferences from your card"}
            {step === "review" && "Review imported details before saving"}
            {step === "error" && "We couldn't fully read this preference card"}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-4 overflow-y-auto flex flex-col gap-3">
          {/* UPLOAD STEP */}
          {step === "upload" && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />

              <Button
                variant="outline"
                onClick={() => cameraInputRef.current?.click()}
                className="w-full h-14 gap-3 border-dashed border-2 border-primary/30 hover:border-primary/60"
              >
                <Camera size={20} className="text-primary" />
                Take Photo
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = "image/jpeg,image/png,image/webp";
                    fileInputRef.current.click();
                  }
                }}
                className="w-full h-14 gap-3 border-dashed border-2 border-primary/30 hover:border-primary/60"
              >
                <Image size={20} className="text-primary" />
                Upload Image
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = "application/pdf";
                    fileInputRef.current.click();
                  }
                }}
                className="w-full h-14 gap-3 border-dashed border-2 border-primary/30 hover:border-primary/60"
              >
                <FileText size={20} className="text-primary" />
                Upload PDF
              </Button>

              <p className="text-[11px] text-muted-foreground text-center mt-2">
                Supports JPG, PNG, and PDF. Max 20MB. Extracted data will populate your preference card fields.
              </p>
            </>
          )}

          {/* PROCESSING STEP */}
          {step === "processing" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 size={40} className="text-primary animate-spin" />
              <Progress value={progress} className="w-full h-2" />
              <p className="text-sm text-muted-foreground">
                {progress < 40 ? "Uploading file..." : progress < 80 ? "Extracting preferences with AI..." : "Finalizing..."}
              </p>
              {filePreviewUrl && (
                <img src={filePreviewUrl} alt="Preview" className="w-32 h-32 object-cover rounded-lg border border-border opacity-60" />
              )}
            </div>
          )}

          {/* ERROR STEP */}
          {step === "error" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <AlertCircle size={40} className="text-destructive" />
              <p className="text-sm text-muted-foreground text-center">{errorMessage}</p>
              <p className="text-xs text-muted-foreground text-center">Try uploading a clearer image or PDF.</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={reset} className="gap-2">
                  <RefreshCw size={16} /> Try Again
                </Button>
                <Button variant="ghost" onClick={() => handleClose(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* SAVING STEP */}
          {step === "saving" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 size={40} className="text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Saving imported preferences...</p>
            </div>
          )}

          {/* REVIEW STEP */}
          {step === "review" && extraction && (
            <>
              {filePreviewUrl && (
                <div className="rounded-lg border border-border overflow-hidden">
                  <img src={filePreviewUrl} alt="Uploaded card" className="w-full max-h-40 object-contain bg-secondary" />
                </div>
              )}
              {!filePreviewUrl && (
                <div className="rounded-lg border border-border p-3 flex items-center gap-2 bg-secondary/50">
                  <FileText size={16} className="text-primary" />
                  <span className="text-sm text-foreground truncate">{fileName}</span>
                </div>
              )}

              {/* Summary */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Check size={14} className="text-green-500" />
                {totalItems} items extracted across {categoriesWithItems.length} categories
                {lowConfidenceCount > 0 && (
                  <span className="text-yellow-500 flex items-center gap-1">
                    <AlertCircle size={12} /> {lowConfidenceCount} need review
                  </span>
                )}
              </div>

              {lowConfidenceCount > 0 && (
                <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-3 py-2">
                  <p className="text-xs text-yellow-500">
                    Some fields may need confirmation. Review before saving.
                  </p>
                </div>
              )}

              {/* Extracted categories */}
              <div className="flex flex-col gap-2">
                {categoriesWithItems.map(([key, items]) => {
                  const expanded = expandedCategories.has(key);
                  const label = CATEGORY_LABELS[key] || key;
                  const lowCount = items.filter((i) => i.confidence !== "high").length;

                  return (
                    <div key={key} className="rounded-xl border border-border bg-secondary/30">
                      <button
                        onClick={() => toggleCategory(key)}
                        className="w-full flex items-center justify-between p-3 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{label}</span>
                          <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                            {items.length}
                          </span>
                          {lowCount > 0 && (
                            <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded-full">
                              {lowCount} uncertain
                            </span>
                          )}
                        </div>
                        {expanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                      </button>

                      {expanded && (
                        <div className="px-3 pb-3 flex flex-col gap-1.5">
                          {items.map((item, i) => (
                            <div key={i} className="flex items-center gap-2 rounded-lg bg-card border border-border p-2">
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                item.confidence === "high" ? "bg-green-500" :
                                item.confidence === "medium" ? "bg-yellow-500" : "bg-destructive"
                              }`} />
                              <input
                                value={item.name}
                                onChange={(e) => updateItemName(key, i, e.target.value)}
                                className="flex-1 min-w-0 bg-transparent text-sm text-foreground outline-none"
                              />
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateItemQuantity(key, i, parseInt(e.target.value) || 1)}
                                className="w-12 bg-secondary rounded px-1.5 py-0.5 text-xs text-center text-foreground outline-none border border-border"
                                min={1}
                              />
                              <button
                                onClick={() => removeItem(key, i)}
                                className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {categoriesWithItems.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    No preferences could be extracted. Try uploading a clearer image.
                  </div>
                )}
              </div>

              {/* Confidence legend */}
              <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> High confidence</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Needs review</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive" /> Low confidence</span>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleSave}
                  disabled={totalItems === 0}
                  className="flex-1 gap-2"
                >
                  <Check size={16} /> Import & Save
                </Button>
                <Button variant="outline" onClick={reset} className="gap-2">
                  <RefreshCw size={16} /> Re-upload
                </Button>
              </div>

              <p className="text-[10px] text-muted-foreground text-center">
                Review all fields before saving. Existing preferences in matching categories will be replaced.
              </p>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ImportPreferenceCardDrawer;
