import * as React from "react";

import { cn } from "@/lib/utils";

const SPELLCHECK_EXCLUDED_TYPES = new Set([
  "email", "password", "url", "number", "tel", "date", "time", "datetime-local", "month", "week", "color", "range", "hidden",
]);

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, spellCheck, autoCorrect, ...props }, ref) => {
    const shouldSpellCheck = spellCheck ?? !SPELLCHECK_EXCLUDED_TYPES.has(type || "text");

    return (
      <input
        type={type}
        spellCheck={shouldSpellCheck}
        autoCorrect={shouldSpellCheck ? "on" : "off"}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
