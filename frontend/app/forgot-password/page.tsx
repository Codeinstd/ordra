"use client";

import { useState } from "react";
import Link from "next/link";
import { forgotPassword } from "../../lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await forgotPassword(email);
    } finally {
      setBusy(false);
      // Always shows the same confirmation, whether or not the email has
      // an account — the response itself must not reveal that.
      setSent(true);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <div className="w-full max-w-sm border border-line bg-white p-8">
        <h1 className="mb-6 font-sans text-lg font-semibold text-ink">Reset your password</h1>

        {sent ? (
          <p className="font-body text-sm text-slate">
            If an account exists for that email, a reset link is on its way. It expires in 1
            hour.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="mb-1 block font-body text-xs text-slate">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mb-4 w-full border border-line px-3 py-2 font-body text-sm text-ink"
            />
            <button disabled={busy} type="submit" className="w-full bg-teal py-2 font-body text-sm text-white hover:bg-teal/90 disabled:opacity-50">
              Send reset link
            </button>
          </form>
        )}

        <Link href="/signin" className="mt-4 block font-body text-xs text-slate hover:text-ink">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
