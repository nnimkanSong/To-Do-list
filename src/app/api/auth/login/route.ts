import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import { User } from "@/model/user";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const { email, password } = (await req.json()) as { email?: string; password?: string };

    if (!email || !password || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findOne({ email: email.toLowerCase() }).lean();
    if (!user) {
      return NextResponse.json({ error: "Email or password is incorrect" }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Email or password is incorrect" }, { status: 401 });
    }

    // (ทางเลือก) บังคับต้อง verify email ก่อน
    // if (!user.emailVerified) {
    //   return NextResponse.json({ error: "Please verify your email first." }, { status: 403 });
    // }

    // ออก session token แบบง่ายด้วย jose (JWT ลง cookie)
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "devsecret");
    const token = await new SignJWT({ sub: String(user._id), email: user.email })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);

    const res = NextResponse.json({ ok: true });
    res.cookies.set("session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 วัน
    });
    return res;
  } catch (e) {
    console.error("[login] ", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
