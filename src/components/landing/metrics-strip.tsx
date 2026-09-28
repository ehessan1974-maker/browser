"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  MemoryStick,
  ShieldCheck,
  Timer,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { StatsResponse } from "@/lib/barq-types";

interface Metric {
  icon: LucideIcon;
  value: number;
  prefix: string;
  suffix: string;
  label: string;
  decimals: 0 | 1;
  grouped: boolean;
}

const METRICS: readonly Metric[] = [
  {
    icon: Timer,
    value: 85,
    prefix: "",
    suffix: "ms",
    label: "متوسط تحميل الصفحة",
    decimals: 0,
    grouped: false,
  },
  {
    icon: MemoryStick,
    value: 30,
    prefix: "",
    suffix: "MB",
    label: "استهلاك الذاكرة عند التشغيل",
    decimals: 0,
    grouped: false,
  },
  {
    icon: ShieldCheck,
    value: 3512,
    prefix: "",
    suffix: "+",
    label: "متعقّب محجوب تلقائيًا",
    decimals: 0,
    grouped: true,
  },
  {
    icon: Zap,
    value: 0.8,
    prefix: "<",
    suffix: "s",
    label: "زمن التشغيل البارد",
    decimals: 1,
    grouped: false,
  },
];

/** Animated count-up driven by requestAnimationFrame with easeOutCubic easing. */
function useCountUp(target: number, start: boolean, duration = 1600): number {
  const [value, setValue] = useState<number>(0);

  useEffect(() => {
    if (!start) return;
    let rafId = 0;
    const startTime = performance.now();
    const tick = (now: number): void => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setValue(target * eased);
      if (progress < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, start, duration]);

  return value;
}

function formatMetricValue(raw: number, metric: Metric): string {
  if (metric.decimals > 0) return raw.toFixed(metric.decimals);
  const rounded = Math.round(raw);
  return metric.grouped ? rounded.toLocaleString("en-US") : String(rounded);
}

function isStatsResponse(data: unknown): data is StatsResponse {
  if (typeof data !== "object" || data === null) return false;
  const record = data as Record<string, unknown>;
  return (
    typeof record.trackersInDB === "number" &&
    typeof record.totalBlocked === "number" &&
    typeof record.pagesServed === "number" &&
    typeof record.avgLoadMs === "number" &&
    typeof record.avgRamMb === "number"
  );
}

function MetricCard({
  metric,
  start,
}: {
  metric: Metric;
  start: boolean;
}): React.JSX.Element {
  const current = useCountUp(metric.value, start);
  const formatted = formatMetricValue(current, metric);
  const Icon = metric.icon;

  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-zinc-900/60 p-6 text-center">
      <span className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-2.5">
        <Icon className="h-5 w-5 text-emerald-400" aria-hidden="true" />
      </span>
      <p dir="ltr" className="flex items-baseline justify-center">
        {metric.prefix !== "" && (
          <span className="font-display text-lg text-emerald-400">
            {metric.prefix}
          </span>
        )}
        <span className="font-display text-3xl font-bold text-foreground md:text-4xl">
          {formatted}
        </span>
        <span className="font-display text-lg text-emerald-400">
          {metric.suffix}
        </span>
      </p>
      <p className="text-sm text-muted-foreground">{metric.label}</p>
    </div>
  );
}

export function MetricsStrip() {
  const gridRef = useRef<HTMLDivElement | null>(null);
  const inView = useInView(gridRef, { once: true, margin: "-60px" });
  const [stats, setStats] = useState<StatsResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      try {
        const res = await fetch("/api/stats", { cache: "no-store" });
        if (!res.ok) return;
        const data: unknown = await res.json();
        if (!cancelled && isStatsResponse(data)) setStats(data);
      } catch {
        // Silently ignore network errors — the live line simply stays hidden.
      }
    };
    void load();
    const intervalId = window.setInterval(() => {
      void load();
    }, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <section className="border-y border-white/5 bg-white/[0.02] py-14">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div ref={gridRef} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {METRICS.map((metric) => (
            <MetricCard key={metric.label} metric={metric} start={inView} />
          ))}
        </div>

        {stats !== null && (
          <div
            aria-live="polite"
            className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground"
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="ping-slow absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <p>
              مباشر —{" "}
              <span
                dir="ltr"
                className="font-display font-semibold text-foreground/80"
              >
                {stats.pagesServed.toLocaleString("en-US")}
              </span>{" "}
              صفحة قُدّمت عبر شبكة برق هذا اليوم، بمتوسط{" "}
              <span
                dir="ltr"
                className="font-display font-semibold text-foreground/80"
              >
                {stats.avgLoadMs}ms
              </span>{" "}
              — أكثر من{" "}
              <span
                dir="ltr"
                className="font-display font-semibold text-foreground/80"
              >
                {stats.trackersInDB.toLocaleString("en-US")}
              </span>{" "}
              قاعدة حظر
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default MetricsStrip;
