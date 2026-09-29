"use client";

import * as React from "react";
import { motion, useInView } from "framer-motion";
import {
  Ban,
  ChevronLeft,
  ChevronRight,
  Globe,
  Lock,
  MemoryStick,
  Plus,
  RotateCw,
  ShieldCheck,
  Timer,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { buildPage } from "@/lib/barq-data";
import type { BrowseError, BrowsePage, BrowseResponse } from "@/lib/barq-types";
import MockPage from "@/components/demo/mock-page";
import PrivacyPanel, { type DemoSession } from "@/components/demo/privacy-panel";
import AgentConsole from "@/components/demo/agent-console";

type TabStatus = "idle" | "loading" | "ready" | "error";

interface Tab {
  id: string;
  title: string;
  url: string;
  hue: number;
  status: TabStatus;
  page: BrowsePage | null;
  error?: string;
  history: string[];
  historyIndex: number;
}

function makeTab(id: string): Tab {
  return {
    id,
    title: "تبويب جديد",
    url: "",
    hue: 160,
    status: "idle",
    page: null,
    history: [],
    historyIndex: -1,
  };
}

function truncateText(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, Math.max(0, n - 1))}…` : s;
}

const START_CHIPS: { label: string; target: string }[] = [
  { label: "ويكيبيديا", target: "wikipedia.org" },
  { label: "أخبار التقنية", target: "tech.example.com" },
  { label: "بحث: الذكاء الاصطناعي", target: "الذكاء الاصطناعي" },
];

const MIN_LOAD_MS = 900; // minimum simulated load time
const NAV_ABORT_MS = 20_000; // hard cap for any single navigation
const TICKER_MS = 130; // blocked-requests ticker tick

export default function BrowserDemo() {
  const sectionRef = React.useRef<HTMLElement | null>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-200px" });

  const [tabs, setTabs] = React.useState<Tab[]>(() => [makeTab("tab-1")]);
  const [activeId, setActiveId] = React.useState("tab-1");
  const [session, setSession] = React.useState<DemoSession>({
    pages: 0,
    blocked: 0,
    ads: 0,
    dataKb: 0,
  });
  const [shieldOn, setShieldOn] = React.useState(true);
  const [loadingBlocked, setLoadingBlocked] = React.useState(0);
  const [address, setAddress] = React.useState("");
  const [navKey, setNavKey] = React.useState(0); // restarts the loading progress bar

  const activeTab = tabs.find((t) => t.id === activeId) ?? tabs[0];

  // Refs mirroring state for stable callbacks
  const tabsRef = React.useRef(tabs);
  const activeIdRef = React.useRef(activeId);
  React.useEffect(() => {
    tabsRef.current = tabs;
  }, [tabs]);
  React.useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  // Navigation bookkeeping
  const seqRef = React.useRef(new Map<string, number>()); // per-tab navigation sequence
  const tabControllersRef = React.useRef(new Map<string, AbortController>());
  const tabCounterRef = React.useRef(1);
  const intervalsRef = React.useRef<Set<number>>(new Set());
  const timeoutsRef = React.useRef<Set<number>>(new Set());
  const autoDemoRef = React.useRef(false);

  // Clear all timers/intervals on unmount. (Fetches are deliberately left to
  // settle — their completion is a no-op on an unmounted tree.)
  React.useEffect(() => {
    const intervals = intervalsRef.current;
    const timeouts = timeoutsRef.current;
    return () => {
      intervals.forEach((id) => window.clearInterval(id));
      timeouts.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const navigate = React.useCallback(
    (input: string, tabIdParam?: string, opts?: { pushHistory?: boolean }) => {
      const target = input.trim();
      if (!target) return;
      const tabId = tabIdParam ?? activeIdRef.current;
      const pushHistory = opts?.pushHistory !== false;

      setNavKey((k) => k + 1);
      setLoadingBlocked(0);

      setTabs((prev) =>
        prev.map((t) => {
          if (t.id !== tabId) return t;
          const history = pushHistory
            ? [...t.history.slice(0, t.historyIndex + 1), target]
            : t.history;
          const historyIndex = pushHistory ? history.length - 1 : t.historyIndex;
          return {
            ...t,
            status: "loading" as const,
            url: target,
            title: truncateText(target, 24),
            page: null,
            error: undefined,
            history,
            historyIndex,
          };
        }),
      );
      setAddress(target);

      // Stale-response guard: only the newest navigation per tab may commit.
      const seq = (seqRef.current.get(tabId) ?? 0) + 1;
      seqRef.current.set(tabId, seq);
      const prevController = tabControllersRef.current.get(tabId);
      if (prevController) prevController.abort();
      const controller = new AbortController();
      tabControllersRef.current.set(tabId, controller);

      // Live blocking ticker (interim plausible target until real data lands).
      const interimTarget = Math.min(24, 8 + target.length);
      const interval = window.setInterval(() => {
        setLoadingBlocked((prev) => {
          if (prev >= interimTarget) return prev;
          return prev + Math.max(1, Math.ceil(Math.random() * 3));
        });
      }, TICKER_MS);
      intervalsRef.current.add(interval);

      const abortTimer = window.setTimeout(() => controller.abort(), NAV_ABORT_MS);
      timeoutsRef.current.add(abortTimer);

      const startedAt = Date.now();

      const finish = () => {
        window.clearInterval(interval);
        intervalsRef.current.delete(interval);
        window.clearTimeout(abortTimer);
        timeoutsRef.current.delete(abortTimer);
      };

      fetch("/api/browse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target }),
        signal: controller.signal,
      })
        .then(async (res) => {
          const data = (await res.json()) as BrowseResponse | BrowseError;
          const wait = Math.max(0, MIN_LOAD_MS - (Date.now() - startedAt));
          const commitTimer = window.setTimeout(() => {
            timeoutsRef.current.delete(commitTimer);
            finish();
            if ((seqRef.current.get(tabId) ?? 0) !== seq) return; // stale
            if (data.ok) {
              const page = data.page;
              setTabs((prev) =>
                prev.map((t) =>
                  t.id === tabId
                    ? {
                        ...t,
                        status: "ready" as const,
                        url: page.url,
                        title: truncateText(page.title, 24),
                        hue: page.hue,
                        page,
                        error: undefined,
                      }
                    : t,
                ),
              );
              setAddress(page.url);
              setSession((prev) => ({
                pages: prev.pages + 1,
                blocked: prev.blocked + page.totalBlocked,
                ads: prev.ads + page.adsRemoved,
                dataKb: prev.dataKb + page.dataSavedKb,
              }));
            } else {
              setTabs((prev) =>
                prev.map((t) =>
                  t.id === tabId
                    ? { ...t, status: "error" as const, error: data.error, page: null }
                    : t,
                ),
              );
            }
            setLoadingBlocked(0);
          }, wait);
          timeoutsRef.current.add(commitTimer);
        })
        .catch((err: unknown) => {
          finish();
          if ((seqRef.current.get(tabId) ?? 0) !== seq) return; // stale
          if (err instanceof DOMException && err.name === "AbortError") return;
          // Static-hosting fallback (GitHub Pages has no server API):
          // build the simulated page locally so the demo keeps working.
          try {
            const page = buildPage(target);
            setTabs((prev) =>
              prev.map((t) =>
                t.id === tabId
                  ? {
                      ...t,
                      status: "ready" as const,
                      url: page.url,
                      title: truncateText(page.title, 24),
                      hue: page.hue,
                      page,
                      error: undefined,
                    }
                  : t,
              ),
            );
            setAddress(page.url);
            setSession((prev) => ({
              pages: prev.pages + 1,
              blocked: prev.blocked + page.totalBlocked,
              ads: prev.ads + page.adsRemoved,
              dataKb: prev.dataKb + page.dataSavedKb,
            }));
          } catch {
            setTabs((prev) =>
              prev.map((t) =>
                t.id === tabId ? { ...t, status: "error" as const, error: "unexpected", page: null } : t,
              ),
            );
          }
          setLoadingBlocked(0);
        });
    },
    [],
  );

  // Auto-demo: run once when the section scrolls into view.
  React.useEffect(() => {
    if (!inView || autoDemoRef.current) return;
    autoDemoRef.current = true;
    const t = tabsRef.current.find((x) => x.id === activeIdRef.current);
    if (t && t.status === "idle") navigate("wikipedia.org", t.id);
  }, [inView, navigate]);

  const reload = React.useCallback(() => {
    navigate(activeTab.url, activeTab.id, { pushHistory: false });
  }, [navigate, activeTab.url, activeTab.id]);

  const goBack = () => {
    const t = activeTab;
    if (t.historyIndex <= 0) return;
    const idx = t.historyIndex - 1;
    setTabs((prev) => prev.map((x) => (x.id === t.id ? { ...x, historyIndex: idx } : x)));
    navigate(t.history[idx], t.id, { pushHistory: false });
  };

  const goForward = () => {
    const t = activeTab;
    if (t.historyIndex >= t.history.length - 1) return;
    const idx = t.historyIndex + 1;
    setTabs((prev) => prev.map((x) => (x.id === t.id ? { ...x, historyIndex: idx } : x)));
    navigate(t.history[idx], t.id, { pushHistory: false });
  };

  const newTab = () => {
    tabCounterRef.current += 1;
    const id = `tab-${tabCounterRef.current}`;
    setTabs((prev) => [...prev, makeTab(id)]);
    setActiveId(id);
    setAddress("");
  };

  const closeTab = (id: string) => {
    if (tabs.length <= 1) return; // always keep at least one tab
    const idx = tabs.findIndex((t) => t.id === id);
    const next = tabs.filter((t) => t.id !== id);
    setTabs(next);
    if (id === activeId) {
      const fallback = next[Math.min(Math.max(idx, 0), next.length - 1)];
      setActiveId(fallback.id);
      setAddress(fallback.status === "idle" ? "" : fallback.url);
    }
  };

  const switchTab = (id: string) => {
    setActiveId(id);
    const t = tabs.find((x) => x.id === id);
    setAddress(t ? (t.status === "idle" ? "" : t.url) : "");
  };

  const iconBtn =
    "flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-white/5 hover:text-foreground disabled:pointer-events-none disabled:opacity-40";

  return (
    <section ref={sectionRef} id="demo" className="relative scroll-mt-24 py-20 md:py-28">
      <div
        aria-hidden="true"
        className="grid-bg pointer-events-none absolute inset-x-0 top-0 h-48 opacity-70 [mask-image:linear-gradient(to_bottom,black,transparent)]"
      />

      <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-block rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
            تجربة حيّة
          </span>
          <h2 className="mt-4 text-3xl font-extrabold md:text-5xl">
            جرّب <span className="text-gradient">برق</span> الآن — من داخل متصفحك
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground md:text-base">
            اكتب أي عنوان أو كلمة بحث، وشاهد درع الخصوصية يعمل لحظة بلحظة. هذه نافذة حقيقية من متصفح برق.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {/* Browser window */}
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/70 glow-emerald lg:col-span-2">
            {/* Title bar + tabs */}
            <div className="flex items-end gap-2 border-b border-white/5 bg-black/30 px-3 pt-2">
              <div className="flex shrink-0 items-center gap-1.5 pb-3" aria-hidden="true">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
              </div>
              <div className="flex flex-1 items-end gap-1 overflow-x-auto pt-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {tabs.map((t) => {
                  const active = t.id === activeId;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => switchTab(t.id)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex max-w-40 shrink-0 items-center gap-2 rounded-t-lg px-3 py-2 text-xs transition-colors",
                        active
                          ? "border border-b-0 border-white/10 bg-white/8 text-foreground"
                          : "text-muted-foreground hover:text-foreground/80",
                      )}
                    >
                      {t.status === "idle" && !t.url ? (
                        <Globe className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      ) : (
                        <span
                          aria-hidden="true"
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ background: `hsl(${t.hue} 55% 45%)` }}
                        />
                      )}
                      <span className="truncate">{t.title || "تبويب جديد"}</span>
                      {active && tabs.length > 1 && (
                        <span
                          role="button"
                          tabIndex={0}
                          aria-label="إغلاق التبويب"
                          onClick={(e) => {
                            e.stopPropagation();
                            closeTab(t.id);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              e.stopPropagation();
                              closeTab(t.id);
                            }
                          }}
                          className="-me-0.5 rounded p-0.5 hover:bg-white/10"
                        >
                          <X className="h-3 w-3" aria-hidden="true" />
                        </span>
                      )}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={newTab}
                  aria-label="تبويب جديد"
                  className="mb-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Navigation row */}
            <div className="flex items-center gap-1.5 border-b border-white/5 px-3 py-2.5">
              <button
                type="button"
                onClick={goBack}
                disabled={activeTab.historyIndex <= 0}
                aria-label="رجوع"
                className={iconBtn}
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={goForward}
                disabled={activeTab.historyIndex >= activeTab.history.length - 1}
                aria-label="تقدّم"
                className={iconBtn}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={reload}
                disabled={!activeTab.url || activeTab.status === "loading"}
                aria-label="تحديث الصفحة"
                className={iconBtn}
              >
                <RotateCw
                  className={cn("h-4 w-4", activeTab.status === "loading" && "animate-spin")}
                  aria-hidden="true"
                />
              </button>

              <div className="flex flex-1 items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3.5 py-1.5">
                <Lock className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden="true" />
                <input
                  dir="ltr"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      navigate(address);
                    }
                  }}
                  placeholder="اكتب عنوانًا أو كلمة بحث…"
                  aria-label="شريط العنوان"
                  className="w-full flex-1 bg-transparent font-mono text-xs text-foreground/90 outline-none placeholder:text-muted-foreground/60"
                />
                <span
                  title="إجمالي الطلبات المحجوبة في جلستك"
                  className="flex shrink-0 items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] text-emerald-300"
                >
                  <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                  <span dir="ltr" className="font-display">{session.blocked}</span>
                </span>
              </div>
            </div>

            {/* Viewport */}
            <div className={cn("relative min-h-[520px]", activeTab.status === "ready" && "bg-[#0e1513]")}>
              {/* Loading progress bar (RTL: grows from the right) */}
              {activeTab.status === "loading" && (
                <div className="absolute inset-x-0 top-0 z-20 h-0.5 overflow-hidden bg-white/5">
                  <motion.div
                    key={navKey}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.9, ease: "easeInOut" }}
                    className="h-full w-full origin-right bg-emerald-400"
                  />
                </div>
              )}

              {/* Idle: Barq start page */}
              {activeTab.status === "idle" && (
                <div className="flex min-h-[520px] flex-col items-center justify-center gap-5 px-6 text-center">
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col items-center gap-5"
                  >
                    <span className="glow-emerald flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-400">
                      <Zap className="h-7 w-7" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="text-lg font-bold md:text-xl">
                        صفحة بداية نظيفة <span dir="ltr" className="font-display">100%</span>
                      </h3>
                      <p className="mt-1.5 text-sm text-muted-foreground">
                        بلا إعلانات، بلا بصمة، بلا انتظار.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {START_CHIPS.map((c) => (
                        <button
                          key={c.label}
                          type="button"
                          onClick={() => navigate(c.target)}
                          className="cursor-pointer rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs text-foreground/80 transition hover:border-emerald-400/40 hover:text-emerald-300"
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                    <div dir="ltr" className="font-display text-xs tracking-wide text-muted-foreground/70">
                      85ms · 30MB · 3,512 rules
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Loading: shimmer skeleton + live blocking ticker */}
              {activeTab.status === "loading" && (
                <div className="flex min-h-[520px] flex-col items-center justify-center gap-6 px-6 md:px-10">
                  <div
                    role="status"
                    aria-live="polite"
                    className="flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-1.5 text-xs text-amber-300"
                  >
                    <Ban className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>
                      حُجب{" "}
                      <span dir="ltr" className="font-display font-bold">{loadingBlocked}</span>{" "}
                      طلب تتبّع حتى الآن…
                    </span>
                  </div>
                  <div className="w-full max-w-md space-y-3" aria-hidden="true">
                    <div className="shimmer h-10 rounded-full bg-white/[0.04]" />
                    <div className="shimmer h-3 w-11/12 rounded-full bg-white/[0.04]" />
                    <div className="shimmer h-3 w-9/12 rounded-full bg-white/[0.04]" />
                    <div className="shimmer h-32 w-full rounded-2xl bg-white/[0.04]" />
                    <div className="grid grid-cols-3 gap-3">
                      <div className="shimmer h-16 rounded-xl bg-white/[0.04]" />
                      <div className="shimmer h-16 rounded-xl bg-white/[0.04]" />
                      <div className="shimmer h-16 rounded-xl bg-white/[0.04]" />
                    </div>
                  </div>
                </div>
              )}

              {/* Ready: clean page + HUD */}
              {activeTab.status === "ready" && activeTab.page && (
                <>
                  <MockPage page={activeTab.page} />
                  <motion.div
                    key={activeTab.page.url}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    dir="ltr"
                    className="absolute bottom-3 end-3 z-10 flex items-center gap-3 rounded-full border border-white/10 bg-black/60 px-4 py-2 font-display text-xs text-foreground/90 backdrop-blur"
                  >
                    <span className="flex items-center gap-1.5">
                      <MemoryStick className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                      {activeTab.page.ramMb}MB
                    </span>
                    <span className="text-white/20">·</span>
                    <span className="flex items-center gap-1.5">
                      <Timer className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
                      {activeTab.page.loadMs}ms
                    </span>
                  </motion.div>
                </>
              )}

              {/* Error */}
              {activeTab.status === "error" && (
                <div className="flex min-h-[520px] flex-col items-center justify-center gap-3 px-6 text-center">
                  <XCircle className="h-10 w-10 text-rose-400" aria-hidden="true" />
                  <h3 className="text-base font-bold">تعذّر تحميل الصفحة</h3>
                  <p className="max-w-sm text-sm leading-7 text-muted-foreground">
                    {activeTab.error === "invalid-url"
                      ? "تأكد من كتابة عنوان صحيح مثل wikipedia.org أو اكتب كلمة للبحث"
                      : "حدث خطأ غير متوقع. حاول مرة أخرى."}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={reload}
                    disabled={!activeTab.url}
                    className="mt-2 rounded-full border-white/15 bg-transparent hover:bg-white/5"
                  >
                    <RotateCw className="h-4 w-4" aria-hidden="true" />
                    إعادة المحاولة
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Side column */}
          <div className="flex flex-col gap-6">
            <PrivacyPanel
              page={activeTab.page}
              session={session}
              shieldOn={shieldOn}
              onShieldToggle={setShieldOn}
            />
            <AgentConsole onNavigate={(url) => navigate(url)} />
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          محاكاة تفاعلية تعمل محليًا في صفحتك — بنفس منطق الحجب المستخدم في تطبيق برق الفعلي.
        </p>
      </div>
    </section>
  );
}
