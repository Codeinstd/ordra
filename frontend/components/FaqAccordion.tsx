"use client";

import { useState } from "react";

const faqs = [
  {
    q: "Does this replace our ERP or procurement system?",
    a: "No. It sits in front of sourcing and approvals, then exports the finished purchase order to whatever you already run — SAP Ariba, Coupa, NetSuite, or a CSV drop for anything else.",
  },
  {
    q: "What happens if a quote changes after routing starts?",
    a: "Any change to amount, department, or category re-resolves the approval chain automatically. Approvals already given are preserved where they still apply; anything that no longer satisfies the current policy is never counted toward final sign-off.",
  },
  {
    q: "Can the AI approve or send anything on its own?",
    a: "No. Extraction and negotiation drafts are generated automatically, but nothing is sent and no purchase request is approved without a person taking that action.",
  },
  {
    q: "How is vendor reliability scored?",
    a: "From concrete signals — on-time delivery history, certifications, financial health, and past performance — combined with a written rationale, not a single opaque number.",
  },
  {
    q: "Can we customize approval chains per department or category?",
    a: "Yes. Chains are defined as policies keyed on department, category, and amount thresholds, including parallel sign-off steps and conditional approvers like a CFO threshold.",
  },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-line border-t border-line">
      {faqs.map((item, i) => {
        const open = openIndex === i;
        return (
          <div key={item.q}>
            <button
              onClick={() => setOpenIndex(open ? null : i)}
              className="flex w-full items-center justify-between gap-6 py-6 text-left"
              aria-expanded={open}
            >
              <span className="font-body text-base text-ink">{item.q}</span>
              <span className="font-mono text-lg text-slate">{open ? "–" : "+"}</span>
            </button>
            {open && <p className="max-w-xl pb-6 font-body text-sm leading-relaxed text-slate">{item.a}</p>}
          </div>
        );
      })}
    </div>
  );
}
