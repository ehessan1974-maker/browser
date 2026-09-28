"use client";

import { motion } from "framer-motion";
import { AppWindow, Command, Terminal, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type DownloadTarget = {
  icon: LucideIcon;
  os: string;
  meta: string;
};

const downloads: DownloadTarget[] = [
  { icon: AppWindow, os: "Windows", meta: "8.2MB · x64" },
  { icon: Command, os: "macOS", meta: "8.0MB · Universal" },
  { icon: Terminal, os: "Linux", meta: "7.9MB · deb/rpm/AppImage" },
];

export default function Cta() {
  return (
    <section id="download" className="relative scroll-mt-24 py-20 md:py-28">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55 }}
        >
          <div className="relative overflow-hidden rounded-3xl border border-emerald-400/25 bg-gradient-to-bl from-emerald-500/15 via-emerald-500/5 to-transparent p-8 text-center md:p-14">
            {/* Decorative layers */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 grid-bg opacity-70"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 inset-x-0 mx-auto h-64 w-64 rounded-full bg-emerald-500/25 blur-3xl"
            />

            <div className="relative">
              <h2 className="text-3xl font-extrabold leading-tight md:text-4xl">
                جاهز تجرّب الفرق؟
              </h2>
              <p className="mt-3 leading-8 text-muted-foreground">
                حمّل برق مجانًا —{" "}
                <span dir="ltr" className="font-display">
                  8.2MB
                </span>{" "}
                فقط، وشغّل صفحاتك قبل أن ترمش.
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {downloads.map((target) => {
                  const Icon = target.icon;
                  return (
                    <Button
                      key={target.os}
                      type="button"
                      variant="outline"
                      aria-label={`تحميل برق لنظام ${target.os}`}
                      className="h-auto flex-col items-center gap-0.5 rounded-xl border-white/15 bg-black/30 px-5 py-3 hover:border-emerald-400/40 hover:bg-black/40 hover:text-emerald-300"
                    >
                      <span className="flex items-center gap-2">
                        <Icon aria-hidden="true" className="h-4 w-4 text-emerald-400" />
                        <span dir="ltr" className="font-display font-bold">
                          {target.os}
                        </span>
                      </span>
                      <span dir="ltr" className="font-display text-[10px] text-muted-foreground">
                        {target.meta}
                      </span>
                    </Button>
                  );
                })}
              </div>

              <p
                dir="ltr"
                className="mt-6 font-mono text-[10px] text-muted-foreground"
              >
                SHA-256: 9f2c7a41…e1a4 · Windows 10+ · macOS 12+ · Linux glibc 2.31+
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
