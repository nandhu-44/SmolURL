import { apiError, apiResponse, preflight, v1 } from "@/lib/apiKeys";
import { LinkError, createLink, linkState, listLinks, parseLink, toLink } from "@/lib/links";
import { requestOrigin } from "@/lib/origin";

const int = (v: string | null, d: number, min: number, max: number) => {
  const n = v === null ? d : Number(v);
  return Number.isInteger(n) ? Math.min(max, Math.max(min, n)) : d;
};
const SORTS = ["created", "updated", "clicks", "last_click", "title", "slug"] as const;
const STATES = ["active", "disabled", "expired"] as const;

export const OPTIONS = preflight;

/** GET /api/v1/links: search, filter, sort and page through your links. */
export const GET = v1("links:read", async ({ req, userId }) => {
  const q = new URL(req.url).searchParams;
  const text = q.get("q")?.trim().toLowerCase();
  const state = q.get("state");
  const sort = q.get("sort") ?? "created";
  const dir = q.get("direction") === "asc" ? 1 : -1;
  if (state && !(STATES as readonly string[]).includes(state)) return apiError("invalid_parameter", "state must be active, disabled or expired.", 400);
  if (!(SORTS as readonly string[]).includes(sort)) return apiError("invalid_parameter", `sort must be one of: ${SORTS.join(", ")}.`, 400);

  const now = Date.now();
  let list = (await listLinks(userId)).map(toLink).filter((l) =>
    (!state || linkState(l, now) === state) &&
    (!text || l.title.toLowerCase().includes(text) || l.url.toLowerCase().includes(text) || l.slug.toLowerCase().includes(text)),
  );
  list = list.sort((a, b) => {
    switch (sort) {
      case "updated": return dir * a.updatedAt.localeCompare(b.updatedAt);
      case "clicks": return dir * (a.clicks - b.clicks);
      case "last_click": return dir * (a.lastClickedAt ?? "").localeCompare(b.lastClickedAt ?? "");
      case "title": return dir * a.title.localeCompare(b.title);
      case "slug": return dir * a.slug.localeCompare(b.slug);
      default: return dir * a.createdAt.localeCompare(b.createdAt);
    }
  });
  const limit = int(q.get("limit"), 50, 1, 200);
  const offset = int(q.get("offset"), 0, 0, 1_000_000);
  const origin = requestOrigin(req);
  return apiResponse({ data: list.slice(offset, offset + limit).map((l) => ({ ...l, shortUrl: `${origin}/r/${l.slug}` })), total: list.length, limit, offset });
});

/** POST /api/v1/links: shorten a URL. */
export const POST = v1("links:write", async ({ req, userId }) => {
  const origin = requestOrigin(req);
  const input = parseLink(await req.json().catch(() => null), true, new URL(origin).host);
  if (typeof input === "string") return apiError("invalid_body", input, 400);
  try {
    const link = toLink(await createLink(userId, input));
    return apiResponse({ data: { ...link, shortUrl: `${origin}/r/${link.slug}` } }, 201, { Location: `/api/v1/links/${link.id}` });
  } catch (e) {
    if (e instanceof LinkError) return apiError(e.code, e.message, e.status);
    throw e;
  }
});
