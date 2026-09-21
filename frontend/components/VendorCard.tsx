"use client";

import { useState } from "react";
import { Vendor } from "../lib/types";
import { scoreVendorReliability, enrichVendor } from "../lib/api";

export function VendorCard({ vendor, token, onChanged }: { vendor: Vendor; token: string; onChanged: () => void }) {
  const [showScoreForm, setShowScoreForm] = useState(false);
  const [onTimeDeliveryRate, setOnTimeDeliveryRate] = useState("90");
  const [financialHealthScore, setFinancialHealthScore] = useState("70");
  const [yearsInBusiness, setYearsInBusiness] = useState("5");
  const [pastDefectRate, setPastDefectRate] = useState("2");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleScore(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await scoreVendorReliability(token, vendor.id, {
        onTimeDeliveryRate: Number(onTimeDeliveryRate) / 100,
        financialHealthScore: Number(financialHealthScore),
        certificationCount: vendor.certifications.length,
        yearsInBusiness: Number(yearsInBusiness),
        pastDefectRate: Number(pastDefectRate) / 100,
      });
      setShowScoreForm(false);
      onChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleEnrich() {
    setBusy(true);
    setError(null);
    try {
      await enrichVendor(token, vendor.id);
      onChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-b border-line py-4">
      <div className="flex items-baseline justify-between">
        <span className="font-body text-sm text-ink">{vendor.name}</span>
        {vendor.reliabilityScore && (
          <span className="font-mono text-sm text-teal">{vendor.reliabilityScore.score}/100</span>
        )}
      </div>
      <div className="mt-1 text-xs text-slate font-body">
        {vendor.categories.join(", ") || "no categories yet"}
        {vendor.certifications.length > 0 && ` · ${vendor.certifications.join(", ")}`}
      </div>
      {vendor.reliabilityScore && (
        <p className="mt-2 text-xs text-slate font-body">{vendor.reliabilityScore.rationale}</p>
      )}

      <div className="mt-2 flex gap-4">
        <button onClick={() => setShowScoreForm(!showScoreForm)} className="font-mono text-xs text-teal hover:underline">
          {vendor.reliabilityScore ? "re-score" : "score reliability"}
        </button>
        {vendor.website && (
          <button onClick={handleEnrich} disabled={busy} className="font-mono text-xs text-teal hover:underline disabled:opacity-50">
            enrich from website
          </button>
        )}
      </div>
      {error && <div className="mt-2 font-body text-xs text-rust">{error}</div>}

      {showScoreForm && (
        <form onSubmit={handleScore} className="mt-3 border border-line bg-paper p-4">
          <div className="mb-3 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-body text-xs text-slate">On-time delivery %</label>
              <input
                type="number"
                min={0}
                max={100}
                value={onTimeDeliveryRate}
                onChange={(e) => setOnTimeDeliveryRate(e.target.value)}
                className="w-full border border-line bg-white px-2 py-1 font-body text-sm text-ink"
              />
            </div>
            <div>
              <label className="mb-1 block font-body text-xs text-slate">Financial health (0-100)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={financialHealthScore}
                onChange={(e) => setFinancialHealthScore(e.target.value)}
                className="w-full border border-line bg-white px-2 py-1 font-body text-sm text-ink"
              />
            </div>
            <div>
              <label className="mb-1 block font-body text-xs text-slate">Years in business</label>
              <input
                type="number"
                min={0}
                value={yearsInBusiness}
                onChange={(e) => setYearsInBusiness(e.target.value)}
                className="w-full border border-line bg-white px-2 py-1 font-body text-sm text-ink"
              />
            </div>
            <div>
              <label className="mb-1 block font-body text-xs text-slate">Past defect rate %</label>
              <input
                type="number"
                min={0}
                max={100}
                value={pastDefectRate}
                onChange={(e) => setPastDefectRate(e.target.value)}
                className="w-full border border-line bg-white px-2 py-1 font-body text-sm text-ink"
              />
            </div>
          </div>
          <p className="mb-3 font-body text-xs text-slate">
            Certification count ({vendor.certifications.length}) is pulled from the vendor
            record automatically.
          </p>
          <button disabled={busy} type="submit" className="bg-teal px-4 py-1.5 font-body text-sm text-white hover:bg-teal/90 disabled:opacity-50">
            Save score
          </button>
        </form>
      )}
    </div>
  );
}
