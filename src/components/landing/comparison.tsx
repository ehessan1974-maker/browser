"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { ReactNode } from "react";

/** Latin/number fragment rendered LTR in Space Grotesk. */
function LTR({ value }: { value: string }) {
  return (
    <span dir="ltr" className="font-display">
      {value}
    </span>
  );
}

type ComparisonRow = {
  label: string;
  barq: ReactNode;
  chromium: ReactNode;
  traditional: ReactNode;
};

const rows: ComparisonRow[] = [
  {
    label: "زمن التشغيل البارد",
    barq: <LTR value="0.8s" />,
    chromium: <LTR value="4.2s" />,
    traditional: <LTR value="3.1s" />,
  },
  {
    label: "الذاكرة عند الفتح",
    barq: <LTR value="30MB" />,
    chromium: <LTR value="310MB" />,
    traditional: <LTR value="280MB" />,
  },
  {
    label: "متوسط تحميل الصفحة",
    barq: <LTR value="85ms" />,
    chromium: <LTR value="420ms" />,
    traditional: <LTR value="380ms" />,
  },
  {
    label: "متعقّبات محجوبة افتراضيًا",
    barq: <LTR value="3,512+" />,
    chromium: "صفر",
    traditional: "قليل جدًا",
  },
  {
    label: "الإعلانات",
    barq: "محجوبة بالكامل",
    chromium: "ظاهرة",
    traditional: "جزئية",
  },
  {
    label: "واجهة أتمتة للوكلاء",
    barq: (
      <>
        <LTR value="CLI + API" /> + مقابس
      </>
    ),
    chromium: "محدودة عبر إضافات",
    traditional: "شبه معدومة",
  },
  {
    label: "الشفافية",
    barq: "مفتوح المصدر",
    chromium: "مغلق جزئيًا",
    traditional: "مغلق",
  },
];

export default function Comparison() {
  return (
    <section id="comparison" className="relative scroll-mt-24 py-20 md:py-28">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55 }}
          className="text-center"
        >
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
            المقارنة
          </span>
          <h2 className="mt-4 text-3xl font-extrabold leading-tight md:text-5xl">
            الأرقام لا تجامل أحدًا
          </h2>
          <p className="mx-auto mt-4 max-w-2xl leading-8 text-muted-foreground">
            قياسات تقريبية على جهاز متوسط (
            <span dir="ltr" className="font-display">
              Intel i5 · 8GB RAM
            </span>
            ) لثلاث صفحات إخبارية مفتوحة في آن واحد.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="mt-12 overflow-x-auto rounded-2xl border border-white/10 bg-zinc-900/60"
        >
          <table dir="rtl" className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-start text-muted-foreground">
                <th scope="col" className="px-4 py-3.5 text-start font-medium">
                  المعيار
                </th>
                <th
                  scope="col"
                  className="bg-emerald-400/10 px-4 py-3.5 text-start font-bold text-emerald-300"
                >
                  برق
                </th>
                <th scope="col" className="px-4 py-3.5 text-start font-medium">
                  كروميوم
                </th>
                <th scope="col" className="px-4 py-3.5 text-start font-medium">
                  المتصفح التقليدي
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <td className="border-t border-white/5 px-4 py-3.5 font-medium">
                    {row.label}
                  </td>
                  <td className="border-t border-white/5 bg-emerald-400/[0.06] px-4 py-3.5 font-semibold text-emerald-300">
                    <span className="inline-flex items-center gap-1.5">
                      <Check aria-hidden="true" className="h-4 w-4" />
                      {row.barq}
                    </span>
                  </td>
                  <td className="border-t border-white/5 px-4 py-3.5 text-muted-foreground">
                    {row.chromium}
                  </td>
                  <td className="border-t border-white/5 px-4 py-3.5 text-muted-foreground">
                    {row.traditional}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          الأرقام للتمثيل التسويقي وقد تختلف بحسب الجهاز والموقع.
        </p>
      </div>
    </section>
  );
}
