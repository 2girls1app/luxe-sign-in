import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { Building2, User, ArrowLeft, Search, MapPin } from "lucide-react";
import NavHeader from "@/components/NavHeader";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

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
  const { profile } = useAuth();

  const [facility, setFacility] = useState<FacilityInfo | null>(null);
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

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
    const { data } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url, specialty")
      .eq("facility_id", facilityId)
      .eq("role", "surgeon");
    if (data) setDoctors(data.sort((a, b) => (a.display_name || "").localeCompare(b.display_name || "")));
  }, [facilityId]);

  useEffect(() => {
    fetchFacility();
    fetchDoctors();
  }, [fetchFacility, fetchDoctors]);

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

        {/* Doctors Section */}
        <div>
          <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-2 mb-3">
            <User size={16} className="text-primary" /> Doctors
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
              <p className="text-sm text-muted-foreground">No doctors available for this facility</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredDoctors.map((doc) => {
                const procCount = procedures.filter(p => p.user_id === doc.user_id).length;
                return (
                  <motion.div
                    key={doc.user_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full flex items-center gap-3 rounded-xl bg-card border border-border p-4"
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
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

      </motion.div>
    </div>
  );
};

export default FacilityDetails;

