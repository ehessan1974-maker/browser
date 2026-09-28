// Barq (برق) simulation engine — deterministic, URL-seeded page/tracker generation
// plus a lightweight in-memory global stats store. Server-side only in practice,
// but free of Node-specific APIs so types can be shared safely.

import type {
  BlockedTracker,
  BrowsePage,
  PageKind,
  PageResult,
  StatsResponse,
  TrackerCategory,
} from "./barq-types";

/* ---------------------------------- RNG ---------------------------------- */

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function shuffle<T>(rng: () => number, arr: readonly T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function intBetween(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/* ------------------------------ Tracker pool ------------------------------ */

const TRACKER_POOL: ReadonlyArray<{ name: string; category: TrackerCategory }> = [
  { name: "google-analytics.com", category: "analytics" },
  { name: "googletagmanager.com", category: "analytics" },
  { name: "doubleclick.net", category: "ads" },
  { name: "googleadservices.com", category: "ads" },
  { name: "pagead2.googlesyndication.com", category: "ads" },
  { name: "connect.facebook.net", category: "social" },
  { name: "ads-twitter.com", category: "ads" },
  { name: "analytics.tiktok.com", category: "analytics" },
  { name: "scorecardresearch.com", category: "analytics" },
  { name: "quantserve.com", category: "analytics" },
  { name: "chartbeat.com", category: "analytics" },
  { name: "hotjar.com", category: "fingerprint" },
  { name: "clarity.ms", category: "analytics" },
  { name: "mixpanel.com", category: "analytics" },
  { name: "amplitude.com", category: "analytics" },
  { name: "segment.io", category: "analytics" },
  { name: "criteo.com", category: "ads" },
  { name: "taboola.com", category: "ads" },
  { name: "outbrain.com", category: "ads" },
  { name: "adnxs.com", category: "ads" },
  { name: "pubmatic.com", category: "ads" },
  { name: "rubiconproject.com", category: "ads" },
  { name: "amazon-adsystem.com", category: "ads" },
  { name: "moatads.com", category: "ads" },
  { name: "fingerprintjs.com", category: "fingerprint" },
  { name: "iovation.com", category: "fingerprint" },
  { name: "crashlytics.com", category: "other" },
  { name: "newrelic.com", category: "other" },
  { name: "adsrvr.org", category: "ads" },
  { name: "zemanta.com", category: "ads" },
];

/* ------------------------------ URL parsing ------------------------------- */

interface ParsedTarget {
  url: string;
  host: string;
  kind: PageKind;
  query?: string;
  wikiTopic?: string;
}

const URL_LIKE = /^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/i;

function prettyHost(host: string): string {
  return host.replace(/^www\./, "");
}

export function parseTarget(raw: string): ParsedTarget | null {
  const input = raw.trim();
  if (!input) return null;

  if (URL_LIKE.test(input)) {
    const withProto = /^https?:\/\//i.test(input) ? input : `https://${input}`;
    try {
      const u = new URL(withProto);
      const host = prettyHost(u.hostname);
      let kind: PageKind = "generic";
      let wikiTopic: string | undefined;

      if (/wikipedia/i.test(host)) {
        kind = "wiki";
        const m = decodeURIComponent(u.pathname).match(/\/wiki\/(.+)/);
        if (m) wikiTopic = m[1].replace(/_/g, " ");
      } else if (/news|akhbar|akhbaar|خبر|press|journal|economic|sport/i.test(host)) {
        kind = "news";
      }

      return { url: u.toString(), host, kind, wikiTopic };
    } catch {
      return null;
    }
  }

  // Not URL-like → treat as an instant search query
  return {
    url: `barq://search?q=${encodeURIComponent(input)}`,
    host: "بحث برق",
    kind: "search",
    query: input,
  };
}

/* ----------------------------- Content pools ------------------------------ */

const NEWS_SITES = ["الشرق نيوز", "تقنية اليوم", "بوابة الأخبار", "الموجز الاقتصادي"] as const;

const NEWS_HEADLINES = [
  {
    title: "الذكاء الاصطناعي يعيد رسم خريطة التقنية في 2025",
    excerpt:
      "تشير التقارير إلى أن أدوات الذكاء الاصطناعي الوكيلة أصبحت المحرك الأول لنمو المنصات الرقمية، مع تحول كبير نحو التصفح الآلي الذي ينفّذ المهام نيابة عن المستخدم.",
  },
  {
    title: "المتصفحات الخفيفة ترجع بقوة مع موجة الأجهزة القديمة",
    excerpt:
      "مع ارتفاع استهلاك الموارد في المتصفحات التقليدية، يبحث المستخدمون عن بدائل تستهلك ذاكرة أقل وتحترم خصوصيتهم دون التضحية بسرعة التصفح.",
  },
  {
    title: "حظر المتعقبات الافتراضي يصبح المعيار الجديد",
    excerpt:
      "دراسة جديدة تُظهر أن أكثر من 60% من المستخدمين يعتبرون حظر التتبع ميزة أساسية وليست خيارًا إضافيًا، ما يدفع المطوّرين لتبنيه افتراضيًا.",
  },
] as const;

const NEWS_RELATED = [
  "أسعار المعالجات تتراجع بنسبة 12% مع وفرة الإمدادات",
  "الاتحاد الأوروبي يشدّد قواعد مشاركة البيانات الإعلانية",
  "إطلاق معيار جديد للتطبيقات الذي يعمل دون اتصال",
  "شركات الاتصالات تختبر شبكات الجيل السابع لأول مرة",
  "نمو الاستخدام المؤسسي لوكلاء الذكاء الاصطناعي بنسبة 220%",
  "تقرير: ثلثا المستخدمين يفضلون الإعلانات المحجوبة افتراضيًا",
] as const;

const GENERIC_HOST_TOPICS = [
  "دليل البداية السريعة",
  "ما الجديد في هذا الإصدار",
  "الأسئلة الشائعة",
  "توثيق واجهة البرمجة",
] as const;

const WIKI_FALLBACK_TOPICS = [
  "متصفح الويب",
  "خصوصية على الإنترنت",
  "محرك العرض",
  "التتبع على الويب",
  "الذكاء الاصطناعي الوكيل",
] as const;

const WIKI_INTRO = (topic: string) =>
  `${topic} هو أحد المفاهيم الأساسية في عالم الويب الحديث، ويشهد تطورًا متسارعًا مدفوعًا بالتغيرات في توقعات المستخدمين حول السرعة والخصوصية واستهلاك الموارد. تتناول هذه المادة الجوانب التقنية والتاريخية للموضوع مع الإشارة إلى أبرز الاتجاهات الحديثة.`;

const WIKI_PARAGRAPH_2 = (topic: string) =>
  `يعتمد تطور ${topic} على منظومة متكاملة من المعايير المفتوحة وأدوات القياس المستقلة، ما سمح بظهور حلول خفيفة تقدّم تجربة كاملة بموارد أقل بكثير. وتُظهر القياسات المرجعية أن الفروق في زمن التحميل واستهلاك الذاكرة بين الحلول التقليدية والبدائل الخفيفة تتجاوز أحيانًا عشرة أضعاف.`;

const SEARCH_SNIPPETS = [
  "دليل عملي خطوة بخطوة يشرح الأساسيات مع أمثلة واقعية ونصائح للبداية الصحيحة.",
  "مقالة معمّقة تناقش أحدث التطورات في المجال مع مقارنات عملية بين الحلول المتاحة.",
  "إجابة موجزة ومباشرة من موسوعة حرة يحرّرها المتطوعون حول الموضوع المطلوب.",
  "تقرير تقني يعرض أرقام قياسات حقيقية عن الأداء والاستهلاك مقارنة بالبدائل الشائعة.",
  "مناقشة مجتمعية نشطة حول أفضل الممارسات والتجارب الشخصية والتحذيرات المهمة.",
  "صفحة رسمية تتضمن التوثيق الكامل للأوامر والواجهات مع أمثلة جاهزة للنسخ.",
] as const;

const RESULT_HOSTS = [
  "ar.wikipedia.org",
  "docs.example.net",
  "tech.example.com",
  "news.example.com",
  "community.example.org",
  "blog.example.dev",
] as const;

/* ------------------------------ Page builder ------------------------------ */

function makeResults(rng: () => number, topic: string, count: number): PageResult[] {
  const clean = topic.replace(/\s*(19|20)\d{2}\s*$/, "").trim() || topic;
  return Array.from({ length: count }, (_, i) => ({
    title:
      i === 0
        ? `${clean} — ويكيبيديا`
        : i === 1
          ? `${clean} 2025: دليل شامل ومحدَّث`
          : i === 2
            ? `أفضل 10 موارد عن ${clean}`
            : i === 3
              ? `شرح مبسّط: كل ما تحتاج معرفته عن ${clean}`
              : i === 4
                ? `أدوات ومقارنات عملية حول ${clean}`
                : `أسئلة شائعة حول ${clean}`,
    host: RESULT_HOSTS[i % RESULT_HOSTS.length],
    snippet: SEARCH_SNIPPETS[(i + intBetween(rng, 0, 3)) % SEARCH_SNIPPETS.length],
    loadMs: intBetween(rng, 42, 96),
  }));
}

export function buildPage(rawInput: string): BrowsePage {
  const target = parseTarget(rawInput);
  if (!target) {
    throw new Error("invalid-target");
  }

  const rng = mulberry32(hashStr(target.url));
  const { kind } = target;

  /* --- performance numbers (always hover around Barq's claims) --- */
  const loadMs =
    kind === "search"
      ? intBetween(rng, 44, 72)
      : kind === "wiki"
        ? intBetween(rng, 68, 98)
        : kind === "news"
          ? intBetween(rng, 76, 112)
          : intBetween(rng, 60, 104);

  const ramMb = 27 + Math.round(rng() * 6); // 27–33 MB

  /* --- blocked trackers --- */
  const picked = shuffle(rng, TRACKER_POOL).slice(0, intBetween(rng, 7, 11));
  const trackers: BlockedTracker[] = picked.map((t) => ({
    name: t.name,
    category: t.category,
    requests: intBetween(rng, 1, 6),
  }));
  const totalBlocked = trackers.reduce((s, t) => s + t.requests, 0);
  const adsRemoved = trackers
    .filter((t) => t.category === "ads")
    .reduce((s, t) => s + t.requests, 0) + intBetween(rng, 0, 3);
  const dataSavedKb = totalBlocked * intBetween(rng, 38, 88) + intBetween(rng, 120, 420);

  const hue = hashStr(target.host) % 360;

  /* --- content --- */
  let title = "";
  let siteName = "";
  let hero = { kicker: "", title: "", excerpt: "" };
  const blocks: BrowsePage["content"]["blocks"] = [];
  let results: PageResult[] = [];

  if (kind === "search") {
    const q = target.query ?? "";
    siteName = "بحث برق";
    title = `نتائج البحث عن: ${q}`;
    hero = {
      kicker: "بحث فوري",
      title: `نتائج البحث عن «${q}»`,
      excerpt: `${intBetween(rng, 8, 24)},${intBetween(rng, 100, 999)} نتيجة مرتبة حسب الصلة — جُلبت في ${loadMs} مللي ثانية.`,
    };
    blocks.push({
      type: "paragraph",
      text: `يعرض برق نتائج نظيفة خالية من روابط الإعلانات الممولة؛ إذ حُجبت ${adsRemoved} نتيجة مدفوعة و${totalBlocked} طلب تتبّع أثناء البحث.`,
    });
    results = makeResults(rng, q, 6);
  } else if (kind === "wiki") {
    const topic = target.wikiTopic ?? pick(rng, WIKI_FALLBACK_TOPICS);
    siteName = "ويكيبيديا";
    title = `${topic} — ويكيبيديا`;
    hero = {
      kicker: "موسوعة حرة",
      title: topic,
      excerpt: WIKI_INTRO(topic).slice(0, 180) + "…",
    };
    blocks.push({ type: "paragraph", text: WIKI_INTRO(topic) });
    blocks.push({ type: "paragraph", text: WIKI_PARAGRAPH_2(topic) });
    blocks.push({
      type: "list",
      items: [
        "الأصل والتطور التاريخي",
        "المبادئ التقنية وأركان التصميم",
        "القياسات المرجعية للأداء",
        "الانتقادات والردود عليها",
        "اقرأ أيضًا",
      ],
    });
    results = makeResults(rng, topic, 3);
  } else if (kind === "news") {
    const site = pick(rng, NEWS_SITES);
    const head = pick(rng, NEWS_HEADLINES);
    siteName = site;
    title = head.title;
    hero = {
      kicker: "شريط رئيسي",
      title: head.title,
      excerpt: head.excerpt,
    };
    blocks.push({ type: "paragraph", text: head.excerpt });
    blocks.push({
      type: "paragraph",
      text: "وفي التفاصيل، أوضحت المصادر أن التحول نحو التصفح الآلي والوكلاء الشخصيين أصبح واقعًا يوميًا لا خيارًا مستقبليًا؛ فالمستخدم يطلب النتيجة لا الخطوات، والمتصفح الذي لا يفهم الوكلاء سيجد نفسه خارج السوق تدريجيًا.",
    });
    blocks.push({
      type: "list",
      items: shuffle(rng, NEWS_RELATED).slice(0, 4),
    });
    results = makeResults(rng, head.title.split(" ").slice(0, 3).join(" "), 3);
  } else {
    const topic = pick(rng, GENERIC_HOST_TOPICS);
    siteName = target.host;
    title = `${target.host} — ${topic}`;
    hero = {
      kicker: "صفحة رئيسية",
      title: `مرحبًا بك في ${target.host}`,
      excerpt: `صفحة خفيفة جُلبت في ${loadMs} مللي ثانية مع حجب ${totalBlocked} متعقّب وإعلان.`,
    };
    blocks.push({
      type: "paragraph",
      text: `هذه نسخة نظيفة من الصفحة بعد إزالة السكربتات التتبعية والإعلانات. عرض ${topic} الكامل يعمل كالمعتاد لأن برق يحجب ما يضار فقط ويترك المحتوى سليمًا.`,
    });
    blocks.push({
      type: "list",
      items: [
        `${topic} — دليل سريع`,
        "إعدادات الخصوصية الموصى بها",
        "أدوات التطوير والمقاييس",
        "الأسئلة الشائعة",
      ],
    });
    results = makeResults(rng, target.host, 3);
  }

  return {
    url: target.url,
    host: target.host,
    title,
    siteName,
    hue,
    loadMs,
    ramMb,
    trackers,
    totalBlocked,
    adsRemoved,
    dataSavedKb,
    content: { kind, hero, blocks, results },
  };
}

/* ------------------------------ Stats store ------------------------------- */

const BASE_TOTAL_BLOCKED = 1_284_503;
const BASE_PAGES_SERVED = 48_213;

const store = {
  totalBlocked: BASE_TOTAL_BLOCKED,
  pagesServed: BASE_PAGES_SERVED,
  loadSamples: [] as number[],
  ramSamples: [] as number[],
};

export function recordPageLoad(page: BrowsePage): void {
  store.totalBlocked += page.totalBlocked;
  store.pagesServed += 1;
  store.loadSamples.push(page.loadMs);
  store.ramSamples.push(page.ramMb);
  if (store.loadSamples.length > 60) store.loadSamples.shift();
  if (store.ramSamples.length > 60) store.ramSamples.shift();
}

export function getStats(): StatsResponse {
  const avg = (xs: number[], dflt: number) =>
    xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : dflt;
  return {
    trackersInDB: 3512,
    totalBlocked: store.totalBlocked,
    pagesServed: store.pagesServed,
    avgLoadMs: avg(store.loadSamples, 85),
    avgRamMb: avg(store.ramSamples, 30),
  };
}
