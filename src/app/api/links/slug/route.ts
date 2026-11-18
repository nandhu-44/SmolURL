import { json, requireUser } from "@/lib/auth";
import { SLUG_PATTERN, SLUG_RULES, slugAvailable } from "@/lib/links";
import { allow } from "@/lib/rateLimit";

/** GET /api/links/slug?slug=docs[&except=<link id>]: is this short name free? (live check while typing) */
export async function GET(req: Request) {
  const a = await requireUser();
  if ("res" in a) return a.res;
  const q = new URL(req.url).searchParams;
  const slug = (q.get("slug") ?? "").trim();
  if (!SLUG_PATTERN.test(slug)) return json({ valid: false, available: false, message: SLUG_RULES });
  if (!allow(`slug:${a.user.id}`, 120, 60_000)) return json({ valid: true, available: true }); // don't block typing; the save re-checks
  return json({ valid: true, available: await slugAvailable(a.user.id, slug, q.get("except") ?? undefined) });
}
