"use client";

import { ApprovalStep } from "../lib/types";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function ApprovalQueue({
  steps,
  selectedRequestId,
  onSelect,
}: {
  steps: (ApprovalStep & { requestAmount?: number; requestVendor?: string })[];
  selectedRequestId: string | null;
  onSelect: (requestId: string) => void;
}) {
  return (
    <div className="w-[340px] shrink-0 border-r border-line bg-paper">
      <div className="border-b border-line px-5 py-4">
        <h2 className="font-sans text-sm font-semibold text-ink">Your approvals</h2>
        <div className="mt-0.5 font-mono text-xs text-slate">{steps.length} pending</div>
      </div>

      {steps.length === 0 && (
        <div className="px-5 py-8 text-sm text-slate font-body">Nothing waiting on you right now.</div>
      )}

      <div>
        {steps.map((step) => (
          <button
            key={step.id}
            onClick={() => onSelect(step.purchaseRequestId)}
            className={`block w-full border-b border-line px-5 py-3 text-left transition-colors ${
              selectedRequestId === step.purchaseRequestId ? "bg-teal-dim" : "hover:bg-white"
            }`}
          >
            <div className="flex items-baseline justify-between">
              <span className="font-body text-sm text-ink">{step.requestVendor ?? "Purchase request"}</span>
              <span className="font-mono text-sm text-ink">
                {step.requestAmount ? currency.format(step.requestAmount) : ""}
              </span>
            </div>
            <div className="mt-0.5 text-xs text-slate font-body">{step.approverRole.replace(/_/g, " ")}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
