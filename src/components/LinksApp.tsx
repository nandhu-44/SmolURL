"use client";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownUp, BookOpen, Check, ChevronDown, Copy, Link2, Loader2, LogOut, QrCode, Search, SearchX, Settings, SlidersHorizontal, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { api } from "@/lib/api";
import { copyText, useNow, useOrigin, useSlugCheck } from "@/lib/client";
import { notify } from "@/lib/notify";
import type { Link as ShortLink, PublicUser } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Sparkline } from "./charts";
import LinkForm, { endOfDay, type LinkDraft } from "./LinkForm";
import LinkItem, { type LinkStateLabel } from "./LinkItem";
import LinkStatsDialog from "./LinkStatsDialog";
import Logo from "./Logo";
import { ProgressBar } from "./NavProgress";
import QrDialog from "./QrDialog";
import { SlugField } from "./SlugField";
import ThemeToggle from "./ThemeToggle";
import { Button } from "./ui/button";
import { DatePicker } from "./ui/date-picker";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent } from "./ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { SegmentedControl } from "./ui/toggle-group";

interface Data { links: ShortLink[]; spark: Record<string, number[]>; daily: number[] }
type Filter = "all" | "active" | "disabled" | "expired";
type Sort = "newest" | "oldest" | "clicks" | "recent" | "title";

const SORTS: { id: Sort; label: string }[] = [
  { id: "newest", label: "Newest first" },
  { id: "oldest", label: "Oldest first" },
  { id: "clicks", label: "Most clicks" },
  { id: "recent", label: "Recently clicked" },
  { id: "title", label: "A → Z" },
];
const EMPTY_SPARK = Array(14).fill(0);

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
  const [navigating, startNav] = useTransition();
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
    setTimeout(() => setHighlight((h) => (h === id ? null : h)), 2500);
  }

  async function created(link: ShortLink) {
    setData((d) => ({ ...d, links: [link, ...d.links], spark: { ...d.spark, [link.id]: EMPTY_SPARK } }));
    if (filter !== "all" && filter !== "active") setFilter("all");
    setQuery("");
    flash(link.id);
  }

  async function update(id: string, draft: Partial<LinkDraft>): Promise<boolean> {
    try {
      const { link } = await api<{ link: ShortLink }>(`/api/links/${id}`, { method: "PATCH", body: draft });
      setLinks((l) => l.map((x) => (x.id === id ? link : x)));
      setEditing(null);
      notify.success("Link updated");
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
      notify.success(enabled ? "Link turned on" : "Link paused. It won't redirect until you turn it back on.");
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

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    // full page load: clears client-side caches and avoids a router.replace()+refresh() race that left the old UI showing
    window.location.assign("/");
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

  // The greeting depends on the viewer's local time, which the server can't know, so it's filled in after mount.
  const [greeting, setGreeting] = useState("Welcome back");
  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening");
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-3 pb-24 pt-5 sm:px-6" aria-busy={navigating}>
      {navigating && <ProgressBar />}
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Logo className="size-9" />
          <div className="min-w-0">
            <h1 className="heading text-2xl text-primary">SmolURL</h1>
            <p className="truncate text-xs text-muted-foreground">{greeting}, {user.name.split(" ")[0]}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10 gap-1.5 px-2 pr-2.5" aria-label="Account menu">
                <span className="grid size-7 place-items-center rounded-lg bg-primary text-sm text-primary-foreground">{user.name.charAt(0).toUpperCase()}</span>
                <ChevronDown className="text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>
                <span className="block font-medium text-foreground">{user.name}</span>
                {user.email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => startNav(() => router.push("/settings"))}><Settings /> Account settings</DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/docs"><BookOpen /> API docs</Link></DropdownMenuItem>
              <DropdownMenuItem onSelect={logout} className="text-destructive"><LogOut /> Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.header>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-6 space-y-4">
        <CreateLink urlRef={urlRef} shortUrl={shortUrl} onCreated={created} onQr={setQrFor} />

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <StatTile label="Links" value={summary.total} note={`${summary.active} active`} />
          <StatTile label="Total clicks" value={summary.clicks} note="all time" />
          <StatTile label="Last 7 days" value={summary.week} note={<Sparkline values={data.daily} className="h-4 w-14" />} />
        </div>

        {links.length > 0 && (
          <div className="surface space-y-3 p-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search links" aria-label="Search links by title, short name or URL" className="pl-9 pr-8" />
                {query && (
                  <button onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="size-4" />
                  </button>
                )}
              </div>
              <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
                <SelectTrigger aria-label="Sort links" className="w-40 sm:w-48">
                  <span className="flex items-center gap-2"><ArrowDownUp className="size-4 text-muted-foreground" /><SelectValue /></span>
                </SelectTrigger>
                <SelectContent>
                  {SORTS.map((o) => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <SegmentedControl
              label="Filter links"
              value={filter}
              onChange={setFilter}
              className="w-full sm:w-auto"
              options={[{ value: "all", label: "All" }, { value: "active", label: "Active" }, { value: "disabled", label: "Paused" }, { value: "expired", label: "Expired" }]}
            />
          </div>
        )}

        {visible.length === 0 ? (
          <EmptyState filtering={filtering && links.length > 0} onReset={() => { setFilter("all"); setQuery(""); }} onStart={() => urlRef.current?.focus()} />
        ) : (
          <ul className="space-y-3">
            <AnimatePresence initial={false}>
              {visible.map((l) => (
                <LinkItem
                  key={l.id}
                  link={l}
                  shortUrl={shortUrl(l)}
                  state={stateOf(l, now)}
                  expiryNote={expiryNote(l, now)}
                  spark={data.spark[l.id] ?? EMPTY_SPARK}
                  highlight={highlight === l.id}
                  onEdit={() => setEditing(l)}
                  onToggle={() => toggle(l)}
                  onStats={() => setStatsFor(l)}
                  onQr={() => setQrFor(l)}
                  onDelete={() => setDeleting(l)}
                />
              ))}
            </AnimatePresence>
          </ul>
        )}
        {links.length > 0 && (
          <p className="hidden text-center text-xs text-muted-foreground sm:block">
            <kbd className="rounded border border-border px-1">N</kbd> new link · <kbd className="rounded border border-border px-1">/</kbd> search
          </p>
        )}
      </motion.div>

      <LinkForm link={editing} onClose={() => setEditing(null)} onSubmit={update} />
      <LinkStatsDialog link={statsFor} onClose={() => setStatsFor(null)} />
      <QrDialog link={qrFor} shortUrl={qrFor ? shortUrl(qrFor) : ""} onClose={() => setQrFor(null)} />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent
          title="Delete link?"
          footer={
            <>
              <AlertDialogCancel asChild><Button variant="secondary">Keep it</Button></AlertDialogCancel>
              <AlertDialogAction asChild><Button variant="destructive" onClick={() => deleting && remove(deleting)}>Delete</Button></AlertDialogAction>
            </>
          }
        >
          <p className="heading text-lg break-all">/r/{deleting?.slug} will stop working.</p>
          <p className="mt-1 text-sm text-muted-foreground">Its click history is deleted too. You can undo this right after.</p>
        </AlertDialogContent>
      </AlertDialog>
    </main>
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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!url.trim()) {
      setError("Paste the URL you want to shorten.");
      return urlRef.current?.focus();
    }
    if (custom && (status === "invalid" || status === "taken")) return;
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
    <section className="surface p-3 sm:p-4" aria-labelledby="create-heading">
      <h2 id="create-heading" className="sr-only">Shorten a link</h2>
      <form onSubmit={submit} noValidate>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Link2 className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={urlRef}
              type="url"
              inputMode="url"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setError(""); }}
              placeholder="Paste a long URL"
              aria-label="URL to shorten"
              aria-invalid={!!error}
              aria-describedby="create-error"
              autoComplete="off"
              spellCheck={false}
              className={cn("h-12 pl-11 text-base", error && "border-destructive ring-4 ring-destructive/20")}
            />
          </div>
          <Button type="submit" size="lg" disabled={busy || (custom && (status === "invalid" || status === "taken"))} className="sm:w-36">
            {busy ? <Loader2 className="animate-spin" /> : <Sparkles />} Shorten
          </Button>
        </div>
        <p id="create-error" role="alert" className={cn("text-sm text-destructive", error && "mt-2")}>{error}</p>

        <button
          type="button"
          onClick={() => setCustom((c) => !c)}
          aria-expanded={custom}
          aria-controls="create-options"
          className="mt-2 flex items-center gap-1.5 rounded-lg px-1 py-1 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
        >
          <SlidersHorizontal className="size-4" /> Custom name, title and expiry
          <ChevronDown className={cn("size-4 transition-transform", custom && "rotate-180")} />
        </button>
        <AnimatePresence initial={false}>
          {custom && (
            <motion.div id="create-options" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="grid gap-3 pt-3 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="create-slug">Short name</Label>
                  <SlugField id="create-slug" value={slug} onChange={setSlug} status={status} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="create-title">Title</Label>
                  <Input id="create-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Defaults to the site's name" />
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

      <AnimatePresence>
        {last && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-primary/10 p-2 pl-3" role="status">
              <Check className="size-4 shrink-0 text-primary" />
              <a href={shortUrl(last) || undefined} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate font-mono text-sm text-primary hover:underline">/r/{last.slug}</a>
              <Button size="icon-sm" className="w-auto gap-1.5 px-3 text-sm" onClick={copyLast}>{copied ? <><Check /> Copied</> : <><Copy /> Copy</>}</Button>
              <Button size="icon-sm" variant="outline" onClick={() => onQr(last)} aria-label="Show QR code"><QrCode /></Button>
              <Button size="icon-sm" variant="ghost" onClick={() => setLast(null)} aria-label="Dismiss"><X /></Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function StatTile({ label, value, note }: { label: string; value: number; note: React.ReactNode }) {
  return (
    <div className="surface p-3 sm:p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <motion.p key={value} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="heading text-2xl sm:text-3xl">{value.toLocaleString("en-US")}</motion.p>
      <div className="mt-0.5 flex h-4 items-center text-[11px] text-muted-foreground">{note}</div>
    </div>
  );
}

function EmptyState({ filtering, onReset, onStart }: { filtering: boolean; onReset: () => void; onStart: () => void }) {
  const Icon = filtering ? SearchX : Link2;
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="surface flex flex-col items-center gap-3 px-6 py-12 text-center">
      <Icon className="size-12 text-primary" />
      <h2 className="heading text-2xl">{filtering ? "Nothing matches" : "No links yet"}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        {filtering ? "Try a different search or filter." : "Paste a long URL above to get a short link you can share, track and turn into a QR code."}
      </p>
      <Button onClick={filtering ? onReset : onStart} variant={filtering ? "secondary" : "default"}>
        {filtering ? <><X /> Reset filters</> : <><Link2 /> Shorten your first link</>}
      </Button>
    </motion.div>
  );
}
