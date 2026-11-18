import { cn } from "@/lib/utils";

/** The mark: a slash and a full stop, the start of a short path. Shared with the favicon (src/app/api/icon/route.ts). */
export const MARK_SLASH = "M17.6 7.5 11.4 24.5";
export const MARK_DOT = { cx: 20.6, cy: 22.3, r: 2.3 };

export default function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-7", className)}>
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <path d={MARK_SLASH} fill="none" strokeWidth="3.4" strokeLinecap="round" className="stroke-primary-foreground" />
      <circle {...MARK_DOT} className="fill-primary-foreground" />
    </svg>
  );
}

/** Logo plus the product name, as used in headers. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <Logo className="size-7" />
      <span className="font-display text-[18px] font-bold tracking-[-0.02em]">smolurl</span>
    </span>
  );
}
