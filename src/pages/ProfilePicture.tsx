import { useState } from "react";
import { motion } from "framer-motion";
import { Camera, Upload, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NavHeader from "@/components/NavHeader";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ProfilePicture = () => {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selected);
    }
  };

  const handleUpload = async () => {
    const role = user?.user_metadata?.profession;
    const isAdmin = role === "administrative" || role === "admin" || role === "admin-staff";

    if (!file || !user) {
      if (preview) {
        localStorage.setItem("avatar_preview", preview);
      }
      navigate("/profile");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("user_id", user.id);

      localStorage.setItem("avatar_preview", publicUrl);
      const role = user?.user_metadata?.profession;
      const isAdmin = role === "administrative" || role === "admin" || role === "admin-staff";
      navigate("/profile");
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Could not upload photo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 pt-16 pb-12">
      <NavHeader />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm flex flex-col items-center gap-8"
      >
        <h1 className="text-xl font-light tracking-wide text-foreground text-center">
          Upload Profile Photo
        </h1>

        <div className="w-36 h-36 rounded-full overflow-hidden bg-card border-2 border-border flex items-center justify-center">
          {preview ? (
            <img src={preview} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <User size={64} className="text-muted-foreground" />
          )}
        </div>

        <div className="w-full flex flex-col gap-3">
          <label className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted cursor-pointer">
            <Upload size={18} />
            Upload Photo
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>

          <label className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted cursor-pointer">
            <Camera size={18} />
            Capture Photo
            <input type="file" accept="image/*" capture="user" onChange={handleFileChange} className="hidden" />
          </label>
        </div>

        <button
          onClick={handleUpload}
          disabled={uploading}
          className="rounded-lg bg-primary px-12 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-gold-light active:scale-95 disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>

        <button
          onClick={() => navigate("/profile")}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip for now
        </button>
      </motion.div>
    </div>
  );
};

export default ProfilePicture;
