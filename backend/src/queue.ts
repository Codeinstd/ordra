import { Queue } from "bullmq";

const connection = { url: process.env.REDIS_URL ?? "redis://localhost:6379" };

export const specExtractionQueue = new Queue("spec-extraction", { connection });
export const quoteIngestQueue = new Queue("quote-ingest", { connection });
export const escalationQueue = new Queue("approval-escalation", { connection });
export const negotiationDraftQueue = new Queue("negotiation-draft", { connection });

export { connection };
