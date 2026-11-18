import { randomUUID } from "crypto";
import { utcDay } from "./apiKeys";
import { DuplicateError, getDb, type LinkDoc } from "./db";
import { limits } from "./limits";
import { linkState, randomSlug, slugKey, SLUG_PATTERN, titleFor, type LinkInput, type LinkState } from "./linkRules";
import type { Link, LinkStats } from "./types";

export * from "./linkRules";

export const toLink = ({ userId: _u, slugKey: _k, deletedAt: _d, ...link }: LinkDoc): Link => link;

/* ----------------------------- storage ----------------------------- */

/** How long a deleted link stays restorable ("Undo") before it and its stats are removed for good. */
const TRASH_MS = 2 * 60_000;

export class LinkError extends Error {
  constructor(public code: string, message: string, public status: number) {
    super(message);
  }
}

/** The user's links (not deleted), newest first. Also clears out links whose undo window has passed. */
export async function listLinks(userId: string): Promise<LinkDoc[]> {
  const all = await (await getDb()).links.find({ userId });
  const now = Date.now();
  const expired = all.filter((l) => l.deletedAt && now - Date.parse(l.deletedAt) > TRASH_MS);
  if (expired.length) void Promise.all(expired.map(purge)).catch((e) => console.error("[links] purge failed", e));
  return all.filter((l) => !l.deletedAt).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function findLink(userId: string, id: string): Promise<LinkDoc | null> {
  const l = await (await getDb()).links.findOne({ id, userId });
  return l && !l.deletedAt ? l : null;
}

async function purge(l: LinkDoc) {
  const db = await getDb();
  await Promise.all([db.links.remove({ id: l.id }), db.clickDays.remove({ linkId: l.id }), db.clickSources.remove({ linkId: l.id })]);
}

/** Frees a slug held by one of the user's own deleted links, so it can be reused straight away. */
async function freeSlug(userId: string, slug: string): Promise<boolean> {
  const held = await (await getDb()).links.findOne({ slugKey: slugKey(slug) });
  if (held && held.userId === userId && held.deletedAt) {
    await purge(held);
    return true;
  }
  return false;
}

export async function slugAvailable(userId: string, slug: string, exceptId?: string): Promise<boolean> {
  const held = await (await getDb()).links.findOne({ slugKey: slugKey(slug) });
  return !held || held.id === exceptId || (held.userId === userId && !!held.deletedAt);
}

export async function createLink(userId: string, input: LinkInput): Promise<LinkDoc> {
  const db = await getDb();
  const max = limits().linksPerUser;
  if ((await listLinks(userId)).length >= max) throw new LinkError("link_limit_reached", `You have reached the limit of ${max} links. Delete some to add more.`, 403);

  const now = new Date().toISOString();
  const base = {
    id: randomUUID(), userId, url: input.url!, title: input.title || titleFor(input.url!),
    enabled: input.enabled ?? true, expiresAt: input.expiresAt ?? null,
    clicks: 0, lastClickedAt: null, createdAt: now, updatedAt: now, deletedAt: null,
  };
  if (input.slug) {
    await freeSlug(userId, input.slug);
    const link: LinkDoc = { ...base, slug: input.slug, slugKey: slugKey(input.slug) };
    try {
      await db.links.insert(link);
    } catch (e) {
      if (e instanceof DuplicateError) throw new LinkError("slug_taken", `The short name "${input.slug}" is already taken.`, 409);
      throw e;
    }
    return link;
  }
  // a random slug: a collision is astronomically unlikely, but retry rather than fail if one happens
  for (let i = 0; i < 5; i++) {
    const slug = randomSlug();
    const link: LinkDoc = { ...base, slug, slugKey: slugKey(slug) };
    try {
      await db.links.insert(link);
      return link;
    } catch (e) {
      if (!(e instanceof DuplicateError)) throw e;
    }
  }
  throw new LinkError("server_error", "Couldn't create a short name. Please try again.", 500);
}

export async function updateLink(link: LinkDoc, input: LinkInput): Promise<LinkDoc> {
  const db = await getDb();
  const patch: Partial<LinkDoc> = { ...input, updatedAt: new Date().toISOString() };
  if (input.slug !== undefined && slugKey(input.slug) !== link.slugKey) {
    await freeSlug(link.userId, input.slug);
    patch.slugKey = slugKey(input.slug);
  }
  if (input.title === "") patch.title = titleFor(input.url ?? link.url);
  try {
    await db.links.update(link.id, patch);
  } catch (e) {
    if (e instanceof DuplicateError) throw new LinkError("slug_taken", `The short name "${input.slug}" is already taken.`, 409);
    throw e;
  }
  return { ...link, ...patch };
}

/** Hides the link at once; "Undo" (restoreLink) can bring it back for a couple of minutes. */
export async function deleteLink(link: LinkDoc) {
  await (await getDb()).links.update(link.id, { deletedAt: new Date().toISOString() });
}

export async function restoreLink(userId: string, id: string): Promise<LinkDoc | null> {
  const db = await getDb();
  const l = await db.links.findOne({ id, userId });
  if (!l?.deletedAt) return null;
  await db.links.update(id, { deletedAt: null });
  return { ...l, deletedAt: null };
}

/** Removes every link and all click data of an account (account deletion). */
export async function removeAllLinks(userId: string) {
  const db = await getDb();
  await Promise.all([db.links.remove({ userId }), db.clickDays.remove({ userId }), db.clickSources.remove({ userId })]);
}

/* ----------------------------- clicks ----------------------------- */

/** The live link behind a short name, or why it can't be used. */
export async function resolveSlug(slug: string): Promise<{ link: LinkDoc; state: LinkState } | null> {
  if (!SLUG_PATTERN.test(slug)) return null;
  const link = await (await getDb()).links.findOne({ slugKey: slugKey(slug) });
  if (!link || link.deletedAt) return null;
  return { link, state: linkState(link) };
}

export async function recordClick(link: LinkDoc, source: string) {
  const db = await getDb();
  const now = new Date();
  const day = utcDay(now);
  await Promise.all([
    db.links.bump(link.id, "clicks", { lastClickedAt: now.toISOString() }),
    db.clickDays.increment(`${link.id}:${day}`, { id: `${link.id}:${day}`, linkId: link.id, userId: link.userId, day, count: 0 }, "count"),
    db.clickSources.increment(`${link.id}:${source}`, { id: `${link.id}:${source}`, linkId: link.id, userId: link.userId, source, count: 0 }, "count"),
  ]);
}

/** Clicks per day for the last `days` days (oldest first) and the top referring sites. */
export async function linkStats(link: LinkDoc, days = 30): Promise<LinkStats> {
  const db = await getDb();
  const [dayDocs, sourceDocs] = await Promise.all([db.clickDays.find({ linkId: link.id }), db.clickSources.find({ linkId: link.id })]);
  const byDay = new Map(dayDocs.map((d) => [d.day, d.count]));
  const wanted = Array.from({ length: days }, (_, i) => utcDay(new Date(Date.now() - (days - 1 - i) * 86_400_000)));
  return {
    total: link.clicks,
    lastClickedAt: link.lastClickedAt,
    days: wanted.map((day) => ({ day, count: byDay.get(day) ?? 0 })),
    referrers: sourceDocs.sort((a, b) => b.count - a.count).slice(0, 10).map((d) => ({ source: d.source, count: d.count })),
  };
}

/** Clicks per day across all of the user's links for the last `days` days (for the dashboard summary and sparklines). */
export async function accountClicks(userId: string, days = 14): Promise<{ total: Map<string, number>; perLink: Map<string, number[]>; wanted: string[] }> {
  const docs = await (await getDb()).clickDays.find({ userId });
  const wanted = Array.from({ length: days }, (_, i) => utcDay(new Date(Date.now() - (days - 1 - i) * 86_400_000)));
  const index = new Map(wanted.map((d, i) => [d, i]));
  const total = new Map<string, number>();
  const perLink = new Map<string, number[]>();
  for (const d of docs) {
    const i = index.get(d.day);
    if (i === undefined) continue;
    total.set(d.day, (total.get(d.day) ?? 0) + d.count);
    const row = perLink.get(d.linkId) ?? Array(days).fill(0);
    row[i] += d.count;
    perLink.set(d.linkId, row);
  }
  return { total, perLink, wanted };
}

export interface Dashboard {
  links: Link[];
  /** clicks per day for the last 14 days, per link id (oldest first) */
  spark: Record<string, number[]>;
  /** clicks per day for the last 14 days across all links (oldest first) */
  daily: number[];
}

/** Everything the links page needs, in one go (used by the server render and by refreshes). */
export async function dashboard(userId: string): Promise<Dashboard> {
  const [docs, clicks] = await Promise.all([listLinks(userId), accountClicks(userId, 14)]);
  return {
    links: docs.map(toLink),
    spark: Object.fromEntries(docs.map((l) => [l.id, clicks.perLink.get(l.id) ?? Array(14).fill(0)])),
    daily: clicks.wanted.map((d) => clicks.total.get(d) ?? 0),
  };
}
