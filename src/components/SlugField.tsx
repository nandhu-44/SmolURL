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
          "flex h-10 items-center rounded-xl border border-border bg-background/60 pl-3.5 text-sm transition focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/20",
          bad && "border-destructive focus-within:border-destructive focus-within:ring-destructive/20",
        )}
      >
        <span className="font-mono text-muted-foreground">/r/</span>
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
          className="h-full min-w-0 flex-1 bg-transparent pr-3 font-mono outline-none placeholder:text-muted-foreground/60"
        />
      </div>
      <p id={`${id}-status`} aria-live="polite" className={cn("flex min-h-4 items-center gap-1 text-xs", bad ? "text-destructive" : "text-muted-foreground")}>
        {status === "checking" && <><Loader2 className="size-3 animate-spin" /> Checking…</>}
        {status === "available" && <><Check className="size-3" /> Available</>}
        {status === "taken" && <><X className="size-3" /> Already taken. Try another name.</>}
        {status === "invalid" && <>Letters, numbers, &ldquo;-&rdquo; and &ldquo;_&rdquo; only, starting with a letter or number.</>}
        {status === "empty" && <>Leave empty for a random name.</>}
      </p>
    </div>
  );
}
