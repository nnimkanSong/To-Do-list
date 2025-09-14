"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function VerifyPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const token = sp.get("token");
  const [status, setStatus] = useState<"checking"|"ok"|"bad">("checking");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!token) { setStatus("bad"); return; }
    (async () => {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) { setStatus("bad"); return; }
      const j = await res.json();
      if (j.ok) {
        localStorage.setItem("email_verif_token", token);
        localStorage.setItem("email_verif_email", j.email);
        setEmail(j.email);
        setStatus("ok");
      } else setStatus("bad");
    })();
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
