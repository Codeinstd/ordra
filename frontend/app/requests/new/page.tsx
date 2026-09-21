"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { AppNav } from "../../../components/AppNav";
import { createQuickRequest } from "../../../lib/api";

export default function NewRequestPage() {
  const { data: session } = useSession();
  const [vendorName, setVendorName] = useState("Acme Industrial");
  const [category, setCategory] = useState("equipment");
  const [department, setDepartment] = useState("engineering");
  const [amount, setAmount] = useState("15000");
  const [result, setResult] = useState<{ id: string; status: string; steps: { approverRole: string }[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.backendToken) return;
    setBusy(true);
    setError(null);
    try {
      const pr = await createQuickRequest(session.backendToken, {
        vendorName,
        category,
        department,
        amount: Number(amount),
      });
      setResult(pr);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <AppNav />
      <div className="mx-auto max-w-md p-8">
      <h1 className="mb-2 font-sans text-xl font-semibold text-ink">New purchase request</h1>
      <p className="mb-6 font-body text-sm text-slate">
        Creates a vendor, RFQ, and quote behind the scenes, then submits the request for
        approval immediately — a shortcut for testing the approval flow.
      </p>

      <form onSubmit={handleSubmit}>
        <label className="mb-1 block font-body text-xs text-slate">Vendor</label>
        <input
          value={vendorName}
          onChange={(e) => setVendorName(e.target.value)}
          className="mb-4 w-full border border-line px-3 py-2 font-body text-sm text-ink"
        />
        <label className="mb-1 block font-body text-xs text-slate">Category</label>
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mb-4 w-full border border-line px-3 py-2 font-body text-sm text-ink"
        />
        <label className="mb-1 block font-body text-xs text-slate">Department</label>
        <input
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="mb-4 w-full border border-line px-3 py-2 font-body text-sm text-ink"
        />
        <label className="mb-1 block font-body text-xs text-slate">Amount (USD)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mb-6 w-full border border-line px-3 py-2 font-body text-sm text-ink"
        />
        {error && <div className="mb-4 font-body text-xs text-rust">{error}</div>}
        <button
          type="submit"
          disabled={busy}
          className="w-full bg-teal py-2 font-body text-sm text-white hover:bg-teal/90 disabled:opacity-50"
        >
          Create and submit
        </button>
      </form>

      {result && (
        <div className="mt-6 border-t border-line pt-4">
          <div className="font-body text-sm text-ink">Request created — status: {result.status}</div>
          <div className="mt-2 font-body text-xs text-slate">Routed to:</div>
          <ul className="mt-1 space-y-1">
            {result.steps.map((s, i) => (
              <li key={i} className="font-mono text-xs text-slate">
                {s.approverRole.replace(/_/g, " ")}
              </li>
            ))}
          </ul>
          <p className="mt-3 font-body text-xs text-slate">
            Sign in as one of those approvers to see it in their /approvals queue.
          </p>
          <Link href={`/requests/${result.id}`} className="mt-3 inline-block font-body text-xs text-teal hover:underline">
            View request
          </Link>
        </div>
      )}
      </div>
    </div>
  );
}
