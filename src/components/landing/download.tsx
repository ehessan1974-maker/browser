"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Cpu,
  Download as DownloadIcon,
  FileCode,
  HardDrive,
  Loader2,
  MemoryStick,
  ShieldCheck,
  Smartphone,
  WifiOff,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CopyButton } from "@/components/download/copy-button";
import { PlatformLogo } from "@/components/download/platform-logos";
import { useSimulatedDownload } from "@/components/download/use-simulated-download";
import {
  BARQ_VERSION,
  checksums,
  packageManagers,
  platforms,
  androidPlatform,
  type Platform,
} from "@/lib/download-data";
import { useToast } from "@/hooks/use-toast";

// Raw <a> tags ignore Next's basePath — prefix manually for GitHub Pages.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/* ---------- Small helpers ---------- */

function Ltr({ children }: { children: ReactNode }) {
  return (
    <span dir="ltr" className="font-display">
      {children}
    </span>
  );
}

function SectionCard({
  title,
  children,
  delay = 0,
}: {
  title: string;
  children: ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, delay }}
    >
      <div className="h-full rounded-2xl border border-white/10 bg-zinc-900/60 p-6">
        <h3 className="text-base font-bold">{title}</h3>
        {children}
      </div>
    </motion.div>
  );
}

/* ---------- Download button (shared look) ---------- */

function DownloadButton({
  platform,
  isDownloading,
  isDone,
  isBusy,
  progress,
  onStart,
  size = "sm",
}: {
  platform: Platform;
  isDownloading: boolean;
  isDone: boolean;
  isBusy: boolean;
  progress: number;
  onStart: (p: Platform) => void;
  size?: "sm" | "lg";
}) {
  return (
    <Button
      type="button"
      onClick={() => onStart(platform)}
      disabled={isBusy || isDone}
      aria-label={`تنزيل برق لنظام ${platform.os} — الملف ${platform.file} بحجم ${platform.size}`}
      className={`mt-auto flex h-11 items-center justify-center gap-2 rounded-xl font-bold disabled:opacity-60 ${
        size === "lg"
          ? "bg-emerald-400 px-8 text-base text-emerald-950 hover:bg-emerald-300"
          : "bg-emerald-400 text-emerald-950 hover:bg-emerald-300"
      }`}
    >
      {isDownloading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          جارٍ التنزيل{" "}
          <span dir="ltr" className="font-display">
            {Math.round(progress)}%
          </span>
        </>
      ) : isDone ? (
        <>
          <Check className="h-4 w-4" aria-hidden="true" />
          اكتمل التنزيل
        </>
      ) : (
        <>
          <DownloadIcon className="h-4 w-4" aria-hidden="true" />
          تنزيل الآن
        </>
      )}
    </Button>
  );
}

/* ---------- FAQ data ---------- */

const faqItems: { q: string; a: ReactNode }[] = [
  {
    q: "هل يعمل برق على أجهزة أندرويد القديمة؟",
    a: "نعم — نسخة أندرويد تعمل من أندرويد 4.0 فما فوق، وخفيفة بما يكفي للأجهزة الضعيفة: أقل من 8 ميغابايت للحزمة، ونحو 30MB من الذاكرة أثناء التصفح.",
  },
  {
    q: "هل برق مجاني فعلًا؟",
    a: "نعم — مجاني بالكامل ومرخّص برخصة MIT المفتوحة. لا حسابات، لا اشتراكات، ولا إعلانات داخل المتصفح نفسه.",
  },
  {
    q: "هل يدعم إضافات كروم؟",
    a: (
      <>
        يدعم الإضافات المتوافقة مع{" "}
        <Ltr>Manifest V3</Ltr> المثبّتة من متجر برق المحلي؛ أي إضافة تحاول
        جمع بيانات التصفح تُحجب تلقائيًا ولا تُسمح بتثبيتها أساسًا.
      </>
    ),
  },
  {
    q: "أين تُخزَّن بياناتي؟",
    a: "كل شيء محليًا على جهازك: السجل، الكوكيز، الجلسات، وقاعدة الحظر. لا يوجد أي حساب سحابي إجباري — مزامنة الأجهزة إن أردتها تعمل مشفّرة طرف-لطرف فقط.",
  },
  {
    q: "كيف يتم التحديث؟",
    a: (
      <>
        تحديثات دلتا صغيرة (~<Ltr>2MB</Ltr>) تُنزّل بالخلفية وتُطبَّق عند
        إعادة التشغيل، وعلى أندرويد عبر تحميل النسخة الجديدة من نفس صفحة
        التحميل.
      </>
    ),
  },
];

/* ---------- Main component ---------- */

export default function Download() {
  const { activeKey, progress, doneKey, isBusy, start } =
    useSimulatedDownload();

  const desktopPlatforms = platforms.filter((p) => p.key !== "android");

  return (
    <section id="download" className="relative scroll-mt-24 py-20 md:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 grid-bg opacity-50 [mask-image:radial-gradient(ellipse_65%_55%_at_50%_35%,black,transparent)]"
      />

      <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55 }}
          className="text-center"
        >
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
              صفحة التحميل
            </span>
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
          <h2 className="mt-4 text-3xl font-extrabold leading-tight md:text-5xl">
            حمّل برق
          </h2>
          <p className="mx-auto mt-4 max-w-2xl leading-8 text-muted-foreground">
            متصفح أندرويد الخفيف — أقل من 8 ميغابايت، متوافق مع أندرويد{" "}
            <Ltr>4.0</Ltr> فما فوق، ونسخ سطح مكتب أيضًا. بلا تسجيل وبلا بريد
            إلكتروني.
          </p>
        </motion.div>

        {/* Featured Android card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55 }}
          className="relative mt-12 overflow-hidden rounded-3xl border border-emerald-400/25 bg-gradient-to-bl from-emerald-500/15 via-emerald-500/5 to-transparent p-6 md:p-8"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-20 -start-20 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl"
          />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/25 bg-emerald-400/10">
              <PlatformLogo
                kind="android"
                className="h-8 w-8 text-emerald-300"
              />
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  dir="ltr"
                  className="font-display text-2xl font-extrabold"
                >
                  Android
                </h3>
                <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-0.5 text-xs text-emerald-300">
                  النسخة الأشهر
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {androidPlatform.req} · حزمة{" "}
                <Ltr>APK</Ltr> مباشرة بلا متجر
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  dir="ltr"
                  className="truncate rounded-lg border border-white/5 bg-black/30 px-2.5 py-1 font-mono text-[11px] text-muted-foreground"
                >
                  {androidPlatform.file}
                </span>
                <span
                  dir="ltr"
                  className="font-display text-sm font-bold text-emerald-300"
                >
                  {androidPlatform.size}
                </span>
              </div>
            </div>

            <div className="shrink-0">
              <DownloadButton
                platform={androidPlatform}
                isDownloading={activeKey === "android"}
                isDone={doneKey === "android"}
                isBusy={isBusy}
                progress={progress}
                onStart={start}
                size="lg"
              />
            </div>
          </div>

          {/* Download progress bar */}
          {activeKey === "android" && (
            <div
              className="absolute inset-x-0 bottom-0 h-1"
              role="progressbar"
              aria-label="تقدم تنزيل أندرويد"
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
        </motion.div>

        {/* 1.4.5 — نسخة برق الخفيفة (HTML): تفتح من أي متصفح حتى القديم */}
        <motion.a
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55 }}
          href={`${BASE_PATH}/light.html`}
          className="mt-4 flex items-center gap-4 rounded-2xl border border-white/10 bg-zinc-900/60 p-4 transition hover:border-emerald-400/40 hover:bg-zinc-900/80 sm:p-5"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-400/25 bg-emerald-400/10">
            <FileCode className="h-5 w-5 text-emerald-300" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold sm:text-base">
              بدون تثبيت — نسخة برق الخفيفة (HTML)
            </span>
            <span className="mt-1 block text-xs leading-6 text-muted-foreground">
              ملف واحد يفتح من أي متصفح كان — بحث وروابط سريعة وروابط تحميل برق
              بداخله
            </span>
          </span>
          <ArrowLeft className="h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
        </motion.a>

        {/* Desktop platform cards */}
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {desktopPlatforms.map((platform, i) => {
            const isDownloading = activeKey === platform.key;
            const isDone = doneKey === platform.key;
            return (
              <motion.article
                key={platform.key}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.55, delay: i * 0.08 }}
                className="relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 p-6 transition hover:border-emerald-400/30 hover:bg-zinc-900/80"
              >
                <div className="flex items-center justify-between gap-3">
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

                <h3
                  dir="ltr"
                  className="mt-4 font-display text-xl font-extrabold"
                >
                  {platform.osLatin}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {platform.req}
                </p>

                <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-black/30 px-3 py-2.5">
                  <span
                    dir="ltr"
                    className="truncate font-mono text-[11px] text-muted-foreground"
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

                <DownloadButton
                  platform={platform}
                  isDownloading={isDownloading}
                  isDone={isDone}
                  isBusy={isBusy}
                  progress={progress}
                  onStart={start}
                />

                {/* زر 32-bit الحقيقي — تنزيل فعلي من release */}
                {platform.secondary && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      start({
                        key: `${platform.key}-x32`,
                        file: platform.secondary!.file,
                        size: platform.secondary!.size,
                        url: platform.secondary!.url,
                      })
                    }
                    disabled={isBusy || doneKey === `${platform.key}-x32`}
                    aria-label={`تنزيل برق 32-bit — الملف ${platform.secondary.file}`}
                    className="mt-2 flex h-10 items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-transparent font-bold text-emerald-300 hover:bg-emerald-400/10 disabled:opacity-60"
                  >
                    {activeKey === `${platform.key}-x32` ? (
                      <>
                        <Loader2
                          className="h-4 w-4 animate-spin"
                          aria-hidden="true"
                        />
                        <span dir="ltr" className="font-display">
                          {Math.round(progress)}%
                        </span>
                      </>
                    ) : doneKey === `${platform.key}-x32` ? (
                      <>
                        <Check className="h-4 w-4" aria-hidden="true" />
                        انطلق التنزيل
                      </>
                    ) : (
                      <>
                        <DownloadIcon
                          className="h-4 w-4"
                          aria-hidden="true"
                        />
                        {platform.secondary.label}
                      </>
                    )}
                  </Button>
                )}

                {/* نسخ إضافية (ويندوز 7) — روابط حقيقية */}
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

                {/* Download progress bar */}
                {isDownloading && (
                  <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-1"
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
              </motion.article>
            );
          })}
        </div>

        {/* Package managers + Changelog */}
        <div className="mt-6 grid gap-6 lg:grid-cols-5">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55 }}
            className="lg:col-span-3"
          >
            <div
              dir="ltr"
              className="h-full overflow-hidden rounded-2xl border border-white/10 bg-[#0b100f] font-mono text-xs text-foreground shadow-2xl md:text-sm"
            >
              <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-rose-500/80" />
                <span className="h-3 w-3 rounded-full bg-amber-400/80" />
                <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
                <span className="ml-3 text-[10px] uppercase tracking-widest text-muted-foreground">
                  verify — checksum &amp; run
                </span>
              </div>
              <div className="divide-y divide-white/5">
                {packageManagers.map((item) => (
                  <div
                    key={item.cmd}
                    className={`flex items-center gap-3 px-4 py-2.5 ${
                      item.highlight ? "bg-emerald-400/5" : ""
                    }`}
                  >
                    <span className="text-emerald-400">$</span>
                    <span className="min-w-0 flex-1 truncate">{item.cmd}</span>
                    <span
                      dir="rtl"
                      className={`hidden shrink-0 rounded-full px-2 py-0.5 font-sans text-[10px] sm:inline ${
                        item.highlight
                          ? "border border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                          : "border border-white/10 text-muted-foreground"
                      }`}
                    >
                      {item.note}
                    </span>
                    <CopyButton value={item.cmd} label={item.cmd} />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <div className="lg:col-span-2">
            <SectionCard title="سجل الإصدارات" delay={0.08}>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span
                  dir="ltr"
                  className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 font-display text-sm font-bold text-emerald-300"
                >
                  v{BARQ_VERSION}-beta
                </span>
                <span
                  dir="ltr"
                  className="font-display text-xs text-muted-foreground"
                >
                  2026-10-10
                </span>
              </div>
              <ul className="mt-4 space-y-3">
                {[
                  "إشعار فوري من داخل البرنامج عند صدور أي تحديث جديد",
                  "فحص التحديثات كل 30 دقيقة — الخبر يصلك أسرع بكثير",
                  "تطبيق أندرويد ينبّهك عند كل فتح إن صدر إصدار أحدث",
                  "شريط حي في صفحة التنزيل يعرض أي إصدار جديد فور جهوزه",
                ].map((line, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-sm leading-7 text-muted-foreground"
                  >
                    <Check
                      className="mt-1.5 h-3.5 w-3.5 shrink-0 text-emerald-400"
                      aria-hidden="true"
                    />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          </div>
        </div>

        {/* Requirements + Checksums */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <SectionCard title="متطلبات النظام">
            <dl className="mt-4 space-y-3.5">
              {[
                {
                  icon: Smartphone,
                  label: "أندرويد",
                  value: (
                    <>
                      <Ltr>4.0+</Ltr> · حزمة <Ltr>APK</Ltr> مباشرة
                    </>
                  ),
                },
                {
                  icon: Cpu,
                  label: "سطح المكتب",
                  value: (
                    <>
                      <Ltr>x64 / ARM64</Ltr>
                    </>
                  ),
                },
                {
                  icon: MemoryStick,
                  label: "الذاكرة أثناء التصفح",
                  value: (
                    <>
                      ~<Ltr>30MB</Ltr> فقط
                    </>
                  ),
                },
                {
                  icon: HardDrive,
                  label: "مساحة التثبيت",
                  value: (
                    <>
                      <Ltr>120MB</Ltr> كحد أقصى
                    </>
                  ),
                },
                {
                  icon: WifiOff,
                  label: "الإنترنت",
                  value: "اختياري — قاعدة الحظر تعمل دون اتصال",
                },
              ].map((row, i) => {
                const Icon = row.icon;
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-4 border-b border-white/5 pb-3.5 last:border-0 last:pb-0"
                  >
                    <dt className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <Icon
                        className="h-4 w-4 shrink-0 text-emerald-300/80"
                        aria-hidden="true"
                      />
                      {row.label}
                    </dt>
                    <dd className="text-end text-sm font-bold">{row.value}</dd>
                  </div>
                );
              })}
            </dl>
          </SectionCard>

          <SectionCard title="المجاميع الاختبارية (SHA-256)" delay={0.08}>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              تحقّق من سلامة الملف قبل التثبيت — قارن البصمة بمخرجات{" "}
              <Ltr>shasum -a 256</Ltr> على جهازك.
            </p>
            <div className="mt-3 max-h-64 overflow-y-auto pe-1">
              {checksums.map((c) => (
                <div
                  key={c.os}
                  className="flex items-center justify-between gap-3 border-b border-white/5 py-2.5 last:border-0"
                >
                  <div className="min-w-0">
                    <p dir="ltr" className="font-display text-sm font-bold">
                      {c.os}
                    </p>
                    <p
                      dir="ltr"
                      className="truncate font-mono text-[11px] text-muted-foreground"
                    >
                      {c.hash.slice(0, 16)}…{c.hash.slice(-8)}
                    </p>
                  </div>
                  <CopyButton
                    value={c.hash}
                    label={`بصمة SHA-256 لنسخة ${c.os}`}
                  />
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55 }}
          className="mx-auto mt-14 w-full max-w-3xl"
        >
          <h3 className="text-center text-2xl font-extrabold">
            أسئلة قبل التنزيل
          </h3>
          <Accordion
            type="single"
            collapsible
            className="mt-6 rounded-2xl border border-white/10 bg-zinc-900/60 px-6"
          >
            {faqItems.map((item, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="border-white/10"
              >
                <AccordionTrigger className="text-start text-sm font-bold hover:text-emerald-300 hover:no-underline md:text-base">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-7 text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        {/* Final trust strip */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55 }}
          className="mt-14"
        >
          <div className="relative overflow-hidden rounded-3xl border border-emerald-400/25 bg-gradient-to-bl from-emerald-500/15 via-emerald-500/5 to-transparent p-8 text-center md:p-10">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-20 inset-x-0 mx-auto h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl"
            />
            <div className="relative">
              <h3 className="text-2xl font-extrabold md:text-3xl">
                جاهز تجرّب الفرق؟
              </h3>
              <p className="mt-3 leading-8 text-muted-foreground">
                ثلاثون ثانية من الآن، ستتصفح بسرعة برق.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {[
                  { icon: ShieldCheck, label: "بدون تسجيل" },
                  { icon: Zap, label: "بدون بريد إلكتروني" },
                  {
                    icon: DownloadIcon,
                    label: (
                      <>
                        <Ltr>8MB</Ltr> فقط
                      </>
                    ),
                  },
                ].map((chip, i) => {
                  const Icon = chip.icon;
                  return (
                    <span
                      key={i}
                      className="flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-4 py-1.5 text-xs text-muted-foreground"
                    >
                      <Icon
                        className="h-3.5 w-3.5 text-emerald-300"
                        aria-hidden="true"
                      />
                      {chip.label}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
