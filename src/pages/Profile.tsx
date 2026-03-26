import { motion } from "framer-motion";
import { Search, User, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NavHeader from "@/components/NavHeader";

const procedures = [
  { id: "kidneys", label: "Kidneys", emoji: "🫘" },
  { id: "bladder", label: "Bladder", emoji: "💧" },
  { id: "gallbladder", label: "Gallbladder", emoji: "🟢" },
  { id: "appendix", label: "Appendix", emoji: "🔴" },
  { id: "hernia", label: "Hernia", emoji: "🩹" },
  { id: "colon", label: "Colon", emoji: "🔵" },
];

const Profile = () => {
  const navigate = useNavigate();

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
            Good Morning,{" "}
            <span className="text-primary font-medium">Dr. Kramer</span>
          </h1>
          <button
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>

        {/* Profile Card */}
        <div className="flex items-center gap-4 rounded-xl bg-card border border-border p-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-secondary border-2 border-primary flex items-center justify-center">
            <User size={28} className="text-primary" />
          </div>
          <div>
            <p className="text-foreground font-medium">Dr. Kramer</p>
            <p className="text-sm text-muted-foreground">General Surgeon</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search procedures..."
            className="w-full rounded-lg border border-border bg-input pl-11 pr-4 py-3 text-sm text-primary-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Procedure Categories */}
        <div>
          <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase mb-4">
            Procedure Categories
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {procedures.map((proc) => (
              <motion.button
                key={proc.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center gap-2 rounded-xl bg-card border border-border p-4 hover:border-primary transition-colors"
              >
                <span className="text-3xl">{proc.emoji}</span>
                <span className="text-xs text-foreground font-medium">{proc.label}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;
