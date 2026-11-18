"use client";
import { useEffect, useState } from "react";
import { api } from "./api";

/**
 * This site's origin (e.g. https://smol.example.com), or "" during the server render and first paint.
 * Reading `window` while rendering would make the server and browser HTML differ (React error #418).
 */
export function useOrigin(): string {
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  return origin;
}

/** The current time, refreshed every minute; null until mounted (the server's clock and time zone aren't the viewer's). */
export function useNow(): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export type SlugStatus = "empty" | "invalid" | "checking" | "available" | "taken";
const SLUG = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;

/** Live "is this short name free?" check while typing (debounced). `unchanged` = the link already has this slug. */
export function useSlugCheck(slug: string, exceptId?: string, unchanged = false): SlugStatus {
  const [status, setStatus] = useState<SlugStatus>("empty");
  useEffect(() => {
    const s = slug.trim();
    if (!s) return setStatus("empty");
    if (!SLUG.test(s)) return setStatus("invalid");
    if (unchanged) return setStatus("available");
    setStatus("checking");
    let live = true;
    const t = setTimeout(async () => {
      try {
        const r = await api<{ available: boolean }>(`/api/links/slug?slug=${encodeURIComponent(s)}${exceptId ? `&except=${exceptId}` : ""}`);
        if (live) setStatus(r.available ? "available" : "taken");
      } catch {
        if (live) setStatus("available"); // the save re-checks; don't block typing on a failed check
      }
    }, 350);
    return () => { live = false; clearTimeout(t); };
  }, [slug, exceptId, unchanged]);
  return status;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** "2026-11-18" -> "18 Nov" (UTC day keys, shown as calendar dates). */
export const shortDay = (day: string) => new Date(`${day}T00:00:00Z`).toLocaleDateString(undefined, { day: "numeric", month: "short", timeZone: "UTC" });
