"use client";

import * as React from "react";
import { Bot, ExternalLink, Globe, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { AgentAction, AgentResponse } from "@/lib/barq-types";

interface ConsoleMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  action?: AgentAction | null;
}

const WELCOME_ID = "welcome";
const WELCOME_CONTENT =
  "مرحبًا! أنا وكيل برق. اطلب مني فتح موقع، أو البحث عن شيء، أو تلخيص صفحة — وسأنفّذها بسرعة 85ms وبلا تتبّع.";
const ERROR_CONTENT = "حدث خطأ في الاتصال بالوكيل. حاول مرة أخرى.";

const INITIAL_MESSAGES: ConsoleMessage[] = [
  { id: WELCOME_ID, role: "assistant", content: WELCOME_CONTENT, action: null },
];

const SUGGESTIONS: { text: string; num?: string }[] = [
  { text: "افتح موقع أخبار التقنية" },
  { text: "ابحث عن أفضل هواتف", num: "2025" },
  { text: "ويكيبيديا: خصوصية على الإنترنت" },
];

function MessageBody({ message }: { message: ConsoleMessage }) {
  if (message.id === WELCOME_ID) {
    return (
      <p>
        مرحبًا! أنا وكيل برق. اطلب مني فتح موقع، أو البحث عن شيء، أو تلخيص صفحة — وسأنفّذها بسرعة{" "}
        <span dir="ltr" className="font-display">85ms</span> وبلا تتبّع.
      </p>
    );
  }
  return <p>{message.content}</p>;
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1" role="status" aria-label="الوكيل يكتب">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-300" style={{ animationDelay: "0ms" }} />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-300" style={{ animationDelay: "150ms" }} />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-300" style={{ animationDelay: "300ms" }} />
    </div>
  );
}

export default function AgentConsole({ onNavigate }: { onNavigate: (url: string) => void }) {
  const [messages, setMessages] = React.useState<ConsoleMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const idRef = React.useRef(1);
  const abortRef = React.useRef<AbortController | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Keep the message list pinned to the bottom on new messages / typing state.
  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // Abort any in-flight request if the console unmounts.
  React.useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  async function send(raw: string) {
    const text = raw.trim();
    if (!text || loading) return;

    const userMsg: ConsoleMessage = { id: `m${idRef.current++}`, role: "user", content: text, action: null };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 30_000);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: controller.signal,
      });
      const data = (await res.json()) as Partial<AgentResponse> | null;

      const assistantId = `m${idRef.current++}`;
      if (res.ok && data && data.ok && typeof data.reply === "string") {
        setMessages((prev) => [
          ...prev,
          { id: assistantId, role: "assistant", content: data.reply as string, action: data.action ?? null },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { id: assistantId, role: "assistant", content: ERROR_CONTENT, action: null },
        ]);
      }
    } catch {
      const assistantId = `m${idRef.current++}`;
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: ERROR_CONTENT, action: null },
      ]);
    } finally {
      window.clearTimeout(timeout);
      abortRef.current = null;
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col rounded-2xl border border-white/10 bg-zinc-900/60 p-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-400">
          <Bot className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <div className="text-sm font-bold text-foreground">وكيل برق الذكي</div>
          <div className="text-xs text-muted-foreground">كلّمه بالعربية — يفتح، يبحث، ويلخّص لك</div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="mt-4 flex max-h-72 flex-col gap-3 overflow-y-auto pe-1">
        {messages.map((m) => {
          const action = m.action;
          return (
            <div
              key={m.id}
              className={cn(
                "max-w-[85%] px-4 py-2.5 text-sm leading-7",
                m.role === "user"
                  ? "self-end rounded-2xl rounded-ss-md border border-emerald-400/20 bg-emerald-400/15"
                  : "self-start rounded-2xl rounded-se-md border border-white/10 bg-white/5",
              )}
            >
              <MessageBody message={m} />
              {action && (
                <div className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <Globe className="h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-emerald-200">{action.label}</div>
                      <div dir="ltr" className="truncate font-mono text-[10px] text-muted-foreground">
                        {action.url}
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => onNavigate(action.url)}
                    className="shrink-0 rounded-lg bg-emerald-400 text-emerald-950 hover:bg-emerald-300"
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    نفّذ
                  </Button>
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="self-start rounded-2xl rounded-se-md border border-white/10 bg-white/5 px-4 py-2.5">
            <TypingDots />
          </div>
        )}

        {/* Suggested prompts */}
        <div className="flex flex-wrap gap-2 pt-1">
          {SUGGESTIONS.map((s) => {
            const full = s.num ? `${s.text} ${s.num}` : s.text;
            return (
              <button
                key={full}
                type="button"
                disabled={loading}
                onClick={() => void send(full)}
                className="cursor-pointer rounded-full border border-white/10 px-3 py-1.5 text-xs text-muted-foreground transition hover:border-emerald-400/40 hover:text-emerald-300 disabled:pointer-events-none disabled:opacity-50"
              >
                {s.text}
                {s.num ? (
                  <>
                    {" "}
                    <span dir="ltr" className="font-display">{s.num}</span>
                  </>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Input */}
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <Input
          dir="rtl"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="اكتب مهمتك… مثال: افتح ويكيبيديا"
          aria-label="رسالتك إلى الوكيل"
          className="h-9 flex-1 bg-black/20 text-sm"
        />
        <Button
          type="submit"
          size="icon"
          aria-label="إرسال"
          disabled={loading}
          className="size-9 shrink-0 rounded-lg bg-emerald-400 text-emerald-950 hover:bg-emerald-300"
        >
          <Send className="h-4 w-4 scale-x-[-1]" aria-hidden="true" />
        </Button>
      </form>
    </div>
  );
}
