import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { Building2, User, ArrowLeft, Search, MapPin, ChevronRight, Plus, Trash2 } from "lucide-react";
import NavHeader from "@/components/NavHeader";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import CreateSurgeonDialog from "@/components/CreateSurgeonDialog";
import { useToast } from "@/hooks/use-toast";

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

const FacilityDetails = () => {
  const navigate = useNavigate();
  const { facilityId } = useParams<{ facilityId: string }>();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [facility, setFacility] = useState<FacilityInfo | null>(null);
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const accountType = user?.user_metadata?.account_type;
  const isIndividual = accountType === "individual" || (!profile?.facility_id && !accountType);

  const displayName = profile?.display_name || user?.user_metadata?.full_name || "User";
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || null;
  const userRole = profile?.role || "";
  const roleLabel = userRole.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());

  const fetchFacility = useCallback(async () => {
    if (!facilityId) return;
    const { data } = await supabase
      .from("facilities")
      .select("id, name, location")
      .eq("id", facilityId)
      .single();
    if (data) setFacility(data);
  }, [facilityId]);

  const fetchDoctors = useCallback(async () => {
    if (!facilityId) return;
    const { data: links } = await supabase
      .from("doctor_facilities")
      .select("user_id")
      .eq("facility_id", facilityId);
    if (!links || links.length === 0) { setDoctors([]); return; }
    // Exclude the logged-in user from the doctors list
    const userIds = links.map(l => l.user_id).filter(id => id !== user?.id);
    if (userIds.length === 0) { setDoctors([]); return; }
    const { data } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url, specialty")
      .in("user_id", userIds);
    if (data) setDoctors(data.sort((a, b) => (a.display_name || "").localeCompare(b.display_name || "")));
  }, [facilityId]);

  useEffect(() => {
    fetchFacility();
    fetchDoctors();
  }, [fetchFacility, fetchDoctors]);

  const removeDoctor = async (doctorUserId: string) => {
    if (!facilityId) return;
    const { error } = await supabase
      .from("doctor_facilities" as any)
      .delete()
      .eq("user_id", doctorUserId)
      .eq("facility_id", facilityId);
    if (!error) {
      fetchDoctors();
      toast({ title: "Doctor removed" });
    } else {
      toast({ title: "Error", description: (error as any).message, variant: "destructive" });
    }
  };

  const filteredDoctors = doctors.filter(d =>
    (d.display_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.specialty || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 pt-16 pb-8">
      <NavHeader />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm mx-auto flex flex-col gap-6"
      >
        {/* Back + Facility Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-primary transition-colors p-1"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-medium text-foreground">{facility?.name || "Facility"}</h1>
            {facility?.location && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin size={12} className="text-primary" /> {facility.location}
              </p>
            )}
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 size={18} className="text-primary" />
          </div>
        </div>

        {/* Individual User Profile Card */}
        {isIndividual && (
          <div className="flex items-center gap-4 rounded-xl bg-card border border-border p-4">
            <Avatar className="h-14 w-14 border-2 border-primary/30">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
              <AvatarFallback className="bg-secondary text-foreground text-lg font-medium">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-foreground font-medium">{displayName}</p>
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary tracking-wide uppercase">
                  <User size={10} />
                  Individual
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{roleLabel}</p>
            </div>
          </div>
        )}

        {/* Doctors Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-2">
              <User size={16} className="text-primary" /> Doctors
            </h2>
          </div>

          {isIndividual && (
            <div className="mb-3">
              <CreateSurgeonDialog onCreated={fetchDoctors} facilityId={facilityId} isIndividual={isIndividual} />
            </div>
          )}

          <p className="text-xs text-muted-foreground/70 mb-3">
            {isIndividual
              ? "Add and manage doctors for your personal workflow."
              : "Doctors associated with this facility."}
          </p>

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
              <p className="text-sm text-muted-foreground">
                {isIndividual ? "No doctors added yet" : "No doctors available for this facility"}
              </p>
              {isIndividual && (
                <p className="text-xs text-muted-foreground/70 mt-2">
                  Add doctors to start organizing procedures and preference cards.
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredDoctors.map((doc) => (
                <motion.div
                  key={doc.user_id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full flex items-center gap-3 rounded-xl bg-card border border-border p-4 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all"
                >
                  <button
                    onClick={() => navigate(`/doctor/${doc.user_id}`)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    <Avatar className="h-10 w-10 border border-border">
                      {doc.avatar_url ? <AvatarImage src={doc.avatar_url} /> : null}
                      <AvatarFallback className="bg-secondary text-foreground text-sm">
                        {(doc.display_name || "D").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{doc.display_name}</p>
                      <p className="text-xs text-primary">{doc.specialty || "No specialty"}</p>
                    </div>
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    {isIndividual && (
                      <button
                        onClick={() => removeDoctor(doc.user_id)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1.5"
                        aria-label="Remove doctor"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                    <ChevronRight size={16} className="text-muted-foreground" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Info banner for Individual users */}
        {isIndividual && (
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              As an <span className="text-primary font-medium">Individual</span> user, you can freely add doctors, create procedures, and manage preference cards. All changes save instantly.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default FacilityDetails;
