import { NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import type { AgentAction, AgentMessage } from "@/lib/barq-types";

const SYSTEM_PROMPT = `أنت "وكيل برق" — مساعد ذكاء اصطناعي مدمج داخل متصفح برق الخفيف. مهمتك فهم طلبات المستخدم بالعربية وتنفيذها عبر المتصفح.

قواعد صارمة:
- أجب بـ JSON صالح فقط، دون أي نص خارج JSON ودون علامات \`\`\`.
- الشكل: {"reply": "<نص قصير بلطف وبدون رموز ترميز>", "action": null أو {"type": "open_url", "url": "<عنوان>", "label": "<اسم قصير عربي>"}}
- إن طلب المستخدم فتح موقع أو موقعًا إخباريًا أو موسوعة: ضع في url اسم النطاق المناسب مثل "wikipedia.org" أو "news.example.com" وفي label وصفًا عربيًا قصيرًا.
- إن طلب المستخدم بحثًا عن شيء: ضع في url نص البحث نفسه بالعربية (مثال: "أفضل هواتف 2025") وفي label "بحث: ..." بشكل مختصر.
- reply يجب أن يكون سطرًا إلى سطرين كحد أقصى، ومباشرًا، وبالعربية الفصحى المبسطة.
- لا تنفّذ مهام خارج إمكانات المتصفح (لا ملفات، لا بريد، لا أنظمة). اعتذر بلطف ووضع action بـ null إن كان الطلب خارج النطاق.`;

function extractJson(text: string): { reply?: string; action?: AgentAction | null } | null {
  const trimmed = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    /* fallthrough */
  }
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch {
      /* fallthrough */
    }
  }
  return null;
}

function sanitizeAction(action: unknown): AgentAction | null {
  if (!action || typeof action !== "object") return null;
  const a = action as Record<string, unknown>;
  if (a.type !== "open_url") return null;
  const url = typeof a.url === "string" ? a.url.trim() : "";
  const label = typeof a.label === "string" && a.label.trim() ? a.label.trim() : "فتح الصفحة";
  if (!url || url.length > 300) return null;
  return { type: "open_url", url, label };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { messages?: unknown };
    const raw = Array.isArray(body.messages) ? body.messages : [];
    const messages: AgentMessage[] = raw
      .filter(
        (m): m is AgentMessage =>
          !!m &&
          typeof m === "object" &&
          ((m as AgentMessage).role === "user" || (m as AgentMessage).role === "assistant") &&
          typeof (m as AgentMessage).content === "string",
      )
      .slice(-8)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 1200) }));

    if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
      return NextResponse.json({ ok: false, error: "empty-messages" }, { status: 400 });
    }

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: SYSTEM_PROMPT },
        ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      ],
      thinking: { type: "disabled" },
    });

    const content = completion.choices[0]?.message?.content ?? "";
    const parsed = extractJson(content);
    const reply = parsed?.reply?.trim() || content.trim();
    const action = sanitizeAction(parsed?.action);

    if (!reply) {
      return NextResponse.json({
        ok: true,
        reply: "لم أتمكن من معالجة الطلب. جرّب صياغة أخرى أو اكتب عنوانًا في شريط المتصفح مباشرة.",
        action: null,
      });
    }

    return NextResponse.json({ ok: true, reply, action });
  } catch (err) {
    console.error("[/api/agent] error:", err);
    return NextResponse.json({
      ok: true,
      reply: "تعذّر الاتصال بنموذج الذكاء الاصطناعي في هذه اللحظة. يمكنك دائمًا كتابة عنوان أو كلمة بحث في شريط المتصفح مباشرة.",
      action: null,
    });
  }
}
