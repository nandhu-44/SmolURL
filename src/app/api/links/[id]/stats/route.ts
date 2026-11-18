import { fail, json, requireUser } from "@/lib/auth";
import { findLink, linkStats } from "@/lib/links";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await requireUser();
  if ("res" in a) return a.res;
  const link = await findLink(a.user.id, (await params).id);
  if (!link) return fail("Link not found", 404);
  const days = Number(new URL(req.url).searchParams.get("days"));
  return json({ stats: await linkStats(link, [7, 30, 90].includes(days) ? days : 30) });
}
