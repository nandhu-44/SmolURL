"use client";
import { ToggleGroup as T } from "radix-ui";
import { cn } from "@/lib/utils";

interface Option<V extends string> { value: V; label: string }

/** Single-select segmented control (filters, time ranges). */
export function SegmentedControl<V extends string>({
  value, onChange, options, className, label,
}: { value: V; onChange: (v: V) => void; options: Option<V>[]; className?: string; label: string }) {
  return (
    <T.Root
      type="single"
      value={value}
      aria-label={label}
      // Radix emits "" when the active item is clicked again; ignore it so one option always stays selected.
      onValueChange={(v) => v && onChange(v as V)}
      className={cn("inline-flex rounded-lg bg-muted p-0.5", className)}
    >
      {options.map((o) => (
        <T.Item
          key={o.value}
          value={o.value}
          className="flex-1 whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-[0_1px_2px_rgb(15_20_30/0.08),0_0_0_1px_hsl(var(--border))]"
        >
          {o.label}
        </T.Item>
      ))}
    </T.Root>
  );
}
