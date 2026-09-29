"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";

type DownloadTarget = {
  key: string;
  file: string;
  size: string;
};

/**
 * Simulated download state machine shared by the landing section
 * and the /download page: idle → downloading (progress %) → done.
 * Completion toast fires automatically with the target file info.
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
            title: "اكتمل تنزيل الملف",
            description: `${target.file} — تحقق من مجلد التنزيلات أو إشعارات النظام`,
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
      setDoneKey(null);
      setActiveKey(target.key);
      setProgress(0);
      toast({
        title: "بدأ التنزيل",
        description: `${target.file} (${target.size})`,
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
