import { apiError, apiResponse, preflight, v1 } from "@/lib/apiKeys";
import { findLink, linkStats } from "@/lib/links";

export const OPTIONS = preflight;

/** GET /api/v1/links/{id}/stats?days=30: clicks per day and the top referring sites. */
export const GET = v1("links:read", async ({ req, userId, params }) => {
  const link = await findLink(userId, params.id);
  if (!link) return apiError("not_found", "No link with that id.", 404);
  const days = Number(new URL(req.url).searchParams.get("days") ?? 30);
  if (![7, 30, 90].includes(days)) return apiError("invalid_parameter", "days must be 7, 30 or 90.", 400);
  return apiResponse({ data: await linkStats(link, days) });
});
