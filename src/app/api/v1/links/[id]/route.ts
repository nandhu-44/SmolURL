import { apiError, apiResponse, preflight, v1 } from "@/lib/apiKeys";
import { LinkError, deleteLink, findLink, parseLink, toLink, updateLink } from "@/lib/links";
import { requestOrigin } from "@/lib/origin";

export const OPTIONS = preflight;

const withShort = (req: Request, l: ReturnType<typeof toLink>) => ({ ...l, shortUrl: `${requestOrigin(req)}/r/${l.slug}` });

export const GET = v1("links:read", async ({ req, userId, params }) => {
  const link = await findLink(userId, params.id);
  return link ? apiResponse({ data: withShort(req, toLink(link)) }) : apiError("not_found", "No link with that id.", 404);
});

/** PATCH: send only the fields you want to change. */
export const PATCH = v1("links:write", async ({ req, userId, params }) => {
  const link = await findLink(userId, params.id);
  if (!link) return apiError("not_found", "No link with that id.", 404);
  const input = parseLink(await req.json().catch(() => null), false, new URL(requestOrigin(req)).host);
  if (typeof input === "string") return apiError("invalid_body", input, 400);
  if (Object.keys(input).length === 0) return apiError("invalid_body", "Send at least one field to change.", 400);
  try {
    return apiResponse({ data: withShort(req, toLink(await updateLink(link, input))) });
  } catch (e) {
    if (e instanceof LinkError) return apiError(e.code, e.message, e.status);
    throw e;
  }
});

export const DELETE = v1("links:write", async ({ userId, params }) => {
  const link = await findLink(userId, params.id);
  if (!link) return apiError("not_found", "No link with that id.", 404);
  await deleteLink(link);
  return apiResponse(null, 204);
});
