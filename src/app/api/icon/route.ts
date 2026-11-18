import { MARK_DOT, MARK_SLASH } from "@/components/Logo";

/** The app mark as an SVG favicon; it follows the browser's light/dark setting. */
export function GET() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><style>.t{fill:#3047c8}.m{stroke:#fff;fill:#fff}@media (prefers-color-scheme:dark){.t{fill:#93a4ff}.m{stroke:#0e1430;fill:#0e1430}}</style><rect class="t" width="32" height="32" rx="8"/><path class="m" d="${MARK_SLASH}" fill="none" stroke-width="3.4" stroke-linecap="round"/><circle class="m" cx="${MARK_DOT.cx}" cy="${MARK_DOT.cy}" r="${MARK_DOT.r}" stroke="none"/></svg>`;
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=86400" } });
}
