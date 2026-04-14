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
import scrubTechImg from "@/assets/scrub-tech.png";

const professions = [
  { id: "doctor", label: "DOCTOR", image: physicianImg },
  { id: "first-assist", label: "FIRST ASSIST", image: firstAssistImg },
  { id: "scrub-tech", label: "SCRUB TECH", image: scrubTechImg },
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
        className="w-full max-w-md flex flex-col items-center gap-10"
      >
        <h1 className="text-xl font-light tracking-[0.15em] text-foreground text-center uppercase">
          Select Your Profession
        </h1>

        <div className="grid grid-cols-2 gap-8 w-full">
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
                className={`relative w-[7rem] h-[7rem] rounded-full overflow-hidden transition-all duration-300 ${
                  selected === prof.id
                    ? "ring-[1.5px] ring-primary shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
                    : "ring-[0.5px] ring-border/30 shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
                }`}
                style={{
                  background: "linear-gradient(145deg, hsl(var(--muted)), hsl(var(--card)))",
                }}
              >
                <img
                  src={prof.image}
                  alt={prof.label}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  width={512}
                  height={512}
                />
              </div>
              <span
                className={`text-[0.65rem] tracking-[0.2em] transition-colors duration-300 ${
                  selected === prof.id
                    ? "text-primary font-semibold"
                    : "text-muted-foreground font-medium"
                }`}
              >
                {prof.label}
              </span>
            </motion.button>
          ))}
        </div>

        <motion.button
          onClick={handleSubmit}
          disabled={!selected}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="rounded-lg bg-primary px-14 py-3.5 text-xs font-semibold tracking-[0.15em] uppercase text-primary-foreground transition-all hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Continue
        </motion.button>

        <p className="text-[0.65rem] text-muted-foreground/60 tracking-[0.2em] uppercase">
          1st Assist
        </p>
      </motion.div>
    </div>
  );
};

export default SelectProfession;
