"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AppNav } from "../../components/AppNav";
import { ApprovalQueue } from "../../components/ApprovalQueue";
import { RequestDetail } from "../../components/RequestDetail";
import { fetchPendingApprovals, fetchPurchaseRequest } from "../../lib/api";
import { ApprovalStep, PurchaseRequest } from "../../lib/types";

export default function ApprovalsPage() {
  const { data: session, status } = useSession();
  const token = session?.backendToken;
  const currentUserId = session?.user?.id;

  const [steps, setSteps] = useState<ApprovalStep[]>([]);
  const [selected, setSelected] = useState<PurchaseRequest | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshQueue = useCallback(async () => {
    if (!token) return;
    try {
      setSteps(await fetchPendingApprovals(token));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [token]);

  useEffect(() => {
    refreshQueue();
  }, [refreshQueue]);

  useEffect(() => {
    if (!selectedId || !token) return;
    fetchPurchaseRequest(token, selectedId).then(setSelected).catch((e) => setError(e.message));
  }, [selectedId, token]);

  async function handleActed() {
    await refreshQueue();
    if (selectedId && token) fetchPurchaseRequest(token, selectedId).then(setSelected);
  }

  if (status === "loading") return null; // middleware already guards this route
  if (!token || !currentUserId) {
    return <div className="p-8 font-body text-sm text-rust">Signed in, but no backend session was issued — try signing in again.</div>;
  }

  return (
    <div>
      <AppNav />
      <div className="flex h-[calc(100vh-65px)]">
        <ApprovalQueue steps={steps} selectedRequestId={selectedId} onSelect={setSelectedId} />
        <div className="flex-1 overflow-y-auto">
          {error && <div className="p-8 text-sm text-rust font-body">{error} — is the API running on :4000?</div>}
          {!error && selected && (
            <RequestDetail
              request={selected}
              currentUserId={currentUserId}
              token={token}
              onActed={handleActed}
            />
          )}
          {!error && !selected && (
            <div className="flex h-full items-center justify-center text-sm text-slate font-body">
              Select a request from the queue.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
