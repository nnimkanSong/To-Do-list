"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff } from "lucide-react";
import { TermsDialog } from "@/components/ui/TermsDialog";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function suggestEmailDomain(email: string) {
    if (!email.includes("@")) return null;
    const [local, domain] = email.split("@");
    if (!domain) return null;
    const map: Record<string, string> = {
        "gmil.com": "gmail.com",
        "gmai.com": "gmail.com",
        "gmal.com": "gmail.com",
        "gmail.co": "gmail.com",
        "gogglemail.com": "gmail.com",
        "hotnail.com": "hotmail.com",
        "outlok.com": "outlook.com",
        "yaho.com": "yahoo.com",
    };
    const fixed = map[domain.toLowerCase()];
    if (fixed && fixed !== domain) return `${local}@${fixed}`;
    return null;
}

function passwordChecks(pw: string) {
    return [
        { ok: pw.length >= 8, label: "≥ 8 characters" },
        { ok: /[A-Z]/.test(pw), label: "Uppercase" },
        { ok: /[a-z]/.test(pw), label: "Lowercase" },
        { ok: /\d/.test(pw), label: "Number" },
        { ok: /[^A-Za-z0-9]/.test(pw), label: "Symbol" },
    ];
}

export default function RegisterForm() {
    const emailId = useId();
    const passwordId = useId();
    const confirmId = useId();
    const termsId = useId();

    const [email, setEmail] = useState("");
    const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);
    const [emailSent, setEmailSent] = useState<null | "sending" | "sent" | "error">(null);
    const [cooldown, setCooldown] = useState(0);

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [accepted, setAccepted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [showPwd, setShowPwd] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const items = useMemo(() => passwordChecks(password), [password]);
    const passed = items.filter(i => i.ok).length;
    const total = items.length;
    const strongEnough = passed >= 4;
    const passwordsMatch = confirm.length === 0 || password === confirm;

    const [verifToken, setVerifToken] = useState<string | null>(null);
    const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);

    useEffect(() => {
        const s = suggestEmailDomain(email.trim());
        setEmailSuggestion(s && s !== email.trim() ? s : null);
    }, [email]);

    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setInterval(() => setCooldown(c => c - 1), 1000);
        return () => clearInterval(t);
    }, [cooldown]);

    // โหลด token จากหน้า /verify
    useEffect(() => {
        const t = localStorage.getItem("email_verif_token");
        const e = localStorage.getItem("email_verif_email");
        setVerifToken(t);
        setVerifiedEmail(e);
    }, []);

    const emailVerified = !!verifToken && verifiedEmail?.toLowerCase() === email.toLowerCase();

    async function handleSendVerify() {
        const value = email.trim();
        if (!EMAIL_RE.test(value)) {
            alert("กรุณากรอกอีเมลให้ถูกต้องก่อนส่งยืนยัน");
            return;
        }
        setEmailSent("sending");
        try {
            const res = await fetch("/api/auth/send-verification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: value }),
            });
            
            if (!res.ok) throw new Error("Send failed");
            setEmailSent("sent");
            setCooldown(60);
        } catch {
            setEmailSent("error");
        }
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!accepted) return alert("กรุณายอมรับเงื่อนไขการใช้งาน");
        if (!strongEnough) return alert("รหัสผ่านยังไม่แข็งแรงพอ");
        if (!passwordsMatch) return alert("รหัสผ่านยืนยันไม่ตรงกัน");
        if (!emailVerified || !verifToken) return alert("กรุณายืนยันอีเมลจากลิงก์ในกล่องจดหมาย");

        try {
            setSubmitting(true);
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    password,
                    verificationToken: verifToken,
                }),
            });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j?.error || "Register failed");
            }
            alert("สมัครสำเร็จ!");
            // เคลียร์ token เพื่อกันใช้ซ้ำ
            localStorage.removeItem("email_verif_token");
            localStorage.removeItem("email_verif_email");
        } catch (e: any) {
            alert(e.message || "สมัครไม่สำเร็จ");
        } finally {
            setSubmitting(false);
        }
    }
    
    return (
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
            {/* Email */}
            <div className="space-y-2">
                <Label htmlFor={emailId}>Email address</Label>
                <div className="flex gap-2 items-center">
                    <Input
                        id={emailId}
                        className="flex-1"
                        placeholder="you@example.com"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        aria-invalid={email.length > 0 && !EMAIL_RE.test(email)}
                    />
                    <Button
                        variant="outline"
                        type="button"
                        onClick={handleSendVerify}
                        disabled={cooldown > 0 || emailSent === "sending"}
                    >
                        {emailVerified ? "Verified ✓" :
                            emailSent === "sending" ? "Sending..." :
                                cooldown > 0 ? `Resend (${cooldown}s)` :
                                    emailSent === "sent" ? "Resend" : "Send"}
                    </Button>
                </div>
                {emailSuggestion && (
                    <div className="text-xs">
                        คุณหมายถึง{" "}
                        <button
                            type="button"
                            className="underline underline-offset-4"
                            onClick={() => setEmail(emailSuggestion)}
                        >
                            {emailSuggestion}
                        </button>{" "}
                        หรือไม่?
                    </div>
                )}
            </div>

            {/* Password */}
            <div className="space-y-2">
                <Label htmlFor={passwordId}>Password</Label>
                <div className="relative">
                    <Input
                        id={passwordId}
                        className="pe-9"
                        placeholder="Password"
                        type={showPwd ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        aria-invalid={!strongEnough}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPwd(v => !v)}
                        aria-label={showPwd ? "Hide password" : "Show password"}
                        aria-controls={passwordId}
                        className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center text-muted-foreground/80 hover:text-foreground"
                    >
                        {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
                {/* Strength meter */}
                <div className="space-y-1">
                    <div className="h-1 w-full rounded bg-muted">
                        <div className="h-1 rounded bg-primary transition-all" style={{ width: `${(passed / total) * 100}%` }} />
                    </div>
                    <ul className="text-xs grid gap-1">
                        {items.map((c, i) => (
                            <li key={i} className={c.ok ? "text-foreground" : "text-muted-foreground"}>
                                {c.ok ? "✓" : "•"} {c.label}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Confirm */}
            <div className="space-y-2">
                <Label htmlFor={confirmId}>Confirm Password</Label>
                <div className="relative">
                    <Input
                        id={confirmId}
                        className="pe-9"
                        placeholder="Confirm password"
                        type={showConfirm ? "text" : "password"}
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        required
                        aria-invalid={!passwordsMatch}
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirm(v => !v)}
                        aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                        aria-controls={confirmId}
                        className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center text-muted-foreground/80 hover:text-foreground"
                    >
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
                {!passwordsMatch && <p className="text-xs text-destructive/90">Passwords do not match.</p>}
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2">
                <Checkbox
                    id={termsId}
                    checked={accepted}
                    onCheckedChange={(v) => setAccepted(v === true)}
                    aria-invalid={!accepted}
                />
                <Label htmlFor={termsId} className="text-sm leading-6">
                    I agree to the <TermsDialog>Terms of Service</TermsDialog>
                </Label>
            </div>
            {!accepted && <p className="text-xs text-destructive/90">You must accept the Terms to continue.</p>}

            {/* Submit */}
            <Button
                type="submit"
                className="w-full"
                disabled={!accepted || !passwordsMatch || !strongEnough || !emailVerified || submitting}
            >
                {submitting ? "Registering..." : "Register"}
            </Button>
        </form>
    );
}
