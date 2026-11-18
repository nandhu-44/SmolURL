"use client";
import { Tooltip as T } from "radix-ui";

export const TooltipProvider = T.Provider;

export function Tip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <T.Root delayDuration={300}>
      <T.Trigger asChild>{children}</T.Trigger>
      <T.Portal>
        <T.Content
          sideOffset={6}
          className="z-[60] origin-[var(--radix-tooltip-content-transform-origin)] rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background duration-150 data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-[0.97]"
        >
          {label}
        </T.Content>
      </T.Portal>
    </T.Root>
  );
}
