import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full border text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-primary bg-primary px-5 py-3 text-primary-foreground shadow-lift hover:-translate-y-0.5 hover:bg-primary/90",
        secondary: "border-secondary bg-secondary px-5 py-3 text-secondary-foreground shadow-lift hover:-translate-y-0.5 hover:bg-secondary/92",
        tertiary: "border-warning bg-warning px-5 py-3 text-warning-foreground shadow-lift hover:-translate-y-0.5 hover:bg-warning/92",
        outline: "border-secondary/20 bg-card/80 px-5 py-3 text-secondary hover:border-secondary/35 hover:bg-neutral",
        ghost: "border-transparent px-3 py-2 text-secondary hover:bg-neutral",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, ...props }, ref) => (
  <button ref={ref} className={cn(buttonVariants({ variant }), className)} {...props} />
));
Button.displayName = "Button";

export { Button, buttonVariants };
