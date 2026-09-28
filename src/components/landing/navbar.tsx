"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Menu, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavLink {
  href: string;
  label: string;
}

const NAV_LINKS: readonly NavLink[] = [
  { href: "#features", label: "المميزات" },
  { href: "#demo", label: "جرّب مباشرة" },
  { href: "#automation", label: "الأتمتة" },
  { href: "#comparison", label: "المقارنة" },
  { href: "#privacy", label: "الخصوصية" },
];

export function Navbar() {
  const [open, setOpen] = useState<boolean>(false);
  const [scrolled, setScrolled] = useState<boolean>(false);

  useEffect(() => {
    const onScroll = (): void => {
      setScrolled(window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const closeMenu = useCallback((): void => setOpen(false), []);
  const toggleMenu = useCallback((): void => setOpen((v) => !v), []);

  return (
    <header
      className={`glass sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? "border-white/10 shadow-[0_8px_30px_rgb(0_0_0/0.35)]"
          : "border-white/5"
      }`}
    >
      <nav
        aria-label="التنقل الرئيسي"
        className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6"
      >
        {/* Logo */}
        <a
          href="#top"
          onClick={closeMenu}
          className="flex items-center gap-2.5"
          aria-label="برق — العودة إلى الأعلى"
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

        {/* Desktop links */}
        <ul className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm text-muted-foreground transition hover:text-foreground"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          {/* CTA */}
          <Button
            asChild
            className="hidden rounded-xl bg-emerald-400 font-bold text-emerald-950 hover:bg-emerald-300 md:inline-flex"
          >
            <a href="#download">
              <Download className="h-4 w-4" aria-hidden="true" />
              حمّل مجانًا
            </a>
          </Button>

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMenu}
            aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="md:hidden"
          >
            {open ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </Button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute inset-x-4 top-[68px] z-50 flex flex-col gap-1 rounded-2xl border border-white/10 bg-zinc-950/95 p-4 shadow-[0_16px_50px_rgb(0_0_0/0.6)] backdrop-blur-xl md:hidden"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
            <Button
              asChild
              className="mt-2 w-full rounded-xl bg-emerald-400 font-bold text-emerald-950 hover:bg-emerald-300"
            >
              <a href="#download" onClick={closeMenu}>
                <Download className="h-4 w-4" aria-hidden="true" />
                حمّل مجانًا
              </a>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export default Navbar;
