"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AppNav } from "../../../../components/AppNav";
import { fetchComparisonMatrix } from "../../../../lib/api";
import { ComparisonMatrix as MatrixData } from "../../../../lib/types";
import { ComparisonMatrix } from "../../../../components/ComparisonMatrix";

export default function ComparePage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const token = session?.backendToken;
  const [matrix, setMatrix] = useState<MatrixData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchComparisonMatrix(token, params.id).then(setMatrix).catch((e) => setError(e.message));
  }, [token, params.id]);

  return (
    <div>
      <AppNav />
      <div className="p-8">
        <h1 className="mb-6 font-sans text-xl font-semibold text-ink">Quote comparison</h1>
        {error && <div className="text-sm text-rust font-body">{error}</div>}
        {matrix && matrix.rows.length === 0 && (
          <div className="text-sm text-slate font-body">No fully-reviewed quotes yet for this RFQ.</div>
        )}
        {matrix && matrix.rows.length > 0 && <ComparisonMatrix matrix={matrix} />}
      </div>
    </div>
  );
}
