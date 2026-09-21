"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { fetchAccount, resendVerificationEmail } from "../lib/api";

const links = [
  { href: "/approvals", label: "Approvals" },
  { href: "/requests", label: "My requests" },
  { href: "/rfqs", label: "RFQs" },
  { href: "/review", label: "Review queue" },
  { href: "/vendors", label: "Vendors" },
  { href: "/policies", label: "Policies" },
  { href: "/audit", label: "Audit" },
  { href: "/team", label: "Team" },
];

export function AppNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const token = session?.backendToken;
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetchAccount(token)
      .then((a) => setEmailVerified(a.emailVerified))
      .catch(() => {});
  }, [token]);

  async function handleResend() {
    if (!token) return;
    await resendVerificationEmail(token);
    setResent(true);
  }

  return (
    <div>
      <nav className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex min-w-0 items-center gap-6">
            <Link href="/" className="shrink-0 font-sans text-sm font-semibold text-ink">
              Procurement
            </Link>
            <div className="flex items-center gap-4 overflow-x-auto whitespace-nowrap">
              {links.map((l) => {
                const active = pathname?.startsWith(l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={`font-body text-sm ${active ? "text-teal" : "text-slate hover:text-ink"}`}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <Link href="/requests/new" className="bg-teal px-3 py-1.5 font-body text-sm text-white hover:bg-teal/90">
              + New request
            </Link>
            <button onClick={() => signOut()} className="font-mono text-xs text-slate hover:text-ink">
              {session?.user?.email ?? "Sign out"}
            </button>
          </div>
        </div>
      </nav>
      {emailVerified === false && (
        <div className="border-b border-amber/30 bg-amber-dim px-6 py-2 text-center font-body text-xs text-ink">
          {resent ? (
            "Verification email sent — check your inbox."
          ) : (
            <>
              Please verify your email.{" "}
              <button onClick={handleResend} className="text-teal hover:underline">
                Resend verification email
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
