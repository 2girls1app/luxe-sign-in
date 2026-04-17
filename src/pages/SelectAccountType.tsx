import { motion } from "framer-motion";
import { User, Building2, ArrowLeft } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import logoImg from "@/assets/logo.png";
import NavHeader from "@/components/NavHeader";

const accountTypes = [
  {
    id: "individual",
    title: "Individual",
    icon: User,
    description:
      "For independent first assists and healthcare professionals managing their own doctors and facilities.",
    features: [
      "Create your own account independently",
      "Freely add and manage facilities",
      "Freely add and manage doctors",
      "No facility code required",
    ],
  },
  {
    id: "facility",
    title: "Facility",
    icon: Building2,
    description:
      "For users joining an existing hospital, surgery center, or organization with admin-managed access.",
    features: [
      "Join an existing facility or organization",
      "Enter a facility code to connect",
      "Or request access from facility admin",
      "Admin-managed permissions",
    ],
  },
];

const SelectAccountType = () => {
  const navigate = useNavigate();

  const handleSelect = (type: string) => {
    navigate("/select-profession", { state: { accountType: type } });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 pt-16 pb-12">
      <NavHeader />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl flex flex-col items-center gap-8"
      >
        <img src={logoImg} alt="First Assist" className="w-32 h-32 object-contain" />
        <h1 className="text-2xl font-light tracking-[0.2em] text-primary text-center uppercase">
          First Assist
        </h1>

        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-wide text-foreground">
            Choose Your Account Type
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Select how you'll be using the platform
          </p>
        </div>

        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-5">
          {accountTypes.map((type, i) => (
            <motion.button
              key={type.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * i }}
              onClick={() => handleSelect(type.id)}
              className="group relative flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-6 text-left transition-all hover:border-primary hover:shadow-[0_0_20px_-6px_hsl(var(--primary)/0.35)] active:scale-[0.98]"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 border border-primary/20 transition-colors group-hover:bg-primary/20">
                <type.icon size={28} className="text-primary" />
              </div>

              <h3 className="text-lg font-semibold text-foreground">{type.title}</h3>

              <p className="text-xs text-muted-foreground text-center leading-relaxed">
                {type.description}
              </p>

              <ul className="w-full space-y-1.5 mt-1">
                {type.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-2 rounded-lg bg-primary/10 px-5 py-2 text-xs font-semibold text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                Select {type.title}
              </div>
            </motion.button>
          ))}
        </div>

        <div className="w-full border-t border-border" />

        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/" className="text-primary hover:text-gold-light underline">
            Sign In Here
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default SelectAccountType;
