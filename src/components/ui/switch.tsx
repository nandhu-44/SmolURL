"use client";
import { Switch as S } from "radix-ui";
import * as React from "react";
import { cn } from "@/lib/utils";

export const Switch = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof S.Root>>(({ className, ...props }, ref) => (
  <S.Root
    ref={ref}
    className={cn(
      "inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent bg-muted-foreground/35 transition-colors duration-150 disabled:opacity-60 data-[state=checked]:bg-primary",
      className,
    )}
    {...props}
  >
    <S.Thumb className="block size-4 translate-x-0.5 rounded-full bg-white shadow-[0_1px_2px_rgb(0_0_0/0.25)] transition-transform duration-150 ease-out data-[state=checked]:translate-x-[18px]" />
  </S.Root>
));
Switch.displayName = "Switch";
