"use client";

import * as React from "react";
import { ArrowDownToLine, Ban, MemoryStick, ShieldCheck } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  TRACKER_CATEGORY_COLORS,
  TRACKER_CATEGORY_LABELS,
  type BrowsePage,
  type TrackerCategory,
} from "@/lib/barq-types";

export interface DemoSession {
  pages: number;
  blocked: number;
  ads: number;
  dataKb: number;
}

/** Local rAF count-up (easeOutCubic) — resumes from current value when target changes. */
function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = React.useState(0);
  const currentRef = React.useRef(0);

  React.useEffect(() => {
    const from = currentRef.current;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(from + (target - from) * eased);
      currentRef.current = next;
      setValue(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

interface PrivacyPanelProps {
  page: BrowsePage | null;
  session: DemoSession;
  shieldOn: boolean;
  onShieldToggle: (v: boolean) => void;
}

function SessionStat({ value, label }: { value: number; label: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white/[0.02] px-1 py-2">
      <div dir="ltr" className="font-display text-sm font-bold text-emerald-300">
        {value}
      </div>
      <div className="mt-0.5 text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

export default function PrivacyPanel({
  page,
  session,
  shieldOn,
  onShieldToggle,
}: PrivacyPanelProps) {
  const animatedBlocked = useCountUp(page?.totalBlocked ?? 0);

  const byCategory = React.useMemo(() => {
    if (!page) return [] as { category: TrackerCategory; count: number }[];
    const map = new Map<TrackerCategory, number>();
    for (const t of page.trackers) {
      map.set(t.category, (map.get(t.category) ?? 0) + t.requests);
    }
    return Array.from(map.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }, [page]);

  return (
    <div
      className={cn(
        "rounded-2xl border bg-zinc-900/60 p-5 transition-colors",
        shieldOn ? "border-white/10" : "border-amber-400/30",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
              shieldOn
                ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-400"
                : "border-amber-400/20 bg-amber-400/10 text-amber-400",
            )}
          >
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <div className="text-sm font-bold text-foreground">درع الخصوصية</div>
            <div className={cn("text-xs", shieldOn ? "text-emerald-300" : "text-amber-300")}>
              {shieldOn ? "الحماية مفعّلة — الحجب يعمل الآن" : "الحماية معطّلة — أنت معرّض للتتبّع"}
            </div>
          </div>
        </div>
        <Switch checked={shieldOn} onCheckedChange={onShieldToggle} aria-label="تفعيل الحماية" />
      </div>

      {/* Big animated number */}
      <div className="mt-5 rounded-2xl border border-white/5 bg-black/20 p-4 text-center">
        <span dir="ltr" className="font-display text-4xl font-bold text-emerald-300">
          {animatedBlocked}
        </span>
        <div className="mt-1 text-xs text-muted-foreground">طلب تتبّع حُجب في هذه الصفحة</div>
      </div>

      {/* Category breakdown */}
      {byCategory.length > 0 && (
        <div className="mt-4 space-y-2.5">
          {byCategory.map(({ category, count }) => {
            const pct =
              page && page.totalBlocked > 0
                ? Math.round((count / page.totalBlocked) * 100)
                : 0;
            return (
              <div key={category} className="flex items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className={cn("h-2 w-2 shrink-0 rounded-full", TRACKER_CATEGORY_COLORS[category])}
                />
                <span className="w-24 shrink-0 text-xs text-foreground/80">
                  {TRACKER_CATEGORY_LABELS[category]}
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                  <div
                    className={cn(
                      "h-full rounded-full transition-[width] duration-700 ease-out",
                      TRACKER_CATEGORY_COLORS[category],
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span
                  dir="ltr"
                  className="w-5 shrink-0 text-end font-display text-xs text-muted-foreground"
                >
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Tracker list */}
      {page && page.trackers.length > 0 && (
        <div className="mt-4 max-h-40 overflow-y-auto rounded-xl border border-white/5 bg-black/20 p-2">
          {page.trackers.map((t, i) => (
            <div
              key={`${t.name}-${i}`}
              className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 transition hover:bg-white/5"
            >
              <span dir="ltr" className="truncate font-mono text-xs text-foreground/75">
                {t.name}
              </span>
              <span
                dir="ltr"
                className="shrink-0 rounded-full bg-white/5 px-2 py-0.5 font-display text-[10px] text-muted-foreground"
              >
                {t.requests}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Footer stats */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
          <Ban className="mx-auto h-4 w-4 text-rose-400" aria-hidden="true" />
          <div dir="ltr" className="mt-1 font-display text-sm font-bold text-rose-300">
            {page?.adsRemoved ?? 0}
          </div>
          <div className="text-[10px] text-muted-foreground">إعلان أزيل</div>
        </div>
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
          <ArrowDownToLine className="mx-auto h-4 w-4 text-emerald-400" aria-hidden="true" />
          <div dir="ltr" className="mt-1 font-display text-sm font-bold text-emerald-300">
            {page?.dataSavedKb ?? 0}
          </div>
          <div className="text-[10px] text-muted-foreground">
            <span dir="ltr" className="font-display">KB</span> وُفّرت
          </div>
        </div>
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
          <MemoryStick className="mx-auto h-4 w-4 text-amber-400" aria-hidden="true" />
          <div dir="ltr" className="mt-1 font-display text-sm font-bold text-amber-300">
            {page ? `${page.ramMb}MB` : "0MB"}
          </div>
          <div className="text-[10px] text-muted-foreground">ذاكرة</div>
        </div>
      </div>

      {/* Session totals */}
      <div className="mt-4 border-t border-white/5 pt-4">
        <div className="mb-2 text-xs font-bold text-foreground/85">جلسة تصفحك</div>
        <div className="grid grid-cols-4 gap-2 text-center">
          <SessionStat value={session.pages} label="صفحات" />
          <SessionStat value={session.blocked} label="حُجب" />
          <SessionStat value={session.ads} label="إعلانات" />
          <SessionStat
            value={session.dataKb}
            label={
              <>
                <span dir="ltr" className="font-display">KB</span> وُفّرت
              </>
            }
          />
        </div>
      </div>
    </div>
  );
}
