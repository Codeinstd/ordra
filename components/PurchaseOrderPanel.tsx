"use client";

import { useState } from "react";
import { fetchPurchaseOrder, exportPurchaseOrder, PurchaseOrder } from "../lib/api";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function PurchaseOrderPanel({ token, purchaseRequestId }: { token: string; purchaseRequestId: string }) {
  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [exported, setExported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function loadPo() {
    setBusy(true);
    setError(null);
    try {
      setPo(await fetchPurchaseOrder(token, purchaseRequestId));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleExport() {
    setBusy(true);
    try {
      await exportPurchaseOrder(token, purchaseRequestId);
      setExported(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 border-t border-line pt-6">
      <h2 className="mb-3 font-body text-sm font-medium text-slate">Purchase order</h2>

      {!po && (
        <button onClick={loadPo} disabled={busy} className="border border-line px-4 py-2 font-body text-sm text-ink hover:bg-paper">
          Generate purchase order
        </button>
      )}
      {error && <div className="mt-2 font-body text-xs text-rust">{error}</div>}

      {po && (
        <div className="bg-paper p-5">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-sm text-ink">{po.poNumber}</span>
            <span className="font-mono text-lg text-ink">{currency.format(po.amount)}</span>
          </div>
          <div className="mt-1 font-body text-sm text-slate">{po.vendor}</div>
          <div className="mt-4 space-y-1">
            {po.lineItems.map((li, i) => (
              <div key={i} className="font-mono text-xs text-slate">{li}</div>
            ))}
          </div>
          <div className="mt-4 border-t border-line pt-3 font-mono text-xs text-slate whitespace-pre-line">
            {po.approvalTrail}
          </div>
          <button
            onClick={handleExport}
            disabled={busy || exported}
            className="mt-4 bg-teal px-4 py-2 font-body text-sm text-white hover:bg-teal/90 disabled:opacity-50"
          >
            {exported ? "Exported" : "Export to ERP"}
          </button>
        </div>
      )}
    </div>
  );
}
