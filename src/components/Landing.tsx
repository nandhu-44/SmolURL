import Link from "next/link";
import AppHeader from "./AppHeader";
import { Wordmark } from "./Logo";
import { Button } from "./ui/button";

const LONG = "example.com/blog/2026/introducing-the-spring-collection?utm_source=newsletter&utm_medium=email&utm_campaign=launch";

const POINTS = [
  { title: "Choose the name", text: "Make it /r/spring, /r/menu or /r/rsvp. Leave it blank and you get seven random characters that are easy to read aloud." },
  { title: "See what works", text: "Clicks per day for each link and the sites that sent them. Bots and chat-app link previews aren't counted." },
  { title: "Print it", text: "Every link has a QR code you can download as PNG or SVG for posters, menus and slides." },
  { title: "Pause or expire", text: "Turn a link off for a while without losing its stats, or set the day it stops working." },
  { title: "Use the API", text: "Create, change and track links from scripts with scoped keys, rate limits and an OpenAPI spec." },
];

const CURL = `curl -X POST https://your-site/api/v1/links \\
  -H "Authorization: Bearer $SMOL_KEY" \\
  -d '{"url":"https://example.com/blog/spring","slug":"spring"}'`;

const RESPONSE = `{
  "data": {
    "slug": "spring",
    "shortUrl": "https://your-site/r/spring",
    "clicks": 0
  }
}`;

/** What signed-out visitors see at /. Static: no clock, no data. */
export default function Landing() {
  return (
    <>
      <AppHeader user={null} />
      <main>
        <section className="mx-auto max-w-5xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
          <h1 className="max-w-2xl text-[2.6rem] font-semibold leading-[1.05] tracking-[-0.035em] sm:text-[3.5rem]">Short links you name yourself.</h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Paste a long address, pick a short name, and see how many people opened it and where they came from.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg"><Link href="/signup">Create an account</Link></Button>
            <Button asChild size="lg" variant="outline"><Link href="/signin">Sign in</Link></Button>
          </div>

          {/* the long address, struck through, and the short one it becomes */}
          <figure className="mt-16 border-t border-border pt-10" aria-label={`${LONG} becomes /r/spring`}>
            <p className="demo-long mono max-w-3xl break-all text-sm leading-relaxed text-foreground sm:text-base">{LONG}</p>
            <p className="demo-short mono mt-4 text-[2.75rem] font-medium leading-none tracking-[-0.02em] text-primary sm:text-[4.5rem]">/r/spring</p>
          </figure>
        </section>

        <section aria-labelledby="what" className="border-t border-border bg-card">
          <div className="mx-auto grid max-w-5xl gap-x-16 gap-y-8 px-4 py-16 sm:px-6 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
            <h2 id="what" className="heading text-xl">What you get</h2>
            <dl className="divide-y divide-border border-y border-border">
              {POINTS.map((p) => (
                <div key={p.title} className="grid gap-1 py-4 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-6">
                  <dt className="font-medium">{p.title}</dt>
                  <dd className="max-w-prose text-muted-foreground">{p.text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section aria-labelledby="api" className="border-t border-border">
          <div className="mx-auto grid max-w-5xl gap-x-16 gap-y-6 px-4 py-16 sm:px-6 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
            <div>
              <h2 id="api" className="heading text-xl">From a script</h2>
              <p className="mt-2 text-sm text-muted-foreground">Create a key in Settings, then shorten links from anywhere.</p>
              <Link href="/docs" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">Read the API docs</Link>
            </div>
            <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-card">
              <pre className="mono overflow-x-auto border-b border-border p-4 text-[13px] leading-relaxed">{CURL}</pre>
              <pre className="mono overflow-x-auto p-4 text-[13px] leading-relaxed text-muted-foreground">{RESPONSE}</pre>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:px-6">
          <Wordmark className="text-foreground" />
          <nav aria-label="Footer" className="flex gap-5">
            <Link href="/docs" className="hover:text-foreground">API docs</Link>
            <a href="https://github.com/nandhu-44/SmolURL" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">Source code</a>
            <Link href="/signin" className="hover:text-foreground">Sign in</Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
