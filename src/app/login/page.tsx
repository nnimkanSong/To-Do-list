"use client";

import { useSearchParams } from "next/navigation";
import LoginForm from "@/components/login-form";

export default function LoginPage() {
    const sp = useSearchParams();
    const justRegistered = sp.get("registered") === "1";

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24">
            {justRegistered && (
                <div className="rounded-md bg-green-50 text-green-800 px-3 py-2 text-sm">
                    ลงทะเบียนสำเร็จ! กรุณาเข้าสู่ระบบ
                </div>
            )}

            {/* TODO: วางฟอร์ม Login ของคุณตรงนี้ */}
            <h1 className="text-xl font-semibold">Login</h1>
            <LoginForm />
        </main>
    );
}
