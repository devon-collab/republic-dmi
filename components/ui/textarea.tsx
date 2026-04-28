import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-[120px] w-full rounded-3xl border border-stone-200 bg-white px-4 py-3 text-sm text-ink shadow-sm outline-none transition focus:border-burgundy focus:ring-2 focus:ring-burgundy/10",
        className
      )}
      {...props}
    />
  )
);

Textarea.displayName = "Textarea";
