"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AppNav } from "../../../components/AppNav";
import {
  fetchNegotiation,
  generateNegotiationDraft,
  approveAndSendNegotiation,
  recordVendorResponse,
} from "../../../lib/api";
import { NegotiationThread } from "../../../lib/types";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function directionLabel(direction: string) {
  switch (direction) {
    case "outbound_draft": return "Draft — awaiting approval";
    case "outbound_sent": return "Sent";
    case "inbound": return "Vendor reply";
    default: return direction;
  }
}

export default function NegotiationPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const token = session?.backendToken;
  const [thread, setThread] = useState<NegotiationThread | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [comparableQuotesSummary, setComparableQuotesSummary] = useState("");
  const [vendorReply, setVendorReply] = useState("");
  const [busy, setBusy] = useState(false);

  function load() {
    if (!token) return;
    fetchNegotiation(token, params.id).then(setThread).catch((e) => setError(e.message));
  }
  useEffect(load, [token, params.id]);

  async function handleDraft() {
    if (!token || !thread) return;
    setBusy(true);
    setError(null);
    try {
      const vendorQuoteSummary = `${thread.quote.vendor.name} quoted ${
        thread.quote.totalPrice != null ? currency.format(thread.quote.totalPrice) : "an unspecified amount"
      } for ${thread.quote.rfqEvent.title}.`;
      await generateNegotiationDraft(token, thread.id, vendorQuoteSummary, comparableQuotesSummary);
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleApproveAndSend(messageId: string) {
    if (!token) return;
    setBusy(true);
    try {
      await approveAndSendNegotiation(token, messageId);
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleVendorReply(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !thread) return;
    setBusy(true);
    try {
      await recordVendorResponse(token, thread.id, vendorReply);
      setVendorReply("");
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
      <div className="mx-auto max-w-2xl p-8">
        {error && <div className="mb-4 font-body text-sm text-rust">{error}</div>}
        {thread && (
          <>
            <h1 className="font-sans text-xl font-semibold text-ink">{thread.quote.vendor.name}</h1>
            <p className="mb-1 font-body text-sm text-slate">{thread.quote.rfqEvent.title}</p>
            <div className="mb-6 flex items-center gap-4">
              {thread.quote.totalPrice != null && (
                <span className="font-mono text-lg text-ink">{currency.format(thread.quote.totalPrice)}</span>
              )}
              <span className="font-mono text-xs uppercase text-slate">{thread.status.replace("_", " ")}</span>
              {thread.targetSavingsPct != null && (
                <span className="font-mono text-xs text-slate">target {thread.targetSavingsPct}% savings</span>
              )}
            </div>

            <div className="mb-8 space-y-4">
              {thread.messages.map((m) => (
                <div key={m.id} className="border border-line p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-mono text-xs text-slate">{directionLabel(m.direction)}</span>
                    <span className="font-mono text-xs text-slate">{new Date(m.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="whitespace-pre-line font-body text-sm text-ink">{m.body}</p>
                  {m.direction === "outbound_draft" && !m.approvedAt && (
                    <button
                      onClick={() => handleApproveAndSend(m.id)}
                      disabled={busy}
                      className="mt-3 bg-teal px-4 py-1.5 font-body text-sm text-white hover:bg-teal/90 disabled:opacity-50"
                    >
                      Approve & send
                    </button>
                  )}
                </div>
              ))}
              {thread.messages.length === 0 && (
                <div className="font-body text-sm text-slate">No messages yet — generate a draft to start.</div>
              )}
            </div>

            <div className="mb-8 border-t border-line pt-6">
              <label className="mb-1 block font-body text-xs text-slate">
                Comparable quotes (used to draft a counter-offer)
              </label>
              <textarea
                rows={2}
                value={comparableQuotesSummary}
                onChange={(e) => setComparableQuotesSummary(e.target.value)}
                placeholder="e.g. Global Supply Co quoted $91,200 for the same equipment"
                className="mb-3 w-full border border-line px-3 py-2 font-body text-sm text-ink"
              />
              <button
                onClick={handleDraft}
                disabled={busy}
                className="border border-line px-4 py-2 font-body text-sm text-ink hover:bg-paper disabled:opacity-50"
              >
                Generate draft
              </button>
            </div>

            <div className="border-t border-line pt-6">
              <h2 className="mb-2 font-body text-sm font-medium text-slate">Simulate vendor reply</h2>
              <form onSubmit={handleVendorReply}>
                <textarea
                  rows={2}
                  required
                  value={vendorReply}
                  onChange={(e) => setVendorReply(e.target.value)}
                  placeholder="For testing — records an inbound message as if the vendor replied"
                  className="mb-3 w-full border border-line px-3 py-2 font-body text-sm text-ink"
                />
                <button disabled={busy} type="submit" className="border border-line px-4 py-2 font-body text-sm text-ink hover:bg-paper disabled:opacity-50">
                  Record reply
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
