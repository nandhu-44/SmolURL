"use client";
import { DropdownMenu as M } from "radix-ui";
import * as React from "react";
import { cn } from "@/lib/utils";

export const DropdownMenu = M.Root;
export const DropdownMenuTrigger = M.Trigger;

export function DropdownMenuContent({ className, ...props }: React.ComponentProps<typeof M.Content>) {
  return (
    <M.Portal>
      <M.Content
        align="end"
        sideOffset={8}
        className={cn(
          "z-50 min-w-48 origin-[var(--radix-dropdown-menu-content-transform-origin)] rounded-lg border border-border bg-popover p-1 shadow-[0_10px_30px_-10px_rgb(15_20_30/0.25),0_2px_6px_-2px_rgb(15_20_30/0.08)] duration-150 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.97] data-[state=closed]:fade-out-0",
          className,
        )}
        {...props}
      />
    </M.Portal>
  );
}

export const DropdownMenuItem = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof M.Item>>(
  ({ className, ...props }, ref) => (
    <M.Item ref={ref} className={cn("flex cursor-pointer select-none items-center gap-2 rounded-md px-2.5 py-1.5 text-sm outline-none data-[highlighted]:bg-muted [&_svg]:size-4 [&_svg]:text-muted-foreground", className)} {...props} />
  ),
);
DropdownMenuItem.displayName = "DropdownMenuItem";

export const DropdownMenuLabel = ({ className, ...props }: React.ComponentProps<typeof M.Label>) => (
  <M.Label className={cn("px-2.5 py-1.5 text-xs text-muted-foreground", className)} {...props} />
);
export const DropdownMenuSeparator = () => <M.Separator className="my-1 h-px bg-border" />;
