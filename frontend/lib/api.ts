import {
  PurchaseRequest,
  ApprovalStep,
  Vendor,
  ComparisonMatrix,
  RfqEvent,
  Organization,
  OrgInvite,
  ApprovalPolicy,
  ChainSlot,
  NegotiationThread,
  ReviewQueueItem,
  DelegationsResponse,
  AuditLogEntry,
  VendorCandidate,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000/api";

export async function forgotPassword(email: string) {
  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
}

export async function resetPassword(token: string, newPassword: string) {
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Reset failed: ${res.status}`);
  }
}

export async function verifyEmail(token: string) {
  const res = await fetch(`${API_BASE}/auth/verify-email?token=${encodeURIComponent(token)}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Verification failed: ${res.status}`);
  }
}

export async function fetchAccount(
  token: string
): Promise<{ id: string; name: string; email: string; emailVerified: boolean; isOrgOwner: boolean }> {
  const res = await fetch(`${API_BASE}/account/me`, { headers: authHeaders(token), cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load account: ${res.status}`);
  return res.json();
}

export async function resendVerificationEmail(token: string) {
  const res = await fetch(`${API_BASE}/account/resend-verification`, { method: "POST", headers: authHeaders(token) });
  if (!res.ok) throw new Error(`Failed to resend: ${res.status}`);
  return res.json();
}

// Public — no token yet, this is what gets you one via the credentials
// sign-in that follows immediately after. companyName only matters if
// there's no pending invite for this email — the backend joins an
// existing org via invite before ever creating a new one.
export async function registerAccount(name: string, email: string, password: string, companyName: string) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, companyName }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Registration failed: ${res.status}`);
  }
}

function authHeaders(token: string): HeadersInit {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

export async function fetchPendingApprovals(token: string): Promise<ApprovalStep[]> {
  const res = await fetch(`${API_BASE}/approval-steps`, { headers: authHeaders(token), cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load approvals: ${res.status}`);
  return res.json();
}

export async function fetchPurchaseRequest(token: string, id: string): Promise<PurchaseRequest> {
  const res = await fetch(`${API_BASE}/purchase-requests/${id}`, { headers: authHeaders(token), cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load request ${id}: ${res.status}`);
  return res.json();
}

export async function approveStep(token: string, stepId: string, comments?: string) {
  const res = await fetch(`${API_BASE}/approval-steps/${stepId}/approve`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ comments }),
  });
  if (!res.ok) throw new Error(`Approve failed: ${res.status}`);
  return res.json();
}

export async function rejectStep(token: string, stepId: string, comments?: string) {
  const res = await fetch(`${API_BASE}/approval-steps/${stepId}/reject`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ comments }),
  });
  if (!res.ok) throw new Error(`Reject failed: ${res.status}`);
}

export async function fetchVendors(token: string, category?: string): Promise<Vendor[]> {
  const res = await fetch(`${API_BASE}/vendors${category ? `?category=${category}` : ""}`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to load vendors: ${res.status}`);
  return res.json();
}

export async function fetchComparisonMatrix(token: string, rfqId: string): Promise<ComparisonMatrix> {
  const res = await fetch(`${API_BASE}/rfqs/${rfqId}/comparison`, { headers: authHeaders(token), cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load comparison: ${res.status}`);
  return res.json();
}

export async function fetchMyRequests(token: string): Promise<PurchaseRequest[]> {
  const res = await fetch(`${API_BASE}/purchase-requests`, { headers: authHeaders(token), cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load your requests: ${res.status}`);
  return res.json();
}

export async function fetchRfqs(token: string): Promise<RfqEvent[]> {
  const res = await fetch(`${API_BASE}/rfqs`, { headers: authHeaders(token), cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load RFQs: ${res.status}`);
  return res.json();
}

export async function createVendor(
  token: string,
  data: { name: string; website?: string; categories: string[]; certifications?: string[]; contactEmail?: string }
) {
  const res = await fetch(`${API_BASE}/vendors`, { method: "POST", headers: authHeaders(token), body: JSON.stringify(data) });
  if (!res.ok) throw new Error(`Failed to create vendor: ${res.status}`);
  return res.json();
}

export async function scoreVendorReliability(
  token: string,
  vendorId: string,
  signals: {
    onTimeDeliveryRate?: number;
    financialHealthScore?: number;
    certificationCount: number;
    yearsInBusiness?: number;
    pastDefectRate?: number;
  }
) {
  const res = await fetch(`${API_BASE}/vendors/${vendorId}/reliability`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(signals),
  });
  if (!res.ok) throw new Error(`Failed to score vendor: ${res.status}`);
  return res.json();
}

export async function enrichVendor(token: string, vendorId: string) {
  const res = await fetch(`${API_BASE}/vendors/${vendorId}/enrich`, { method: "POST", headers: authHeaders(token) });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Enrichment failed: ${res.status}`);
  }
  return res.json();
}

export type PurchaseOrder = {
  poNumber: string;
  vendor: string;
  amount: number;
  category: string;
  department: string;
  approvalTrail: string;
  lineItems: string[];
};

export async function fetchPurchaseOrder(token: string, purchaseRequestId: string): Promise<PurchaseOrder> {
  const res = await fetch(`${API_BASE}/purchase-requests/${purchaseRequestId}/po`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to load purchase order: ${res.status}`);
  }
  return res.json();
}

export async function exportPurchaseOrder(
  token: string,
  purchaseRequestId: string
): Promise<{ exported: boolean; delivered: boolean; poNumber: string }> {
  const res = await fetch(`${API_BASE}/purchase-requests/${purchaseRequestId}/export`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Export failed: ${res.status}`);
  }
  return res.json();
}

// The one-shot "create + submit" path — see backend/src/quick-request.ts
// for why this exists instead of the full multi-step RFQ flow.
export async function createQuickRequest(
  token: string,
  data: { vendorName: string; category: string; department: string; amount: number }
) {
  const res = await fetch(`${API_BASE}/purchase-requests/quick`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to create request: ${res.status}`);
  }
  return res.json();
}

export async function fetchOrg(token: string): Promise<Organization> {
  const res = await fetch(`${API_BASE}/org/me`, { headers: authHeaders(token), cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load organization: ${res.status}`);
  return res.json();
}

export async function fetchOrgInvites(token: string): Promise<OrgInvite[]> {
  const res = await fetch(`${API_BASE}/org/invites`, { headers: authHeaders(token), cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load invites: ${res.status}`);
  return res.json();
}

export async function inviteTeammate(token: string, email: string) {
  const res = await fetch(`${API_BASE}/org/invites`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Invite failed: ${res.status}`);
  }
  return res.json();
}

// ---- Approval policies ---------------------------------------------------

export async function fetchPolicies(token: string): Promise<ApprovalPolicy[]> {
  const res = await fetch(`${API_BASE}/policies`, { headers: authHeaders(token), cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load policies: ${res.status}`);
  return res.json();
}

export async function createPolicy(
  token: string,
  data: {
    name: string;
    priority: number;
    department: string | null;
    category: string | null;
    amountMin: number | null;
    amountMax: number | null;
    chainTemplate: ChainSlot[];
  }
) {
  const res = await fetch(`${API_BASE}/policies`, { method: "POST", headers: authHeaders(token), body: JSON.stringify(data) });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to create policy: ${res.status}`);
  }
  return res.json();
}

export async function deactivatePolicy(token: string, id: string) {
  const res = await fetch(`${API_BASE}/policies/${id}/deactivate`, { method: "POST", headers: authHeaders(token) });
  if (!res.ok) throw new Error(`Failed to deactivate policy: ${res.status}`);
  return res.json();
}

// ---- RFQ detail / quick quote add ----------------------------------------

export async function fetchRfq(token: string, id: string): Promise<RfqEvent> {
  const res = await fetch(`${API_BASE}/rfqs/${id}`, { headers: authHeaders(token), cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load RFQ: ${res.status}`);
  return res.json();
}

export async function addQuoteToRfq(
  token: string,
  rfqId: string,
  data: { vendorId: string; rawEmailText: string; totalPrice?: number }
) {
  const res = await fetch(`${API_BASE}/rfqs/${rfqId}/quotes`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to add quote: ${res.status}`);
  }
  return res.json();
}

// ---- Negotiation ----------------------------------------------------------

export async function startNegotiation(token: string, quoteId: string, targetSavingsPct: number) {
  const res = await fetch(`${API_BASE}/negotiations`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ quoteId, targetSavingsPct }),
  });
  if (!res.ok) throw new Error(`Failed to start negotiation: ${res.status}`);
  return res.json();
}

export async function fetchNegotiation(token: string, id: string): Promise<NegotiationThread> {
  const res = await fetch(`${API_BASE}/negotiations/${id}`, { headers: authHeaders(token), cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load negotiation: ${res.status}`);
  return res.json();
}

export async function listQuoteNegotiations(token: string, quoteId: string): Promise<{ id: string }[]> {
  const res = await fetch(`${API_BASE}/quotes/${quoteId}/negotiations`, { headers: authHeaders(token), cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load negotiations: ${res.status}`);
  return res.json();
}

export async function generateNegotiationDraft(
  token: string,
  threadId: string,
  vendorQuoteSummary: string,
  comparableQuotesSummary: string
) {
  const res = await fetch(`${API_BASE}/negotiations/${threadId}/draft`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ vendorQuoteSummary, comparableQuotesSummary }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to generate draft: ${res.status}`);
  }
  return res.json();
}

export async function approveAndSendNegotiation(token: string, messageId: string) {
  const res = await fetch(`${API_BASE}/negotiation-messages/${messageId}/approve-and-send`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`Failed to send: ${res.status}`);
  return res.json();
}

export async function recordVendorResponse(token: string, threadId: string, body: string) {
  const res = await fetch(`${API_BASE}/negotiations/${threadId}/vendor-response`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ body }),
  });
  if (!res.ok) throw new Error(`Failed to record response: ${res.status}`);
  return res.json();
}

// ---- Spec review queue -----------------------------------------------------

export async function fetchReviewQueue(token: string): Promise<ReviewQueueItem[]> {
  const res = await fetch(`${API_BASE}/review-queue`, { headers: authHeaders(token), cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load review queue: ${res.status}`);
  return res.json();
}

export async function reviewExtractedField(token: string, specId: string, correctedValue?: string) {
  const res = await fetch(`${API_BASE}/extracted-specs/${specId}/review`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ correctedValue }),
  });
  if (!res.ok) throw new Error(`Failed to save review: ${res.status}`);
}

// ---- Delegations ------------------------------------------------------------

export async function fetchDelegations(token: string): Promise<DelegationsResponse> {
  const res = await fetch(`${API_BASE}/delegations`, { headers: authHeaders(token), cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load delegations: ${res.status}`);
  return res.json();
}

export async function createDelegation(
  token: string,
  data: { delegateEmail: string; startDate: string; endDate: string; reason?: string }
) {
  const res = await fetch(`${API_BASE}/delegations`, { method: "POST", headers: authHeaders(token), body: JSON.stringify(data) });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to create delegation: ${res.status}`);
  }
  return res.json();
}

export async function cancelDelegation(token: string, id: string) {
  const res = await fetch(`${API_BASE}/delegations/${id}`, { method: "DELETE", headers: authHeaders(token) });
  if (!res.ok) throw new Error(`Failed to cancel delegation: ${res.status}`);
}

// ---- Audit log ----------------------------------------------------------------

export async function fetchAuditLog(token: string): Promise<AuditLogEntry[]> {
  const res = await fetch(`${API_BASE}/audit-log`, { headers: authHeaders(token), cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load audit log: ${res.status}`);
  return res.json();
}

// ---- Vendor discovery -----------------------------------------------------------

export async function discoverVendorCandidates(token: string, query: string): Promise<VendorCandidate[]> {
  const res = await fetch(`${API_BASE}/vendors/discover`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Vendor search failed: ${res.status}`);
  }
  return res.json();
}
