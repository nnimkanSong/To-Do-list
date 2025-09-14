import jwt from "jsonwebtoken";
import { sign, verify, type SignOptions, type JwtPayload } from "jsonwebtoken";
const SECRET = process.env.JWT_SECRET!;
if (!SECRET) throw new Error("Missing JWT_SECRET");

export function signVerificationToken(
  email: string,
  expiresIn: SignOptions["expiresIn"] = "15m"
) {
  const payload = { sub: email, typ: "email-verify" as const };
  const options: SignOptions = { expiresIn, algorithm: "HS256" }; // <- ใส่ algorithm ให้ชัด
  return sign(payload, SECRET, options);
}

export function verifyVerificationToken(token: string) {
  const decoded = verify(token, SECRET) as JwtPayload & { sub: string; typ: string };
  if (decoded.typ !== "email-verify") throw new Error("Invalid token type");
  return decoded.sub; // email
}