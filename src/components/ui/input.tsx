import * as React from "react";
import { cn } from "@/lib/utils";

// Matches DESIGN.md's {text-input}: surface fill, 1px border, rounded-sm, accent
// focus ring — same visual spec already used by every hand-written <input> in the app.
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full min-w-0 rounded-sm border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-tertiary focus:border-accent focus:ring-4 focus:ring-accent-bg disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
