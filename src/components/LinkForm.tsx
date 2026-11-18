"use client";
import { format } from "date-fns";
import { useEffect, useRef, useState } from "react";
import { useSlugCheck } from "@/lib/client";
import type { Link } from "@/lib/types";
import { SlugField } from "./SlugField";
import { Button } from "./ui/button";
import { DatePicker } from "./ui/date-picker";
import { Dialog, DialogContent } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";

export interface LinkDraft { url: string; slug: string; title: string; enabled: boolean; expiresAt: string | null }

/** "2026-12-31" -> the end of that day in the viewer's time zone, as an ISO string. */
export const endOfDay = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d, 23, 59, 59).toISOString();
};

/** Edit a link: destination, short name, title, on/off and expiry. */
export default function LinkForm({ link, onClose, onSubmit }: { link: Link | null; onClose: () => void; onSubmit: (id: string, draft: Partial<LinkDraft>) => Promise<boolean> }) {
  const [url, setUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [expiry, setExpiry] = useState("");
  const [saving, setSaving] = useState(false);
  const urlRef = useRef<HTMLInputElement>(null);
  const status = useSlugCheck(slug, link?.id, slug.trim().toLowerCase() === link?.slug.toLowerCase());

  useEffect(() => {
    if (!link) return;
    setUrl(link.url);
    setSlug(link.slug);
    setTitle(link.title);
    setEnabled(link.enabled);
    setExpiry(link.expiresAt ? format(new Date(link.expiresAt), "yyyy-MM-dd") : "");
    setSaving(false);
  }, [link]);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!link || saving || status === "invalid" || status === "taken" || !slug.trim()) return;
    const draft: Partial<LinkDraft> = {};
    if (url.trim() !== link.url) draft.url = url.trim();
    if (slug.trim() !== link.slug) draft.slug = slug.trim();
    if (title.trim() !== link.title) draft.title = title.trim();
    if (enabled !== link.enabled) draft.enabled = enabled;
    const oldExpiry = link.expiresAt ? format(new Date(link.expiresAt), "yyyy-MM-dd") : "";
    if (expiry !== oldExpiry) draft.expiresAt = expiry ? endOfDay(expiry) : null;
    if (Object.keys(draft).length === 0) return onClose();
    setSaving(true);
    if (!(await onSubmit(link.id, draft))) setSaving(false);
  }

  return (
    <Dialog open={!!link} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        title="Edit link"
        description="Change where the link goes, its short name, title, status and expiry"
        onOpenAutoFocus={(e) => { e.preventDefault(); urlRef.current?.focus(); }}
        footer={
          <>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => submit()} disabled={saving || status === "invalid" || status === "taken" || !slug.trim()}>{saving ? "Saving…" : "Save changes"}</Button>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-url">Destination URL</Label>
            <Input ref={urlRef} id="edit-url" type="url" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)} autoComplete="off" spellCheck={false} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-slug">Short name</Label>
            <SlugField id="edit-slug" value={slug} onChange={setSlug} status={status} placeholder="" />
            {link && slug.trim() && slug.trim() !== link.slug && (
              <p className="text-xs text-muted-foreground">The old address <span className="font-mono">/r/{link.slug}</span> will stop working.</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-title">Title</Label>
            <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="The site's name" />
          </div>
          <div className="space-y-1.5">
            <Label>Expires</Label>
            <DatePicker value={expiry} onChange={setExpiry} placeholder="Never" clearLabel="Remove expiry" fromDate={new Date()} />
          </div>
          <label htmlFor="edit-enabled" className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-border px-3 py-2.5">
            <span>
              <span className="block text-sm font-medium">Redirect visitors</span>
              <span className="block text-xs text-muted-foreground">Turn off to pause the link. Its stats are kept.</span>
            </span>
            <Switch id="edit-enabled" checked={enabled} onCheckedChange={setEnabled} />
          </label>
          <button type="submit" hidden />
        </form>
      </DialogContent>
    </Dialog>
  );
}
