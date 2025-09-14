// app/api/login/route.ts
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import { User } from "@/model/user";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

export const runtime = "nodejs"; // กัน edge runtime ที่ใช้ bcrypt ไม่ได้

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type LoginBody = {
  email: string;
  password: string;
};

type UserLean = {
  _id: string;
  email: string;
  passwordHash: string;
};

function isLoginBody(x: unknown): x is LoginBody {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  return typeof o.email === "string" && typeof o.password === "string";
}

export async function POST(req: Request) {
  try {
    const raw = (await req.json()) as unknown;

    if (!isLoginBody(raw)) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
    }

    const email = raw.email.trim().toLowerCase();
    const password = raw.password;

    if (!EMAIL_RE.test(email) || password.length === 0) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findOne({ email })
      .select("_id email passwordHash")
      .lean<UserLean>()
      .exec();

    // ไม่บอกว่า email หรือ password ผิด เพื่อลดข้อมูลรั่ว
    if (!user) {
      return NextResponse.json({ error: "Email or password is incorrect" }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Email or password is incorrect" }, { status: 401 });
    }

    const secretEnv = process.env.JWT_SECRET;
    if (!secretEnv) {
      // หยุดทันทีถ้าไม่มี secret (อย่าใช้ default ในโปรดักชัน)
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }
    const secret = new TextEncoder().encode(secretEnv);

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
  } catch (e: unknown) {
    // ไม่ใช้ `any` ใน catch; แคบ type ให้ถูกต้อง
    console.error("[login] ", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
