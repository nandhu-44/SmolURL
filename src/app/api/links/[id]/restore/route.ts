import { fail, json, requireUser } from "@/lib/auth";
import { restoreLink, toLink } from "@/lib/links";

/** Undo for a delete: brings the link back with its stats, if the undo window hasn't passed. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await requireUser();
  if ("res" in a) return a.res;
  const link = await restoreLink(a.user.id, (await params).id);
  return link ? json({ link: toLink(link) }) : fail("This link can no longer be restored", 404);
}
