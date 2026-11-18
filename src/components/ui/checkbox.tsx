"use client";
import { Check } from "lucide-react";
import { Checkbox as C } from "radix-ui";

/** Standard checkbox for forms. */
export function FormCheckbox({ id, name, defaultChecked, checked, onCheckedChange, children }: { id: string; name: string; defaultChecked?: boolean; checked?: boolean; onCheckedChange?: (c: boolean) => void; children: React.ReactNode }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2 text-sm">
      <C.Root id={id} name={name} defaultChecked={defaultChecked} checked={checked} onCheckedChange={onCheckedChange && ((c) => onCheckedChange(c === true))} className="grid size-4 shrink-0 place-items-center rounded-[4px] border border-muted-foreground/50 bg-card transition-colors duration-150 data-[state=checked]:border-primary data-[state=checked]:bg-primary">
        <C.Indicator><Check className="size-3 text-primary-foreground" strokeWidth={3.5} /></C.Indicator>
      </C.Root>
      {children}
    </label>
  );
}
