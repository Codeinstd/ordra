import { PurchaseRequest, ApprovalStep, Vendor, ComparisonMatrix, RfqEvent } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000/api" ;
console.log("API_BASE:", API_BASE);

// Public — no token yet, this is what gets you one via the credentials
// sign-in that follows immediately after.
export async function registerAccount(name: string, email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
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
  data: { name: string; categories: string[]; certifications?: string[]; contactEmail?: string }
) {
  const res = await fetch(`${API_BASE}/vendors`, { method: "POST", headers: authHeaders(token), body: JSON.stringify(data) });
  if (!res.ok) throw new Error(`Failed to create vendor: ${res.status}`);
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

export async function exportPurchaseOrder(token: string, purchaseRequestId: string) {
  const res = await fetch(`${API_BASE}/purchase-requests/${purchaseRequestId}/export`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`Export failed: ${res.status}`);
  return res.json();
}

export async function createQuickRequest(
  token: string,
  data: {
    category: string;
    department: string;
    amount: number;
  }
) {
  const res = await fetch(`${API_BASE}/purchase-requests/quick`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      body.error ?? `Failed to create request: ${res.status}`
    );
  }

  return res.json();
}
