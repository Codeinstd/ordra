import { Worker } from "bullmq";
import { connection } from "../queue";
import { runSpecExtraction, draftMissingSpecFollowUp } from "../spec-extraction";

export const quoteIngestWorker = new Worker(
  "quote-ingest",
  async (job) => {
    const { quoteId } = job.data as { quoteId: string };
    const { missing } = await runSpecExtraction(quoteId);
    if (missing.length > 0) {
      const followUp = await draftMissingSpecFollowUp(quoteId, missing);
      console.log(`[stub email send] follow-up for quote ${quoteId}:`, followUp);
    }
  },
  { connection }
);

quoteIngestWorker.on("failed", (job, err) => {
  console.error(`quote-ingest job ${job?.id} failed:`, err);
});
