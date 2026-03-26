import { useState } from "react";
import { motion } from "framer-motion";
import { Camera, Upload, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NavHeader from "@/components/NavHeader";

const ProfilePicture = () => {
  const [preview, setPreview] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm flex flex-col items-center gap-8"
      >
        <h1 className="text-xl font-light tracking-wide text-foreground text-center">
          Create Profile Picture
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
          onClick={() => navigate("/onboarding-intro")}
          className="rounded-lg bg-primary px-12 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-gold-light active:scale-95"
        >
          Upload
        </button>

        <button
          onClick={() => navigate("/onboarding-intro")}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip for now
        </button>
      </motion.div>
    </div>
  );
};

export default ProfilePicture;
