import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { sign } from "jsonwebtoken";
import { sendVerificationEmail } from "@/lib/mailer";

export const runtime = "nodejs"; // กันเคส edge runtime บางอย่าง

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("Missing JWT_SECRET");

    // เซ็น token สำหรับลิงก์ยืนยัน (อายุ 15 นาที)
    const token = sign({ sub: email, typ: "email-verify" }, secret, {
      algorithm: "HS256",
      expiresIn: "15m",
    });

    const resolvedHeaders = await headers();
    const origin =
      process.env.APP_URL || (resolvedHeaders.get("origin") ?? "http://localhost:3000");
    const link = `${origin}/verify?token=${encodeURIComponent(token)}`;

    await sendVerificationEmail(email, link);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[send-verification] ", err);
    return NextResponse.json(
      { error: err?.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
