import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Wordmark } from "./Logo";
import { Button } from "./ui/button";

/** A message page (404, an expired or paused link). Says what happened and where to go next. */
export default function StatusPage({ code, title, message }: { icon?: LucideIcon; code?: string; title: string; message: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex h-14 w-full max-w-5xl items-center px-4 sm:px-6">
        <Link href="/" aria-label="smolurl home" className="rounded-md"><Wordmark /></Link>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-[14vh] sm:px-6">
        {code && <p className="mono text-sm text-muted-foreground">{code}</p>}
        <h1 className="mt-2 max-w-xl text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-md text-muted-foreground">{message}</p>
        <Button asChild variant="outline" className="mt-7"><Link href="/">Go to smolurl</Link></Button>
      </main>
    </div>
  );
}
