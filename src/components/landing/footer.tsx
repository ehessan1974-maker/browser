"use client";

import { ShieldCheck, Zap } from "lucide-react";

type FooterLink = { label: string; href: string };

type FooterColumn = {
  title: string;
  links: FooterLink[];
};

const columns: FooterColumn[] = [
  {
    title: "المنتج",
    links: [
      { label: "المميزات", href: "#features" },
      { label: "جرّب مباشرة", href: "#demo" },
      { label: "الأتمتة", href: "#automation" },
      { label: "المقارنة", href: "#comparison" },
    ],
  },
  {
    title: "الموارد",
    links: [
      { label: "التحميل", href: "#download" },
      { label: "الخصوصية", href: "#privacy" },
      { label: "توثيق API", href: "#" },
      { label: "سجل التغييرات", href: "#" },
    ],
  },
  {
    title: "الشركة",
    links: [
      { label: "من نحن", href: "#" },
      { label: "اتصل بنا", href: "#" },
      { label: "سياسة الخصوصية", href: "#" },
      { label: "شروط الاستخدام", href: "#" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative mt-auto border-t border-white/5 bg-black/20">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10">
                <Zap aria-hidden="true" className="h-4 w-4 text-emerald-400" />
              </span>
              <span className="text-lg font-extrabold">برق</span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-7 text-muted-foreground">
              متصفح خفيف للأتمتة ووكلاء الذكاء الاصطناعي. أسرع، أخفّ، وأكثر
              خصوصية — بلا استنزاف موارد جهازك.
            </p>
            <span
              dir="ltr"
              className="mt-4 inline-flex rounded-full border border-white/10 px-3 py-1 text-[10px] text-muted-foreground"
            >
              v1.4.4 — stable
            </span>
          </div>

          {/* Link columns */}
          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h4 className="mb-3 text-sm font-bold">{column.title}</h4>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground transition hover:text-emerald-300"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>
            © <span dir="ltr" className="font-display">2025</span> برق — جميع
            الحقوق محفوظة.
          </p>
          <p className="flex items-center gap-1.5">
            <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5 text-emerald-400" />
            حتى هذه الصفحة لا تحتوي على أي متعقّب.
          </p>
        </div>
      </div>
    </footer>
  );
}
