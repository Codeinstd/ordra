"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { AppNav } from "../../components/AppNav";
import { fetchRfqs } from "../../lib/api";
import { RfqEvent } from "../../lib/types";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function RfqsPage() {
  const { data: session } = useSession();
  const [rfqs, setRfqs] = useState<RfqEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.backendToken) return;
    fetchRfqs(session.backendToken).then(setRfqs).catch((e) => setError(e.message));
  }, [session?.backendToken]);

  return (
    <div>
      <AppNav />
      <div className="mx-auto max-w-3xl p-8">
        <h1 className="mb-6 font-sans text-xl font-semibold text-ink">RFQs</h1>

        {error && <div className="font-body text-sm text-rust">{error}</div>}
        {rfqs.length === 0 && !error && <div className="font-body text-sm text-slate">No RFQs yet.</div>}

        <div className="divide-y divide-line border-t border-line">
          {rfqs.map((r) => (
            <Link key={r.id} href={`/rfqs/${r.id}/compare`} className="flex items-center justify-between py-4 hover:bg-paper">
              <div>
                <div className="font-body text-sm text-ink">{r.title}</div>
                <div className="mt-0.5 font-body text-xs text-slate">
                  {r.category} · {r.quotes.length} {r.quotes.length === 1 ? "quote" : "quotes"}
                </div>
              </div>
              <div className="text-right">
                {r.budget != null && <div className="font-mono text-sm text-ink">{currency.format(r.budget)}</div>}
                <div className="mt-0.5 font-mono text-xs uppercase text-slate">{r.status}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
