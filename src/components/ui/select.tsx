"use client";
import { Check, ChevronDown } from "lucide-react";
import { Select as S } from "radix-ui";
import * as React from "react";
import { cn } from "@/lib/utils";

export const Select = S.Root;

export const SelectTrigger = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof S.Trigger>>(
  ({ className, children, ...props }, ref) => (
    <S.Trigger
      ref={ref}
      className={cn(
        "flex h-9 items-center justify-between gap-2 rounded-md border border-border bg-card px-3 text-sm shadow-[0_1px_0_0_hsl(var(--border)/0.6)] transition-[border-color,box-shadow] duration-150 focus-visible:border-primary focus-visible:shadow-[0_0_0_1px_hsl(var(--primary))] focus-visible:outline-none data-[state=open]:border-primary",
        className,
      )}
      {...props}
    >
      {children}
      <S.Icon><ChevronDown className="size-4 text-muted-foreground" /></S.Icon>
    </S.Trigger>
  ),
);
SelectTrigger.displayName = "SelectTrigger";

export const SelectValue = S.Value;

export function SelectContent({ className, children, ...props }: React.ComponentProps<typeof S.Content>) {
  return (
    <S.Portal>
      <S.Content
        position="popper"
        sideOffset={6}
        className={cn(
          "z-50 min-w-[var(--radix-select-trigger-width)] origin-[var(--radix-select-content-transform-origin)] overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-[0_10px_30px_-10px_rgb(15_20_30/0.25),0_2px_6px_-2px_rgb(15_20_30/0.08)] duration-150 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-[0.97]",
          className,
        )}
        {...props}
      >
        <S.Viewport>{children}</S.Viewport>
      </S.Content>
    </S.Portal>
  );
}

export const SelectItem = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof S.Item>>(
  ({ className, children, ...props }, ref) => (
    <S.Item
      ref={ref}
      className={cn("relative flex cursor-pointer select-none items-center rounded-md py-1.5 pl-8 pr-3 text-sm outline-none data-[highlighted]:bg-muted", className)}
      {...props}
    >
      <S.ItemIndicator className="absolute left-2.5"><Check className="size-4 text-primary" /></S.ItemIndicator>
      <S.ItemText>{children}</S.ItemText>
    </S.Item>
  ),
);
SelectItem.displayName = "SelectItem";
