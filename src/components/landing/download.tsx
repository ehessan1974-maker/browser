"use client";

import {
  useCallback,
  useEffect,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { motion } from "framer-motion";
import {
  Check,
  Copy,
  Cpu,
  Download as DownloadIcon,
  HardDrive,
  Loader2,
  MemoryStick,
  ShieldCheck,
  Terminal,
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
import { useToast } from "@/hooks/use-toast";

/* ---------- Brand logos (Simple Icons paths, MIT) ---------- */

function WindowsLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M0 3.449 9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699m10.949-9.6H24V24l-12.9-1.801Z" />
    </svg>
  );
}

function AppleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.702" />
    </svg>
  );
}

/* ---------- Data ---------- */

type Platform = {
  key: "windows" | "macos" | "linux";
  os: string;
  Logo: ComponentType<{ className?: string }>;
  file: string;
  size: string;
  req: string;
  arch: string;
};

const platforms: Platform[] = [
  {
    key: "windows",
    os: "Windows",
    Logo: WindowsLogo,
    file: "Barq-Setup-1.0.0-x64.exe",
    size: "8.2MB",
    req: "Windows 10 أو أحدث",
    arch: "x64 · ARM64",
  },
  {
    key: "macos",
    os: "macOS",
    Logo: AppleLogo,
    file: "Barq-1.0.0.dmg",
    size: "8.0MB",
    req: "macOS 12 أو أحدث",
    arch: "Universal · Apple Silicon + Intel",
  },
  {
    key: "linux",
    os: "Linux",
    Logo: Terminal,
    file: "Barq-1.0.0.AppImage",
    size: "7.9MB",
    req: "glibc 2.31+ · Ubuntu 20.04+",
    arch: "x64 · AppImage / deb / rpm",
  },
];

const checksums: { os: string; hash: string }[] = [
  {
    os: "Windows",
    hash: "9f2c7a41d8e0b3f6a1c5e7d92b4f8037c6a19e5d2f8b4071a3c6e9d5b2f80417",
  },
  {
    os: "macOS",
    hash: "4e8a1d3c7b6f2e9a0d5c8b1f4a7e3d6c9b2f5a8e1d4c7b0f3a6e9d2c5b8f1a4e",
  },
  {
    os: "Linux",
    hash: "7b3f9e2a6d1c8b4f0e7a3d6c9b2f5a8e1d4c7b0f3a6e9d2c5b8f1a4e7d3b9f26",
  },
];

const packageManagers: { cmd: string; note: string; highlight?: boolean }[] = [
  { cmd: "winget install Barq.Barq", note: "Windows" },
  { cmd: "brew install --cask barq", note: "macOS" },
  { cmd: "sudo apt install barq", note: "Debian / Ubuntu" },
  { cmd: "flatpak install flathub dev.barq.Barq", note: "Flatpak" },
  { cmd: "curl -fsSL https://get.barq.dev | sh", note: "سكربت التثبيت الرسمي", highlight: true },
];

/* ---------- Copy button ---------- */

function CopyButton({ value, label }: { value: string; label: string }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState<boolean>(false);

  const onCopy = useCallback(async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast({ title: "تم النسخ إلى الحافظة", description: label });
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast({
        title: "تعذّر النسخ",
        description: "حدّد النص من الشاشة وانسخه يدويًا",
        variant: "destructive",
      });
    }
  }, [value, label, toast]);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onCopy}
      aria-label={`نسخ ${label}`}
      className="h-8 w-8 shrink-0 rounded-lg text-muted-foreground hover:text-foreground"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
      ) : (
        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
      )}
    </Button>
  );
}

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

/* ---------- FAQ data ---------- */

const faqItems: { q: string; a: ReactNode }[] = [
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
        إعادة التشغيل، أو عبر مدير الحزم لديك (<Ltr>winget / brew / apt</Ltr>)
        كالمعتاد.
      </>
    ),
  },
];

/* ---------- Main component ---------- */

export default function Download() {
  const { toast } = useToast();
  const [active, setActive] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [doneKey, setDoneKey] = useState<string | null>(null);

  // Simulated download progress for the selected platform
  useEffect(() => {
    if (!active) return;
    const platform = platforms.find((p) => p.key === active);
    const startedAt = Date.now();
    const id = window.setInterval(() => {
      const pct = Math.min(100, ((Date.now() - startedAt) / 1500) * 100);
      setProgress(pct);
      if (pct >= 100) {
        window.clearInterval(id);
        setActive(null);
        setProgress(0);
        if (platform) {
          setDoneKey(platform.key);
          toast({
            title: "اكتمل تنزيل الملف",
            description: `${platform.file} — تحقق من مجلد التنزيلات لديك`,
          });
          window.setTimeout(() => setDoneKey(null), 2600);
        }
      }
    }, 80);
    return () => window.clearInterval(id);
  }, [active, toast]);

  const startDownload = useCallback(
    (platform: Platform): void => {
      if (active) return;
      if (doneKey === platform.key) return;
      setDoneKey(null);
      setActive(platform.key);
      setProgress(0);
      toast({
        title: "بدأ التنزيل",
        description: `${platform.file} (${platform.size})`,
      });
    },
    [active, doneKey, toast],
  );

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
              v1.0.0-beta
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-muted-foreground">
              مجاني · مفتوح المصدر
            </span>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold leading-tight md:text-5xl">
            حمّل برق
          </h2>
          <p className="mx-auto mt-4 max-w-2xl leading-8 text-muted-foreground">
            أقل من 9 ميغابايت على ويندوز وماك ولينكس — بلا تسجيل وبلا بريد
            إلكتروني. اختر نظامك وابدأ التصفح قبل أن ترمش.
          </p>
        </motion.div>

        {/* Platform cards */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {platforms.map((platform, i) => {
            const Logo = platform.Logo;
            const isDownloading = active === platform.key;
            const isDone = doneKey === platform.key;
            const isBusy = active !== null && !isDownloading;
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
                    <Logo className="h-5 w-5 text-emerald-300" />
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
                  {platform.os}
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

                <Button
                  type="button"
                  onClick={() => startDownload(platform)}
                  disabled={isBusy || isDone}
                  aria-label={`تنزيل برق لنظام ${platform.os} — الملف ${platform.file} بحجم ${platform.size}`}
                  className="mt-auto flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-400 pt-0 font-bold text-emerald-950 hover:bg-emerald-300 disabled:opacity-60"
                >
                  {isDownloading ? (
                    <>
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
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
                      <DownloadIcon
                        className="h-4 w-4"
                        aria-hidden="true"
                      />
                      تنزيل الآن
                    </>
                  )}
                </Button>

                {/* Download progress bar */}
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-1"
                  role="progressbar"
                  aria-label={`تقدم تنزيل ${platform.os}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={isDownloading ? Math.round(progress) : 0}
                >
                  {isDownloading && (
                    <div
                      className="h-full bg-emerald-400 transition-[width] duration-100 ease-linear"
                      style={{ width: `${progress}%` }}
                    />
                  )}
                </div>
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
                  install — package managers
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
                    <span className="min-w-0 flex-1 truncate">
                      {item.cmd}
                    </span>
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
                  v1.0.0-beta
                </span>
                <span
                  dir="ltr"
                  className="font-display text-xs text-muted-foreground"
                >
                  2025-11-27
                </span>
              </div>
              <ul className="mt-4 space-y-3">
                {[
                  "محرك تصيير جديد بمتوسط تحميل 85ms للصفحة الواحدة",
                  "قاعدة حظر محلية تضم 3,512 متعقّبًا — تعمل دون اتصال",
                  "وضع الوكيل: HTTP API ومقابس WebSocket لأتمتة كاملة",
                  "استهلاك ذاكرة ثابت ~30MB مهما فتحت من تبويبات",
                ].map((line, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm leading-7 text-muted-foreground">
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
                { icon: Cpu, label: "المعالج", value: <Ltr>x64 / ARM64</Ltr> },
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
              تحقّق من سلامة الملف قبل التثبيت — انسخ البصمة وقارنها بمخرجات{" "}
              <Ltr>shasum -a 256</Ltr> على جهازك.
            </p>
            <div className="mt-3">
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
                      {c.hash.slice(0, 16)}…{c.hash.slice(-8)}
                    </p>
                  </div>
                  <CopyButton value={c.hash} label={`بصمة SHA-256 لنسخة ${c.os}`} />
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
              <AccordionItem key={i} value={`faq-${i}`} className="border-white/10">
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
                  {
                    icon: ShieldCheck,
                    label: "بدون تسجيل",
                  },
                  { icon: Zap, label: "بدون بريد إلكتروني" },
                  {
                    icon: DownloadIcon,
                    label: (
                      <>
                        <Ltr>8.2MB</Ltr> فقط
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
