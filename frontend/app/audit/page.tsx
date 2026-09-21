"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { AppNav } from "../../components/AppNav";
import { fetchAuditLog } from "../../lib/api";
import { AuditLogEntry } from "../../lib/types";

function eventTone(eventType: string) {
  if (eventType === "approved") return "text-moss";
  if (eventType === "rejected" || eventType === "finalization_blocked_reroute") return "text-rust";
  if (eventType === "step_escalated") return "text-amber";
  return "text-slate";
}

export default function AuditPage() {
  const { data: session } = useSession();
  const token = session?.backendToken;
  const [events, setEvents] = useState<AuditLogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchAuditLog(token).then(setEvents).catch((e) => setError(e.message));
  }, [token]);

  return (
    <div>
      <AppNav />
      <div className="mx-auto max-w-3xl p-8">
        <h1 className="mb-1 font-sans text-xl font-semibold text-ink">Audit log</h1>
        <p className="mb-6 font-body text-sm text-slate">
          Every routing, approval, and rejection event across the organization, most recent
          first.
        </p>

        {error && <div className="font-body text-sm text-rust">{error}</div>}
        {events.length === 0 && !error && <div className="font-body text-sm text-slate">No events yet.</div>}

        <div className="divide-y divide-line border-t border-line">
          {events.map((e) => (
            <div key={e.id} className="py-3">
              <div className="flex items-baseline justify-between">
                <Link href={`/requests/${e.purchaseRequestId}`} className="font-body text-sm text-ink hover:underline">
                  {e.purchaseRequest.quote.vendor.name} — {e.purchaseRequest.category}, {e.purchaseRequest.department}
                </Link>
                <span className="font-mono text-xs text-slate">{new Date(e.createdAt).toLocaleString()}</span>
              </div>
              <div className={`mt-0.5 font-mono text-xs uppercase ${eventTone(e.eventType)}`}>
                {e.eventType.replace(/_/g, " ")}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
