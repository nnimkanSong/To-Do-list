import { NextResponse } from "next/server";
import { verify } from "jsonwebtoken";

export async function POST(req: Request) {
  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  try {
    const payload = verify(token, process.env.JWT_SECRET!) as { sub: string; typ: string };
    if (payload.typ !== "email-verify") throw new Error("Invalid token type");
    return NextResponse.json({ ok: true, email: payload.sub });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
