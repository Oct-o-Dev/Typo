// client/src/components/Button.tsx
'use client';

import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot"; // Import the official Slot
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transition-transform hover:scale-[1.03]",
  {
    variants: {
      variant: {
        default: "bg-yellow-400 text-black hover:bg-yellow-400/90",
        destructive: "bg-red-600 text-white hover:bg-red-600/90",
        outline: "border border-yellow-400 bg-transparent text-yellow-400 hover:bg-yellow-400 hover:text-black",
        secondary: "bg-gray-700 text-white hover:bg-gray-700/80",
        ghost: "hover:bg-gray-700 hover:text-white",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };