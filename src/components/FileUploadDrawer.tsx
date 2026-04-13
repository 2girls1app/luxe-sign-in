import { useState, useEffect, useRef } from "react";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Upload, Trash2, FileText, Video, ExternalLink, Camera, Pencil, X, Check, StickyNote } from "lucide-react";
import type { PreferenceCategory } from "@/components/PreferenceCategoryWidget";

interface ProcedureFile {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
  custom_name: string | null;
  notes: string | null;
}

interface FileUploadDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: PreferenceCategory | null;
  procedureId: string;
  onFilesChanged: () => void;
}

const ACCEPT_MAP: Record<string, string> = {
  images: "image/jpeg,image/png,image/webp,image/gif",
  videos: "video/mp4,video/webm,video/quicktime",
  pdfs: "application/pdf",
};

const MAX_SIZE_MB = 50;

const FileUploadDrawer = ({
  open, onOpenChange, category, procedureId, onFilesChanged,
}: FileUploadDrawerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<ProcedureFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingFile, setEditingFile] = useState<ProcedureFile | null>(null);
  const [editName, setEditName] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && category && user) fetchFiles();
    if (!open) setEditingFile(null);
  }, [open, category, user]);

  const fetchFiles = async () => {
    if (!category || !user) return;
    const { data } = await supabase
      .from("procedure_files")
      .select("*")
      .eq("procedure_id", procedureId)
      .eq("user_id", user.id)
      .eq("category", category.key)
      .order("created_at", { ascending: false });
    if (data) setFiles(data as ProcedureFile[]);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !category || !user) return;
    setUploading(true);

    const uploadedFiles = Array.from(e.target.files);
    
    for (const file of uploadedFiles) {
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        toast({ title: "File too large", description: `${file.name} exceeds ${MAX_SIZE_MB}MB`, variant: "destructive" });
        continue;
      }

      const ext = file.name.split(".").pop();
      const path = `${user.id}/${procedureId}/${category.key}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("procedure-files")
        .upload(path, file);

      if (uploadError) {
        toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
        continue;
      }

      await supabase.from("procedure_files").insert({
        procedure_id: procedureId,
        user_id: user.id,
        category: category.key,
        file_name: file.name,
        file_path: path,
        file_size: file.size,
        mime_type: file.type,
      });
    }

    toast({ title: `${uploadedFiles.length} file(s) uploaded` });
    await fetchFiles();
    onFilesChanged();
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleDelete = async (file: ProcedureFile) => {
    setDeleting(file.id);
    await supabase.storage.from("procedure-files").remove([file.file_path]);
    await supabase.from("procedure_files").delete().eq("id", file.id);
    toast({ title: "File deleted" });
    if (editingFile?.id === file.id) setEditingFile(null);
    await fetchFiles();
    onFilesChanged();
    setDeleting(null);
  };

  const openEdit = (file: ProcedureFile) => {
    setEditingFile(file);
    setEditName(file.custom_name || "");
    setEditNotes(file.notes || "");
  };

  const handleSaveMetadata = async () => {
    if (!editingFile) return;
    setSaving(true);
    const trimmedName = editName.trim().slice(0, 200);
    const trimmedNotes = editNotes.trim().slice(0, 1000);

    await supabase
      .from("procedure_files")
      .update({
        custom_name: trimmedName || null,
        notes: trimmedNotes || null,
      } as any)
      .eq("id", editingFile.id);

    toast({ title: "Details saved" });
    setEditingFile(null);
    await fetchFiles();
    setSaving(false);
  };

  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage.from("procedure-files").getPublicUrl(path);
    return data.publicUrl;
  };

  if (!category) return null;
  const Icon = category.icon;

  const isImages = category.key === "images";
  const isVideos = category.key === "videos";
  const showCameraOption = isImages || isVideos;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-card border-border max-h-[85vh]">
        <DrawerHeader className="text-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <Icon size={28} className="text-primary" />
          </div>
          <DrawerTitle className="text-foreground">{category.label}</DrawerTitle>
          <DrawerDescription className="text-muted-foreground">
            Upload and manage {category.label.toLowerCase()} for this procedure
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-4 flex flex-col gap-3 overflow-y-auto">
          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT_MAP[category.key] || "*/*"}
            multiple
            className="hidden"
            onChange={handleUpload}
          />

          {showCameraOption && (
            <input
              ref={cameraInputRef}
              type="file"
              accept={isImages ? "image/*" : "video/*"}
              capture="environment"
              className="hidden"
              onChange={handleUpload}
            />
          )}

          {/* Action buttons */}
          {showCameraOption ? (
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => cameraInputRef.current?.click()}
                disabled={uploading}
                className="border-dashed border-2 border-primary/30 hover:border-primary/60 h-16 gap-2 flex-col"
              >
                <Camera size={20} className="text-primary" />
                <span className="text-xs">
                  {isImages ? "Take Photo" : "Record Video"}
                </span>
              </Button>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="border-dashed border-2 border-primary/30 hover:border-primary/60 h-16 gap-2 flex-col"
              >
                <Upload size={20} className="text-primary" />
                <span className="text-xs">
                  {isImages ? "Upload Image" : "Upload Video"}
                </span>
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full border-dashed border-2 border-primary/30 hover:border-primary/60 h-16 gap-2"
            >
              <Upload size={18} className="text-primary" />
              {uploading ? "Uploading..." : `Upload ${category.label}`}
            </Button>
          )}

          {uploading && (
            <p className="text-center text-sm text-primary animate-pulse">Uploading...</p>
          )}

          {/* Inline edit panel */}
          {editingFile && (
            <div className="rounded-xl bg-secondary/70 border border-primary/30 p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Edit Details</span>
                <button onClick={() => setEditingFile(null)} className="p-1 rounded-full hover:bg-card text-muted-foreground">
                  <X size={16} />
                </button>
              </div>

              {editingFile.mime_type?.startsWith("image/") && (
                <img
                  src={getPublicUrl(editingFile.file_path)}
                  alt={editingFile.custom_name || editingFile.file_name}
                  className="w-full max-h-40 rounded-lg object-contain bg-background/50"
                />
              )}

              <div className="space-y-1.5">
                <Label htmlFor="edit-name" className="text-xs text-muted-foreground">Image Name</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Instrument Setup, Tray Layout..."
                  maxLength={200}
                  className="bg-background/50 border-border"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-notes" className="text-xs text-muted-foreground">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Add notes about this image..."
                  maxLength={1000}
                  rows={3}
                  className="bg-background/50 border-border resize-none text-sm"
                />
              </div>

              <Button
                onClick={handleSaveMetadata}
                disabled={saving}
                size="sm"
                className="w-full gap-2"
              >
                <Check size={14} />
                {saving ? "Saving..." : "Save Details"}
              </Button>
            </div>
          )}

          {/* File list */}
          {files.length === 0 && !uploading && (
            <p className="text-center text-sm text-muted-foreground py-4">
              No files uploaded yet
            </p>
          )}

          {files.map((file) => {
            const displayName = file.custom_name || file.file_name;
            const isEditing = editingFile?.id === file.id;

            return (
              <div
                key={file.id}
                className={`flex items-start gap-3 rounded-xl bg-secondary/50 border p-3 transition-colors ${isEditing ? "border-primary/50" : "border-border"}`}
              >
                {file.mime_type?.startsWith("image/") ? (
                  <img
                    src={getPublicUrl(file.file_path)}
                    alt={displayName}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => openEdit(file)}
                  />
                ) : file.mime_type?.startsWith("video/") ? (
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Video size={20} className="text-primary" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText size={20} className="text-primary" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{displayName}</p>
                  {file.notes && (
                    <p className="text-[10px] text-primary/70 truncate flex items-center gap-1 mt-0.5">
                      <StickyNote size={9} className="flex-shrink-0" />
                      {file.notes}
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    {file.file_size ? `${(file.file_size / 1024 / 1024).toFixed(1)} MB` : ""}
                  </p>
                </div>

                <button
                  onClick={() => openEdit(file)}
                  className="p-2 rounded-full hover:bg-primary/10 transition-colors text-muted-foreground hover:text-primary flex-shrink-0"
                  title="Edit details"
                >
                  <Pencil size={14} />
                </button>
                <a
                  href={getPublicUrl(file.file_path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full hover:bg-card transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
                >
                  <ExternalLink size={14} />
                </a>
                <button
                  onClick={() => handleDelete(file)}
                  disabled={deleting === file.id}
                  className="p-2 rounded-full hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive flex-shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default FileUploadDrawer;
