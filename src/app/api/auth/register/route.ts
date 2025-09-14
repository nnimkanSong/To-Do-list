import { NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import { dbConnect } from "@/lib/mongoose";
import { User } from "@/model/user"; // ✅ ใช้ path เดียวทุกที่
import bcrypt from "bcryptjs";

function passwordStrong(pw: string) {
  return (
    typeof pw === "string" &&
    pw.length >= 8 &&
    /[A-Z]/.test(pw) &&
    /[a-z]/.test(pw) &&
    /\d/.test(pw) &&
    /[^A-Za-z0-9]/.test(pw)
  );
}

export async function POST(req: Request) {
  try {
    const { email, password, verificationToken } = (await req.json()) as {
      email?: string;
      password?: string;
      verificationToken?: string;
    };

    if (!email || !password || !verificationToken) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // ตรวจ token และอีเมลต้องตรง
    let tokenEmail: string;
    try {
      const payload = verify(verificationToken, process.env.JWT_SECRET!) as { sub: string; typ: string };
      if (payload.typ !== "email-verify") throw new Error("bad token type");
      tokenEmail = payload.sub;
    } catch {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }
    if (tokenEmail.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({ error: "Token/email mismatch" }, { status: 400 });
    }

    if (!passwordStrong(password)) {
      return NextResponse.json({ error: "Weak password" }, { status: 400 });
    }

    await dbConnect();

    const exists = await User.findOne({ email: email.toLowerCase() }).lean();
    if (exists) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await User.create({
      email: email.toLowerCase(),
      passwordHash,
      emailVerified: true,
      createdAt: new Date(),
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[register]", e?.name, e?.message, e);
    if (e?.code === 11000) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }
    return NextResponse.json({ error: e?.message || "Internal Server Error" }, { status: 500 });
  }
}
