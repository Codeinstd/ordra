"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { AppNav } from "../../../components/AppNav";
import { fetchRfq, fetchVendors, addQuoteToRfq, startNegotiation } from "../../../lib/api";
import { RfqEvent, Vendor } from "../../../lib/types";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function statusTone(status: string) {
  switch (status) {
    case "ready": return "text-moss";
    case "needs_review": return "text-amber";
    case "extracting": return "text-slate";
    default: return "text-slate";
  }
}

export default function RfqDetailPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const token = session?.backendToken;
  const [rfq, setRfq] = useState<RfqEvent | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [vendorId, setVendorId] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [rawEmailText, setRawEmailText] = useState("");
  const [busy, setBusy] = useState(false);

  function load() {
    if (!token) return;
    fetchRfq(token, params.id).then(setRfq).catch((e) => setError(e.message));
    fetchVendors(token).then(setVendors).catch(() => {});
  }
  useEffect(load, [token, params.id]);

  async function handleAddQuote(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      await addQuoteToRfq(token, params.id, {
        vendorId,
        rawEmailText,
        totalPrice: totalPrice ? Number(totalPrice) : undefined,
      });
      setVendorId("");
      setTotalPrice("");
      setRawEmailText("");
      setShowForm(false);
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleNegotiate(quoteId: string) {
    if (!token) return;
    const thread = await startNegotiation(token, quoteId, 10);
    window.location.href = `/negotiations/${thread.id}`;
  }

  return (
    <div>
      <AppNav />
      <div className="mx-auto max-w-2xl p-8">
        {rfq && (
          <>
            <h1 className="mb-1 font-sans text-xl font-semibold text-ink">{rfq.title}</h1>
            <p className="mb-6 font-body text-sm text-slate">
              {rfq.category} {rfq.budget != null ? `· budget ${currency.format(rfq.budget)}` : ""}
            </p>
          </>
        )}

        <div className="mb-6 flex items-center gap-4">
          <button onClick={() => setShowForm(!showForm)} className="font-body text-sm text-teal hover:underline">
            {showForm ? "Cancel" : "+ Add quote"}
          </button>
          {rfq && (
            <Link href={`/rfqs/${rfq.id}/compare`} className="font-body text-sm text-teal hover:underline">
              View comparison
            </Link>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleAddQuote} className="mb-8 border border-line bg-paper p-5">
            <p className="mb-4 font-body text-xs text-slate">
              Pastes in as a real vendor reply and runs it through spec extraction — the same
              pipeline real inbound quotes go through, just skipping email outreach for testing.
            </p>
            <label className="mb-1 block font-body text-xs text-slate">Vendor</label>
            <select
              required
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              className="mb-4 w-full border border-line bg-white px-3 py-2 font-body text-sm text-ink"
            >
              <option value="">Select a vendor</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
            <label className="mb-1 block font-body text-xs text-slate">Total price (optional)</label>
            <input
              type="number"
              value={totalPrice}
              onChange={(e) => setTotalPrice(e.target.value)}
              className="mb-4 w-full border border-line bg-white px-3 py-2 font-body text-sm text-ink"
            />
            <label className="mb-1 block font-body text-xs text-slate">Quote text</label>
            <textarea
              required
              rows={5}
              value={rawEmailText}
              onChange={(e) => setRawEmailText(e.target.value)}
              placeholder="Paste the vendor's quote email or spec sheet text here"
              className="mb-4 w-full border border-line bg-white px-3 py-2 font-body text-sm text-ink"
            />
            {error && <div className="mb-4 font-body text-xs text-rust">{error}</div>}
            <button disabled={busy} type="submit" className="bg-teal px-4 py-2 font-body text-sm text-white hover:bg-teal/90 disabled:opacity-50">
              Add and extract
            </button>
          </form>
        )}

        {!showForm && error && <div className="mb-4 font-body text-sm text-rust">{error}</div>}

        <h2 className="mb-3 font-body text-sm font-medium text-slate">Quotes</h2>
        {rfq?.quotes.length === 0 && <div className="font-body text-sm text-slate">No quotes yet.</div>}
        <div className="divide-y divide-line border-t border-line">
          {rfq?.quotes.map((q) => (
            <div key={q.id} className="flex items-center justify-between py-4">
              <div>
                <div className="font-body text-sm text-ink">{q.vendor.name}</div>
                <div className={`mt-0.5 font-mono text-xs uppercase ${statusTone(q.status)}`}>{q.status.replace("_", " ")}</div>
              </div>
              <div className="flex items-center gap-4">
                {q.totalPrice != null && <span className="font-mono text-sm text-ink">{currency.format(q.totalPrice)}</span>}
                <button onClick={() => handleNegotiate(q.id)} className="font-body text-xs text-teal hover:underline">
                  Negotiate
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
