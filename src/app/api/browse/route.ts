import { NextResponse } from "next/server";
import { buildPage, recordPageLoad } from "@/lib/barq-data";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { url?: unknown };
    const raw = typeof body.url === "string" ? body.url.trim() : "";
    if (!raw) {
      return NextResponse.json({ ok: false, error: "missing-url" }, { status: 400 });
    }

    const page = buildPage(raw);
    recordPageLoad(page);
    return NextResponse.json({ ok: true, page });
  } catch (err) {
    const invalid = err instanceof Error && err.message === "invalid-target";
    return NextResponse.json(
      { ok: false, error: invalid ? "invalid-url" : "browse-failed" },
      { status: invalid ? 400 : 500 },
    );
  }
}
