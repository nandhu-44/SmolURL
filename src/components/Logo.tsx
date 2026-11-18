import { cn } from "@/lib/utils";

/** The chain-link mark inside the app tile; shared with the favicon (src/app/api/icon/route.ts). */
export const LINK_MARK = "M13.2 18.8a5.5 5.5 0 0 0 8.3.6l3.3-3.3a5.5 5.5 0 0 0-7.8-7.8l-1.9 1.9M18.8 13.2a5.5 5.5 0 0 0-8.3-.6l-3.3 3.3a5.5 5.5 0 0 0 7.8 7.8l1.9-1.9";

/** App mark: a rounded tile with a chain link, drawn in the theme's primary colour. */
export default function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-8", className)}>
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <path d={LINK_MARK} fill="none" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" className="stroke-primary-foreground" />
    </svg>
  );
}
