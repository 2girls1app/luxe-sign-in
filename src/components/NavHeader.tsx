import { ArrowLeft, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface NavHeaderProps {
  showHome?: boolean;
}

const NavHeader = ({ showHome = true }: NavHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-background/80 backdrop-blur-sm">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft size={20} />
        <span className="text-xs font-medium">BACK</span>
      </button>
      {showHome && (
        <button
          onClick={() => navigate("/profile")}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
        >
          <Home size={20} />
          <span className="text-xs font-medium">Home</span>
        </button>
      )}
    </div>
  );
};

export default NavHeader;
