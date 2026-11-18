import { CalendarX2, PauseCircle } from "lucide-react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { after } from "next/server";
import StatusPage from "@/components/StatusPage";
import { clickSource, isBot, recordClick, resolveSlug } from "@/lib/links";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Link unavailable · SmolURL", robots: { index: false } };

/** /r/<slug>: sends the visitor on to the link's destination and counts the click. */
export default async function ShortLink({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const found = await resolveSlug(decodeURIComponent(slug));
  if (!found) notFound();

  const { link, state } = found;
  if (state === "disabled") {
    return <StatusPage icon={PauseCircle} title="This link is turned off" message="Its owner has paused this short link. Try again later, or ask them for the address." />;
  }
  if (state === "expired") {
    return <StatusPage icon={CalendarX2} title="This link has expired" message="The short link you followed was set to stop working after a certain date." />;
  }

  const h = await headers();
  // Prefetches and link-preview bots (chat apps, social sites) aren't people clicking, so they aren't counted.
  const prefetch = /prefetch/i.test(h.get("sec-purpose") ?? h.get("purpose") ?? "") || h.has("next-router-prefetch");
  if (!prefetch && !isBot(h.get("user-agent"))) {
    const source = clickSource(h.get("referer"), h.get("x-forwarded-host") ?? h.get("host") ?? "");
    // counted after the response is sent, so the redirect isn't slowed down by the database writes
    after(() => recordClick(link, source).catch((e) => console.error("[r] click not recorded", e)));
  }
  redirect(link.url);
}
