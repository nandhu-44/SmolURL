import { fail, json, requireUser } from "@/lib/auth";
import { LinkError, deleteLink, findLink, parseLink, toLink, updateLink } from "@/lib/links";
import { requestOrigin } from "@/lib/origin";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const a = await requireUser();
  if ("res" in a) return a.res;
  const link = await findLink(a.user.id, (await params).id);
  if (!link) return fail("Link not found", 404);
  const input = parseLink(await req.json().catch(() => null), false, new URL(requestOrigin(req)).host);
  if (typeof input === "string") return fail(input);
  try {
    return json({ link: toLink(await updateLink(link, input)) });
  } catch (e) {
    if (e instanceof LinkError) return fail(e.message, e.status);
    throw e;
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const a = await requireUser();
  if ("res" in a) return a.res;
  const link = await findLink(a.user.id, (await params).id);
  if (!link) return fail("Link not found", 404);
  await deleteLink(link);
  return json({ ok: true });
}
