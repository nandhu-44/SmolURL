"use client";
import { Globe, MousePointerClick } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useNow, when } from "@/lib/client";
import type { Link, LinkStats } from "@/lib/types";
import { ClicksChart } from "./charts";
import { Dialog, DialogContent } from "./ui/dialog";
import { SegmentedControl } from "./ui/toggle-group";

type Range = "7" | "30" | "90";

/** Clicks over time and where they came from, for one link. */
export default function LinkStatsDialog({ link, onClose }: { link: Link | null; onClose: () => void }) {
  const [range, setRange] = useState<Range>("30");
  const [stats, setStats] = useState<LinkStats | null>(null);
  const [error, setError] = useState("");
  const now = useNow();

  useEffect(() => {
    if (!link) return;
    let live = true;
    setError("");
    api<{ stats: LinkStats }>(`/api/links/${link.id}/stats?days=${range}`)
      .then((r) => live && setStats(r.stats))
      .catch((e) => live && setError((e as Error).message));
    return () => { live = false; };
  }, [link, range]);

  const inRange = stats?.days.reduce((n, d) => n + d.count, 0) ?? 0;
  const topRef = stats?.referrers[0]?.count ?? 1;

  return (
    <Dialog open={!!link} onOpenChange={(o) => !o && (onClose(), setStats(null), setRange("30"))}>
      <DialogContent title={link ? <span>Stats for <span className="mono font-medium text-primary">/r/{link.slug}</span></span> : "Stats"} description="Clicks per day and referring sites" className="max-w-xl">
        <div className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex gap-6">
              <div>
                <p className="text-sm text-muted-foreground">All time</p>
                <p className="mt-0.5 text-2xl font-semibold tabular-nums">{(stats?.total ?? link?.clicks ?? 0).toLocaleString("en-US")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last {range} days</p>
                <p className="mt-0.5 text-2xl font-semibold tabular-nums">{stats ? inRange.toLocaleString("en-US") : "–"}</p>
              </div>
            </div>
            <SegmentedControl label="Time range" value={range} onChange={setRange} options={[{ value: "7", label: "7d" }, { value: "30", label: "30d" }, { value: "90", label: "90d" }]} />
          </div>

          {error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/[0.06] p-3 text-sm text-destructive">{error}</p>
          ) : !stats ? (
            <div className="h-40 animate-soft-pulse rounded-lg bg-muted" aria-label="Loading stats" />
          ) : (
            <ClicksChart days={stats.days} />
          )}

          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MousePointerClick className="size-3.5" />
            {link?.lastClickedAt && now ? `Last clicked ${when(link.lastClickedAt, now)}.` : "Not clicked yet."} Days are UTC. Bots and link previews aren&apos;t counted.
          </p>

          <section>
            <h3 className="heading mb-3 text-sm">Where clicks came from</h3>
            {!stats ? null : stats.referrers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No clicks yet. Sites that send visitors will appear here.</p>
            ) : (
              <ul className="space-y-2">
                {stats.referrers.map((r) => (
                  <li key={r.source} className="text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <Globe className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{r.source === "direct" ? "Direct, apps & QR scans" : r.source}</span>
                      </span>
                      <span className="tabular-nums text-muted-foreground">{r.count.toLocaleString("en-US")}</span>
                    </div>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(2, (r.count / topRef) * 100)}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
