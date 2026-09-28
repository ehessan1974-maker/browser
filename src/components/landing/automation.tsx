"use client";

import { motion } from "framer-motion";
import {
  Bot,
  Boxes,
  BrainCircuit,
  Radio,
  Terminal,
  Webhook,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

type TerminalLine = { cmd: string; out: string };

const terminalLines: TerminalLine[] = [
  {
    cmd: "barq open https://example.com --stealth",
    out: "✓ page ready in 78ms · 12 trackers blocked · 29MB ram",
  },
  {
    cmd: "barq agent summarize --url https://news.example.com",
    out: "✓ clean DOM 142KB delivered · 0 ads · 0 trackers",
  },
  {
    cmd: "barq api serve --port 9090 --token $AGENT_TOKEN",
    out: "✓ http api ready on :9090 — awaiting agent commands",
  },
  {
    cmd: "barq block sync",
    out: "✓ 3,512 tracker rules updated — locally, no cloud",
  },
];

type DevFeature = {
  icon: LucideIcon;
  title: ReactNode;
  description: ReactNode;
};

const devFeatures: DevFeature[] = [
  {
    icon: Terminal,
    title: "واجهة CLI كاملة",
    description:
      "أوامر ذرّية لكل شيء: فتح، بحث، تلخيص، حجب — قابلة للتسلسل في أي سكربت.",
  },
  {
    icon: Webhook,
    title: (
      <span dir="ltr" className="font-display">
        HTTP API + Webhooks
      </span>
    ),
    description: (
      <>
        نتائج <span dir="ltr" className="font-display">JSON</span> منظّمة لكل
        عملية؛ تتكامل مع <span dir="ltr" className="font-display">n8n</span> و
        <span dir="ltr" className="font-display">Zapier</span> وأي وكيل مباشرة.
      </>
    ),
  },
  {
    icon: Radio,
    title: "أحداث لحظية",
    description: (
      <>
        مقابس <span dir="ltr" className="font-display">WebSocket</span> تبثّ
        أحداث التصفح لحظة بلحظة إلى وكلائك.
      </>
    ),
  },
];

type CompatChip = { icon: LucideIcon; label: ReactNode };

const compatChips: CompatChip[] = [
  {
    icon: Bot,
    label: (
      <>
        متوافق مع <span dir="ltr" className="font-display">MCP</span>
      </>
    ),
  },
  {
    icon: BrainCircuit,
    label: (
      <>
        <span dir="ltr" className="font-display">Function Calling</span> جاهز
      </>
    ),
  },
  {
    icon: Boxes,
    label: (
      <>
        واجهة شبيهة بـ{" "}
        <span dir="ltr" className="font-display">Playwright</span>
      </>
    ),
  },
];

export default function Automation() {
  return (
    <section id="automation" className="relative scroll-mt-24 py-20 md:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 grid-bg opacity-60 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_45%,black,transparent)]"
      />

      <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55 }}
          className="text-center"
        >
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
            للوكلاء والمطوّرين
          </span>
          <h2 className="mt-4 text-3xl font-extrabold leading-tight md:text-5xl">
            اللغة المفضّلة لوكلائك
          </h2>
          <p className="mx-auto mt-4 max-w-2xl leading-8 text-muted-foreground">
            صُمّم برق ليكون يدي وقدمي وكلاء الذكاء الاصطناعي: واجهة سطر أوامر
            كاملة، وHTTP API منظّم، ومقابس أحداث لحظية — كلها تعمل بنفس نواة
            الخصوصية.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="mt-12"
        >
          <div
            dir="ltr"
            className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b100f] text-start font-mono text-xs text-foreground shadow-2xl md:text-sm"
          >
            <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-rose-500/80" />
              <span className="h-3 w-3 rounded-full bg-amber-400/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
              <span className="ms-3 text-[10px] uppercase tracking-widest text-muted-foreground">
                barq — shell
              </span>
            </div>
            <div className="space-y-3 p-5 leading-6">
              {terminalLines.map((line) => (
                <div key={line.cmd}>
                  <p>
                    <span className="text-emerald-400">$</span>{" "}
                    <span className="text-foreground">{line.cmd}</span>
                  </p>
                  <p className="text-emerald-300/90">{line.out}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {devFeatures.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.article
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.55, delay: i * 0.08 }}
                className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6 transition hover:border-emerald-400/30 hover:bg-zinc-900/80"
              >
                <span className="w-fit rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-2">
                  <Icon aria-hidden="true" className="h-4 w-4 text-emerald-400" />
                </span>
                <h3 className="mt-4 text-base font-bold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {feature.description}
                </p>
              </motion.article>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55 }}
          className="mt-6 flex flex-wrap justify-center gap-2"
        >
          {compatChips.map((chip, i) => {
            const Icon = chip.icon;
            return (
              <span
                key={i}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs text-muted-foreground"
              >
                <Icon aria-hidden="true" className="h-3.5 w-3.5 text-emerald-300" />
                {chip.label}
              </span>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
