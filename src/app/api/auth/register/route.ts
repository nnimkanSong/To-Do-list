import { NextResponse } from "next/server";
import { verify } from "jsonwebtoken";

function strong(pw: string) {
  return pw.length >= 8 && /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /\d/.test(pw) && /[^A-Za-z0-9]/.test(pw);
}

export async function POST(req: Request) {
  const { email, password, verificationToken } = await req.json();

  if (!email || !password || !verificationToken) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (!strong(password)) {
    return NextResponse.json({ error: "Weak password" }, { status: 400 });
  }

  try {
    const payload = verify(verificationToken, process.env.JWT_SECRET!) as { sub: string; typ: string };
    if (payload.typ !== "email-verify" || payload.sub.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({ error: "Invalid token/email" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Token expired/invalid" }, { status: 400 });
  }

  // เดโม: สมมุติบันทึกสำเร็จ
  return NextResponse.json({ ok: true });
}
