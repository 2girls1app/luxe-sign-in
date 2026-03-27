import { useState, useEffect, useRef } from "react";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Upload, Trash2, FileText, Image, Video, ExternalLink } from "lucide-react";
import type { PreferenceCategory } from "@/components/PreferenceCategoryWidget";

interface ProcedureFile {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
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
  const [files, setFiles] = useState<ProcedureFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (open && category && user) fetchFiles();
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
  };

  const handleDelete = async (file: ProcedureFile) => {
    setDeleting(file.id);
    await supabase.storage.from("procedure-files").remove([file.file_path]);
    await supabase.from("procedure_files").delete().eq("id", file.id);
    toast({ title: "File deleted" });
    await fetchFiles();
    onFilesChanged();
    setDeleting(null);
  };

  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage.from("procedure-files").getPublicUrl(path);
    return data.publicUrl;
  };

  if (!category) return null;
  const Icon = category.icon;

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
          {/* Upload button */}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT_MAP[category.key] || "*/*"}
            multiple
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full border-dashed border-2 border-primary/30 hover:border-primary/60 h-16 gap-2"
          >
            <Upload size={18} className="text-primary" />
            {uploading ? "Uploading..." : `Upload ${category.label}`}
          </Button>

          {/* File list */}
          {files.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">
              No files uploaded yet
            </p>
          )}

          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 rounded-xl bg-secondary/50 border border-border p-3"
            >
              {/* Thumbnail / icon */}
              {file.mime_type?.startsWith("image/") ? (
                <img
                  src={getPublicUrl(file.file_path)}
                  alt={file.file_name}
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
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

              {/* File info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{file.file_name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {file.file_size ? `${(file.file_size / 1024 / 1024).toFixed(1)} MB` : ""}
                </p>
              </div>

              {/* Actions */}
              <a
                href={getPublicUrl(file.file_path)}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full hover:bg-card transition-colors text-muted-foreground hover:text-foreground"
              >
                <ExternalLink size={16} />
              </a>
              <button
                onClick={() => handleDelete(file)}
                disabled={deleting === file.id}
                className="p-2 rounded-full hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default FileUploadDrawer;
