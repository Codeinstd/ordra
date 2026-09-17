"use client";

import { useState } from "react";
import { PurchaseRequest } from "../lib/types";
import { ChainTimeline } from "./ChainTimeline";
import { approveStep, rejectStep } from "../lib/api";
import { PurchaseOrderPanel } from "./PurchaseOrderPanel";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function RequestDetail({
  request,
  currentUserId,
  token,
  onActed,
}: {
  request: PurchaseRequest;
  currentUserId: string;
  token: string;
  onActed: () => void;
}) {
  const [comments, setComments] = useState("");
  const [busy, setBusy] = useState(false);

  const myStep = request.steps.find((s) => s.approverUserId === currentUserId && s.status === "pending");

  async function handle(action: "approve" | "reject") {
    if (!myStep) return;
    setBusy(true);
    try {
      if (action === "approve") await approveStep(token, myStep.id, comments || undefined);
      else await rejectStep(token, myStep.id, comments || undefined);
      setComments("");
      onActed();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex-1 p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-sans text-xl font-semibold text-ink">
            {request.quote?.vendor?.name ?? request.vendorName ?? "Purchase request"}
          </h1>
          <div className="mt-1 text-sm text-slate font-body">
            {request.category} · {request.department} · RFQ {request.rfqId}
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-2xl text-ink">{currency.format(request.amount)}</div>
          <div className="text-xs font-mono text-slate uppercase">{request.status.replace("_", " ")}</div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="mb-3 font-body text-sm font-medium text-slate">Approval chain</h2>
        <ChainTimeline steps={request.steps} />
      </div>

      {myStep && (
        <div className="border-t border-line pt-4">
          <label className="mb-2 block font-body text-sm text-slate">Your decision</label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Add a comment (optional)"
            className="mb-3 w-full rounded-none border border-line bg-white px-3 py-2 font-body text-sm text-ink"
            rows={2}
          />
          <div className="flex gap-2">
            <button
              disabled={busy}
              onClick={() => handle("approve")}
              className="bg-teal px-4 py-2 font-body text-sm text-white hover:bg-teal/90 disabled:opacity-50"
            >
              Approve
            </button>
            <button
              disabled={busy}
              onClick={() => handle("reject")}
              className="border border-rust px-4 py-2 font-body text-sm text-rust hover:bg-rust/5 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        </div>
      )}

      {request.status === "approved" && <PurchaseOrderPanel token={token} purchaseRequestId={request.id} />}
    </div>
  );
}
