import assert from "node:assert/strict";
import { SLUG_PATTERN, clickSource, isBot, linkState, parseLink, randomSlug, slugKey, titleFor } from "../src/lib/linkRules.ts";

let n = 0;
const ok = (name: string, fn: () => void) => { fn(); console.log("✓", name); n++; };
const future = new Date(Date.now() + 86_400_000).toISOString();

ok("a URL is required when creating, optional when editing", () => {
  assert.equal(typeof parseLink({}, true), "string");
  assert.deepEqual(parseLink({}, false), {});
});

ok("URLs without a scheme get https://", () => {
  assert.deepEqual(parseLink({ url: "example.com/page?a=1&b=2" }, true), { url: "https://example.com/page?a=1&b=2" });
});

ok("only http and https URLs are accepted", () => {
  for (const url of ["javascript:alert(1)", "data:text/html,hi", "ftp://example.com/x", "mailto:a@b.co", "file:///etc/passwd"]) {
    assert.equal(typeof parseLink({ url }, true), "string", url);
  }
  assert.equal(typeof parseLink({ url: "http://localhost:3000/x" }, true), "object");
  assert.equal(typeof parseLink({ url: "https://intranet" }, true), "string"); // no dot: not a public address
});

ok("a short link can't point at another short link on this site (redirect loop)", () => {
  assert.match(parseLink({ url: "https://smol.example.com/r/abc" }, true, "smol.example.com") as string, /already a short link/);
  assert.equal(typeof parseLink({ url: "https://smol.example.com/docs" }, true, "smol.example.com"), "object");
});

ok("slugs: letters, numbers, - and _, 1–64 characters, starting with a letter or number", () => {
  for (const s of ["a", "launch", "Spring-2026_sale", "x".repeat(64)]) assert.ok(SLUG_PATTERN.test(s), s);
  for (const s of ["", "-lead", "_lead", "has space", "slash/no", "ümlaut", "x".repeat(65), "dot.dot"]) assert.ok(!SLUG_PATTERN.test(s), s);
  assert.equal(typeof parseLink({ url: "example.com", slug: "bad slug" }, true), "string");
  assert.deepEqual(parseLink({ url: "example.com", slug: "  ok-slug " }, true), { url: "https://example.com/", slug: "ok-slug" });
  assert.equal(slugKey("Launch"), slugKey("launch")); // matched without regard to case
});

ok("random slugs are 7 unambiguous characters and don't repeat", () => {
  const seen = new Set<string>();
  for (let i = 0; i < 2000; i++) {
    const s = randomSlug();
    assert.match(s, /^[a-km-zA-HJ-NP-Z2-9]{7}$/);
    seen.add(s);
  }
  assert.equal(seen.size, 2000);
});

ok("expiry must be a future date; null or empty clears it", () => {
  assert.match(parseLink({ expiresAt: "2001-01-01T00:00:00Z" }, false) as string, /future/);
  assert.equal(typeof parseLink({ expiresAt: "not a date" }, false), "string");
  assert.deepEqual(parseLink({ expiresAt: null }, false), { expiresAt: null });
  assert.deepEqual(parseLink({ expiresAt: "" }, false), { expiresAt: null });
  assert.equal((parseLink({ expiresAt: future }, false) as { expiresAt: string }).expiresAt, future);
});

ok("title and enabled are validated", () => {
  assert.equal(typeof parseLink({ title: "x".repeat(121) }, false), "string");
  assert.equal(typeof parseLink({ enabled: "yes" }, false), "string");
  assert.deepEqual(parseLink({ title: "  Hi  ", enabled: false }, false), { title: "Hi", enabled: false });
  assert.equal(titleFor("https://www.example.com/a/b"), "example.com");
});

ok("link state: paused beats expired, expired once the date passes", () => {
  const past = new Date(Date.now() - 1000).toISOString();
  assert.equal(linkState({ enabled: true, expiresAt: null }), "active");
  assert.equal(linkState({ enabled: true, expiresAt: future }), "active");
  assert.equal(linkState({ enabled: true, expiresAt: past }), "expired");
  assert.equal(linkState({ enabled: false, expiresAt: past }), "disabled");
});

ok("link-preview bots and crawlers are not counted as clicks; browsers are", () => {
  for (const ua of ["Slackbot-LinkExpanding 1.0", "Twitterbot/1.0", "facebookexternalhit/1.1", "Mozilla/5.0 (compatible; Discordbot/2.0)", "TelegramBot (like TwitterBot)", "WhatsApp/2.23", "Googlebot/2.1", null]) {
    assert.ok(isBot(ua), String(ua));
  }
  for (const ua of ["Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 Safari/605.1.15", "Mozilla/5.0 (X11; Linux x86_64) Chrome/140.0 Safari/537.36", "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile/15E148"]) {
    assert.ok(!isBot(ua), ua);
  }
});

ok("click sources: referring site, 'direct' when none or when it's this site", () => {
  assert.equal(clickSource(null, "smol.example.com"), "direct");
  assert.equal(clickSource("https://www.reddit.com/r/foo", "smol.example.com"), "reddit.com");
  assert.equal(clickSource("https://smol.example.com/", "smol.example.com"), "direct");
  assert.equal(clickSource("http://localhost:3000/", "localhost:3000"), "direct");
  assert.equal(clickSource("garbage", "smol.example.com"), "direct");
});

console.log(`\n${n} link checks passed`);
