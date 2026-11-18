"use client";
import { BarChart3, Check, Copy, CornerDownRight, ExternalLink, MoreHorizontal, Pause, Pencil, Play, QrCode, Trash2 } from "lucide-react";
import { useState } from "react";
import { copyText, plural, when } from "@/lib/client";
import { notify } from "@/lib/notify";
import type { Link } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Tip } from "./ui/tooltip";

export type LinkStateLabel = "active" | "disabled" | "expired";

interface Props {
  link: Link;
  /** full short URL (empty until mounted) */
  shortUrl: string;
  state: LinkStateLabel;
  /** "Expires in 3 days" etc., computed after mount */
  expiryNote: string | null;
  /** the clock, once mounted (null on the server) */
  now: number | null;
  highlight: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onStats: () => void;
  onQr: () => void;
  onDelete: () => void;
}

const destination = (url: string) => {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "") + (u.pathname === "/" ? "" : u.pathname) + u.search;
  } catch {
    return url;
  }
};

/** One link in the list: what it is and where it goes on the left, its clicks and actions on the right. */
export default function LinkItem({ link, shortUrl, state, expiryNote, now, highlight, onEdit, onToggle, onStats, onQr, onDelete }: Props) {
  const [copied, setCopied] = useState(false);
  const live = state === "active";

  async function copy() {
    if (await copyText(shortUrl)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } else notify.error("Couldn't copy. Select the link and copy it manually.");
  }

  return (
    <li className={cn("grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 px-4 py-3.5 transition-colors duration-700 sm:grid-cols-[minmax(0,1fr)_7.5rem_auto]", highlight && "bg-primary/[0.06]")}>
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className={cn("truncate text-[15px] font-medium", !live && "text-muted-foreground")}>{link.title}</h3>
          {state === "disabled" && <span className="shrink-0 rounded-[4px] bg-muted px-1.5 py-px text-xs font-medium text-muted-foreground">Paused</span>}
          {state === "expired" && <span className="shrink-0 rounded-[4px] bg-destructive/10 px-1.5 py-px text-xs font-medium text-destructive">Expired</span>}
          {live && expiryNote && <span className="shrink-0 text-xs text-muted-foreground">{expiryNote}</span>}
        </div>
        <div className="mt-0.5 flex min-w-0 items-center gap-2 text-sm">
          <button
            onClick={copy}
            disabled={!shortUrl}
            className={cn("mono shrink-0 rounded-sm font-medium hover:underline", live ? "text-primary" : "text-muted-foreground line-through decoration-1")}
            aria-label={`Copy short link /r/${link.slug}`}
          >
            /r/{link.slug}
          </button>
          <CornerDownRight className="size-3.5 shrink-0 text-muted-foreground/70" aria-label="goes to" />
          <a href={link.url} target="_blank" rel="noopener noreferrer" className="min-w-0 truncate text-muted-foreground hover:text-foreground hover:underline">{destination(link.url)}</a>
        </div>
      </div>

      <button onClick={onStats} className="col-start-1 row-start-2 justify-self-start rounded-md text-left text-sm sm:col-start-auto sm:row-start-auto sm:justify-self-end sm:text-right" aria-label={`${plural(link.clicks, "click")}. Open stats`}>
        <span className="font-medium tabular-nums">{plural(link.clicks, "click")}</span>
        <span className="ml-2 text-xs text-muted-foreground sm:ml-0 sm:block">{link.lastClickedAt ? (now !== null ? `clicked ${when(link.lastClickedAt, now)}` : " ") : "no clicks yet"}</span>
      </button>

      <div className="row-span-2 flex items-center gap-0.5 self-start sm:row-span-1 sm:self-center">
        <Tip label={copied ? "Copied" : "Copy link"}>
          <Button size="icon-sm" variant="ghost" onClick={copy} disabled={!shortUrl} aria-label="Copy link">{copied ? <Check className="text-success" /> : <Copy />}</Button>
        </Tip>
        <Tip label="Stats"><Button size="icon-sm" variant="ghost" onClick={onStats} aria-label="Stats" className="hidden sm:inline-flex"><BarChart3 /></Button></Tip>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon-sm" variant="ghost" aria-label="More actions"><MoreHorizontal /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onEdit}><Pencil /> Edit</DropdownMenuItem>
            <DropdownMenuItem onSelect={onQr}><QrCode /> QR code</DropdownMenuItem>
            <DropdownMenuItem onSelect={onStats}><BarChart3 /> Stats</DropdownMenuItem>
            <DropdownMenuItem onSelect={onToggle}>{link.enabled ? <><Pause /> Pause</> : <><Play /> Resume</>}</DropdownMenuItem>
            <DropdownMenuItem asChild><a href={shortUrl || `/r/${link.slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink /> Open short link</a></DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onDelete} className="text-destructive [&_svg]:!text-destructive"><Trash2 /> Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}
