import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, User, Lock, Mail, Phone, ShieldCheck, HeadphonesIcon, Stethoscope, Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import NavHeader from "@/components/NavHeader";
import ProfileAvatarUpload from "@/components/ProfileAvatarUpload";
import PasswordInput from "@/components/PasswordInput";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Settings = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Edit Profile state
  const [firstName, setFirstName] = useState(profile?.display_name?.split(" ")[0] || "");
  const [lastName, setLastName] = useState(profile?.display_name?.split(" ").slice(1).join(" ") || "");
  const [phone, setPhone] = useState("");
  const [specialty, setSpecialty] = useState(profile?.specialty || "");

  const SPECIALTIES = [
    "Bariatric Surgery", "Breast Surgery", "Cardiothoracic Surgery", "Colon and Rectal Surgery",
    "Cosmetic Surgery", "Critical Care Surgery", "Endocrine Surgery", "General Surgery",
    "Gynecologic Surgery", "Hand Surgery", "Head and Neck Surgery", "Hepatobiliary Surgery",
    "Maxillofacial Surgery", "Minimally Invasive Surgery", "Neurosurgery", "Obstetric Surgery",
    "Oncologic Surgery", "Ophthalmic Surgery", "Oral Surgery", "Orthopedic Surgery",
    "Otolaryngology Surgery", "Pediatric Surgery", "Plastic Surgery", "Podiatric Surgery",
    "Reconstructive Surgery", "Spine Surgery", "Surgical Oncology", "Thoracic Surgery",
    "Transplant Surgery", "Trauma Surgery", "Urologic Surgery", "Vascular Surgery",
  ];

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Contact Support state
  const [supportMessage, setSupportMessage] = useState("");

  const displayName = profile?.display_name || user?.user_metadata?.full_name || "User";
  const email = user?.email || "";
  const userRole = (profile?.role || "").toLowerCase();
  const isDoctorRole = ["doctor", "surgeon", "physician"].includes(userRole);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const saveProfile = async () => {
    if (!user) return;
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!fullName) return;
    const updateData: any = { display_name: fullName };
    if (specialty) updateData.specialty = specialty;
    const { error } = await supabase.from("profiles").update(updateData).eq("user_id", user.id);
    if (error) {
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    } else {
      toast({ title: "Profile updated" });
      refreshProfile();
      setExpandedSection(null);
    }
  };

  const changePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password changed successfully" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setExpandedSection(null);
    }
  };

  const sections = [
    {
      id: "display-settings",
      icon: Monitor,
      label: "Display Settings",
      description: "Theme & appearance",
    },
    {
      id: "edit-profile",
      icon: User,
      label: "Edit Profile",
      description: "Name, photo & credentials",
    },
    {
      id: "contact-info",
      icon: Mail,
      label: "Contact Information",
      description: "Email & phone number",
    },
    {
      id: "change-password",
      icon: Lock,
      label: "Change Password",
      description: "Update your password",
    },
    {
      id: "contact-support",
      icon: HeadphonesIcon,
      label: "Contact Support",
      description: "Get help from our team",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 pt-16 pb-8">
      <NavHeader />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm mx-auto flex flex-col gap-5"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/profile")}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Settings</h1>
        </div>

        {/* Sections */}
        <div className="flex flex-col gap-3">
          {sections.map((section) => {
            const Icon = section.icon;
            const isExpanded = expandedSection === section.id;
            return (
              <motion.div
                key={section.id}
                layout
                className="rounded-xl bg-card border border-border overflow-hidden"
              >
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-secondary/50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{section.label}</p>
                    <p className="text-xs text-muted-foreground">{section.description}</p>
                  </div>
                </button>

                {/* Display Settings */}
                {isExpanded && section.id === "display-settings" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-4 pb-4 flex flex-col gap-4 border-t border-border pt-4"
                  >
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Theme</label>
                      <p className="text-xs text-muted-foreground mb-3">Choose how the app looks to you</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setTheme("light")}
                          className={`flex-1 flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                            theme === "light"
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-secondary text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Sun size={16} />
                          Light
                        </button>
                        <button
                          onClick={() => setTheme("dark")}
                          className={`flex-1 flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                            theme === "dark"
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-secondary text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Moon size={16} />
                          Dark
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Edit Profile */}
                {isExpanded && section.id === "edit-profile" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-4 pb-4 flex flex-col gap-4 border-t border-border pt-4"
                  >
                    <div className="flex justify-center">
                      <ProfileAvatarUpload />
                    </div>
                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">First Name</label>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="First name"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Last Name</label>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="Last name"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Credentials</label>
                        <input
                          type="text"
                          defaultValue={profile?.role?.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || ""}
                          disabled
                          className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2.5 text-sm text-muted-foreground cursor-not-allowed"
                        />
                      </div>
                      {isDoctorRole && (
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                            <Stethoscope size={12} className="text-primary" /> Specialty
                          </label>
                          <Select value={specialty} onValueChange={setSpecialty}>
                            <SelectTrigger className="w-full rounded-lg border-border bg-secondary text-foreground h-10">
                              <SelectValue placeholder="Select your specialty" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                              {SPECIALTIES.map((s) => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={saveProfile}
                      className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      Save Changes
                    </button>
                  </motion.div>
                )}

                {/* Contact Information */}
                {isExpanded && section.id === "contact-info" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-4 pb-4 flex flex-col gap-3 border-t border-border pt-4"
                  >
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Email</label>
                      <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-2.5">
                        <Mail size={14} className="text-muted-foreground shrink-0" />
                        <span className="text-sm text-muted-foreground truncate">{email}</span>
                        <ShieldCheck size={14} className="text-primary shrink-0 ml-auto" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Phone Number</label>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 rounded-lg border border-border bg-secondary px-3 py-2.5">
                          <Phone size={14} className="text-muted-foreground" />
                        </div>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="flex-1 rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="(555) 000-0000"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Change Password */}
                {isExpanded && section.id === "change-password" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-4 pb-4 flex flex-col gap-3 border-t border-border pt-4"
                  >
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">New Password</label>
                      <PasswordInput
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Confirm New Password</label>
                      <PasswordInput
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <button
                      onClick={changePassword}
                      disabled={savingPassword}
                      className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {savingPassword ? "Updating..." : "Update Password"}
                    </button>
                  </motion.div>
                )}

                {/* Contact Support */}
                {isExpanded && section.id === "contact-support" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-4 pb-4 flex flex-col gap-3 border-t border-border pt-4"
                  >
                    <p className="text-xs text-muted-foreground">
                      Need help? Send us a message and we'll get back to you as soon as possible.
                    </p>
                    <textarea
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      rows={4}
                      className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                      placeholder="Describe your issue..."
                    />
                    <a
                      href={`mailto:support@1stassist.app?subject=Support Request&body=${encodeURIComponent(supportMessage)}`}
                      className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors text-center block"
                    >
                      Send Email
                    </a>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default Settings;
