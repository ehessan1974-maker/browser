"use client";

import { motion } from "framer-motion";
import {
  Check,
  Cookie,
  Database,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

type PrivacyPoint = {
  title: string;
  description: string;
};

const points: PrivacyPoint[] = [
  {
    title: "حظر محلي 100%",
    description:
      "قوائم الحظر تعمل على جهازك؛ لا يُرسل أي طلب لفحص الروابط أو التحقق.",
  },
  {
    title: "بلا سجل",
    description:
      "لا يحفظ برق ما تتصفحه ولا يربط جلساتك ببعضها، ويمكنك مسح كل شيء بضغطة.",
  },
  {
    title: "مقاومة بصمة الجهاز",
    description:
      "تعطيل تقنيات fingerprinting التي تعرّف بك حتى دون كوكيز.",
  },
  {
    title: "مفتوح المصدر",
    description:
      "كل سطر قابل للتدقيق والمراجعة — الثقة تُبنى بالشفافية لا بالوعود.",
  },
];

function CheckBullet({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="mt-0.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 p-1.5">
      <Icon aria-hidden="true" className="h-3.5 w-3.5 text-emerald-400" />
    </span>
  );
}

export default function Privacy() {
  return (
    <section id="privacy" className="relative scroll-mt-24 py-20 md:py-28">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Copy column */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55 }}
          >
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
              الخصوصية أولًا
            </span>
            <h2 className="mt-4 text-3xl font-extrabold leading-tight md:text-5xl">
              خصوصيتك ليست ميزة إضافية — إنها الأساس
            </h2>
            <p className="mt-4 max-w-2xl leading-8 text-muted-foreground">
              بينما يحوّل المتصفحات الأخرى تصفحك إلى منتج يُباع، يعمل برق بمنطق
              معاكس: كل ما يحدث في جهازك يبقى في جهازك.
            </p>

            <ul>
              {points.map((point) => (
                <li key={point.title} className="mt-5 flex items-start gap-3">
                  <CheckBullet icon={Check} />
                  <div>
                    <h4 className="font-bold">{point.title}</h4>
                    <p className="mt-1 text-sm leading-7 text-muted-foreground">
                      {point.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Visual column — radar-style concentric circles */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="relative mx-auto flex h-72 w-72 items-center justify-center md:h-80 md:w-80"
          >
            <div
              aria-hidden="true"
              className="absolute inset-0 rounded-full bg-emerald-500/5 blur-2xl"
            />
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full border border-emerald-400/15"
            />
            <span
              aria-hidden="true"
              className="ping-slow absolute inset-[12.5%] rounded-full border border-emerald-400/15"
            />
            <span
              aria-hidden="true"
              className="absolute inset-[25%] rounded-full border border-emerald-400/15"
            />

            <div className="relative z-10 flex flex-col items-center gap-1 text-center">
              <ShieldCheck aria-hidden="true" className="h-14 w-14 text-emerald-400" />
              <span dir="ltr" className="font-display text-3xl font-bold">
                3,512+
              </span>
              <span className="text-xs text-muted-foreground">قاعدة حظر نشطة</span>
              <span aria-hidden="true" className="my-2 h-px w-16 bg-white/10" />
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Database aria-hidden="true" className="h-3.5 w-3.5 text-emerald-400/80" />
                  <span dir="ltr" className="font-display">0</span> بيانات مجمّعة
                </span>
                <span className="flex items-center gap-1.5">
                  <Cookie aria-hidden="true" className="h-3.5 w-3.5 text-emerald-400/80" />
                  <span dir="ltr" className="font-display">0</span> كوكيز تتبّع
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
