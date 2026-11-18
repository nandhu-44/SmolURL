import * as React from "react";
import { cn } from "@/lib/utils";

/** Shared look for text fields; exported so composite fields (e.g. the short-name input) match exactly. */
export const fieldClass =
  "w-full rounded-md border border-border bg-card px-3 text-sm text-foreground shadow-[0_1px_0_0_hsl(var(--border)/0.6)] placeholder:text-muted-foreground/80 outline-none transition-[border-color,box-shadow] duration-150 focus-visible:border-primary focus-visible:shadow-[0_0_0_1px_hsl(var(--primary))] focus-visible:outline-none disabled:opacity-60 aria-[invalid=true]:border-destructive";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn(fieldClass, "h-9", className)} {...props} />,
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => <textarea ref={ref} className={cn(fieldClass, "min-h-20 resize-y py-2", className)} {...props} />,
);
Textarea.displayName = "Textarea";
