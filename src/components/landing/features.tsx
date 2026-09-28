"use client";

import { motion } from "framer-motion";
import {
  Bot,
  EyeOff,
  MemoryStick,
  ShieldCheck,
  Timer,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

type Feature = {
  icon: LucideIcon;
  title: ReactNode;
  description: ReactNode;
};

const features: Feature[] = [
  {
    icon: Zap,
    title: "تشغيل شبه فوري",
    description:
      "نواة خفيفة لا تحمّل مكوّنات غير ضرورية؛ يفتح برق في أقل من ثانية حتى على الأجهزة القديمة.",
  },
  {
    icon: Timer,
    title: (
      <>
        تحميل في{" "}
        <span dir="ltr" className="font-display font-semibold text-emerald-300">
          85
        </span>{" "}
        مللي ثانية
      </>
    ),
    description:
      "محرك عرض مبسّط وجلب ذكي للبيانات يقدّمان الصفحة قبل أن تكتمل رفّة العين.",
  },
  {
    icon: MemoryStick,
    title: (
      <>
        <span dir="ltr" className="font-display font-semibold text-emerald-300">
          30MB
        </span>{" "}
        من الذاكرة فقط
      </>
    ),
    description:
      "إدارة ذاكرة صارمة تُغلق العمليات الخاملة فورًا، فلا يستنزف المتصفح موارد جهازك.",
  },
  {
    icon: ShieldCheck,
    title: (
      <>
        أكثر من{" "}
        <span dir="ltr" className="font-display font-semibold text-emerald-300">
          3,500
        </span>{" "}
        متعقّب محجوب
      </>
    ),
    description:
      "قائمة حظر محدّثة باستمرار تعمل محليًا على جهازك وتحجب التتبّع قبل تحميله.",
  },
  {
    icon: EyeOff,
    title: "إعلانات وتحليلات تحت الصفر",
    description:
      "حجب شامل للإعلانات وأكواد التحليلات وبكسلات التتبّع قبل أن تُحمَّل أصلًا.",
  },
  {
    icon: Bot,
    title: "صديق الأتمتة والوكلاء",
    description: (
      <>
        واجهة <span dir="ltr" className="font-display">CLI</span> و
        <span dir="ltr" className="font-display">HTTP API</span> ومقابس أحداث
        جاهزة لوكلاء الذكاء الاصطناعي وتدفقات العمل الآلي.
      </>
    ),
  },
];

export default function Features() {
  return (
    <section id="features" className="relative scroll-mt-24 py-20 md:py-28">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55 }}
          className="text-center"
        >
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
            لماذا برق؟
          </span>
          <h2 className="mt-4 text-3xl font-extrabold leading-tight md:text-5xl">
            مبني للسرعة. مصمّم للخصوصية.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl leading-8 text-muted-foreground">
            كل قرار هندسي في برق يخدم ثلاثة أهداف: أن يبدأ فورًا، أن يحمّل
            الصفحات بسرعة تفوق أي متصفح تقليدي، وأن يبقى بياناتك على جهازك وحده.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.article
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.55, delay: i * 0.08 }}
                className="group rounded-2xl border border-white/10 bg-zinc-900/60 p-6 transition hover:border-emerald-400/30 hover:bg-zinc-900/80"
              >
                <span className="w-fit rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-2.5">
                  <Icon aria-hidden="true" className="h-5 w-5 text-emerald-400" />
                </span>
                <h3 className="mt-4 text-lg font-bold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {feature.description}
                </p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
