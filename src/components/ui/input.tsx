import * as React from "react";
import { cn } from "@/utils/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-[#cccccc] bg-white px-3 py-2 text-sm text-[#0f0f0f] placeholder:text-[#888888] transition-colors focus-visible:border-[#065fd4] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#065fd4] disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#f2f2f2]",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
