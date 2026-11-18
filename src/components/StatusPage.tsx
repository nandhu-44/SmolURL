import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import Logo from "./Logo";
import { Button } from "./ui/button";

/** A centred message page (404, an expired or turned-off link, …). */
export default function StatusPage({ icon: Icon, code, title, message }: { icon: LucideIcon; code?: string; title: string; message: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="relative">
        <Logo className="size-16" />
        <span className="absolute -bottom-2 -right-2 grid size-8 place-items-center rounded-full border-4 border-background bg-card text-primary">
          <Icon className="size-4" />
        </span>
      </div>
      {code && <p className="font-mono text-sm text-muted-foreground">{code}</p>}
      <h1 className="heading text-3xl sm:text-4xl">{title}</h1>
      <p className="max-w-md text-muted-foreground">{message}</p>
      <Button asChild className="mt-2"><Link href="/">Go to SmolURL</Link></Button>
    </main>
  );
}
