import { apiError, apiResponse, preflight, publicKey, v1 } from "@/lib/apiKeys";
import { getDb } from "@/lib/db";
import { limits } from "@/lib/limits";
import { listLinks } from "@/lib/links";

export const OPTIONS = preflight;

/** GET /api/v1/me: the account behind this key, the key itself and the limits that apply. */
export const GET = v1(null, async ({ userId, key }) => {
  const db = await getDb();
  const [user, links] = await Promise.all([db.users.findOne({ id: userId }), listLinks(userId)]);
  if (!user) return apiError("not_found", "Account not found.", 404);
  const l = limits();
  return apiResponse({
    user: { id: user.id, name: user.name, email: user.email },
    key: publicKey(key),
    links: { count: links.length, limit: l.linksPerUser },
    limits: { requestsPerMinute: l.perMinute, requestsPerDay: Math.min(key.dailyLimit ?? l.perDay, l.perDay) },
  });
});
