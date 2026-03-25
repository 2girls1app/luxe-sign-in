import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import physicianImg from "@/assets/physician.png";
import firstAssistImg from "@/assets/first-assist.png";
import nurseImg from "@/assets/nurse.png";
import anesthesiaImg from "@/assets/anesthesia.png";
import administrativeImg from "@/assets/administrative.png";
import paImg from "@/assets/physician-assistant.png";

const professions = [
  { id: "doctor", label: "DOCTOR", image: physicianImg },
  { id: "physician-assistant", label: "PHYSICIAN ASST", image: paImg },
  { id: "nurse", label: "NURSE", image: nurseImg },
  { id: "anesthesia", label: "ANESTHESIA", image: anesthesiaImg },
  { id: "administrative", label: "ADMIN STAFF", image: administrativeImg },
];

const SelectProfession = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = () => {
    if (selected) {
      navigate("/signup", { state: { profession: selected } });
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
          Please Select Your Medical<br />Profession
        </h1>

        <div className="grid grid-cols-2 gap-6 w-full justify-items-center">
          {professions.map((prof) => (
            <button
              key={prof.id}
              onClick={() => setSelected(prof.id)}
              className="flex flex-col items-center gap-2 focus:outline-none"
            >
              <div className="w-28 h-28 rounded-full overflow-hidden bg-card border-2 border-border">
                <img
                  src={prof.image}
                  alt={prof.label}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  width={512}
                  height={512}
                />
              </div>
              <span className="text-xs font-semibold tracking-wider text-foreground">
                {prof.label}
              </span>
              <div
                className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center transition-colors ${
                  selected === prof.id
                    ? "bg-primary border-primary"
                    : "border-muted-foreground"
                }`}
              >
                {selected === prof.id && (
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2 6L5 9L10 3"
                      stroke="hsl(0,0%,8%)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            </button>
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

        <p className="text-sm text-muted-foreground italic">
          Advanced Surgical Solutions
        </p>
      </motion.div>
    </div>
  );
};

export default SelectProfession;
