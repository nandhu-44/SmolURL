"use client";
import { motion } from "framer-motion";
import { BarChart3, Check, Copy, ExternalLink, MoreHorizontal, Pause, Pencil, Play, QrCode, Trash2 } from "lucide-react";
import { useState } from "react";
import { copyText } from "@/lib/client";
import { notify } from "@/lib/notify";
import type { Link } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Sparkline } from "./charts";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Tip } from "./ui/tooltip";

export type LinkStateLabel = "active" | "disabled" | "expired";

interface Props {
  link: Link;
  /** full short URL (empty until mounted) */
  shortUrl: string;
  state: LinkStateLabel;
  /** "expires in 3 days" etc., computed after mount */
  expiryNote: string | null;
  spark: number[];
  highlight: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onStats: () => void;
  onQr: () => void;
  onDelete: () => void;
}

const host = (url: string) => {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "") + (u.pathname === "/" ? "" : u.pathname) + u.search;
  } catch {
    return url;
  }
};

export default function LinkItem({ link, shortUrl, state, expiryNote, spark, highlight, onEdit, onToggle, onStats, onQr, onDelete }: Props) {
  const [copied, setCopied] = useState(false);
  const week = spark.slice(-7).reduce((a, b) => a + b, 0);

  async function copy() {
    if (await copyText(shortUrl)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } else notify.error("Couldn't copy. Select the link and copy it manually.");
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={cn("surface p-4 transition-shadow", highlight && "ring-2 ring-primary ring-offset-2 ring-offset-background", state !== "active" && "bg-card/60")}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={cn("heading truncate text-lg leading-tight", state !== "active" && "text-muted-foreground")}>{link.title}</h3>
            {state === "disabled" && <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"><Pause className="size-3" /> Paused</span>}
            {state === "expired" && <span className="rounded-full bg-destructive/12 px-2 py-0.5 text-[11px] font-medium text-destructive">Expired</span>}
            {state === "active" && expiryNote && <span className="rounded-full bg-primary/12 px-2 py-0.5 text-[11px] font-medium text-primary">{expiryNote}</span>}
          </div>
          <button
            onClick={copy}
            className={cn("mt-1 max-w-full truncate font-mono text-sm outline-none hover:underline focus-visible:underline", state === "active" ? "text-primary" : "text-muted-foreground line-through decoration-1")}
            aria-label={`Copy short link /r/${link.slug}`}
          >
            /r/{link.slug}
          </button>
          <a href={link.url} target="_blank" rel="noopener noreferrer" className="mt-0.5 flex min-w-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <span aria-hidden>→</span>
            <span className="truncate">{host(link.url)}</span>
          </a>
        </div>

        <button onClick={onStats} className="hidden shrink-0 flex-col items-end gap-1 rounded-xl px-2 py-1 text-right outline-none transition hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary sm:flex" aria-label={`${link.clicks} clicks, ${week} in the last 7 days. Open stats`}>
          <span className="heading text-xl leading-none">{link.clicks.toLocaleString("en-US")}</span>
          <span className="text-[11px] text-muted-foreground">{link.clicks === 1 ? "click" : "clicks"} · {week} this week</span>
          <Sparkline values={spark} />
        </button>
      </div>

      <div className="mt-3 flex items-center gap-1.5 border-t border-border pt-3">
        <Button size="icon-sm" variant={copied ? "default" : "outline"} className="w-auto gap-1.5 px-3 text-sm" onClick={copy} disabled={!shortUrl}>
          {copied ? <><Check /> Copied</> : <><Copy /> Copy</>}
        </Button>
        <Tip label="QR code"><Button size="icon-sm" variant="ghost" onClick={onQr} aria-label="QR code"><QrCode /></Button></Tip>
        <Tip label="Stats"><Button size="icon-sm" variant="ghost" onClick={onStats} aria-label="Stats"><BarChart3 /></Button></Tip>
        <Tip label="Edit"><Button size="icon-sm" variant="ghost" onClick={onEdit} aria-label="Edit"><Pencil /></Button></Tip>
        <span className="ml-auto text-xs text-muted-foreground sm:hidden">{link.clicks.toLocaleString("en-US")} {link.clicks === 1 ? "click" : "clicks"}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon-sm" variant="ghost" aria-label="More actions" className="sm:ml-auto"><MoreHorizontal /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onEdit}><Pencil /> Edit</DropdownMenuItem>
            <DropdownMenuItem onSelect={onToggle}>{link.enabled ? <><Pause /> Pause link</> : <><Play /> Turn link on</>}</DropdownMenuItem>
            <DropdownMenuItem asChild><a href={shortUrl || `/r/${link.slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink /> Open short link</a></DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onDelete} className="text-destructive"><Trash2 /> Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.li>
  );
}
