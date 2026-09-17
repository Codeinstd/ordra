import { Vendor } from "../lib/types";

export function VendorCard({ vendor }: { vendor: Vendor }) {
  return (
    <div className="border-b border-line py-4">
      <div className="flex items-baseline justify-between">
        <span className="font-body text-sm text-ink">{vendor.name}</span>
        {vendor.reliabilityScore && (
          <span className="font-mono text-sm text-teal">{vendor.reliabilityScore.score}/100</span>
        )}
      </div>
      <div className="mt-1 text-xs text-slate font-body">
        {vendor.categories.join(", ")}
        {vendor.certifications.length > 0 && ` · ${vendor.certifications.join(", ")}`}
      </div>
      {vendor.reliabilityScore && (
        <p className="mt-2 text-xs text-slate font-body">{vendor.reliabilityScore.rationale}</p>
      )}
    </div>
  );
}
