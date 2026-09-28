"use client";

import { motion, type Variants } from "framer-motion";
import {
  Ban,
  Download,
  Eye,
  Gauge,
  Lock,
  MemoryStick,
  Play,
  ShieldCheck,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const BLOCKED_DOMAINS: readonly string[] = [
  "google-analytics.com",
  "doubleclick.net",
  "connect.facebook.net",
  "taboola.com",
  "hotjar.com",
  "scorecardresearch.com",
  "criteo.com",
  "adnxs.com",
  "clarity.ms",
  "outbrain.com",
  "mixpanel.com",
  "pagead2.googlesyndication.com",
];

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

export function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24"
    >
      {/* Background layers */}
      <div aria-hidden="true" className="grid-bg absolute inset-0" />
      <div
        aria-hidden="true"
        className="absolute -top-32 start-1/4 h-96 w-96 rounded-full bg-emerald-500/15 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-40 -end-24 h-80 w-80 rounded-full bg-amber-500/8 blur-[110px]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent"
      />

      <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Text column */}
          <motion.div variants={containerVariants} initial="hidden" animate="show">
            <motion.div
              variants={itemVariants}
              className="glass flex w-fit items-center gap-2 rounded-full px-4 py-1.5 text-xs"
            >
              <span className="relative flex h-2 w-2">
                <span className="ping-slow absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="text-muted-foreground">
                الإصدار{" "}
                <span
                  dir="ltr"
                  className="font-display font-semibold text-emerald-300"
                >
                  1.0
                </span>{" "}
                متاح الآن —{" "}
                <span dir="ltr" className="font-display">
                  Windows · macOS · Linux
                </span>
              </span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="mt-5 text-4xl font-extrabold leading-[1.2] tracking-tight sm:text-5xl md:text-6xl"
            >
              تصفّح <span className="text-gradient">أسرع</span>. أخفّ.
              <br />
              أكثر خصوصية. بلا انتظار.
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="mt-5 max-w-xl text-base leading-8 text-muted-foreground md:text-lg"
            >
              برق متصفح خفيف مصمّم لعصر الأتمتة ووكلاء الذكاء الاصطناعي: يُشغّل
              الصفحات في نحو{" "}
              <span
                dir="ltr"
                className="font-display font-semibold text-emerald-300"
              >
                85
              </span>{" "}
              مللي ثانية، ويستهلك{" "}
              <span
                dir="ltr"
                className="font-display font-semibold text-emerald-300"
              >
                30MB
              </span>{" "}
              فقط من الذاكرة، ويحجب أكثر من{" "}
              <span
                dir="ltr"
                className="font-display font-semibold text-emerald-300"
              >
                3,500
              </span>{" "}
              متعقّب قبل أن تكتمل الصفحة — بلا إعداد ولا تعقيد.
            </motion.p>

            <motion.div variants={itemVariants} className="mt-8 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="rounded-xl bg-emerald-400 font-bold text-emerald-950 hover:bg-emerald-300"
              >
                <a href="#download">
                  <Download className="h-4 w-4" aria-hidden="true" />
                  حمّل برق مجانًا
                </a>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-xl">
                <a href="#demo">
                  <Play className="h-4 w-4" aria-hidden="true" />
                  جرّبه مباشرة الآن
                </a>
              </Button>
            </motion.div>

            <motion.ul
              variants={itemVariants}
              className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground"
            >
              <li className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                بلا تتبّع ولا كوكيز
              </li>
              <li className="flex items-center gap-1.5">
                <Gauge className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                حجم التنزيل{" "}
                <span dir="ltr" className="font-display font-semibold">
                  8.2MB
                </span>
              </li>
              <li className="flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                مفتوح المصدر
              </li>
            </motion.ul>
          </motion.div>

          {/* Visual column — Barq browser mockup */}
          <motion.div variants={itemVariants} className="relative">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="glow-emerald relative rounded-2xl border border-white/10 bg-zinc-900/80 shadow-2xl"
            >
              {/* Floating badges */}
              <div className="glass absolute -top-4 -end-3 hidden items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs sm:flex">
                <MemoryStick
                  className="h-4 w-4 text-emerald-400"
                  aria-hidden="true"
                />
                <span dir="ltr" className="font-display font-semibold">
                  30MB RAM
                </span>
              </div>
              <div className="glass absolute -bottom-4 -start-3 hidden items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs sm:flex">
                <ShieldCheck
                  className="h-4 w-4 text-amber-400"
                  aria-hidden="true"
                />
                <span dir="ltr" className="font-display font-semibold text-amber-300">
                  3,512
                </span>
                <span>متعقّب محجوب</span>
              </div>

              {/* Title bar */}
              <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-rose-400/80" />
                <span className="h-3 w-3 rounded-full bg-amber-400/80" />
                <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
                <span className="ms-3 flex items-center gap-2 rounded-t-lg bg-white/5 px-3 py-1.5 text-[11px] text-muted-foreground">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ background: "hsl(160 60% 40%)" }}
                  />
                  <span dir="ltr" className="font-display">
                    wikipedia.org
                  </span>
                </span>
              </div>

              {/* Address row */}
              <div className="flex items-center gap-2 border-b border-white/5 px-4 py-2.5">
                <Lock
                  className="h-3.5 w-3.5 shrink-0 text-emerald-400"
                  aria-hidden="true"
                />
                <span
                  dir="ltr"
                  className="flex-1 truncate font-mono text-xs text-muted-foreground"
                >
                  https://ar.wikipedia.org/متصفح_الويب
                </span>
                <span className="flex shrink-0 items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] text-emerald-300">
                  <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                  <span dir="ltr" className="font-display">
                    12
                  </span>
                </span>
              </div>

              {/* Content area */}
              <div className="p-5">
                <div className="flex items-center gap-3">
                  <span
                    className="h-8 w-8 shrink-0 rounded-full"
                    style={{ background: "hsl(160 60% 40%)" }}
                  />
                  <div className="h-4 w-3/4 rounded bg-white/10" />
                </div>
                <div className="mt-4 space-y-2.5">
                  <div className="h-3 w-full rounded bg-white/5" />
                  <div className="h-3 w-11/12 rounded bg-white/5" />
                  <div className="h-3 w-full rounded bg-white/5" />
                  <div className="h-3 w-2/3 rounded bg-white/5" />
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] text-emerald-300">
                    <Timer className="h-3 w-3" aria-hidden="true" />
                    <span dir="ltr" className="font-display">
                      85ms
                    </span>
                  </span>
                  <span className="flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] text-emerald-300">
                    <MemoryStick className="h-3 w-3" aria-hidden="true" />
                    <span dir="ltr" className="font-display">
                      30MB
                    </span>
                  </span>
                </div>
                <div className="mt-4 flex h-14 items-center justify-center gap-2 rounded-lg border border-dashed border-rose-400/30 text-[10px] text-rose-300/70">
                  <Ban className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="line-through">مساحة إعلانية محجوبة</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Blocked-trackers marquee */}
        <div
          dir="ltr"
          aria-hidden="true"
          className="mask-x-fade mt-16 overflow-hidden"
        >
          <div className="marquee-track flex w-max whitespace-nowrap">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex items-center gap-10 pe-10">
                {BLOCKED_DOMAINS.map((domain) => (
                  <span
                    key={domain}
                    className="flex items-center gap-2 font-mono text-sm text-muted-foreground/80"
                  >
                    <Ban className="h-3.5 w-3.5 text-rose-400/70" />
                    <span className="line-through">{domain}</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
