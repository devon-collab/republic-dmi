import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-11 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm text-ink shadow-sm outline-none transition focus:border-burgundy focus:ring-2 focus:ring-burgundy/10",
      className
    )}
    {...props}
  />
));

Input.displayName = "Input";
