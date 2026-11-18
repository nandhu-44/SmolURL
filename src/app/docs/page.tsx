import type { Metadata } from "next";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import { getUser } from "@/lib/auth";
import { limits } from "@/lib/limits";
import { ENDPOINTS } from "@/lib/openapi";

export const metadata: Metadata = { title: "API docs" };
export const dynamic = "force-dynamic";

const SECTIONS = [
  { id: "auth", label: "Authentication" },
  { id: "limits", label: "Limits" },
  { id: "errors", label: "Errors" },
  { id: "endpoints", label: "Endpoints" },
  { id: "examples", label: "Examples" },
];
const METHOD_STYLE: Record<string, string> = { get: "text-success", post: "text-primary", patch: "text-foreground", delete: "text-destructive" };
const ERRORS = ["unauthorized", "invalid_key", "key_expired", "insufficient_scope", "rate_limited", "quota_exceeded", "invalid_body", "invalid_parameter", "not_found", "slug_taken", "link_limit_reached"];

function Code({ children }: { children: string }) {
  return <pre className="mono overflow-x-auto rounded-lg border border-border bg-card p-4 text-[13px] leading-relaxed">{children}</pre>;
}

export default async function Docs() {
  const l = limits();
  const user = await getUser().catch(() => null);
  return (
    <>
      <AppHeader user={user ? { name: user.name, email: user.email } : null} />
      <div className="mx-auto grid max-w-5xl gap-10 px-4 pb-24 pt-8 sm:px-6 lg:grid-cols-[11rem_minmax(0,1fr)]">
        <nav aria-label="On this page" className="hidden lg:block">
          <ul className="sticky top-20 space-y-1 text-sm">
            {SECTIONS.map((s) => (
              <li key={s.id}><a href={`#${s.id}`} className="block rounded-md px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground">{s.label}</a></li>
            ))}
          </ul>
        </nav>

        <main className="min-w-0 max-w-3xl">
          <h1 className="heading text-2xl">API</h1>
          <p className="mt-2 text-muted-foreground">
            Create, change and track short links from scripts and other apps. The OpenAPI 3.1 spec is at{" "}
            <a className="mono text-primary hover:underline" href="/api/v1/openapi.json">/api/v1/openapi.json</a>.
          </p>

          <section id="auth" className="mt-12 scroll-mt-20 space-y-3">
            <h2 className="heading text-lg">Authentication</h2>
            <p className="text-muted-foreground">Create a key in <Link href="/settings" className="text-primary hover:underline">Settings</Link> and send it with every request. A key is shown once; keys can be read-only and can expire.</p>
            <Code>{`curl https://your-site/api/v1/links \\\n  -H "Authorization: Bearer sk_smol.your_key"`}</Code>
          </section>

          <section id="limits" className="mt-12 scroll-mt-20 space-y-3">
            <h2 className="heading text-lg">Limits</h2>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border border-y border-border">
                <tr><td className="py-2 pr-4 text-muted-foreground">Per key, per minute</td><td className="py-2 text-right font-medium tabular-nums">{l.perMinute.toLocaleString("en-US")} requests</td></tr>
                <tr><td className="py-2 pr-4 text-muted-foreground">Per key, per day (resets 00:00 UTC)</td><td className="py-2 text-right font-medium tabular-nums">{l.perDay.toLocaleString("en-US")} requests</td></tr>
                <tr><td className="py-2 pr-4 text-muted-foreground">Keys per account</td><td className="py-2 text-right font-medium tabular-nums">{l.keysPerUser}</td></tr>
                <tr><td className="py-2 pr-4 text-muted-foreground">Links per account</td><td className="py-2 text-right font-medium tabular-nums">{l.linksPerUser.toLocaleString("en-US")}</td></tr>
              </tbody>
            </table>
            <p className="text-sm text-muted-foreground">
              Responses carry <code className="mono">X-RateLimit-*</code> (per minute) and <code className="mono">X-Quota-*</code> (per day) headers.
              Over a limit you get <code className="mono">429</code> with a <code className="mono">Retry-After</code> header in seconds.
            </p>
          </section>

          <section id="errors" className="mt-12 scroll-mt-20 space-y-3">
            <h2 className="heading text-lg">Errors</h2>
            <p className="text-muted-foreground">Errors are JSON with a stable <code className="mono">code</code> you can match on.</p>
            <Code>{`HTTP 409\n{ "error": { "code": "slug_taken", "message": "The short name \\"spring\\" is already taken." } }`}</Code>
            <p className="flex flex-wrap gap-1.5">{ERRORS.map((c) => <code key={c} className="mono rounded-[4px] bg-muted px-1.5 py-0.5 text-xs">{c}</code>)}</p>
          </section>

          <section id="endpoints" className="mt-12 scroll-mt-20">
            <h2 className="heading text-lg">Endpoints</h2>
            <div className="mt-3 divide-y divide-border rounded-xl border border-border bg-card">
              {ENDPOINTS.map((e) => (
                <div key={e.method + e.path} className="p-4">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className={`mono w-14 text-xs font-medium uppercase ${METHOD_STYLE[e.method]}`}>{e.method}</span>
                    <code className="mono text-sm font-medium">{e.path}</code>
                    <span className="ml-auto text-xs text-muted-foreground">{e.scope}</span>
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground sm:pl-[4.25rem]">{e.summary}</p>
                  {e.params && e.params.length > 0 && (
                    <dl className="mt-2 grid gap-x-4 gap-y-1 text-xs sm:grid-cols-[auto_1fr] sm:pl-[4.25rem]">
                      {e.params.map((p) => (<div key={p.name} className="contents"><dt className="mono text-foreground">{p.name}</dt><dd className="text-muted-foreground">{p.description}</dd></div>))}
                    </dl>
                  )}
                  {e.body && <pre className="mono mt-3 overflow-x-auto rounded-md bg-muted px-3 py-2 text-xs sm:ml-[4.25rem]">{e.body}</pre>}
                </div>
              ))}
            </div>
          </section>

          <section id="examples" className="mt-12 scroll-mt-20 space-y-3">
            <h2 className="heading text-lg">Examples</h2>
            <Code>{`# shorten a URL with your own short name
curl -X POST https://your-site/api/v1/links \\
  -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \\
  -d '{"url":"https://example.com/blog/2026/launch","slug":"launch"}'

# a random short name that stops working at the end of the year
curl -X POST https://your-site/api/v1/links \\
  -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \\
  -d '{"url":"https://example.com/sale","expiresAt":"2026-12-31T23:59:59Z"}'

# your ten most-clicked links
curl "https://your-site/api/v1/links?sort=clicks&limit=10" -H "Authorization: Bearer $KEY"

# clicks per day for the last week
curl "https://your-site/api/v1/links/LINK_ID/stats?days=7" -H "Authorization: Bearer $KEY"

# pause a link
curl -X PATCH https://your-site/api/v1/links/LINK_ID \\
  -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" -d '{"enabled":false}'`}</Code>
          </section>
        </main>
      </div>
    </>
  );
}
