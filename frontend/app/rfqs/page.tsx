"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { AppNav } from "../../components/AppNav";
import { fetchRfqs } from "../../lib/api";
import { RfqEvent } from "../../lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000/api";
const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function RfqsPage() {
  const { data: session } = useSession();
  const token = session?.backendToken;
  const [rfqs, setRfqs] = useState<RfqEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [budget, setBudget] = useState("");
  const [busy, setBusy] = useState(false);

  function load() {
    if (!token) return;
    fetchRfqs(token).then(setRfqs).catch((e) => setError(e.message));
  }
  useEffect(load, [token]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/rfqs`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, category, budget: budget ? Number(budget) : undefined }),
      });
      if (!res.ok) throw new Error(`Failed to create RFQ: ${res.status}`);
      setTitle("");
      setCategory("");
      setBudget("");
      setShowForm(false);
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <AppNav />
      <div className="mx-auto max-w-3xl p-8">
        <div className="mb-6 flex items-baseline justify-between">
          <h1 className="font-sans text-xl font-semibold text-ink">RFQs</h1>
          <button onClick={() => setShowForm(!showForm)} className="font-body text-sm text-teal hover:underline">
            {showForm ? "Cancel" : "+ New RFQ"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="mb-8 border border-line bg-paper p-5">
            <label className="mb-1 block font-body text-xs text-slate">Title</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mb-4 w-full border border-line bg-white px-3 py-2 font-body text-sm text-ink"
            />
            <label className="mb-1 block font-body text-xs text-slate">Category</label>
            <input
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mb-4 w-full border border-line bg-white px-3 py-2 font-body text-sm text-ink"
            />
            <label className="mb-1 block font-body text-xs text-slate">Budget (optional)</label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="mb-4 w-full border border-line bg-white px-3 py-2 font-body text-sm text-ink"
            />
            {error && <div className="mb-4 font-body text-xs text-rust">{error}</div>}
            <button disabled={busy} type="submit" className="bg-teal px-4 py-2 font-body text-sm text-white hover:bg-teal/90 disabled:opacity-50">
              Create RFQ
            </button>
          </form>
        )}

        {!showForm && error && <div className="font-body text-sm text-rust">{error}</div>}
        {rfqs.length === 0 && !error && <div className="font-body text-sm text-slate">No RFQs yet.</div>}

        <div className="divide-y divide-line border-t border-line">
          {rfqs.map((r) => (
            <Link key={r.id} href={`/rfqs/${r.id}`} className="flex items-center justify-between py-4 hover:bg-paper">
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
