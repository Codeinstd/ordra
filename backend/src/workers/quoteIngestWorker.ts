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
      // Deliberately not auto-sent — same "draft first, human sends" rule
      // as quote requests and negotiation messages. Logged here for now;
      // a real deployment would surface this as a reviewable draft in the
      // RFQ detail UI rather than only the server log.
      console.log(`[follow-up drafted, not sent] quote ${quoteId}:`, followUp);
    }
  },
  { connection }
);

quoteIngestWorker.on("failed", (job, err) => {
  console.error(`quote-ingest job ${job?.id} failed:`, err);
});
