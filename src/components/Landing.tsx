import { BarChart3, BookOpen, CalendarClock, Code, Fingerprint, PenLine, QrCode } from "lucide-react";
import Link from "next/link";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import { Button } from "./ui/button";

const FEATURES = [
  { icon: PenLine, title: "Names you choose", text: "Turn a long address into /r/launch, or let SmolURL pick a short random one." },
  { icon: BarChart3, title: "Click stats", text: "Clicks per day and the sites they came from. Link previews and bots aren't counted." },
  { icon: QrCode, title: "QR codes", text: "Download a QR code for any link as PNG or SVG, ready for print." },
  { icon: CalendarClock, title: "Pause or expire", text: "Turn a link off without losing it, or have it stop working after a date." },
  { icon: BookOpen, title: "API", text: "Create and track links from scripts with scoped API keys and an OpenAPI spec." },
  { icon: Fingerprint, title: "Secure sign-in", text: "Passkeys, two-step verification and Google sign-in, with your own theme." },
];

/** What signed-out visitors see at /. Static: no clock, no data. */
export default function Landing() {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-16 pt-5 sm:px-6">
      <header className="flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2"><Logo className="size-9" /><span className="heading text-2xl text-primary">SmolURL</span></Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" className="hidden sm:inline-flex"><Link href="/signin">Sign in</Link></Button>
          <Button asChild><Link href="/signup">Get started</Link></Button>
        </div>
      </header>

      <section className="grid items-center gap-10 py-14 sm:py-20 md:grid-cols-[1.1fr_1fr]">
        <div>
          <h1 className="heading text-4xl leading-tight sm:text-5xl">Short links with names you&nbsp;choose.</h1>
          <p className="mt-4 max-w-md text-lg text-muted-foreground">
            Shorten any URL, share it anywhere, and see how many people clicked and where they came from.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg"><Link href="/signup">Create a free account</Link></Button>
            <Button asChild size="lg" variant="outline"><Link href="/signin">Sign in</Link></Button>
          </div>
        </div>

        {/* an illustration of a link card; not live data */}
        <div aria-hidden className="surface rotate-1 p-4 shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="heading text-lg">Spring launch post</p>
              <p className="font-mono text-sm text-primary">/r/launch</p>
              <p className="truncate text-xs text-muted-foreground">→ example.com/blog/2026/introducing-our-spring-collection</p>
            </div>
            <div className="text-right">
              <p className="heading text-2xl leading-none">1,248</p>
              <p className="text-[11px] text-muted-foreground">clicks</p>
            </div>
          </div>
          <div className="mt-4 flex h-20 items-end gap-1.5">
            {[18, 26, 22, 40, 34, 52, 47, 61, 58, 72, 66, 84, 79, 95].map((h, i) => (
              <div key={i} className="flex-1 rounded-t bg-primary" style={{ height: `${h}%`, opacity: 0.45 + i * 0.04 }} />
            ))}
          </div>
          <div className="mt-3 flex gap-2 border-t border-border pt-3">
            <span className="rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-foreground">Copy</span>
            <span className="rounded-lg border border-border px-3 py-1.5 text-sm">QR code</span>
            <span className="rounded-lg border border-border px-3 py-1.5 text-sm">Stats</span>
          </div>
        </div>
      </section>

      <section aria-labelledby="features" className="py-6">
        <h2 id="features" className="heading mb-5 text-2xl">Everything a short link needs</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="surface p-5">
              <Icon className="size-6 text-primary" />
              <h3 className="heading mt-3 text-lg">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6 text-sm text-muted-foreground">
        <span>SmolURL</span>
        <nav className="flex gap-4">
          <Link href="/docs" className="hover:text-foreground">API docs</Link>
          <a href="https://github.com/nandhu-44/SmolURL" className="flex items-center gap-1 hover:text-foreground" target="_blank" rel="noopener noreferrer"><Code className="size-4" /> Source</a>
        </nav>
      </footer>
    </main>
  );
}
