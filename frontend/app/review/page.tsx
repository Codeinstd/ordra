"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { AppNav } from "../../components/AppNav";
import { fetchReviewQueue, reviewExtractedField } from "../../lib/api";
import { ReviewQueueItem } from "../../lib/types";

function ReviewRow({ item, token, onDone }: { item: ReviewQueueItem; token: string; onDone: () => void }) {
  const [value, setValue] = useState(item.value);
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    setBusy(true);
    try {
      await reviewExtractedField(token, item.id, value);
      onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border border-line p-5">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="font-body text-sm text-ink">{item.quote.vendor.name}</div>
          <Link href={`/rfqs/${item.quote.rfqEvent.id}`} className="font-body text-xs text-teal hover:underline">
            {item.quote.rfqEvent.title}
          </Link>
        </div>
        <span className="font-mono text-xs text-amber">{Math.round(item.confidence * 100)}% confidence</span>
      </div>

      <div className="mt-3 font-body text-xs text-slate">{item.fieldKey.replace(/_/g, " ")}</div>
      <div className="mt-1 flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 border border-line px-3 py-2 font-mono text-sm text-ink"
        />
        {item.unit && <span className="font-mono text-xs text-slate">{item.unit}</span>}
      </div>

      {item.sourceSpan && (
        <div className="mt-2 border-l-2 border-line pl-3 font-body text-xs italic text-slate">"{item.sourceSpan}"</div>
      )}

      <button
        onClick={handleSave}
        disabled={busy}
        className="mt-4 bg-teal px-4 py-1.5 font-body text-sm text-white hover:bg-teal/90 disabled:opacity-50"
      >
        {value === item.value ? "Confirm as extracted" : "Save correction"}
      </button>
    </div>
  );
}

export default function ReviewPage() {
  const { data: session } = useSession();
  const token = session?.backendToken;
  const [items, setItems] = useState<ReviewQueueItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  function load() {
    if (!token) return;
    fetchReviewQueue(token).then(setItems).catch((e) => setError(e.message));
  }
  useEffect(load, [token]);

  return (
    <div>
      <AppNav />
      <div className="mx-auto max-w-2xl p-8">
        <h1 className="mb-1 font-sans text-xl font-semibold text-ink">Review queue</h1>
        <p className="mb-6 font-body text-sm text-slate">
          Fields the extraction pipeline couldn't confidently read from a vendor's quote —
          confirm the value or correct it, shown next to the exact source text it came from.
        </p>

        {error && <div className="font-body text-sm text-rust">{error}</div>}
        {items.length === 0 && !error && (
          <div className="font-body text-sm text-slate">Nothing waiting for review right now.</div>
        )}

        <div className="space-y-4">
          {items.map((item) => (
            <ReviewRow key={item.id} item={item} token={token!} onDone={load} />
          ))}
        </div>
      </div>
    </div>
  );
}
