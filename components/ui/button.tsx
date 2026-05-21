import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "rounded-cta bg-primary text-primary-foreground shadow-cta hover:bg-neon-cta-hover active:bg-neon-cta-pressed",
        destructive:
          "rounded-xl bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "rounded-xl border border-white/15 bg-transparent text-white shadow-sm hover:bg-white/10",
        secondary:
          "rounded-xl border border-white/10 bg-white/10 text-white hover:bg-white/15",
        ghost: "rounded-xl text-muted-foreground hover:bg-white/10 hover:text-white",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 rounded-xl px-4 py-2 text-sm",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-xl px-8 text-base",
        cta: "min-h-cta w-full rounded-cta px-7 py-6 text-button",
        /** In-card primary on entry pages (login/join) — mint CTA without 92px hero height */
        "cta-entry": "h-14 min-h-14 w-full rounded-cta px-6 text-lg font-semibold",
        "cta-compact": "min-h-cta-compact rounded-xl px-4 py-2 text-base font-medium",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
