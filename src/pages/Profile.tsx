import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, LogOut, MapPin, Building2, Stethoscope, Trash2, Pencil, Check, X, Headphones } from "lucide-react";
import MusicPreferencesDrawer from "@/components/MusicPreferencesDrawer";
import { useNavigate } from "react-router-dom";
import NavHeader from "@/components/NavHeader";
import AddFacilityDialog from "@/components/AddFacilityDialog";
import AddProcedureDialog from "@/components/AddProcedureDialog";
import ProcedureCard from "@/components/ProcedureCard";
import ProfileAvatarUpload from "@/components/ProfileAvatarUpload";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Facility {
  id: string;
  name: string;
  location: string | null;
  notes: string | null;
}

interface Procedure {
  id: string;
  name: string;
  category: string | null;
  facility_id: string | null;
  notes: string | null;
}

const Profile = () => {
  const navigate = useNavigate();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [searchProcedures, setSearchProcedures] = useState("");
  const [specialty, setSpecialty] = useState<string>(profile?.specialty || "");
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [musicDrawerOpen, setMusicDrawerOpen] = useState(false);
  const [hasMusicPrefs, setHasMusicPrefs] = useState(false);

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

  const emailUsername = user?.email?.split("@")[0] || "";
  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.user_metadata?.name || emailUsername || "User";
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || null;
  const userRole = profile?.role || user?.user_metadata?.profession || "";
  const roleLabel = userRole ? userRole.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) : "";
  const isAdmin = ["administrative", "admin", "admin-staff"].includes(userRole);
  const username = emailUsername || displayName.toLowerCase().replace(/\s+/g, "");

  const fetchFacilities = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("facilities").select("id, name, location, notes").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) setFacilities(data);
  }, [user]);

  const fetchProcedures = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("procedures").select("id, name, category, facility_id, notes").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) setProcedures(data);
  }, [user]);

  useEffect(() => {
    if (profile?.specialty) setSpecialty(profile.specialty);
  }, [profile]);

  const fetchMusicPrefsCount = useCallback(async () => {
    if (!user) return;
    const { count } = await supabase
      .from("music_preferences")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    setHasMusicPrefs((count ?? 0) > 0);
  }, [user]);

  useEffect(() => {
    refreshProfile();
    fetchFacilities();
    fetchProcedures();
    fetchMusicPrefsCount();
  }, [fetchFacilities, fetchProcedures, fetchMusicPrefsCount]);

  const updateSpecialty = async (value: string) => {
    setSpecialty(value);
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ specialty: value } as any).eq("user_id", user.id);
    if (error) {
      toast({ title: "Error", description: "Failed to save specialty", variant: "destructive" });
    } else {
      toast({ title: "Specialty updated" });
      refreshProfile();
    }
  };

  const startEditingName = () => {
    setNameInput(displayName === "User" ? "" : displayName);
    setEditingName(true);
  };

  const saveName = async () => {
    if (!user || !nameInput.trim()) return;
    const { error } = await supabase.from("profiles").update({ display_name: nameInput.trim() } as any).eq("user_id", user.id);
    if (error) {
      toast({ title: "Error", description: "Failed to update name", variant: "destructive" });
    } else {
      toast({ title: "Name updated" });
      refreshProfile();
    }
    setEditingName(false);
  };

  const deleteFacility = async (id: string) => {
    const { error } = await supabase.from("facilities").delete().eq("id", id);
    if (!error) fetchFacilities();
    else toast({ title: "Error", description: error.message, variant: "destructive" });
  };

  const deleteProcedure = async (id: string) => {
    const { error } = await supabase.from("procedures").delete().eq("id", id);
    if (!error) fetchProcedures();
    else toast({ title: "Error", description: error.message, variant: "destructive" });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const filteredProcedures = procedures.filter((p) =>
    p.name.toLowerCase().includes(searchProcedures.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(searchProcedures.toLowerCase()))
  );

  const getFacilityName = (facilityId: string | null) => {
    if (!facilityId) return null;
    return facilities.find((f) => f.id === facilityId)?.name || null;
  };

  // Determine greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

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
          <button onClick={handleSignOut} className="text-muted-foreground hover:text-foreground transition-colors">
            <LogOut size={20} />
          </button>
        </div>

        {/* Profile Card */}
        <div className="relative flex items-center gap-4 rounded-xl bg-card border border-border p-4">
          {/* Music icon - top right */}
          {!isAdmin && (
            <button
              onClick={() => setMusicDrawerOpen(true)}
              className="absolute top-3 right-3 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 group hover:shadow-lg hover:shadow-primary/20 active:scale-95"
              style={hasMusicPrefs
                ? { background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--gold-dark)) 100%)" }
                : { background: "hsl(var(--muted) / 0.5)" }
              }
              aria-label="Music preferences"
            >
              <Headphones size={14} className={hasMusicPrefs ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"} />
              {hasMusicPrefs && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-card" />
              )}
            </button>
          )}
          <ProfileAvatarUpload />
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveName()}
                  autoFocus
                  className="bg-secondary border border-border rounded-lg px-3 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring w-full"
                  placeholder="Enter your name"
                />
                <button onClick={saveName} className="text-primary hover:text-primary/80 transition-colors">
                  <Check size={16} />
                </button>
                <button onClick={() => setEditingName(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-foreground font-medium">{displayName}</p>
                <button onClick={startEditingName} className="text-muted-foreground hover:text-primary transition-colors">
                  <Pencil size={12} />
                </button>
              </div>
            )}
            <p className="text-sm text-muted-foreground">{roleLabel || username}</p>
          </div>
        </div>

        {/* Surgery Specialty - hidden for admin */}
        {!isAdmin && (
          <div>
            <label className="text-sm font-semibold tracking-wider text-muted-foreground uppercase mb-2 block">
              Surgery Specialty
            </label>
            <Select value={specialty} onValueChange={updateSpecialty}>
              <SelectTrigger className="w-full rounded-xl border-border bg-card text-foreground h-12">
                <SelectValue placeholder="Select your surgery specialty" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {SPECIALTIES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Facilities Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-2">
              <Building2 size={16} className="text-primary" /> Facilities
            </h2>
            <AddFacilityDialog onAdded={fetchFacilities} />
          </div>
          {facilities.length === 0 ? (
            <div className="rounded-xl bg-card border border-border p-6 text-center">
              <Building2 size={32} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No facilities added yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {facilities.map((f) => (
                <motion.div key={f.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start justify-between rounded-xl bg-card border border-border p-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-medium text-sm">{f.name}</p>
                    {f.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin size={12} /> {f.location}
                      </p>
                    )}
                    {f.notes && <p className="text-xs text-muted-foreground mt-1 truncate">{f.notes}</p>}
                  </div>
                  <button onClick={() => deleteFacility(f.id)} className="text-muted-foreground hover:text-destructive transition-colors ml-2 mt-0.5">
                    <Trash2 size={14} />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Procedures Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-2">
              <Stethoscope size={16} className="text-primary" /> Procedures
            </h2>
            <AddProcedureDialog facilities={facilities} onAdded={fetchProcedures} />
          </div>

          {procedures.length > 0 && (
            <div className="relative mb-3">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search procedures..."
                value={searchProcedures}
                onChange={(e) => setSearchProcedures(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}

          {procedures.length === 0 ? (
            <div className="rounded-xl bg-card border border-border p-6 text-center">
              <Stethoscope size={32} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No procedures added yet</p>
            </div>
          ) : filteredProcedures.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No matching procedures</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredProcedures.map((p) => (
                <ProcedureCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  category={p.category}
                  facilityName={getFacilityName(p.facility_id)}
                  notes={p.notes}
                  onDelete={deleteProcedure}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>
      {!isAdmin && (
        <MusicPreferencesDrawer
          open={musicDrawerOpen}
          onOpenChange={(open) => {
            setMusicDrawerOpen(open);
            if (!open) fetchMusicPrefsCount();
          }}
        />
      )}
    </div>
  );
};

export default Profile;
