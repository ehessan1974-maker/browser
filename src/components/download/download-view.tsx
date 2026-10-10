"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Download as DownloadIcon,
  FileCode,
  Globe,
  Info,
  Loader2,
  Lock,
  MemoryStick,
  ShieldBan,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/download/copy-button";
import { PlatformLogo } from "@/components/download/platform-logos";
import { useSimulatedDownload } from "@/components/download/use-simulated-download";
import {
  androidInstallSteps,
  BARQ_VERSION,
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

// ترتيب الخانات — ويندوز أولاً لأنه الأكثر طلباً
const GRID_ORDER: PlatformKey[] = ["windows", "android", "macos", "linux"];

// barq:// deep link: opens the installed app directly. If it is not
// installed, Chrome falls back to the encoded URL instead of erroring.
const BARQ_INTENT_URL =
  "intent://open#Intent;scheme=barq;package=com.ehessan1974.barq;S.browser_fallback_url=https%3A%2F%2Fehessan1974-maker.github.io%2Fbrowser%2F;end";

// Raw <a> tags ignore Next's basePath — prefix manually for GitHub Pages.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const homeHref = `${BASE_PATH}/`;
const RELEASE_URL = "https://github.com/ehessan1974-maker/browser/releases/tag/stable";

/* ---------- 1.4.6 — الشريط الحي: أحدث إصدار على جيت هاب ---------- */

// مقارنة إصدارات نمطية: هل a أحدث من b؟
function isNewerVersion(a: string, b: string): boolean {
  const pa = a.split(".").map((x) => parseInt(x, 10) || 0);
  const pb = b.split(".").map((x) => parseInt(x, 10) || 0);
  const n = Math.max(pa.length, pb.length);
  for (let i = 0; i < n; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d > 0;
  }
  return false;
}

/** يجلب version.json (نشره سير الأندرويد مع كل إصدار) — إن ظهر إصدار أحدث
 * من بيانات الصفحة، يُعرض شريط أخضر فوراً بروابط الإصدار الجديد.
 * هكذا تصل النسخ الجديدة إلى «مجلد التنزيل» فور اكتمالها دون انتظار. */
function useRemoteRelease() {
  const [version, setVersion] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    fetch(`${BASE_PATH}/version.json`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { version?: unknown } | null) => {
        if (alive && d && typeof d.version === "string") {
          setVersion(d.version);
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return version && isNewerVersion(version, BARQ_VERSION) ? version : null;
}

/* ---------- Small helpers ---------- */

function Ltr({ children }: { children: React.ReactNode }) {
  return (
    <span dir="ltr" className="font-display">
      {children}
    </span>
  );
}

/* ---------- Button label (shared states) ---------- */

function ButtonInner({
  isDownloading,
  isDone,
  progress,
  label,
}: {
  isDownloading: boolean;
  isDone: boolean;
  progress: number;
  label: string;
}) {
  if (isDownloading) {
    return (
      <>
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        جارٍ التنزيل{" "}
        <span dir="ltr" className="font-display">
          {Math.round(progress)}%
        </span>
      </>
    );
  }
  if (isDone) {
    return (
      <>
        <Check className="h-5 w-5" aria-hidden="true" />
        انطلق التنزيل — افحص شريط المتصفح
      </>
    );
  }
  return (
    <>
      <DownloadIcon className="h-5 w-5" aria-hidden="true" />
      {label}
    </>
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

  const isIOS = detected === "ios";
  const recommendedKey: PlatformKey | null =
    detected === "ios" || detected === "unknown" ? null : detected;
  const ordered = GRID_ORDER.map(
    (k) => platforms.find((p) => p.key === k)!,
  ).filter(Boolean);
  // 1.4.6 — إصدار أحدث على جيت هاب من الموجود في بيانات الصفحة؟
  const newerRelease = useRemoteRelease();

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
        <section className="relative overflow-hidden py-10 md:py-14">
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
            {/* Hero — مختصر، والخانات مباشرة تحته */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-emerald-400/25 bg-emerald-400/10 glow-emerald">
                <Zap className="h-8 w-8 text-emerald-300" aria-hidden="true" />
              </span>
              <h1 className="mt-5 text-3xl font-extrabold leading-tight sm:text-4xl">
                حمّل برق — اختر نظامك
              </h1>
              <p className="mx-auto mt-3 max-w-xl leading-8 text-muted-foreground">
                متصفح خفيف يحجب المتعقّبات — نسخ لـويندوز وأندرويد وماك ولينكس،
                والتنزيل يبدأ فوراً بضغطة واحدة.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <span
                  dir="ltr"
                  className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-display text-xs text-muted-foreground"
                >
                  v{BARQ_VERSION}-beta
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-muted-foreground">
                  مجاني · مفتوح المصدر
                </span>
              </div>
              {detected !== "unknown" && !isIOS && (
                <p className="mx-auto mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheck
                    className="h-4 w-4 shrink-0 text-emerald-400"
                    aria-hidden="true"
                  />
                  جهازك يعمل بنظام{" "}
                  <strong className="text-foreground">
                    {OS_LABELS[detected]}
                  </strong>{" "}
                  — خانته موسومة بـ«لجهازك»
                </p>
              )}
              {isIOS && (
                <p className="mx-auto mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Info
                    className="h-4 w-4 shrink-0 text-amber-400"
                    aria-hidden="true"
                  />
                  جهازك <strong className="text-foreground">iOS</strong> — برق
                  لأندرويد وسطح المكتب، ونسخة iOS قريباً. حمّل الـAPK وأرسله
                  لجهاز أندرويد:
                </p>
              )}
            </motion.div>

            {/* 1.4.6 — شريط الإصدار الأحدث: يظهر فور توفر نسخة أحدث على جيت هاب */}
            {newerRelease && (
              <motion.a
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                href={RELEASE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mx-auto mt-5 flex w-fit max-w-full items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:border-emerald-400/50 hover:bg-emerald-400/15"
              >
                <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  صدر إصدار أحدث: برق{" "}
                  <span dir="ltr" className="font-display">
                    {newerRelease}
                  </span>{" "}
                  — ملفاته على صفحة الإصدارات في جيت هاب الآن
                </span>
                <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
              </motion.a>
            )}

            {/* خانات التنزيل — أعلى الصفحة مباشرة */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="mt-8 grid gap-4 sm:grid-cols-2"
            >
              {ordered.map((platform) => {
                const isDownloading = activeKey === platform.key;
                const isDone = doneKey === platform.key;
                const isRecommended = recommendedKey === platform.key;
                const secKey = `${platform.key}-x32`;
                const secDownloading = activeKey === secKey;
                const secDone = doneKey === secKey;
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
                    <div className="flex items-start justify-between gap-3">
                      <span className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-2.5">
                        <PlatformLogo
                          kind={platform.logo}
                          className="h-5 w-5 text-emerald-300"
                        />
                      </span>
                      <span
                        dir="ltr"
                        className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5 font-display text-[10px] text-muted-foreground"
                      >
                        {platform.arch}
                      </span>
                    </div>
                    <h2
                      dir="ltr"
                      className="mt-3 font-display text-lg font-extrabold"
                    >
                      {platform.osLatin}
                    </h2>
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

                    {/* الزر الرئيسي — تنزيل حقيقي */}
                    <Button
                      type="button"
                      onClick={() => start(platform)}
                      disabled={isBusy || isDone}
                      aria-label={`تنزيل برق لنظام ${platform.os} — الملف ${platform.file} بحجم ${platform.size}`}
                      className="mt-4 flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-400 font-bold text-emerald-950 hover:bg-emerald-300 disabled:opacity-60"
                    >
                      <ButtonInner
                        isDownloading={isDownloading}
                        isDone={isDone}
                        progress={progress}
                        label={
                          platform.key === "android"
                            ? "تنزيل APK"
                            : `تنزيل ${platform.arch.startsWith("x64") ? "64-bit" : ""}`.trim()
                        }
                      />
                    </Button>

                    {/* زر 32-bit الحقيقي لويندوز */}
                    {platform.secondary && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          start({
                            key: secKey,
                            file: platform.secondary!.file,
                            size: platform.secondary!.size,
                            url: platform.secondary!.url,
                          })
                        }
                        disabled={isBusy || secDone}
                        aria-label={`تنزيل برق 32-bit — الملف ${platform.secondary.file} بحجم ${platform.secondary.size}`}
                        className="mt-2 flex h-10 items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-transparent font-bold text-emerald-300 hover:bg-emerald-400/10 disabled:opacity-60"
                      >
                        <ButtonInner
                          isDownloading={secDownloading}
                          isDone={secDone}
                          progress={progress}
                          label={platform.secondary.label}
                        />
                      </Button>
                    )}

                    {/* نسخ ويندوز 7 — روابط صغيرة */}
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

                    {/* تنبيه حظر كروم — داخل خانة ويندوز فقط */}
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

                    {/* فتح برق مباشرة على أندرويد */}
                    {platform.key === "android" && detected === "android" && (
                      <p className="mt-3 text-center">
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

                    {/* Progress bars */}
                    {(isDownloading || secDownloading) && (
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
            </motion.div>

            {/* 1.4.5 — نسخة برق الخفيفة (HTML): تفتح من أي متصفح حتى القديم */}
            <motion.a
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.15 }}
              href={`${BASE_PATH}/light.html`}
              className="mt-4 flex items-center gap-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4 transition hover:border-emerald-400/40 hover:bg-emerald-400/10 sm:p-5"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-400/25 bg-emerald-400/10">
                <FileCode className="h-5 w-5 text-emerald-300" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-foreground sm:text-base">
                  بدون تثبيت — نسخة برق الخفيفة (HTML)
                </span>
                <span className="mt-1 block text-xs leading-6 text-muted-foreground">
                  ملف واحد يفتح من أي متصفح كان، حتى الأقدم منها — بحث سريع،
                  روابط فورية، وروابط تحميل برق كلها بداخله
                </span>
              </span>
              <ArrowLeft
                className="h-4 w-4 shrink-0 text-emerald-300"
                aria-hidden="true"
              />
            </motion.a>

            {/* خطوات تثبيت أندرويد */}
            <motion.ol
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55 }}
              className="mt-8 grid gap-3 sm:grid-cols-3"
            >
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
            </motion.ol>

            {/* Trust strip */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55 }}
              className="mt-10 flex flex-wrap items-center justify-center gap-2"
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
              v{BARQ_VERSION}-beta
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
