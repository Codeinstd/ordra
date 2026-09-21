import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  companyName: z.string().optional(),
  department: z.string().optional(),
  role: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
});

export const createVendorSchema = z.object({
  name: z.string().min(1),
  website: z.string().url().optional(),
  categories: z.array(z.string()).min(1),
  certifications: z.array(z.string()).optional(),
  contactEmail: z.string().email().optional(),
});

export const discoverVendorsSchema = z.object({
  query: z.string().min(1),
});

const chainSlotSchema = z.union([
  z.object({
    order: z.number(),
    type: z.literal("sequential").optional(),
    role: z.string().min(1),
    condition: z.string().optional(),
  }),
  z.object({
    order: z.number(),
    type: z.literal("parallel_group"),
    groupId: z.string(),
    roles: z.array(z.string()).min(1),
    condition: z.string().optional(),
  }),
]);

export const createPolicySchema = z.object({
  name: z.string().min(1),
  priority: z.number().default(0),
  department: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  amountMin: z.number().nullable().optional(),
  amountMax: z.number().nullable().optional(),
  chainTemplate: z.array(chainSlotSchema).min(1),
});

export const quickRequestSchema = z.object({
  vendorName: z.string().min(1),
  category: z.string().min(1),
  department: z.string().min(1),
  amount: z.number().positive(),
});

export const createRfqSchema = z.object({
  title: z.string().min(1),
  category: z.string().min(1),
  budget: z.number().positive().optional(),
  specNotes: z.string().optional(),
});

export const addQuoteSchema = z.object({
  vendorId: z.string().min(1),
  rawEmailText: z.string().min(1),
  totalPrice: z.number().positive().optional(),
});

export const inviteSchema = z.object({
  email: z.string().email(),
});

export const delegationSchema = z.object({
  delegateEmail: z.string().email(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  reason: z.string().optional(),
});

export const startNegotiationSchema = z.object({
  quoteId: z.string().min(1),
  targetSavingsPct: z.number().min(0).max(100),
});

export const negotiationDraftSchema = z.object({
  vendorQuoteSummary: z.string().min(1),
  comparableQuotesSummary: z.string().optional().default(""),
});

export const negotiationVendorResponseSchema = z.object({
  body: z.string().min(1),
});

export const reliabilitySignalsSchema = z.object({
  onTimeDeliveryRate: z.number().min(0).max(1).optional(),
  financialHealthScore: z.number().min(0).max(100).optional(),
  certificationCount: z.number().min(0),
  yearsInBusiness: z.number().min(0).optional(),
  pastDefectRate: z.number().min(0).max(1).optional(),
});
