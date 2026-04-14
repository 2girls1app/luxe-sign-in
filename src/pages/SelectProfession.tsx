import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import NavHeader from "@/components/NavHeader";
import { useAuth } from "@/contexts/AuthContext";
import physicianImg from "@/assets/physician.png";
import firstAssistImg from "@/assets/first-assist.png";
import nurseImg from "@/assets/nurse.png";
import anesthesiaImg from "@/assets/anesthesia.png";
import administrativeImg from "@/assets/administrative.png";
import paImg from "@/assets/physician-assistant.png";

const professions = [
  { id: "doctor", label: "DOCTOR", image: physicianImg },
  { id: "first-assist", label: "FIRST ASSIST", image: firstAssistImg },
  { id: "physician-assistant", label: "PHYSICIAN ASST", image: paImg },
  { id: "nurse", label: "NURSE", image: nurseImg },
  { id: "anesthesia", label: "ANESTHESIA", image: anesthesiaImg },
  { id: "administrative", label: "ADMIN STAFF", image: administrativeImg },
];

const SelectProfession = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const accountType = (location.state as any)?.accountType || "individual";
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && profile?.onboarding_completed) {
      navigate("/profile", { replace: true });
    }
  }, [loading, user, profile, navigate]);

  const handleSubmit = () => {
    if (selected) {
      navigate("/signup", { state: { profession: selected, accountType } });
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
          Please Select Your Medical<br />Profession
        </h1>

        <div className="grid grid-cols-2 gap-7 w-full">
          {professions.map((prof, index) => (
            <motion.button
              key={prof.id}
              onClick={() => setSelected(prof.id)}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={`flex flex-col items-center gap-3 focus:outline-none ${
                professions.length % 2 !== 0 && index === professions.length - 1
                  ? "col-span-2"
                  : ""
              }`}
            >
              <div
                className={`relative w-28 h-28 rounded-full overflow-hidden transition-all duration-300 ${
                  selected === prof.id
                    ? "shadow-[0_0_24px_-4px_hsl(var(--primary)/0.5)] ring-1 ring-primary/60"
                    : "shadow-[0_4px_20px_-4px_hsl(0_0%_0%/0.4)] ring-1 ring-border/40 hover:shadow-[0_6px_28px_-4px_hsl(0_0%_0%/0.5)] hover:ring-border/60"
                }`}
                style={{
                  background: "linear-gradient(145deg, hsl(0 0% 18%), hsl(0 0% 12%))",
                }}
              >
                <img
                  src={prof.image}
                  alt={prof.label}
                  className={`w-full h-full object-cover transition-all duration-300 ${
                    selected === prof.id ? "saturate-100" : "saturate-[0.85] hover:saturate-100"
                  }`}
                  loading="lazy"
                  width={512}
                  height={512}
                />
              </div>
              <span
                className={`text-[11px] font-medium tracking-[0.15em] transition-colors duration-300 ${
                  selected === prof.id ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {prof.label}
              </span>
            </motion.button>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!selected}
          className="rounded-lg bg-primary px-12 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-gold-light active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Submit
        </button>

        <div className="w-full border-t border-border" />

        <p className="text-sm text-muted-foreground italic font-bold">
          1st Assist
        </p>
      </motion.div>
    </div>
  );
};

export default SelectProfession;
