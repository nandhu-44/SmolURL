"use client";
import { Check, Loader2, X } from "lucide-react";
import type { SlugStatus } from "@/lib/client";
import { cn } from "@/lib/utils";

/** "Short name" input shown as /r/<name>, with a live availability message. */
export function SlugField({ id, value, onChange, status, placeholder = "random" }: { id: string; value: string; onChange: (v: string) => void; status: SlugStatus; placeholder?: string }) {
  const bad = status === "invalid" || status === "taken";
  return (
    <div className="space-y-1.5">
      <div
        className={cn(
          "flex h-9 items-center rounded-md border border-border bg-card pl-3 text-sm shadow-[0_1px_0_0_hsl(var(--border)/0.6)] transition-[border-color,box-shadow] duration-150 focus-within:border-primary focus-within:shadow-[0_0_0_1px_hsl(var(--primary))]",
          bad && "border-destructive focus-within:border-destructive focus-within:shadow-[0_0_0_1px_hsl(var(--destructive))]",
        )}
      >
        <span className="mono select-none text-muted-foreground">/r/</span>
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\s/g, "-"))}
          placeholder={placeholder}
          maxLength={64}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={bad}
          aria-describedby={`${id}-status`}
          className="mono h-full min-w-0 flex-1 bg-transparent pr-3 outline-none placeholder:text-muted-foreground/70 focus-visible:outline-none"
        />
      </div>
      <p id={`${id}-status`} aria-live="polite" className={cn("flex min-h-4 items-center gap-1 text-xs", bad ? "text-destructive" : "text-muted-foreground")}>
        {status === "checking" && <><Loader2 className="size-3 animate-spin" /> Checking…</>}
        {status === "available" && <span className="flex items-center gap-1 text-success"><Check className="size-3" /> Available</span>}
        {status === "taken" && <><X className="size-3" /> Taken. Try another name.</>}
        {status === "invalid" && <>Use letters, numbers, - and _. Start with a letter or number.</>}
        {status === "empty" && <>Leave empty for a random name.</>}
      </p>
    </div>
  );
}
