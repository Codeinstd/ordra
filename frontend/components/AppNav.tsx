"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const links = [
  { href: "/approvals", label: "Approvals" },
  { href: "/requests", label: "My requests" },
  { href: "/rfqs", label: "RFQs" },
  { href: "/vendors", label: "Vendors" },
];

export function AppNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <nav className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-sans text-sm font-semibold text-ink">
            Procurement
          </Link>
          <div className="flex items-center gap-5">
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
        <div className="flex items-center gap-4">
          <Link href="/requests/new" className="bg-teal px-3 py-1.5 font-body text-sm text-white hover:bg-teal/90">
            + New request
          </Link>
          <button onClick={() => signOut()} className="font-mono text-xs text-slate hover:text-ink">
            {session?.user?.email ?? "Sign out"}
          </button>
        </div>
      </div>
    </nav>
  );
}
