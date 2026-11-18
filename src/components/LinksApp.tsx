"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Copy, Loader2, QrCode, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { copyText, useNow, useOrigin, useSlugCheck } from "@/lib/client";
import { notify } from "@/lib/notify";
import type { Link as ShortLink, PublicUser } from "@/lib/types";
import { cn } from "@/lib/utils";
import AppHeader from "./AppHeader";
import LinkForm, { endOfDay, type LinkDraft } from "./LinkForm";
import LinkItem, { type LinkStateLabel } from "./LinkItem";
import LinkStatsDialog from "./LinkStatsDialog";
import QrDialog from "./QrDialog";
import { SlugField } from "./SlugField";
import { Button } from "./ui/button";
import { DatePicker } from "./ui/date-picker";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { SegmentedControl } from "./ui/toggle-group";

interface Data { links: ShortLink[]; spark: Record<string, number[]>; daily: number[] }
type Filter = "all" | "active" | "disabled" | "expired";
type Sort = "newest" | "oldest" | "clicks" | "recent" | "title";

const SORTS: { id: Sort; label: string }[] = [
  { id: "newest", label: "Newest" },
  { id: "oldest", label: "Oldest" },
  { id: "clicks", label: "Most clicks" },
  { id: "recent", label: "Recently clicked" },
  { id: "title", label: "Title" },
];

const stateOf = (l: ShortLink, now: number | null): LinkStateLabel =>
  !l.enabled ? "disabled" : now !== null && l.expiresAt && Date.parse(l.expiresAt) <= now ? "expired" : "active";

function expiryNote(l: ShortLink, now: number | null): string | null {
  if (!l.expiresAt || now === null) return null;
  const days = Math.ceil((Date.parse(l.expiresAt) - now) / 86_400_000);
  if (days <= 1) return "Expires today";
  if (days <= 14) return `Expires in ${days} days`;
  return `Expires ${new Date(l.expiresAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}`;
}

export default function LinksApp({ user, initial }: { user: PublicUser; initial: Data }) {
  const router = useRouter();
  const origin = useOrigin();
  const now = useNow();
  const [data, setData] = useState<Data>(initial);
  const links = data.links;
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("newest");
  const [query, setQuery] = useState("");
  const prefsLoaded = useRef(false);
  const [editing, setEditing] = useState<ShortLink | null>(null);
  const [statsFor, setStatsFor] = useState<ShortLink | null>(null);
  const [qrFor, setQrFor] = useState<ShortLink | null>(null);
  const [deleting, setDeleting] = useState<ShortLink | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);
  const urlRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const shortUrl = useCallback((l: Pick<ShortLink, "slug">) => (origin ? `${origin}/r/${l.slug}` : ""), [origin]);

  const reload = useCallback(async () => {
    try {
      setData(await api<Data>("/api/links"));
    } catch (e) {
      notify.error((e as Error).message);
    }
  }, []);

  // warm up the settings page so opening it is instant
  useEffect(() => router.prefetch("/settings"), [router]);

  // Click counts change while the page is open elsewhere: refresh when the tab comes back into view.
  useEffect(() => {
    const onVisible = () => document.visibilityState === "visible" && reload();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [reload]);

  // Keyboard shortcuts: "n" new link, "/" search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest("input,textarea,select,[role=dialog],[role=menu]") || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "n") { e.preventDefault(); urlRef.current?.focus(); }
      if (e.key === "/") { e.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Sort order and status filter are remembered per user in this browser.
  const prefsKey = `smolurl:prefs:${user.id}`;
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(prefsKey) ?? "null");
      if (SORTS.some((o) => o.id === saved?.sort)) setSort(saved.sort);
      if (["all", "active", "disabled", "expired"].includes(saved?.filter)) setFilter(saved.filter);
    } catch {}
    prefsLoaded.current = true;
  }, [prefsKey]);
  useEffect(() => {
    if (!prefsLoaded.current) return;
    try {
      localStorage.setItem(prefsKey, JSON.stringify({ sort, filter }));
    } catch {}
  }, [prefsKey, sort, filter]);

  /* ---------------- mutations ---------------- */
  const setLinks = (fn: (l: ShortLink[]) => ShortLink[]) => setData((d) => ({ ...d, links: fn(d.links) }));

  function flash(id: string) {
    setHighlight(id);
    setTimeout(() => setHighlight((h) => (h === id ? null : h)), 1800);
  }

  function created(link: ShortLink) {
    setData((d) => ({ ...d, links: [link, ...d.links] }));
    if (filter !== "all" && filter !== "active") setFilter("all");
    setQuery("");
    flash(link.id);
  }

  async function update(id: string, draft: Partial<LinkDraft>): Promise<boolean> {
    try {
      const { link } = await api<{ link: ShortLink }>(`/api/links/${id}`, { method: "PATCH", body: draft });
      setLinks((l) => l.map((x) => (x.id === id ? link : x)));
      setEditing(null);
      notify.success("Link saved");
      return true;
    } catch (e) {
      notify.error((e as Error).message);
      return false;
    }
  }

  async function toggle(l: ShortLink) {
    const enabled = !l.enabled;
    setLinks((list) => list.map((x) => (x.id === l.id ? { ...x, enabled } : x)));
    try {
      await api(`/api/links/${l.id}`, { method: "PATCH", body: { enabled } });
      notify.success(enabled ? `Resumed /r/${l.slug}` : `Paused /r/${l.slug}. It won't redirect until you resume it.`);
    } catch (e) {
      notify.error((e as Error).message);
      reload();
    }
  }

  async function remove(l: ShortLink) {
    setDeleting(null);
    setLinks((list) => list.filter((x) => x.id !== l.id));
    try {
      await api(`/api/links/${l.id}`, { method: "DELETE" });
      notify.success(`Deleted /r/${l.slug}`, {
        label: "Undo",
        onClick: async () => {
          try {
            const { link } = await api<{ link: ShortLink }>(`/api/links/${l.id}/restore`, { method: "POST" });
            setLinks((list) => [...list.filter((x) => x.id !== link.id), link].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
            flash(link.id);
          } catch (e) {
            notify.error((e as Error).message);
          }
        },
      });
    } catch (e) {
      notify.error((e as Error).message);
      reload();
    }
  }

  /* ---------------- derived ---------------- */
  const summary = useMemo(() => ({
    total: links.length,
    active: links.filter((l) => stateOf(l, now) === "active").length,
    clicks: links.reduce((n, l) => n + l.clicks, 0),
    week: data.daily.slice(-7).reduce((a, b) => a + b, 0),
  }), [links, data.daily, now]);

  const filtering = filter !== "all" || !!query.trim();
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = links.filter((l) =>
      (filter === "all" || stateOf(l, now) === filter) &&
      (!q || l.title.toLowerCase().includes(q) || l.slug.toLowerCase().includes(q) || l.url.toLowerCase().includes(q)),
    );
    return list.sort((a, b) => {
      switch (sort) {
        case "oldest": return a.createdAt.localeCompare(b.createdAt);
        case "clicks": return b.clicks - a.clicks || b.createdAt.localeCompare(a.createdAt);
        case "recent": return (b.lastClickedAt ?? "").localeCompare(a.lastClickedAt ?? "") || b.createdAt.localeCompare(a.createdAt);
        case "title": return a.title.localeCompare(b.title);
        default: return b.createdAt.localeCompare(a.createdAt);
      }
    });
  }, [links, filter, query, sort, now]);

  return (
    <>
      <AppHeader user={user} />
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
          <div>
            <h1 className="heading text-2xl">Links</h1>
            <p className="mt-1 text-sm text-muted-foreground">Shorten a URL, then share the short link anywhere.</p>
          </div>
          {links.length > 0 && (
            <dl className="flex gap-8 text-sm">
              <Figure label="Active links" value={summary.active} />
              <Figure label="Clicks this week" value={summary.week} />
              <Figure label="Clicks all time" value={summary.clicks} />
            </dl>
          )}
        </div>

        <CreateLink urlRef={urlRef} shortUrl={shortUrl} onCreated={created} onQr={setQrFor} />

        {links.length > 0 && (
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input ref={searchRef} type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search links" aria-label="Search by title, short name or URL" className="pl-8 pr-8 [&::-webkit-search-cancel-button]:hidden" />
              {query && (
                <button onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-1.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:text-foreground">
                  <X className="size-4" />
                </button>
              )}
            </div>
            <SegmentedControl
              label="Filter links"
              value={filter}
              onChange={setFilter}
              className="w-full sm:w-auto"
              options={[{ value: "all", label: "All" }, { value: "active", label: "Active" }, { value: "disabled", label: "Paused" }, { value: "expired", label: "Expired" }]}
            />
            <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
              <SelectTrigger aria-label="Sort links" className="w-full sm:ml-auto sm:w-44">
                <span className="text-muted-foreground">Sort:</span>
                <span className="flex-1 text-left"><SelectValue /></span>
              </SelectTrigger>
              <SelectContent align="end">
                {SORTS.map((o) => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="mt-3">
          {visible.length === 0 ? (
            <EmptyState filtering={filtering && links.length > 0} onReset={() => { setFilter("all"); setQuery(""); }} onStart={() => urlRef.current?.focus()} />
          ) : (
            <ul className="surface divide-y divide-border overflow-hidden" aria-label="Your links">
              {visible.map((l) => (
                <LinkItem
                  key={l.id}
                  link={l}
                  shortUrl={shortUrl(l)}
                  state={stateOf(l, now)}
                  expiryNote={expiryNote(l, now)}
                  now={now}
                  highlight={highlight === l.id}
                  onEdit={() => setEditing(l)}
                  onToggle={() => toggle(l)}
                  onStats={() => setStatsFor(l)}
                  onQr={() => setQrFor(l)}
                  onDelete={() => setDeleting(l)}
                />
              ))}
            </ul>
          )}
          {links.length > 0 && (
            <p className="mt-3 hidden text-xs text-muted-foreground sm:block">
              Press <kbd className="rounded border border-border bg-card px-1 font-sans">N</kbd> for a new link, <kbd className="rounded border border-border bg-card px-1 font-sans">/</kbd> to search.
            </p>
          )}
        </div>

        <LinkForm link={editing} onClose={() => setEditing(null)} onSubmit={update} />
        <LinkStatsDialog link={statsFor} onClose={() => setStatsFor(null)} />
        <QrDialog link={qrFor} shortUrl={qrFor ? shortUrl(qrFor) : ""} onClose={() => setQrFor(null)} />

        <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
          <AlertDialogContent
            title={`Delete /r/${deleting?.slug ?? ""}?`}
            footer={
              <>
                <AlertDialogCancel asChild><Button variant="outline">Cancel</Button></AlertDialogCancel>
                <AlertDialogAction asChild><Button variant="destructive" onClick={() => deleting && remove(deleting)}>Delete link</Button></AlertDialogAction>
              </>
            }
          >
            <p className="text-sm text-muted-foreground">The short link stops working and its click history is deleted. You can undo this for a couple of minutes.</p>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </>
  );
}

function Figure({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-display text-xl font-semibold tabular-nums">{value.toLocaleString("en-US")}</dd>
    </div>
  );
}

/* ------------------------------- create ------------------------------- */
function CreateLink({ urlRef, shortUrl, onCreated, onQr }: {
  urlRef: React.RefObject<HTMLInputElement | null>;
  shortUrl: (l: Pick<ShortLink, "slug">) => string;
  onCreated: (l: ShortLink) => void;
  onQr: (l: ShortLink) => void;
}) {
  const [url, setUrl] = useState("");
  const [custom, setCustom] = useState(false);
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [expiry, setExpiry] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [last, setLast] = useState<ShortLink | null>(null);
  const [copied, setCopied] = useState(false);
  const status = useSlugCheck(custom ? slug : "");
  const blocked = custom && (status === "invalid" || status === "taken");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!url.trim()) {
      setError("Paste the URL you want to shorten.");
      return urlRef.current?.focus();
    }
    if (blocked) return;
    setBusy(true);
    setError("");
    try {
      const body = { url: url.trim(), ...(custom ? { slug: slug.trim() || undefined, title: title.trim() || undefined, expiresAt: expiry ? endOfDay(expiry) : undefined } : {}) };
      const { link } = await api<{ link: ShortLink }>("/api/links", { method: "POST", body });
      onCreated(link);
      setLast(link);
      setCopied(false);
      setUrl(""); setSlug(""); setTitle(""); setExpiry("");
    } catch (err) {
      setError((err as Error).message);
    }
    setBusy(false);
  }

  async function copyLast() {
    if (last && (await copyText(shortUrl(last)))) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  return (
    <section className="surface mt-6 p-4" aria-labelledby="create-heading">
      <h2 id="create-heading" className="sr-only">Shorten a URL</h2>
      <form onSubmit={submit} noValidate>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            ref={urlRef}
            type="url"
            inputMode="url"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setError(""); }}
            placeholder="https://example.com/a-long-address-to-share"
            aria-label="URL to shorten"
            aria-invalid={!!error}
            aria-describedby="create-error"
            autoComplete="off"
            spellCheck={false}
            className="h-10 flex-1 text-[15px]"
          />
          <Button type="submit" size="lg" disabled={busy || blocked} className="sm:w-32">
            {busy && <Loader2 className="animate-spin" />} Shorten
          </Button>
        </div>
        <p id="create-error" role="alert" className={cn("text-sm text-destructive", error && "mt-2")}>{error}</p>

        <button
          type="button"
          onClick={() => setCustom((c) => !c)}
          aria-expanded={custom}
          aria-controls="create-options"
          className="mt-3 flex items-center gap-1 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronDown className={cn("size-4 transition-transform duration-200 ease-out", custom ? "rotate-0" : "-rotate-90")} />
          Short name, title and expiry
        </button>
        <AnimatePresence initial={false}>
          {custom && (
            <motion.div
              id="create-options"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="overflow-hidden"
            >
              <div className="grid gap-4 pt-4 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,0.9fr)]">
                <div className="space-y-1.5">
                  <Label htmlFor="create-slug">Short name</Label>
                  <SlugField id="create-slug" value={slug} onChange={setSlug} status={status} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="create-title">Title</Label>
                  <Input id="create-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="The site's name" />
                </div>
                <div className="space-y-1.5">
                  <Label>Expires</Label>
                  <DatePicker value={expiry} onChange={setExpiry} placeholder="Never" clearLabel="Remove expiry" fromDate={new Date()} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {last && (
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border pt-4" role="status">
          <span className="flex items-center gap-1.5 text-sm text-success"><Check className="size-4" /> Created</span>
          <a href={shortUrl(last) || undefined} target="_blank" rel="noopener noreferrer" className="mono min-w-0 flex-1 truncate font-medium text-primary hover:underline">
            {shortUrl(last).replace(/^https?:\/\//, "") || `/r/${last.slug}`}
          </a>
          <div className="flex items-center gap-1">
            <Button size="icon-sm" className="w-auto gap-1.5 px-3" onClick={copyLast}>{copied ? <><Check /> Copied</> : <><Copy /> Copy</>}</Button>
            <Button size="icon-sm" variant="outline" className="w-auto gap-1.5 px-3" onClick={() => onQr(last)}><QrCode /> QR code</Button>
            <Button size="icon-sm" variant="ghost" onClick={() => setLast(null)} aria-label="Dismiss"><X /></Button>
          </div>
        </div>
      )}
    </section>
  );
}

function EmptyState({ filtering, onReset, onStart }: { filtering: boolean; onReset: () => void; onStart: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-border px-6 py-14 text-center">
      <h2 className="heading text-base">{filtering ? "No links match" : "No links yet"}</h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        {filtering ? "Try another search, or show all links." : "Paste a URL above. You'll get a short link to share, a QR code and click stats."}
      </p>
      <Button onClick={filtering ? onReset : onStart} variant="outline" className="mt-5">
        {filtering ? "Show all links" : "Shorten a URL"}
      </Button>
    </div>
  );
}
