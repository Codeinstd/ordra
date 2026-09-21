"use client";

import { useEffect, useState } from "react";
import { fetchDelegations, createDelegation, cancelDelegation } from "../lib/api";
import { DelegationsResponse } from "../lib/types";

function fmt(d: string) {
  return new Date(d).toLocaleDateString();
}

export function DelegationsSection({ token }: { token: string }) {
  const [data, setData] = useState<DelegationsResponse | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [delegateEmail, setDelegateEmail] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function load() {
    fetchDelegations(token).then(setData).catch((e) => setError(e.message));
  }
  useEffect(load, [token]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await createDelegation(token, { delegateEmail, startDate, endDate, reason: reason || undefined });
      setDelegateEmail("");
      setStartDate("");
      setEndDate("");
      setReason("");
      setShowForm(false);
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel(id: string) {
    await cancelDelegation(token, id);
    load();
  }

  return (
    <div className="mt-10 border-t border-line pt-8">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="font-body text-sm font-medium text-slate">Delegations</h2>
        <button onClick={() => setShowForm(!showForm)} className="font-body text-xs text-teal hover:underline">
          {showForm ? "Cancel" : "+ Delegate my approvals"}
        </button>
      </div>
      <p className="mb-4 font-body text-xs text-slate">
        While a delegation is active, anything that would route to you routes to your delegate
        instead — useful for time off. This doesn't change anything already assigned.
      </p>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 border border-line bg-paper p-4">
          <label className="mb-1 block font-body text-xs text-slate">Delegate to (teammate's email)</label>
          <input
            type="email"
            required
            value={delegateEmail}
            onChange={(e) => setDelegateEmail(e.target.value)}
            className="mb-3 w-full border border-line bg-white px-3 py-2 font-body text-sm text-ink"
          />
          <div className="mb-3 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-body text-xs text-slate">Start date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-line bg-white px-3 py-2 font-body text-sm text-ink"
              />
            </div>
            <div>
              <label className="mb-1 block font-body text-xs text-slate">End date</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-line bg-white px-3 py-2 font-body text-sm text-ink"
              />
            </div>
          </div>
          <label className="mb-1 block font-body text-xs text-slate">Reason (optional)</label>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. out of office"
            className="mb-3 w-full border border-line bg-white px-3 py-2 font-body text-sm text-ink"
          />
          {error && <div className="mb-3 font-body text-xs text-rust">{error}</div>}
          <button disabled={busy} type="submit" className="bg-teal px-4 py-1.5 font-body text-sm text-white hover:bg-teal/90 disabled:opacity-50">
            Create delegation
          </button>
        </form>
      )}

      {!showForm && error && <div className="mb-4 font-body text-xs text-rust">{error}</div>}

      <div className="mb-2 font-body text-xs text-slate">Given by you</div>
      {data?.given.length === 0 && <div className="mb-4 font-body text-xs text-slate">None active.</div>}
      <div className="mb-6 divide-y divide-line border-t border-line">
        {data?.given.map((d) => (
          <div key={d.id} className="flex items-center justify-between py-2">
            <div className="font-body text-sm text-ink">
              To {d.delegate.name} · {fmt(d.startDate)}–{fmt(d.endDate)}
              {d.reason && <span className="text-slate"> · {d.reason}</span>}
            </div>
            <button onClick={() => handleCancel(d.id)} className="font-mono text-xs text-slate hover:text-rust">
              cancel
            </button>
          </div>
        ))}
      </div>

      <div className="mb-2 font-body text-xs text-slate">Covering for others</div>
      {data?.received.length === 0 && <div className="font-body text-xs text-slate">None active.</div>}
      <div className="divide-y divide-line border-t border-line">
        {data?.received.map((d) => (
          <div key={d.id} className="py-2 font-body text-sm text-ink">
            From {d.delegator.name} · {fmt(d.startDate)}–{fmt(d.endDate)}
            {d.reason && <span className="text-slate"> · {d.reason}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
