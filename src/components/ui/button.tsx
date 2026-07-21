import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Radii and the primary/secondary split follow DESIGN.md's {button-primary}/
// {button-secondary} spec: pill radius, one accent-filled primary per view, everything
// else a bordered secondary. The secondary variant matches the transparent-background
// + border style already used by every hand-written button across this app (not
// DESIGN.md's literal "translucent surface fill" — the codebase converged on plain
// transparent+border in practice, so this follows the actual established convention).
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-60 outline-none focus-visible:ring-4 focus-visible:ring-accent-bg [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "rounded-pill bg-accent text-white hover:opacity-90",
        secondary:
          "rounded-pill border border-border text-text-primary hover:border-border-strong",
        ghost: "rounded-pill text-text-secondary hover:bg-muted hover:text-text-primary",
        destructive: "rounded-pill bg-status-urgent text-white hover:opacity-90",
        link: "text-accent underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-5 py-2",
        sm: "h-8 px-4 text-xs",
        icon: "h-9 w-9 rounded-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
