"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPassword } from "../../lib/api";

function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      await resetPassword(token, password);
      setDone(true);
      setTimeout(() => router.push("/signin"), 2000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <div className="w-full max-w-sm border border-line bg-white p-8">
        <h1 className="mb-6 font-sans text-lg font-semibold text-ink">Set a new password</h1>

        {!token && (
          <p className="font-body text-sm text-rust">
            This link is missing its token. Request a new one from the{" "}
            <Link href="/forgot-password" className="text-teal hover:underline">
              reset page
            </Link>
            .
          </p>
        )}

        {token && done && <p className="font-body text-sm text-moss">Password updated — redirecting to sign in.</p>}

        {token && !done && (
          <form onSubmit={handleSubmit}>
            <label className="mb-1 block font-body text-xs text-slate">New password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mb-4 w-full border border-line px-3 py-2 font-body text-sm text-ink"
            />
            {error && <div className="mb-4 font-body text-xs text-rust">{error}</div>}
            <button disabled={busy} type="submit" className="w-full bg-teal py-2 font-body text-sm text-white hover:bg-teal/90 disabled:opacity-50">
              Update password
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
