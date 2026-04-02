import { useState } from "react";
import { motion } from "framer-motion";
import { Camera, Upload, User, Sun, Moon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NavHeader from "@/components/NavHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ProfilePicture = () => {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<"light" | "dark" | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { setTheme } = useTheme();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selected);
    }
  };

  const handleThemeSelect = (theme: "light" | "dark") => {
    setSelectedTheme(theme);
    setTheme(theme);
  };

  const handleUpload = async () => {
    if (!selectedTheme) {
      toast({
        title: "Theme required",
        description: "Please choose a display preference before continuing.",
        variant: "destructive",
      });
      return;
    }

    const role = user?.user_metadata?.profession;
    const isAdmin = role === "administrative" || role === "admin" || role === "admin-staff";

    if (!file || !user) {
      if (preview) {
        localStorage.setItem("avatar_preview", preview);
      }
      if (user) {
        await supabase
          .from("profiles")
          .update({ onboarding_completed: true })
          .eq("user_id", user.id);
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
        .update({ avatar_url: publicUrl, onboarding_completed: true })
        .eq("user_id", user.id);

      localStorage.setItem("avatar_preview", publicUrl);
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

        {/* Display Preference Section */}
        <div className="w-full flex flex-col gap-3">
          <div className="text-center">
            <h2 className="text-sm font-semibold tracking-wider text-foreground uppercase">
              Display Preference
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Choose how you want the app to look
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleThemeSelect("light")}
              className={`flex flex-col items-center gap-2 rounded-lg border-2 px-4 py-4 transition-all ${
                selectedTheme === "light"
                  ? "border-primary bg-primary/10"
                  : "border-border bg-secondary hover:bg-muted"
              }`}
            >
              <Sun size={28} className={selectedTheme === "light" ? "text-primary" : "text-muted-foreground"} />
              <span className={`text-sm font-medium ${selectedTheme === "light" ? "text-primary" : "text-foreground"}`}>
                Light
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleThemeSelect("dark")}
              className={`flex flex-col items-center gap-2 rounded-lg border-2 px-4 py-4 transition-all ${
                selectedTheme === "dark"
                  ? "border-primary bg-primary/10"
                  : "border-border bg-secondary hover:bg-muted"
              }`}
            >
              <Moon size={28} className={selectedTheme === "dark" ? "text-primary" : "text-muted-foreground"} />
              <span className={`text-sm font-medium ${selectedTheme === "dark" ? "text-primary" : "text-foreground"}`}>
                Dark
              </span>
            </button>
          </div>
        </div>

        <button
          onClick={handleUpload}
          disabled={uploading || !selectedTheme}
          className="rounded-lg bg-primary px-12 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-gold-light active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {uploading ? "Uploading..." : "Continue"}
        </button>

        <button
          onClick={() => {
            if (!selectedTheme) {
              toast({
                title: "Theme required",
                description: "Please choose a display preference before continuing.",
                variant: "destructive",
              });
              return;
            }
            handleUpload();
          }}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip photo
        </button>
      </motion.div>
    </div>
  );
};

export default ProfilePicture;
