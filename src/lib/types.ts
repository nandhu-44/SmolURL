export interface Link {
  id: string;
  /** the part after /r/, as the owner typed it */
  slug: string;
  /** where the link goes (http/https only) */
  url: string;
  title: string;
  /** off = the short link stops redirecting but is kept */
  enabled: boolean;
  /** after this moment the short link stops redirecting (ISO date-time), or null */
  expiresAt: string | null;
  clicks: number;
  lastClickedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DayCount { day: string; count: number }

export interface LinkStats {
  total: number;
  lastClickedAt: string | null;
  /** clicks per UTC day, oldest first, zeros filled in */
  days: DayCount[];
  /** where clicks came from (referring site), most first; "direct" = no referrer */
  referrers: { source: string; count: number }[];
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  hasPassword: boolean;
  google: boolean;
  totpEnabled: boolean;
  recoveryLeft: number;
}
