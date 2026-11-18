import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** One settings group: what it is on the left, its controls on the right (stacked on phones). */
export function Section({ title, description, children, danger }: { icon?: LucideIcon; title: string; description?: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <section className="grid gap-x-10 gap-y-4 border-t border-border py-8 first:border-t-0 first:pt-2 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
      <div>
        <h2 className={cn("heading text-[15px]", danger && "text-destructive")}>{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
