import { randomBytes } from "crypto";
import type { Link } from "./types";

/* Pure rules for links: no database, so they can be unit-tested directly (tests/links.test.ts). */

/* ----------------------------- slugs ----------------------------- */

/** 1–64 characters: letters, numbers, "-" and "_", starting with a letter or number. */
export const SLUG_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;
export const SLUG_RULES = 'Use 1–64 letters, numbers, "-" or "_", starting with a letter or number.';
export const slugKey = (slug: string) => slug.toLowerCase();

// No 0/O, 1/l/I: random slugs are often read aloud or typed from a screen.
const ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
/** 7 characters from a 56-letter alphabet ≈ 1.7 trillion combinations. */
export function randomSlug(length = 7): string {
  let out = "";
  while (out.length < length) {
    for (const b of randomBytes(length * 2)) {
      // rejection sampling keeps every character equally likely
      if (b < 256 - (256 % ALPHABET.length)) out += ALPHABET[b % ALPHABET.length];
      if (out.length === length) break;
    }
  }
  return out;
}

/* ----------------------------- input ----------------------------- */

export interface LinkInput {
  url?: string;
  slug?: string;
  title?: string;
  enabled?: boolean;
  expiresAt?: string | null;
}

/**
 * Validates an untrusted body; returns a clean patch or an error message.
 * `selfHost` is this site's host, so a short link can't point at another short link here (a redirect loop).
 */
export function parseLink(body: unknown, creating: boolean, selfHost?: string): LinkInput | string {
  if (!body || typeof body !== "object") return "Invalid body";
  const b = body as Record<string, unknown>;
  const out: LinkInput = {};

  if (b.url !== undefined || creating) {
    if (typeof b.url !== "string" || !b.url.trim()) return "Enter the URL to shorten";
    let raw = b.url.trim();
    if (!/^[a-z][a-z0-9+.-]*:/i.test(raw)) raw = `https://${raw}`; // "example.com/page" means https
    if (raw.length > 2048) return "That URL is too long (max 2048 characters)";
    let u: URL;
    try {
      u = new URL(raw);
    } catch {
      return "That doesn't look like a valid URL";
    }
    if (u.protocol !== "http:" && u.protocol !== "https:") return "Only http:// and https:// links can be shortened";
    if (!u.hostname.includes(".") && u.hostname !== "localhost") return "That doesn't look like a valid URL";
    if (selfHost && u.host === selfHost && u.pathname.startsWith("/r/")) return "That URL is already a short link here";
    out.url = u.toString();
  }
  if (b.slug !== undefined && b.slug !== null && b.slug !== "") {
    if (typeof b.slug !== "string" || !SLUG_PATTERN.test(b.slug.trim())) return `Invalid short name. ${SLUG_RULES}`;
    out.slug = b.slug.trim();
  }
  if (b.title !== undefined) {
    if (typeof b.title !== "string") return "Invalid title";
    if (b.title.trim().length > 120) return "Title is too long (max 120 characters)";
    out.title = b.title.trim();
  }
  if (b.enabled !== undefined) {
    if (typeof b.enabled !== "boolean") return "Invalid enabled flag";
    out.enabled = b.enabled;
  }
  if (b.expiresAt !== undefined) {
    if (b.expiresAt === null || b.expiresAt === "") out.expiresAt = null;
    else {
      if (typeof b.expiresAt !== "string" || isNaN(Date.parse(b.expiresAt))) return "Invalid expiry date";
      if (Date.parse(b.expiresAt) <= Date.now()) return "The expiry date must be in the future";
      out.expiresAt = new Date(b.expiresAt).toISOString();
    }
  }
  return out;
}

/** A default title: the destination's host without "www.". */
export const titleFor = (url: string) => new URL(url).hostname.replace(/^www\./, "");

export type LinkState = "active" | "disabled" | "expired";
export const linkState = (l: Pick<Link, "enabled" | "expiresAt">, now = Date.now()): LinkState =>
  !l.enabled ? "disabled" : l.expiresAt && Date.parse(l.expiresAt) <= now ? "expired" : "active";

// Link-preview fetchers (chat apps, social sites) and crawlers open links without a person clicking.
const BOT = /bot\b|crawler|spider|slurp|facebookexternalhit|embedly|preview|whatsapp|vkshare|skypeuripreview|bitlybot|google-?inspectiontool|lighthouse/i;
export const isBot = (userAgent: string | null) => !userAgent || BOT.test(userAgent);

/** Where a click came from: the referring site's host, or "direct". */
export function clickSource(referrer: string | null, selfHost: string): string {
  if (!referrer) return "direct";
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "").toLowerCase();
    return !host || host === selfHost.replace(/:\d+$/, "").replace(/^www\./, "") ? "direct" : host.slice(0, 100);
  } catch {
    return "direct";
  }
}
