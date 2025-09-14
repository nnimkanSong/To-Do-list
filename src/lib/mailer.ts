import { Resend } from "resend";

export async function sendVerificationEmail(email: string, link: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Missing RESEND_API_KEY");

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: "onboarding@resend.dev",               // ✅ ส่งเข้ากล่องจริง ฟรี ไม่ต้อง verify โดเมน
    to: email,
    subject: "Verify your email",
    html: `<p>Hi,</p><p>Please verify your email by clicking the link:</p><p><a href="${link}">${link}</a></p><p>This link expires in 15 minutes.</p>`,
    text: `Verify your email: ${link} (expires in 15 minutes)`,
  });

  if (error) throw new Error(String(error));
}
