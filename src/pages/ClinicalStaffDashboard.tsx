import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, LogOut, Building2, Stethoscope, Settings, User, Mic, MicOff, Send, X } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import NavHeader from "@/components/NavHeader";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface FacilityInfo {
  id: string;
  name: string;
  location: string | null;
}

interface DoctorProfile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  specialty: string | null;
}

interface ProcedureInfo {
  id: string;
  name: string;
  category: string | null;
  user_id: string;
  facility_id: string | null;
}

const ClinicalStaffDashboard = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();

  const [facility, setFacility] = useState<FacilityInfo | null>(null);
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [procedures, setProcedures] = useState<ProcedureInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [changeRequestOpen, setChangeRequestOpen] = useState(false);
  const [selectedProcedure, setSelectedProcedure] = useState<ProcedureInfo | null>(null);
  const [changeRequestText, setChangeRequestText] = useState("");
  const [changeCategory, setChangeCategory] = useState("general");
  const [submitting, setSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  const displayName = profile?.display_name || user?.user_metadata?.full_name || "User";
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || null;
  const userRole = profile?.role || user?.user_metadata?.profession || "";
  const roleLabel = userRole.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  const facilityId = (profile as any)?.facility_id;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  const fetchFacility = useCallback(async () => {
    if (!facilityId) return;
    const { data } = await supabase
      .from("facilities")
      .select("id, name, location")
      .eq("id", facilityId)
      .single();
    if (data) setFacility(data);
  }, [facilityId]);

  const fetchDoctorsAndProcedures = useCallback(async () => {
    if (!facilityId) return;
    // Fetch procedures at this facility
    const { data: procs } = await supabase
      .from("procedures")
      .select("id, name, category, user_id, facility_id")
      .eq("facility_id", facilityId)
      .order("name");
    if (procs) {
      setProcedures(procs as ProcedureInfo[]);
      // Get unique doctor user_ids from procedures
      const doctorIds = [...new Set(procs.map((p: any) => p.user_id))];
      if (doctorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url, specialty")
          .in("user_id", doctorIds);
        if (profiles) setDoctors(profiles as DoctorProfile[]);
      }
    }
  }, [facilityId]);

  useEffect(() => {
    fetchFacility();
    fetchDoctorsAndProcedures();
  }, [fetchFacility, fetchDoctorsAndProcedures]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const filteredDoctors = doctors
    .filter((d) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        d.display_name?.toLowerCase().includes(q) ||
        d.specialty?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => (a.display_name || "").localeCompare(b.display_name || "", undefined, { sensitivity: "base" }));

  const doctorProcedures = selectedDoctor
    ? procedures.filter((p) => p.user_id === selectedDoctor)
    : [];

  const selectedDoctorProfile = selectedDoctor
    ? doctors.find((d) => d.user_id === selectedDoctor)
    : null;

  const openChangeRequest = (proc: ProcedureInfo) => {
    setSelectedProcedure(proc);
    setChangeRequestText("");
    setChangeCategory("general");
    setChangeRequestOpen(true);
  };

  const submitChangeRequest = async () => {
    if (!selectedProcedure || !changeRequestText.trim() || !user) return;
    setSubmitting(true);
    const { error } = await supabase.from("pending_preference_changes").insert({
      procedure_id: selectedProcedure.id,
      submitted_by: user.id,
      category: changeCategory,
      new_value: changeRequestText.trim(),
      old_value: "",
      status: "pending",
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Change request submitted", description: "Awaiting doctor approval." });
      setChangeRequestOpen(false);
      setChangeRequestText("");
    }
  };

  // Voice-to-text
  const startRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Not supported", description: "Voice-to-text is not supported in this browser.", variant: "destructive" });
      return;
    }
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setChangeRequestText(transcript);
    };

    rec.onerror = () => {
      setIsRecording(false);
      toast({ title: "Error", description: "Voice recognition error.", variant: "destructive" });
    };

    rec.onend = () => setIsRecording(false);

    rec.start();
    setRecognition(rec);
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (recognition) {
      recognition.stop();
      setRecognition(null);
    }
    setIsRecording(false);
  };

  const CHANGE_CATEGORIES = [
    { key: "general", label: "General" },
    { key: "gloves", label: "Gloves" },
    { key: "gown", label: "Gown/Draping" },
    { key: "position", label: "Patient Position" },
    { key: "skin_prep", label: "Skin Prep" },
    { key: "sutures", label: "Sutures" },
    { key: "dressing", label: "Dressings" },
    { key: "equipment", label: "Equipment" },
    { key: "medication", label: "Medications" },
    { key: "instruments", label: "Instruments" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 pt-16 pb-8">
      <NavHeader />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm mx-auto flex flex-col gap-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-light text-foreground">
            {greeting},{" "}
            <span className="text-primary font-medium">{displayName}</span>
          </h1>
          <TooltipProvider delayDuration={300}>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={() => navigate("/settings")} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                    <Settings size={20} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">Settings</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={handleSignOut} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                    <LogOut size={20} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">Sign Out</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>

        {/* Profile Card */}
        <div className="flex items-center gap-4 rounded-xl bg-card border border-border p-4">
          <Avatar className="h-14 w-14 border-2 border-primary/30">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
            <AvatarFallback className="bg-secondary text-foreground text-lg font-medium">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-foreground font-medium">{displayName}</p>
            <p className="text-sm text-muted-foreground">{roleLabel}</p>
          </div>
        </div>

        {/* Facility Card */}
        {facility && (
          <div className="rounded-xl bg-card border border-primary/30 p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-foreground font-medium">{facility.name}</p>
                {facility.location && (
                  <p className="text-xs text-muted-foreground">{facility.location}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {!facility && (
          <div className="rounded-xl bg-card border border-border p-6 text-center">
            <Building2 size={32} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No facility assigned</p>
            <p className="text-xs text-muted-foreground mt-1">Contact your administrator</p>
          </div>
        )}

        {/* Doctor or Procedures View */}
        {!selectedDoctor ? (
          <>
            {/* Doctors Section */}
            <div>
              <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-2 mb-3">
                <Stethoscope size={16} className="text-primary" /> Doctors
              </h2>

              {doctors.length > 3 && (
                <div className="relative mb-3">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search doctors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-border bg-secondary pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              )}

              {filteredDoctors.length === 0 ? (
                <div className="rounded-xl bg-card border border-border p-6 text-center">
                  <User size={32} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No doctors found at this facility</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {filteredDoctors.map((doc) => {
                    const procCount = procedures.filter((p) => p.user_id === doc.user_id).length;
                    return (
                      <motion.div
                        key={doc.user_id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-3 rounded-xl bg-card border border-border p-4 cursor-pointer hover:border-primary/40 transition-colors"
                        onClick={() => setSelectedDoctor(doc.user_id)}
                      >
                        <Avatar className="h-10 w-10 border border-border">
                          {doc.avatar_url ? <AvatarImage src={doc.avatar_url} alt={doc.display_name || ""} /> : null}
                          <AvatarFallback className="bg-secondary text-foreground text-sm">
                            {(doc.display_name || "D").charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground font-medium text-sm">{doc.display_name || "Unknown"}</p>
                          {doc.specialty && (
                            <p className="text-xs text-primary/80">{doc.specialty}</p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">{procCount} card{procCount !== 1 ? "s" : ""}</span>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Doctor's Preference Cards */}
            <div>
              <button
                onClick={() => setSelectedDoctor(null)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
              >
                <X size={14} /> Back to doctors
              </button>

              {selectedDoctorProfile && (
                <div className="flex items-center gap-3 rounded-xl bg-card border border-border p-4 mb-4">
                  <Avatar className="h-10 w-10 border border-border">
                    {selectedDoctorProfile.avatar_url ? (
                      <AvatarImage src={selectedDoctorProfile.avatar_url} alt={selectedDoctorProfile.display_name || ""} />
                    ) : null}
                    <AvatarFallback className="bg-secondary text-foreground text-sm">
                      {(selectedDoctorProfile.display_name || "D").charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-foreground font-medium">{selectedDoctorProfile.display_name}</p>
                    {selectedDoctorProfile.specialty && (
                      <p className="text-xs text-primary/80">{selectedDoctorProfile.specialty}</p>
                    )}
                  </div>
                </div>
              )}

              <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-2 mb-3">
                <Stethoscope size={16} className="text-primary" /> Preference Cards
              </h2>

              {doctorProcedures.length === 0 ? (
                <div className="rounded-xl bg-card border border-border p-6 text-center">
                  <Stethoscope size={32} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No preference cards found</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {doctorProcedures.map((proc) => (
                    <motion.div
                      key={proc.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="rounded-xl bg-card border border-border p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-foreground font-medium text-sm">{proc.name}</p>
                          {proc.category && (
                            <p className="text-xs text-muted-foreground mt-0.5">{proc.category}</p>
                          )}
                        </div>
                        <button
                          onClick={() => openChangeRequest(proc)}
                          className="text-xs font-medium text-primary hover:text-gold-light transition-colors px-3 py-1.5 rounded-lg border border-primary/30 hover:border-primary/60"
                        >
                          Request Change
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </motion.div>

      {/* Change Request Drawer */}
      <Drawer open={changeRequestOpen} onOpenChange={setChangeRequestOpen}>
        <DrawerContent className="bg-background border-border max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle className="text-foreground">
              Request Change
            </DrawerTitle>
            {selectedProcedure && (
              <p className="text-xs text-muted-foreground">{selectedProcedure.name}</p>
            )}
          </DrawerHeader>
          <div className="px-4 pb-6 flex flex-col gap-4">
            {/* Category selector */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Category</label>
              <div className="flex flex-wrap gap-2">
                {CHANGE_CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setChangeCategory(cat.key)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      changeCategory === cat.key
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-foreground border-border hover:border-primary/40"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Text area with voice-to-text */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                Requested Change
              </label>
              <div className="relative">
                <textarea
                  value={changeRequestText}
                  onChange={(e) => setChangeRequestText(e.target.value)}
                  placeholder="Describe the change you'd like to request..."
                  className="w-full rounded-lg border border-border bg-input px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[120px] resize-none"
                />
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`absolute bottom-3 right-3 p-2 rounded-full transition-colors ${
                    isRecording
                      ? "bg-destructive text-destructive-foreground animate-pulse"
                      : "bg-primary/10 text-primary hover:bg-primary/20"
                  }`}
                  title={isRecording ? "Stop recording" : "Voice-to-text"}
                >
                  {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
              </div>
              {isRecording && (
                <p className="text-xs text-destructive mt-1 animate-pulse">Recording... Speak now</p>
              )}
            </div>

            {/* Submit */}
            <button
              onClick={submitChangeRequest}
              disabled={!changeRequestText.trim() || submitting}
              className="flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-gold-light active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <>
                  <Send size={16} />
                  Submit Request
                </>
              )}
            </button>

            <p className="text-xs text-muted-foreground text-center">
              Your request will be sent for doctor approval
            </p>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default ClinicalStaffDashboard;
