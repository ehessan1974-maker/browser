"use client";

import { useCallback, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function CopyButton({ value, label }: { value: string; label: string }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState<boolean>(false);

  const onCopy = useCallback(async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast({ title: "تم النسخ إلى الحافظة", description: label });
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast({
        title: "تعذّر النسخ",
        description: "حدّد النص من الشاشة وانسخه يدويًا",
        variant: "destructive",
      });
    }
  }, [value, label, toast]);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onCopy}
      aria-label={`نسخ ${label}`}
      className="h-8 w-8 shrink-0 rounded-lg text-muted-foreground hover:text-foreground"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
      ) : (
        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
      )}
    </Button>
  );
}
