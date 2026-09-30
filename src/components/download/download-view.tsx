"use client";

import { useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Download as DownloadIcon,
  Globe,
  Info,
  Loader2,
  Lock,
  MemoryStick,
  ShieldBan,
  ShieldCheck,
  Smartphone,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/download/copy-button";
import { PlatformLogo } from "@/components/download/platform-logos";
import { useSimulatedDownload } from "@/components/download/use-simulated-download";
import {
  androidInstallSteps,
  checksums,
  platforms,
  type Platform,
  type PlatformKey,
} from "@/lib/download-data";

/* ---------- OS detection (client only) ---------- */

type DetectedOS = PlatformKey | "ios" | "unknown";

function detectOS(): DetectedOS {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return "android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Windows/i.test(ua)) return "windows";
  if (/Mac OS X|Macintosh/i.test(ua)) return "macos";
  if (/Linux/i.test(ua)) return "linux";
  return "unknown";
}

const OS_LABELS: Record<DetectedOS, string> = {
  android: "أندرويد",
  ios: "iOS",
  windows: "ويندوز",
  macos: "ماك",
  linux: "لينكس",
  unknown: "جهازك",
};

// Stable subscribe (UA never changes during a session) + server snapshot
const noopSubscribe = (): (() => void) => () => {};
const getServerOS = (): DetectedOS => "unknown";

/* ---------- Real download & deep-link targets ---------- */

// كل ملفات التثبيت الحقيقية منشورة على release المستقر (تبنيها CI)
// وتربطها data المنصات عبر platform.url.

// barq:// deep link: opens the installed app directly. If it is not
// installed, Chrome falls back to the encoded URL instead of erroring.
const BARQ_INTENT_URL =
  "intent://open#Intent;scheme=barq;package=com.ehessan1974.barq;S.browser_fallback_url=https%3A%2F%2Fehessan1974-maker.github.io%2Fbrowser%2F;end";

// Raw <a> tags ignore Next's basePath — prefix manually for GitHub Pages.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const homeHref = `${BASE_PATH}/`;

/* ---------- Small helpers ---------- */

function Ltr({ children }: { children: React.ReactNode }) {
  return (
    <span dir="ltr" className="font-display">
      {children}
    </span>
  );
}

/* ---------- Main view ---------- */

export function DownloadView() {
  const { activeKey, progress, doneKey, isBusy, start } =
    useSimulatedDownload();
  // Client-only UA detection without setState-in-effect (hydration-safe)
  const detected = useSyncExternalStore(
    noopSubscribe,
    detectOS,
    getServerOS,
  );

  const android = platforms[0];
  const isAndroidDownloading = activeKey === "android";
  const isAndroidDone = doneKey === "android";

  // The platform recommended for this device
  const recommendedKey: PlatformKey | null =
    detected === "ios" || detected === "unknown" ? null : detected;
  const recommended = recommendedKey
    ? platforms.find((p) => p.key === recommendedKey) ?? null
    : null;

  const isIOS = detected === "ios";

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-4 sm:px-6">
          <a
            href={homeHref}
            className="flex items-center gap-2.5"
            aria-label="برق — الصفحة الرئيسية"
          >
            <span className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-2">
              <Zap className="h-5 w-5 text-emerald-400" aria-hidden="true" />
            </span>
            <span className="text-lg font-extrabold">برق</span>
            <span
              dir="ltr"
              className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 font-display text-[10px] font-semibold text-emerald-300"
            >
              beta
            </span>
          </a>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <a href={homeHref}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              الموقع الرئيسي
            </a>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden py-12 md:py-16">
          {/* Background */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 grid-bg opacity-50 [mask-image:radial-gradient(ellipse_70%_50%_at_50%_0%,black,transparent)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 inset-x-0 mx-auto h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl"
          />

          <div className="relative mx-auto w-full max-w-4xl px-4 sm:px-6">
            {/* Hero */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-emerald-400/25 bg-emerald-400/10 glow-emerald">
                <PlatformLogo
                  kind="android"
                  className="h-10 w-10 text-emerald-300"
                />
              </span>
              <h1 className="mt-6 text-3xl font-extrabold leading-tight sm:text-4xl md:text-5xl">
                حمّل برق لأندرويد
              </h1>
              <p className="mx-auto mt-4 max-w-xl leading-8 text-muted-foreground">
                متصفح خفيف يفتح الصفحات في{" "}
                <Ltr>85ms</Ltr> ويحجب أكثر من{" "}
                <Ltr>3,500</Ltr> متعقّب — أقل من{" "}
                <Ltr>8MB</Ltr> ويعمل حتى على الأجهزة القديمة.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                <span
                  dir="ltr"
                  className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-display text-xs text-muted-foreground"
                >
                  v1.0.0-beta
                </span>
                <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                  <Smartphone className="h-3.5 w-3.5" aria-hidden="true" />
                  متوافق مع أندرويد <Ltr>4.0</Ltr> فما فوق
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-muted-foreground">
                  مجاني · مفتوح المصدر
                </span>
              </div>
            </motion.div>

            {/* Primary download card */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="relative mt-10 overflow-hidden rounded-3xl border border-emerald-400/25 bg-gradient-to-bl from-emerald-500/15 via-emerald-500/5 to-transparent p-6 md:p-8"
            >
              <div className="relative">
                {/* Detected OS hint */}
                {detected !== "unknown" && (
                  <p className="mb-4 flex items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                    {isIOS ? (
                      <>
                        <Info
                          className="h-4 w-4 shrink-0 text-amber-400"
                          aria-hidden="true"
                        />
                        جهازك يعمل بنظام{" "}
                        <strong className="text-foreground">iOS</strong> — برق
                        متوفر حاليًا لأندرويد وسطح المكتب، ونسخة iOS قريبًا.
                        حمّل الـ APK وأرسله لجهاز أندرويد:
                      </>
                    ) : (
                      <>
                        <ShieldCheck
                          className="h-4 w-4 shrink-0 text-emerald-400"
                          aria-hidden="true"
                        />
                        جهازك يعمل بنظام{" "}
                        <strong className="text-foreground">
                          {OS_LABELS[detected]}
                        </strong>{" "}
                        — النسخة المناسبة جاهزة:
                      </>
                    )}
                  </p>
                )}

                {/* File + action row */}
                <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-between">
                  <div className="flex items-center gap-3 text-center sm:text-start">
                    <span className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/25 bg-emerald-400/10 sm:flex">
                      <PlatformLogo
                        kind="android"
                        className="h-7 w-7 text-emerald-300"
                      />
                    </span>
                    <div>
                      <p
                        dir="ltr"
                        className="font-mono text-sm text-muted-foreground"
                      >
                        {android.file}
                      </p>
                      <p className="mt-0.5 text-sm">
                        <span
                          dir="ltr"
                          className="font-display font-bold text-emerald-300"
                        >
                          {android.size}
                        </span>{" "}
                        · حزمة <Ltr>APK</Ltr> مباشرة بلا متجر
                      </p>
                    </div>
                  </div>

                  <Button
                    asChild
                    disabled={isBusy || isAndroidDone}
                    aria-label={`تنزيل برق لأندرويد — الملف ${android.file} بحجم ${android.size}`}
                    className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-emerald-400 px-8 text-base font-extrabold text-emerald-950 hover:bg-emerald-300 disabled:opacity-60 sm:w-auto"
                  >
                    <a
                      href={android.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        if (!isBusy && !isAndroidDone) start(android);
                      }}
                    >
                      {isAndroidDownloading ? (
                        <>
                          <Loader2
                            className="h-5 w-5 animate-spin"
                            aria-hidden="true"
                          />
                          جارٍ التنزيل{" "}
                          <span dir="ltr" className="font-display">
                            {Math.round(progress)}%
                          </span>
                        </>
                      ) : isAndroidDone ? (
                        <>
                          <Check className="h-5 w-5" aria-hidden="true" />
                          اكتمل التنزيل — افتح الملف لتثبيته
                        </>
                      ) : (
                        <>
                          <DownloadIcon
                            className="h-5 w-5"
                            aria-hidden="true"
                          />
                          تنزيل لأندرويد
                        </>
                      )}
                    </a>
                  </Button>
                </div>

                {/* Deep link — users with برق installed open it directly, no browser */}
                {detected === "android" && (
                  <p className="mt-4 text-center">
                    <a
                      href={BARQ_INTENT_URL}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-300 underline-offset-4 transition hover:text-emerald-200 hover:underline"
                    >
                      <Smartphone
                        className="h-4 w-4"
                        aria-hidden="true"
                      />
                      عندك برق مثبّت؟ افتحه الآن مباشرة
                    </a>
                  </p>
                )}

                {/* Progress bar */}
                {isAndroidDownloading && (
                  <div
                    className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10"
                    role="progressbar"
                    aria-label="تقدم تنزيل برق لأندرويد"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(progress)}
                  >
                    <div
                      className="h-full rounded-full bg-emerald-400 transition-[width] duration-100 ease-linear"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}

                {/* Android install steps */}
                <ol className="mt-6 grid gap-3 sm:grid-cols-3">
                  {androidInstallSteps.map((step, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 rounded-2xl border border-white/5 bg-black/20 p-4"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-400/10 font-display text-sm font-bold text-emerald-300">
                        {i + 1}
                      </span>
                      <span className="text-sm leading-7 text-muted-foreground">
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </motion.div>

            {/* Other platforms */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55 }}
              className="mt-12"
            >
              <h2 className="text-center text-xl font-extrabold">
                متوفر أيضًا على أنظمة أخرى
              </h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {platforms.map((platform) => {
                  const isDownloading = activeKey === platform.key;
                  const isDone = doneKey === platform.key;
                  const isRecommended = recommendedKey === platform.key;
                  return (
                    <article
                      key={platform.key}
                      className={`relative flex flex-col overflow-hidden rounded-2xl border bg-zinc-900/60 p-5 transition ${
                        isRecommended
                          ? "border-emerald-400/40 shadow-[0_0_24px_rgb(16_185_129/0.15)]"
                          : "border-white/10 hover:border-emerald-400/30"
                      }`}
                    >
                      {isRecommended && (
                        <span className="absolute end-4 top-4 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-[10px] text-emerald-300">
                          لجهازك
                        </span>
                      )}
                      <span className="w-fit rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-2.5">
                        <PlatformLogo
                          kind={platform.logo}
                          className="h-5 w-5 text-emerald-300"
                        />
                      </span>
                      <h3
                        dir="ltr"
                        className="mt-3 font-display text-lg font-extrabold"
                      >
                        {platform.osLatin}
                      </h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {platform.req}
                      </p>
                      <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-white/5 bg-black/30 px-2.5 py-2">
                        <span
                          dir="ltr"
                          className="truncate font-mono text-[10px] text-muted-foreground"
                        >
                          {platform.file}
                        </span>
                        <span
                          dir="ltr"
                          className="shrink-0 font-display text-xs font-bold text-emerald-300"
                        >
                          {platform.size}
                        </span>
                      </div>
                      <Button
                        asChild
                        disabled={isBusy || isDone}
                        aria-label={`تنزيل برق لنظام ${platform.os} — الملف ${platform.file}`}
                        className="mt-4 flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-400 font-bold text-emerald-950 hover:bg-emerald-300 disabled:opacity-60"
                      >
                        <a
                          href={platform.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => {
                            if (!isBusy && !isDone) start(platform);
                          }}
                        >
                          {isDownloading ? (
                          <>
                            <Loader2
                              className="h-4 w-4 animate-spin"
                              aria-hidden="true"
                            />
                            <span dir="ltr" className="font-display">
                              {Math.round(progress)}%
                            </span>
                          </>
                        ) : isDone ? (
                          <>
                            <Check
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                            اكتمل
                          </>
                        ) : (
                          <>
                            <DownloadIcon
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                            تنزيل
                          </>
                        )}
                        </a>
                      </Button>

                      {platform.alts?.map((alt) => (
                        <a
                          key={alt.file}
                          href={alt.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground transition hover:text-emerald-300"
                          title={alt.file}
                        >
                          <DownloadIcon
                            className="h-3 w-3 shrink-0"
                            aria-hidden="true"
                          />
                          {alt.label}
                          <span dir="ltr" className="font-display">
                            ({alt.size})
                          </span>
                        </a>
                      ))}

                      {platform.key === "windows" && (
                        <p className="mt-3 rounded-md border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
                          إن حَظَر كروم التنزيل وظهر تحذير «اتصال غير آمن»:
                          اضغط <kbd className="font-display">Ctrl</kbd>+
                          <kbd className="font-display">J</kbd> لفتح التنزيلات
                          ثم زر <span className="text-amber-300">«الاحتفاظ»</span>{" "}
                          وأكّد بـ«الاحتفاظ على أي حال» — التحذير احترازي فقط
                          لأن الملف بلا توقيع رقمي، والرابط مشفّر بالكامل.
                        </p>
                      )}

                      {isDownloading && (
                        <div
                          className="absolute inset-x-0 bottom-0 h-1"
                          role="progressbar"
                          aria-label={`تقدم تنزيل ${platform.osLatin}`}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={Math.round(progress)}
                        >
                          <div
                            className="h-full bg-emerald-400 transition-[width] duration-100 ease-linear"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </motion.div>

            {/* Trust strip */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55 }}
              className="mt-12 flex flex-wrap items-center justify-center gap-2"
            >
              {[
                {
                  icon: Lock,
                  label: "بدون تسجيل أو بريد إلكتروني",
                },
                {
                  icon: ShieldBan,
                  label: (
                    <>
                      <Ltr>3,512</Ltr> متعقّب محجوب
                    </>
                  ),
                },
                {
                  icon: MemoryStick,
                  label: (
                    <>
                      ~<Ltr>30MB</Ltr> ذاكرة فقط
                    </>
                  ),
                },
                {
                  icon: Globe,
                  label: "قاعدة الحظر تعمل دون اتصال",
                },
              ].map((chip, i) => {
                const Icon = chip.icon;
                return (
                  <span
                    key={i}
                    className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs text-muted-foreground"
                  >
                    <Icon
                      className="h-3.5 w-3.5 text-emerald-300"
                      aria-hidden="true"
                    />
                    {chip.label}
                  </span>
                );
              })}
            </motion.div>

            {/* Checksums */}
            <motion.details
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mx-auto mt-10 w-full max-w-2xl rounded-2xl border border-white/10 bg-zinc-900/40"
            >
              <summary className="cursor-pointer select-none px-5 py-4 text-sm font-bold text-muted-foreground transition hover:text-foreground">
                بصمات <Ltr>SHA-256</Ltr> — للتحقق من سلامة الملفات
              </summary>
              <div className="border-t border-white/5 px-5 pb-4 pt-2">
                {checksums.map((c) => (
                  <div
                    key={c.os}
                    className="flex items-center justify-between gap-3 border-b border-white/5 py-2.5 last:border-0"
                  >
                    <div className="min-w-0">
                      <p
                        dir="ltr"
                        className="font-display text-sm font-bold"
                      >
                        {c.os}
                      </p>
                      <p
                        dir="ltr"
                        className="truncate font-mono text-[11px] text-muted-foreground"
                      >
                        {c.hash.slice(0, 20)}…{c.hash.slice(-10)}
                      </p>
                    </div>
                    <CopyButton
                      value={c.hash}
                      label={`بصمة SHA-256 لنسخة ${c.os}`}
                    />
                  </div>
                ))}
              </div>
            </motion.details>
          </div>
        </section>
      </main>

      {/* Footer — sticks to bottom on short screens */}
      <footer className="mt-auto border-t border-white/5 py-6">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center justify-between gap-3 px-4 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <p>
            © <Ltr>2025</Ltr> برق — متصفح خفيف للسرعة والخصوصية
          </p>
          <div className="flex items-center gap-4">
            <a
              href={homeHref}
              className="transition hover:text-emerald-300"
            >
              الصفحة الرئيسية
            </a>
            <span dir="ltr" className="font-display">
              v1.0.0-beta
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
