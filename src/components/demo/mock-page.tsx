"use client";

import { motion } from "framer-motion";
import { Ban, Check, Timer } from "lucide-react";
import type { BrowsePage, PageResult } from "@/lib/barq-types";

function ResultMeta({ result }: { result: PageResult }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        dir="ltr"
        className="rounded-full bg-white/5 px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
      >
        {result.host}
      </span>
      <span className="inline-flex items-center gap-1 text-[10px] text-amber-300/90">
        <Timer className="h-3 w-3" aria-hidden="true" />
        <span dir="ltr" className="font-display">{result.loadMs}ms</span>
      </span>
    </div>
  );
}

export default function MockPage({ page }: { page: BrowsePage }) {
  const isSearch = page.content.kind === "search";
  const adSlots = Math.max(0, Math.min(2, page.adsRemoved));

  return (
    <div className="min-h-[420px] bg-[#0e1513]">
      {/* Clean page header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="p-5 pb-0"
      >
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ background: `hsl(${page.hue} 55% 40%)` }}
          >
            {page.siteName.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-foreground">{page.siteName}</div>
            <div dir="ltr" className="truncate font-mono text-xs text-muted-foreground">
              {page.host}
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 px-2.5 py-0.5 text-xs text-emerald-300">
            <Timer className="h-3 w-3" aria-hidden="true" />
            <span dir="ltr" className="font-display">{page.loadMs}ms</span>
          </span>
          {page.adsRemoved > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/30 bg-rose-400/10 px-2.5 py-0.5 text-xs text-rose-300">
              <Ban className="h-3 w-3" aria-hidden="true" />
              <span dir="ltr" className="font-display">{page.adsRemoved}</span>
              <span>إعلان محجوب</span>
            </span>
          )}
        </div>
      </motion.div>

      {/* Scrollable clean content */}
      <div className="max-h-[460px] overflow-y-auto p-5 pt-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="space-y-6"
        >
          {/* Hero */}
          <header className="space-y-3">
            <span className="inline-block rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-medium text-emerald-300">
              {page.content.hero.kicker}
            </span>
            <h3 className="text-xl font-bold leading-9 md:text-2xl">{page.content.hero.title}</h3>
            <p className="text-sm leading-7 text-muted-foreground">{page.content.hero.excerpt}</p>
          </header>

          {/* Body blocks */}
          <div className="space-y-4">
            {page.content.blocks.map((block, i) =>
              block.type === "paragraph" ? (
                <p key={i} className="text-sm leading-8 text-foreground/85">
                  {block.text}
                </p>
              ) : (
                <ul key={i} className="space-y-2.5">
                  {(block.items ?? []).map((item, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-2.5 text-sm leading-7 text-foreground/85"
                    >
                      <Check
                        className="mt-1 h-4 w-4 shrink-0 text-emerald-400"
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ),
            )}
          </div>

          {/* Blocked ad slots (removed before they ever loaded) */}
          {adSlots > 0 && (
            <div className="space-y-2.5">
              {Array.from({ length: adSlots }).map((_, i) => (
                <div
                  key={i}
                  className="flex h-16 items-center justify-center gap-2 rounded-xl border border-dashed border-rose-400/30 text-xs text-rose-300/70"
                >
                  <Ban className="h-4 w-4" aria-hidden="true" />
                  <span className="line-through">مساحة إعلانية حُجبت قبل تحميلها</span>
                </div>
              ))}
            </div>
          )}

          {/* Related results */}
          {page.content.results.length > 0 &&
            (isSearch ? (
              <div className="space-y-3">
                {page.content.results.map((r, i) => (
                  <div
                    key={`${r.host}-${i}`}
                    className="rounded-xl border border-white/5 bg-white/[0.02] p-4 transition hover:border-emerald-400/20"
                  >
                    <h4 className="text-sm font-bold text-emerald-300/90">{r.title}</h4>
                    <div className="mt-2">
                      <ResultMeta result={r} />
                    </div>
                    <p className="mt-2 text-xs leading-6 text-muted-foreground">{r.snippet}</p>
                  </div>
                ))}
              </div>
            ) : (
              <section>
                <h4 className="mb-3 text-sm font-bold text-foreground/90">اقرأ أيضًا</h4>
                <div className="grid gap-3 sm:grid-cols-3">
                  {page.content.results.map((r, i) => (
                    <div
                      key={`${r.host}-${i}`}
                      className="rounded-xl border border-white/5 bg-white/[0.02] p-3 transition hover:border-emerald-400/20"
                    >
                      <h5 className="text-sm font-bold leading-6 text-emerald-300/90">{r.title}</h5>
                      <div className="mt-2">
                        <ResultMeta result={r} />
                      </div>
                      <p className="mt-2 text-xs leading-6 text-muted-foreground">{r.snippet}</p>
                    </div>
                  ))}
                </div>
              </section>
            ))}
        </motion.div>
      </div>
    </div>
  );
}
