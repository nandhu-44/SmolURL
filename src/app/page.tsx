import AppearanceSync from "@/components/AppearanceSync";
import Landing from "@/components/Landing";
import LinksApp from "@/components/LinksApp";
import { getSessionUserId, toPublic } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { dashboard } from "@/lib/links";

export const dynamic = "force-dynamic";

export default async function Home() {
  const id = await getSessionUserId();
  if (!id) return <Landing />;
  // The session cookie already names the user, so the account and its links load in parallel
  // and the page arrives with its data: no second request.
  const [user, data] = await Promise.all([(await getDb()).users.findOne({ id }), dashboard(id)]);
  if (!user) return <Landing />;
  const pub = toPublic(user);
  return (
    <>
      <AppearanceSync appearance={pub.appearance} />
      <LinksApp user={pub} initial={data} />
    </>
  );
}
