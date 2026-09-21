"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { AppNav } from "../../../components/AppNav";
import { RequestDetail } from "../../../components/RequestDetail";
import { fetchPurchaseRequest } from "../../../lib/api";
import { PurchaseRequest } from "../../../lib/types";

export default function RequestDetailPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const [request, setRequest] = useState<PurchaseRequest | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!session?.backendToken) return;
    fetchPurchaseRequest(session.backendToken, params.id).then(setRequest).catch((e) => setError(e.message));
  }, [session?.backendToken, params.id]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <AppNav />
      {error && <div className="p-8 font-body text-sm text-rust">{error}</div>}
      {!error && request && session?.user?.id && (
        <RequestDetail request={request} currentUserId={session.user.id} token={session.backendToken!} onActed={load} />
      )}
    </div>
  );
}
