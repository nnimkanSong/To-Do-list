// app/verify/page.tsx
"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

function VerifyInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const token = sp.get("token");

  const [status, setStatus] = useState<"checking" | "ok" | "bad">("checking");
  const [email, setEmail] = useState("");

  // กัน race: ใช้ ref เก็บ token ล่าสุด
  const latestTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("bad");
      return;
    }
    latestTokenRef.current = token;

    const ac = new AbortController();

    (async () => {
      try {
        const res = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
          signal: ac.signal,
        });

        if (!res.ok) {
          setStatus("bad");
          return;
        }

        type VerifyResponse = { ok: true; email: string } | { ok: false; error?: string };
        const j = (await res.json()) as VerifyResponse;

        // ตรวจว่า token ที่ตอบกลับตรงกับ token ล่าสุด (กันกรณี search params เปลี่ยน)
        if (latestTokenRef.current !== token) return;

        if (j && "ok" in j && j.ok === true) {
          localStorage.setItem("email_verif_token", token);
          localStorage.setItem("email_verif_email", j.email);
          setEmail(j.email);
          setStatus("ok");
        } else {
          setStatus("bad");
        }
      } catch (e: unknown) {
        if ((e as { name?: string })?.name === "AbortError") return;
        setStatus("bad");
      }
    })();

    return () => {
      ac.abort();
    };
  }, [token]);

  if (status === "checking") return <div className="p-8">Verifying...</div>;
  if (status === "bad") return <div className="p-8">Invalid or expired link.</div>;

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-xl font-semibold">Email verified</h1>
      <p>{email}</p>
      <Button onClick={() => router.push("/register")}>Back</Button>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading…</div>}>
      <VerifyInner />
    </Suspense>
  );
}
