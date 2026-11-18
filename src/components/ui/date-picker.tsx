"use client";
import { format, parseISO } from "date-fns";
import { CalendarDays, X } from "lucide-react";
import { Popover } from "radix-ui";
import { useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { cn } from "@/lib/utils";

/** value / onChange use YYYY-MM-DD strings (or "" for none). */
export function DatePicker({ value, onChange, placeholder = "No date", clearLabel = "Clear date", fromDate }: { value: string; onChange: (v: string) => void; placeholder?: string; clearLabel?: string; fromDate?: Date }) {
  const [open, setOpen] = useState(false);
  const selected = value ? parseISO(value) : undefined;
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <div className="flex gap-2">
        <Popover.Trigger asChild>
          <button
            type="button"
            className={cn(
              "flex h-9 flex-1 items-center gap-2 rounded-md border border-border bg-card px-3 text-left text-sm shadow-[0_1px_0_0_hsl(var(--border)/0.6)] transition-[border-color] duration-150 data-[state=open]:border-primary [&_svg]:text-muted-foreground",
              !selected && "text-muted-foreground",
            )}
          >
            <CalendarDays className="size-4" />
            {selected ? format(selected, "EEE, d MMM yyyy") : placeholder}
          </button>
        </Popover.Trigger>
        {selected && (
          <button type="button" onClick={() => onChange("")} aria-label={clearLabel} className="grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-muted">
            <X className="size-4" />
          </button>
        )}
      </div>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className="z-[70] origin-[var(--radix-popover-content-transform-origin)] rounded-lg border border-border bg-popover p-2 shadow-[0_10px_30px_-10px_rgb(15_20_30/0.25),0_2px_6px_-2px_rgb(15_20_30/0.08)] duration-150 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.97]"
        >
          <DayPicker
            mode="single"
            selected={selected}
            defaultMonth={selected ?? fromDate}
            disabled={fromDate ? { before: fromDate } : undefined}
            onSelect={(d) => {
              onChange(d ? format(d, "yyyy-MM-dd") : "");
              setOpen(false);
            }}
            style={{ "--rdp-accent-color": "hsl(var(--primary))", "--rdp-accent-background-color": "hsl(var(--primary) / 0.15)" } as React.CSSProperties}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
