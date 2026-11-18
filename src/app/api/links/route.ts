import { fail, json, requireUser } from "@/lib/auth";
import { LinkError, createLink, dashboard, parseLink, toLink } from "@/lib/links";
import { requestOrigin } from "@/lib/origin";
import { allow } from "@/lib/rateLimit";

export async function GET() {
  const a = await requireUser();
  if ("res" in a) return a.res;
  return json(await dashboard(a.user.id));
}

export async function POST(req: Request) {
  const a = await requireUser();
  if ("res" in a) return a.res;
  if (!allow(`create:${a.user.id}`, 60, 60_000)) return fail("You're creating links too quickly. Wait a minute and try again.", 429);
  const input = parseLink(await req.json().catch(() => null), true, new URL(requestOrigin(req)).host);
  if (typeof input === "string") return fail(input);
  try {
    return json({ link: toLink(await createLink(a.user.id, input)) }, 201);
  } catch (e) {
    if (e instanceof LinkError) return fail(e.message, e.status);
    throw e;
  }
}
