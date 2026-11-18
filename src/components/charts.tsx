"use client";
import { useId, useState } from "react";
import type { DayCount } from "@/lib/types";
import { shortDay } from "@/lib/client";
import { cn } from "@/lib/utils";

/** Bars with a rounded top (4px) sitting flat on the baseline. */
function barPath(x: number, y: number, w: number, h: number) {
  if (h <= 0) return "";
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

/** Tiny decorative trend of clicks per day; the numbers it shows are always stated in text next to it. */
export function Sparkline({ values, className }: { values: number[]; className?: string }) {
  const max = Math.max(1, ...values);
  const W = 64, H = 20, gap = 1.5;
  const w = (W - gap * (values.length - 1)) / values.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={cn("h-5 w-16", className)} aria-hidden preserveAspectRatio="none">
      {values.map((v, i) => {
        const h = v ? Math.max(2, (v / max) * H) : 1;
        return <rect key={i} x={i * (w + gap)} y={H - h} width={w} height={h} rx={Math.min(1.5, w / 2)} className={v ? "fill-primary" : "fill-muted-foreground/25"} />;
      })}
    </svg>
  );
}

/** Clicks per day: one series, so one colour and no legend. Every bar has a hover/focus tooltip; a table backs it for screen readers. */
export function ClicksChart({ days, height = 160 }: { days: DayCount[]; height?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const id = useId();
  const max = Math.max(1, ...days.map((d) => d.count));
  const W = 600, H = height, top = 20, bottom = 22; // top leaves room for the "max" label above the bars
  const plotH = H - top - bottom;
  const slot = W / days.length;
  const gap = Math.max(2, slot * 0.25);
  const barW = slot - gap;
  const labelIdx = [0, Math.floor((days.length - 1) / 2), days.length - 1];
  const tip = hover !== null ? days[hover] : null;

  return (
    <figure className="relative" aria-labelledby={`${id}-cap`}>
      <figcaption id={`${id}-cap`} className="sr-only">Clicks per day, {shortDay(days[0].day)} to {shortDay(days[days.length - 1].day)}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} preserveAspectRatio="none" aria-hidden onMouseLeave={() => setHover(null)}>
        {/* recessive gridlines at the max and half-way */}
        {[0, 0.5].map((f) => <line key={f} x1="0" x2={W} y1={top + plotH * f} y2={top + plotH * f} className="stroke-border" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />)}
        <line x1="0" x2={W} y1={top + plotH} y2={top + plotH} className="stroke-border" vectorEffect="non-scaling-stroke" />
        {days.map((d, i) => {
          const h = d.count ? Math.max(3, (d.count / max) * plotH) : 0;
          return (
            <g key={d.day}>
              <path d={barPath(i * slot + gap / 2, top + plotH - h, barW, h)} className={cn("fill-primary transition-opacity", hover !== null && hover !== i && "opacity-40")} />
              {/* hit target: the whole column, bigger than the bar */}
              <rect x={i * slot} y={0} width={slot} height={H} fill="transparent" onMouseEnter={() => setHover(i)} />
            </g>
          );
        })}
      </svg>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-between text-[11px] text-muted-foreground">
        {labelIdx.map((i, k) => <span key={k}>{shortDay(days[i].day)}</span>)}
      </div>
      <div className="pointer-events-none absolute left-0 top-0 text-[11px] text-muted-foreground">{max.toLocaleString("en-US")} max</div>
      {tip && hover !== null && (
        <div
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-popover px-2.5 py-1.5 text-xs shadow-lg"
          style={{ left: `${Math.min(92, Math.max(8, ((hover + 0.5) / days.length) * 100))}%` }}
        >
          <span className="font-medium text-foreground">{tip.count.toLocaleString()} {tip.count === 1 ? "click" : "clicks"}</span>
          <span className="text-muted-foreground"> · {shortDay(tip.day)}</span>
        </div>
      )}
      {/* keyboard + screen reader access to every value */}
      <table className="sr-only">
        <thead><tr><th>Day</th><th>Clicks</th></tr></thead>
        <tbody>{days.map((d) => <tr key={d.day}><td>{shortDay(d.day)}</td><td>{d.count}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}
