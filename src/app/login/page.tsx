// app/login/page.tsx  (ไม่มี "use client")
import LoginForm from "@/components/login-form";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { [k: string]: string | string[] | undefined };
}) {
  const r = searchParams?.registered;
  const justRegistered =
    typeof r === "string" ? r === "1" : Array.isArray(r) ? r[0] === "1" : false;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      {justRegistered && (
        <div className="rounded-md bg-green-50 text-green-800 px-3 py-2 text-sm">
          ลงทะเบียนสำเร็จ! กรุณาเข้าสู่ระบบ
        </div>
      )}
      <h1 className="text-xl font-semibold">Login</h1>
      <LoginForm />
    </main>
  );
}
