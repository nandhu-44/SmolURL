"use client";
import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="bottom-center"
      closeButton={false}
      toastOptions={{
        classNames: {
          toast: "!rounded-lg !border !border-border !bg-popover !text-foreground !font-sans !text-sm !shadow-[0_10px_30px_-10px_rgb(15_20_30/0.25)]",
          actionButton: "!bg-primary !font-medium !text-primary-foreground !rounded-md",
        },
      }}
    />
  );
}
