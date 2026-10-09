"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";

type DownloadTarget = {
  key: string;
  file: string;
  size: string;
  /** الرابط الحقيقي للملف — يُنزَّل فعلياً عند الضغط */
  url: string;
};

/**
 * تنزيل حقيقي 100% — عند الضغط يُنشئ رابطاً مخفياً ويضغطه فيبدأ
 * تنزيل الملف الفعلي من release المستقر عبر شريط تنزيل المتصفح.
 * الحركة على الزر مجرد تغذية بصرية، والتنزيل نفسه حقيقي دائماً.
 */
export function useSimulatedDownload() {
  const { toast } = useToast();
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [doneKey, setDoneKey] = useState<string | null>(null);
  const targetRef = useRef<DownloadTarget | null>(null);

  useEffect(() => {
    if (!activeKey) return;
    const startedAt = Date.now();
    const id = window.setInterval(() => {
      const pct = Math.min(100, ((Date.now() - startedAt) / 1500) * 100);
      setProgress(pct);
      if (pct >= 100) {
        window.clearInterval(id);
        setActiveKey(null);
        setProgress(0);
        setDoneKey(activeKey);
        const target = targetRef.current;
        if (target) {
          toast({
            title: "التنزيل يعمل الآن عبر المتصفح",
            description: `${target.file} — إن لم يظهر في شريط التنزيل اضغط الزر مجدداً`,
          });
        }
        window.setTimeout(() => setDoneKey(null), 2600);
      }
    }, 80);
    return () => window.clearInterval(id);
  }, [activeKey, toast]);

  const start = useCallback(
    (target: DownloadTarget): void => {
      if (activeKey || doneKey === target.key) return;
      targetRef.current = target;

      /* التنزيل الحقيقي — رابط مخفي يضغط نفسه */
      try {
        const a = document.createElement("a");
        a.href = target.url;
        a.download = target.file;
        a.rel = "noopener";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch {
        /* احتياط — افتح في تبويب جديد إن رفض المتصفح */
        window.open(target.url, "_blank", "noopener,noreferrer");
      }

      setDoneKey(null);
      setActiveKey(target.key);
      setProgress(0);
      toast({
        title: "بدأ تنزيل الملف الفعلي",
        description: `${target.file} (${target.size}) — افحص شريط تنزيل المتصفح`,
      });
    },
    [activeKey, doneKey, toast],
  );

  return {
    activeKey,
    progress,
    doneKey,
    isBusy: activeKey !== null,
    start,
  };
}
