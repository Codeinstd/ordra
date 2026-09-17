export type StepStatus = "pending" | "approved" | "rejected" | "superseded";
export type StepType = "sequential" | "parallel_group";

export interface ApprovalStep {
  id: string;
  purchaseRequestId: string;
  routingVersion: number;
  stepOrder: number;
  stepType: StepType;
  groupId: string | null;
  approverRole: string;
  approverUserId: string;
  approver?: { name: string; email: string };
  status: StepStatus;
  actedAt?: string | null;
  comments?: string | null;
}

export interface PurchaseRequest {
  id: string;
  rfqId: string;
  vendorName?: string;
  quote?: { vendor?: { name: string } } | null;
  amount: number;
  department: string;
  category: string;
  status: "draft" | "routing" | "in_review" | "approved" | "rejected";
  currentRoutingVersion: number;
  createdAt?: string;
  steps: ApprovalStep[];
}

export interface RfqEvent {
  id: string;
  title: string;
  category: string;
  status: string;
  budget: number | null;
  createdAt: string;
  quotes: { id: string; status: string; totalPrice: number | null; vendor: { name: string } }[];
}

export interface Vendor {
  id: string;
  name: string;
  categories: string[];
  certifications: string[];
  reliabilityScore?: { score: number; rationale: string } | null;
}

export interface ComparisonMatrix {
  vendors: { id: string; name: string; totalPrice: number | null }[];
  rows: { fieldKey: string; values: Record<string, { value: string; unit?: string; confidence: number }> }[];
}

export interface AuditEvent {
  id: string;
  eventType: string;
  createdAt: string;
  metadata: Record<string, unknown>;
}
