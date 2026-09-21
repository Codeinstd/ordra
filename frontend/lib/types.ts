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
  auditLog?: AuditEvent[];
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
  website: string | null;
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

export interface AuditLogEntry extends AuditEvent {
  purchaseRequestId: string;
  purchaseRequest: {
    id: string;
    category: string;
    department: string;
    quote: { vendor: { name: string } };
  };
}

export interface OrgMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  isOrgOwner: boolean;
}

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
  users: OrgMember[];
}

export interface OrgInvite {
  id: string;
  email: string;
  createdAt: string;
  acceptedAt: string | null;
}

export type ChainSlot =
  | { order: number; type?: "sequential"; role: string; condition?: string }
  | { order: number; type: "parallel_group"; groupId: string; roles: string[]; condition?: string };

export interface ApprovalPolicy {
  id: string;
  name: string;
  priority: number;
  department: string | null;
  category: string | null;
  amountMin: number | null;
  amountMax: number | null;
  chainTemplate: ChainSlot[];
  activeFrom: string;
  activeUntil: string | null;
}

export interface NegotiationMessage {
  id: string;
  threadId: string;
  direction: "outbound_draft" | "outbound_sent" | "inbound";
  body: string;
  approvedById: string | null;
  approvedAt: string | null;
  createdAt: string;
}

export interface NegotiationThread {
  id: string;
  quoteId: string;
  status: "drafting" | "awaiting_approval" | "sent" | "vendor_responded" | "settled";
  targetSavingsPct: number | null;
  createdAt: string;
  messages: NegotiationMessage[];
  quote: { totalPrice: number | null; vendor: { name: string }; rfqEvent: { title: string } };
}

export interface ReviewQueueItem {
  id: string;
  fieldKey: string;
  value: string;
  unit: string | null;
  confidence: number;
  sourceSpan: string | null;
  quote: { id: string; vendor: { name: string }; rfqEvent: { id: string; title: string } };
}

interface DelegationRecord {
  id: string;
  startDate: string;
  endDate: string;
  reason: string | null;
}

export interface DelegationGiven extends DelegationRecord {
  delegate: { id: string; name: string; email: string };
}

export interface DelegationReceived extends DelegationRecord {
  delegator: { id: string; name: string; email: string };
}

export interface DelegationsResponse {
  given: DelegationGiven[];
  received: DelegationReceived[];
}

export interface VendorCandidate {
  name: string;
  website: string;
  summary: string;
}
