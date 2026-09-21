"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { verifyEmail } from "../../lib/api";

function VerifyEmailContent() {
  const token = useSearchParams().get("token");
  const [state, setState] = useState<"checking" | "verified" | "error">("checking");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setState("error");
      setError("Missing verification token.");
      return;
    }
    verifyEmail(token)
      .then(() => setState("verified"))
      .catch((e) => {
        setState("error");
        setError(e.message);
      });
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <div className="w-full max-w-sm border border-line bg-white p-8 text-center">
        {state === "checking" && <p className="font-body text-sm text-slate">Verifying…</p>}
        {state === "verified" && (
          <>
            <p className="mb-4 font-body text-sm text-moss">Your email is verified.</p>
            <Link href="/approvals" className="font-body text-sm text-teal hover:underline">
              Continue to the app
            </Link>
          </>
        )}
        {state === "error" && <p className="font-body text-sm text-rust">{error}</p>}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
