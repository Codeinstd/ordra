"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { AppNav } from "../../components/AppNav";
import { fetchMyRequests } from "../../lib/api";
import { PurchaseRequest } from "../../lib/types";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function statusTone(status: string) {
  switch (status) {
    case "approved": return "text-moss";
    case "rejected": return "text-rust";
    case "draft": return "text-slate";
    default: return "text-amber";
  }
}

export default function MyRequestsPage() {
  const { data: session } = useSession();
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.backendToken) return;
    fetchMyRequests(session.backendToken).then(setRequests).catch((e) => setError(e.message));
  }, [session?.backendToken]);

  return (
    <div>
      <AppNav />
      <div className="mx-auto max-w-3xl p-8">
        <div className="mb-6 flex items-baseline justify-between">
          <h1 className="font-sans text-xl font-semibold text-ink">Your requests</h1>
          <Link href="/requests/new" className="font-body text-sm text-teal hover:underline">
            + New request
          </Link>
        </div>

        {error && <div className="font-body text-sm text-rust">{error}</div>}
        {requests.length === 0 && !error && (
          <div className="font-body text-sm text-slate">You haven't submitted any requests yet.</div>
        )}

        <div className="divide-y divide-line border-t border-line">
          {requests.map((r) => (
            <Link key={r.id} href={`/requests/${r.id}`} className="flex items-center justify-between py-4 hover:bg-paper">
              <div>
                <div className="font-body text-sm text-ink">{r.quote?.vendor?.name ?? "Purchase request"}</div>
                <div className="mt-0.5 font-body text-xs text-slate">
                  {r.category}, {r.department}
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm text-ink">{currency.format(r.amount)}</div>
                <div className={`mt-0.5 font-mono text-xs uppercase ${statusTone(r.status)}`}>
                  {r.status.replace("_", " ")}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
