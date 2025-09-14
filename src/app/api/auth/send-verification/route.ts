import { NextRequest, NextResponse } from "next/server";
import { sign } from "jsonwebtoken";
import { sendVerificationEmail } from "@/lib/mailer";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const { email: raw } = (await req.json()) as { email?: string };
    const email = raw?.trim().toLowerCase();
    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("Missing JWT_SECRET");

    const token = sign({ sub: email, typ: "email-verify" }, secret, {
      algorithm: "HS256",
      expiresIn: "15m",
    });

    // ใช้ APP_URL ถ้ามี; ไม่มีก็ใช้ origin จากคำขอ
    const origin = process.env.APP_URL ?? req.nextUrl.origin ?? "http://localhost:3000";
    const url = new URL("/verify", origin);
    url.searchParams.set("token", token);
    const link = url.toString();

    await sendVerificationEmail(email, link);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[send-verification]", err);
    return NextResponse.json({ error: err?.message ?? "Internal Server Error" }, { status: 500 });
  }
}
