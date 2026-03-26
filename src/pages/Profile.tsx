import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, User, LogOut, MapPin, Building2, Stethoscope, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NavHeader from "@/components/NavHeader";
import AddFacilityDialog from "@/components/AddFacilityDialog";
import AddProcedureDialog from "@/components/AddProcedureDialog";
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

  const emailUsername = user?.email?.split("@")[0] || "";
  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.user_metadata?.name || emailUsername || "User";
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || null;
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
    refreshProfile();
    fetchFacilities();
    fetchProcedures();
  }, [fetchFacilities, fetchProcedures]);

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
        <div className="flex items-center gap-4 rounded-xl bg-card border border-border p-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-secondary border-2 border-primary flex items-center justify-center">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={28} className="text-primary" />
            )}
          </div>
          <div>
            <p className="text-foreground font-medium">{displayName}</p>
            <p className="text-sm text-muted-foreground">{username}</p>
          </div>
        </div>

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
            <div className="flex flex-col gap-2">
              {filteredProcedures.map((p) => (
                <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start justify-between rounded-xl bg-card border border-border p-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-medium text-sm">{p.name}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {p.category && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{p.category}</span>
                      )}
                      {getFacilityName(p.facility_id) && (
                        <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Building2 size={10} /> {getFacilityName(p.facility_id)}
                        </span>
                      )}
                    </div>
                    {p.notes && <p className="text-xs text-muted-foreground mt-1 truncate">{p.notes}</p>}
                  </div>
                  <button onClick={() => deleteProcedure(p.id)} className="text-muted-foreground hover:text-destructive transition-colors ml-2 mt-0.5">
                    <Trash2 size={14} />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;
