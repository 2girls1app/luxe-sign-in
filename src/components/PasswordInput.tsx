import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
}

const PasswordInput = ({ value, onChange, placeholder = "Password", className }: PasswordInputProps) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative w-full">
      <input
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={cn(
          "w-full rounded-lg border border-border bg-input px-4 py-3 pr-11 text-sm text-primary-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold",
          className
        )}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
      >
        {visible ? (
          <EyeOff className="h-4 w-4 transition-opacity" />
        ) : (
          <Eye className="h-4 w-4 transition-opacity" />
        )}
      </button>
    </div>
  );
};

export default PasswordInput;
