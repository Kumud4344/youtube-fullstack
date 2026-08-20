import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#065fd4] disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
  {
    variants: {
      variant: {
        primary:
          "bg-[#0f0f0f] text-white hover:bg-[#272727] shadow-sm",
        secondary:
          "bg-[#f2f2f2] text-[#0f0f0f] hover:bg-[#e5e5e5]",
        ghost: "bg-transparent text-[#0f0f0f] hover:bg-[#f2f2f2]",
        danger: "bg-[#cc0000] text-white hover:bg-[#b00000]",
        outline:
          "border border-[#cccccc] bg-transparent text-[#0f0f0f] hover:bg-[#f2f2f2]",
        brand: "bg-[#ff0000] text-white hover:bg-[#cc0000] font-semibold",
        signin:
          "border border-[#cccccc] text-[#0f0f0f] hover:bg-[#f2f2f2] font-semibold",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-4 text-sm",
        lg: "h-11 px-6 text-base",
        icon: "h-9 w-9 rounded-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
