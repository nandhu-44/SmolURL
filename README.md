# SmolURL

Short links with names you choose. Shorten any URL to `/r/<name>`, share it, and see how many people clicked and where they came from.
Built with **Next.js (App Router) + TypeScript**, on the same foundation as [ToDo Next](https://github.com/nandhu-44/todo-next).

## Features
- **Custom or random short names.** `/r/launch`, or a 7-character random name without look-alike characters (no `0/O`, `1/l/I`).
  Names are matched without regard to case, and availability is checked live while you type.
- **Click stats.** Clicks per day (7, 30 or 90 days) and the top referring sites for every link, plus a 14-day trend on each card.
  Link-preview fetchers (Slack, Discord, WhatsApp, X…), crawlers and browser prefetches are not counted.
- **QR codes** for every link, downloadable as PNG or SVG.
- **Pause or expire.** Turn a link off without deleting it, or set a date after which it stops working. Visitors see a clear page instead of an error.
- **Edit anything later**: destination, short name, title, status and expiry.
- **Delete with undo.** A deleted link and its stats can be restored for two minutes.
- Search, filter (active / paused / expired) and sort (newest, most clicks, recently clicked…), remembered per browser. Keyboard shortcuts: `N` new link, `/` search.
- Light / dark theme, six colour themes, a custom theme, fonts and corner roundness (*Settings → Appearance*).

## Run it
```bash
npm install
cp .env.example .env.local   # set AUTH_SECRET at minimum for production
npm run dev
```
With no `MONGO_URI`, data lives in `./data/db.json` (zero setup). Set `MONGO_URI` to use MongoDB.
With no SMTP settings, password-reset links are printed to the server console (and shown on the page in dev).

## Short links
- A link is `https://<your-site>/r/<name>`. Opening it answers with a `307` redirect straight away; the click is recorded after the response is sent, so the database never slows the redirect down.
- Only `http://` and `https://` destinations are accepted, and a short link can't point at another short link on the same site (that would loop).
- Unknown names get a 404 page; paused and expired links get their own page explaining why.
- Days in the stats are UTC days.

## Accounts and security
- **Email + password**, **Google sign-in** (OAuth 2.0 code flow with PKCE + state), **passkeys** (WebAuthn) and **two-step verification** (TOTP with 8 recovery codes).
  Set `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` and add `<your-site-url>/api/auth/google/callback` as an authorised redirect URI; the Google button only appears when configured.
  Passkeys are bound to the site's domain: set `WEBAUTHN_RP_ID` / `WEBAUTHN_ORIGIN` in production.
- Passwords are bcrypt-hashed, sessions are signed httpOnly cookies, reset tokens are hashed and single-use, and TOTP secrets are AES-256-GCM encrypted at rest.
- **Bot protection** on sign-up, password reset, and sign-in after 3 wrong passwords: Cloudflare Turnstile when `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` are set,
  otherwise a built-in proof-of-work check (a speed bump, not a real bot detector). `CAPTCHA_PROVIDER=off` disables it.
- Sign-in, 2FA, link creation and sensitive account actions are rate-limited (in memory, per server instance).
- Deleting an account removes its links, click data, API keys and passkeys.

## Public API
Create keys in *Settings → API access* (`sk_smol.` plus 64 random characters, shown once, stored only as a SHA-256 hash, with optional expiry,
read/write scopes and a lower daily limit), then call `/api/v1` with `Authorization: Bearer sk_smol.…`:

| Endpoint | |
|---|---|
| `GET /api/v1/links` | search (`q`), filter (`state`), sort and page |
| `POST /api/v1/links` | shorten a URL (`url`, optional `slug`, `title`, `expiresAt`) |
| `GET / PATCH / DELETE /api/v1/links/{id}` | read, change or delete one link |
| `GET /api/v1/links/{id}/stats?days=30` | clicks per day and top sources |
| `GET /api/v1/me`, `GET /api/v1/usage` | the account, the key and its quota |

Docs live at `/docs` and the OpenAPI 3.1 spec at `/api/v1/openapi.json`. Defaults (configurable, see `.env.example`): 60 requests/minute and 2,000/day per key,
5 keys and 1,000 links per account. Responses carry `X-RateLimit-*` and `X-Quota-*` headers; going over returns `429` with `Retry-After`.

## Tests
- `npm test` runs the unit checks: link validation, slugs and click detection (`tests/links.test.ts`), theme contrast (`tests/appearance.test.ts`) and the CAPTCHA (`tests/captcha.test.ts`).
- `tests/api.integration.js` exercises the API, redirects, click counting, limits and quotas against a running server; its header shows how to start one.

## Deploying
Works on Vercel or any Node host. Set `AUTH_SECRET` and `MONGO_URI` (for example a free MongoDB Atlas cluster).
For the fastest redirects, put the function region next to the database and use a `mongodb://` connection string rather than `mongodb+srv://`.
`GET /api/health` is a cheap public check; with `HEALTH_TOKEN` set, `GET /api/health?deep=1` reports database latency.

## License
[MIT](LICENSE)
