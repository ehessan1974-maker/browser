// Shared types for the Barq (برق) demo — safe to import from client & server.

export type TrackerCategory = "ads" | "analytics" | "social" | "fingerprint" | "other";

export const TRACKER_CATEGORY_LABELS: Record<TrackerCategory, string> = {
  ads: "إعلانات",
  analytics: "تحليلات",
  social: "تواصل اجتماعي",
  fingerprint: "بصمة الجهاز",
  other: "أخرى",
};

export const TRACKER_CATEGORY_COLORS: Record<TrackerCategory, string> = {
  ads: "bg-rose-400",
  analytics: "bg-amber-400",
  social: "bg-violet-400",
  fingerprint: "bg-teal-400",
  other: "bg-zinc-400",
};

export interface BlockedTracker {
  name: string;
  category: TrackerCategory;
  requests: number;
}

export interface PageResult {
  title: string;
  host: string;
  snippet: string;
  loadMs: number;
}

export interface PageBlock {
  type: "paragraph" | "list";
  text?: string;
  items?: string[];
}

export type PageKind = "news" | "wiki" | "search" | "generic";

export interface PageContent {
  kind: PageKind;
  hero: { kicker: string; title: string; excerpt: string };
  blocks: PageBlock[];
  results: PageResult[];
}

export interface BrowsePage {
  url: string;
  host: string;
  title: string;
  siteName: string;
  hue: number;
  loadMs: number;
  ramMb: number;
  trackers: BlockedTracker[];
  totalBlocked: number;
  adsRemoved: number;
  dataSavedKb: number;
  content: PageContent;
}

export interface BrowseResponse {
  ok: true;
  page: BrowsePage;
}

export interface BrowseError {
  ok: false;
  error: string;
}

export interface StatsResponse {
  trackersInDB: number;
  totalBlocked: number;
  pagesServed: number;
  avgLoadMs: number;
  avgRamMb: number;
}

export interface AgentAction {
  type: "open_url";
  url: string;
  label: string;
}

export interface AgentMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AgentResponse {
  ok: true;
  reply: string;
  action: AgentAction | null;
}
