import { Trash2, Building2, Heart, Brain, Bone, Eye, Baby, Scissors, Stethoscope, Activity, Syringe, Shield, Waypoints, Cross, HandMetal, Ear, Pill, Footprints, Ribbon, Flame, Zap } from "lucide-react";
import { motion } from "framer-motion";

interface ProcedureCardProps {
  id: string;
  name: string;
  category: string | null;
  facilityName: string | null;
  notes: string | null;
  onDelete: (id: string) => void;
}

const PROCEDURE_ICON_MAP: Record<string, React.ElementType> = {
  breast: Heart,
  cardiac: Activity,
  cardio: Activity,
  heart: Activity,
  neuro: Brain,
  brain: Brain,
  spine: Brain,
  ortho: Bone,
  bone: Bone,
  joint: Bone,
  knee: Bone,
  hip: Bone,
  shoulder: Bone,
  fracture: Bone,
  eye: Eye,
  ophthalm: Eye,
  lasik: Eye,
  cataract: Eye,
  pediatric: Baby,
  cosmetic: Scissors,
  plastic: Scissors,
  rhinoplasty: Scissors,
  facelift: Scissors,
  liposuction: Scissors,
  tummy: Scissors,
  augmentation: Scissors,
  reconstruct: Scissors,
  hand: HandMetal,
  ear: Ear,
  ent: Ear,
  sinus: Ear,
  tonsil: Ear,
  vascular: Waypoints,
  varicose: Waypoints,
  transplant: Shield,
  bariatric: Flame,
  gastric: Flame,
  weight: Flame,
  trauma: Zap,
  emergency: Zap,
  oncol: Ribbon,
  cancer: Ribbon,
  tumor: Ribbon,
  biopsy: Ribbon,
  foot: Footprints,
  ankle: Footprints,
  podiatr: Footprints,
  injection: Syringe,
  botox: Syringe,
  filler: Syringe,
  hernia: Cross,
  appendix: Cross,
  gallbladder: Cross,
  cholecyst: Cross,
  laparo: Cross,
  abdomin: Cross,
};

function getIconForProcedure(name: string, category: string | null): React.ElementType {
  const searchText = `${name} ${category || ""}`.toLowerCase();
  for (const [keyword, Icon] of Object.entries(PROCEDURE_ICON_MAP)) {
    if (searchText.includes(keyword)) return Icon;
  }
  return Stethoscope;
}

const ProcedureCard = ({ id, name, category, facilityName, notes, onDelete }: ProcedureCardProps) => {
  const Icon = getIconForProcedure(name, category);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative flex flex-col rounded-2xl bg-card border border-border overflow-hidden transition-shadow hover:shadow-lg hover:shadow-primary/5"
    >
      {/* Icon area */}
      <div className="flex items-center justify-center bg-primary/5 py-6">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon size={28} className="text-primary" />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-1.5">
        <p className="text-foreground font-medium text-sm leading-tight line-clamp-2">{name}</p>

        {category && (
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full w-fit">{category}</span>
        )}

        {facilityName && (
          <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Building2 size={10} /> {facilityName}
          </span>
        )}

        {notes && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notes}</p>
        )}
      </div>

      {/* Delete button */}
      <button
        onClick={() => onDelete(id)}
        className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
        aria-label="Delete procedure"
      >
        <Trash2 size={14} />
      </button>
    </motion.div>
  );
};

export default ProcedureCard;
