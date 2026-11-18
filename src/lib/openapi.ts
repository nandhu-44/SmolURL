import { limits } from "./limits";

type Param = { name: string; in: "query" | "path"; description: string; required?: boolean; schema: Record<string, unknown> };
export interface Endpoint { method: "get" | "post" | "patch" | "delete"; path: string; summary: string; scope: string; params?: Param[]; body?: string; responses: Record<string, string> }

const q = (name: string, description: string, schema: Record<string, unknown> = { type: "string" }): Param => ({ name, in: "query", description, schema });
const id: Param = { name: "id", in: "path", description: "The link's id", required: true, schema: { type: "string", format: "uuid" } };

export const ENDPOINTS: Endpoint[] = [
  { method: "get", path: "/api/v1/links", summary: "List links (search, filter, sort, page)", scope: "links:read",
    params: [
      q("q", "Search title, destination URL and short name"), q("state", "active, disabled or expired", { enum: ["active", "disabled", "expired"] }),
      q("sort", "created, updated, clicks, last_click, title or slug", { type: "string", default: "created" }), q("direction", "asc or desc (default desc)", { enum: ["asc", "desc"] }),
      q("limit", "1 to 200 (default 50)", { type: "integer" }), q("offset", "How many to skip", { type: "integer" }),
    ],
    responses: { "200": "{ data: Link[], total, limit, offset }" } },
  { method: "post", path: "/api/v1/links", summary: "Shorten a URL", scope: "links:write", body: '{ "url": "https://example.com/a/very/long/page", "slug": "launch", "title": "Launch post" }', responses: { "201": "{ data: Link }", "409": "slug_taken", "403": "link_limit_reached" } },
  { method: "get", path: "/api/v1/links/{id}", summary: "Get one link", scope: "links:read", params: [id], responses: { "200": "{ data: Link }", "404": "not_found" } },
  { method: "patch", path: "/api/v1/links/{id}", summary: "Change a link (send only what changes)", scope: "links:write", params: [id], body: '{ "enabled": false }', responses: { "200": "{ data: Link }", "404": "not_found", "409": "slug_taken" } },
  { method: "delete", path: "/api/v1/links/{id}", summary: "Delete a link and its stats", scope: "links:write", params: [id], responses: { "204": "no content", "404": "not_found" } },
  { method: "get", path: "/api/v1/links/{id}/stats", summary: "Clicks per day and top referring sites", scope: "links:read", params: [id, q("days", "7, 30 or 90 (default 30)", { type: "integer", enum: [7, 30, 90] })], responses: { "200": "{ data: LinkStats }", "404": "not_found" } },
  { method: "get", path: "/api/v1/me", summary: "The account, this key and your limits", scope: "any valid key", responses: { "200": "{ user, key, links, limits }" } },
  { method: "get", path: "/api/v1/usage", summary: "Today's quota usage and the last 7 days", scope: "any valid key", responses: { "200": "{ today, last7Days }" } },
];

export function openApiSpec(origin: string) {
  const l = limits();
  const link = {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      slug: { type: "string", pattern: "^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$", description: "The short name: the link is <site>/r/<slug>. Random if not given." },
      shortUrl: { type: "string", format: "uri", readOnly: true },
      url: { type: "string", format: "uri", maxLength: 2048, description: "Where the link goes (http or https)" },
      title: { type: "string", maxLength: 120, description: "Defaults to the destination's host name" },
      enabled: { type: "boolean", description: "false = the short link stops redirecting" },
      expiresAt: { type: ["string", "null"], format: "date-time", description: "After this the short link stops redirecting" },
      clicks: { type: "integer", readOnly: true }, lastClickedAt: { type: ["string", "null"], format: "date-time", readOnly: true },
      createdAt: { type: "string", format: "date-time", readOnly: true }, updatedAt: { type: "string", format: "date-time", readOnly: true },
    },
  };
  const paths: Record<string, Record<string, unknown>> = {};
  for (const e of ENDPOINTS) {
    (paths[e.path] ??= {})[e.method] = {
      summary: e.summary,
      description: `Required scope: ${e.scope}.`,
      parameters: e.params,
      ...(e.body ? { requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/LinkInput" }, example: JSON.parse(e.body) } } } } : {}),
      responses: Object.fromEntries(Object.entries(e.responses).map(([code, description]) => [code, { description }])),
    };
  }
  return {
    openapi: "3.1.0",
    info: {
      title: "SmolURL API", version: "1.0.0",
      description: `Create an API key in Settings, then send it as \`Authorization: Bearer <key>\`. Limits per key: ${l.perMinute} requests/minute and ${l.perDay} requests/day (UTC).`,
    },
    servers: [{ url: origin }],
    security: [{ bearerAuth: [] }],
    paths,
    components: {
      securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", description: "API key starting with sk_smol." } },
      schemas: {
        Link: link,
        LinkInput: { type: "object", properties: { url: link.properties.url, slug: link.properties.slug, title: link.properties.title, enabled: link.properties.enabled, expiresAt: link.properties.expiresAt } },
        LinkStats: {
          type: "object",
          properties: {
            total: { type: "integer" }, lastClickedAt: { type: ["string", "null"], format: "date-time" },
            days: { type: "array", items: { type: "object", properties: { day: { type: "string", format: "date" }, count: { type: "integer" } } } },
            referrers: { type: "array", items: { type: "object", properties: { source: { type: "string" }, count: { type: "integer" } } } },
          },
        },
        Error: { type: "object", properties: { error: { type: "object", properties: { code: { type: "string" }, message: { type: "string" } } } } },
      },
    },
  };
}
