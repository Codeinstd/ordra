import { PrismaClient } from "@prisma/client";
import { extractStructured } from "./llm";

const prisma = new PrismaClient();

const CONFIDENCE_THRESHOLD = 0.75;

type ExtractedField = { value: string; unit?: string; confidence: number; sourceSpan: string };
type ExtractionResult = Record<string, ExtractedField>;

// Called by the quote-ingest worker once raw text is available for a quote.
export async function runSpecExtraction(quoteId: string) {
  const quote = await prisma.quote.findUniqueOrThrow({ where: { id: quoteId }, include: { rfqEvent: true } });
  const documentText = quote.rawEmailText ?? "";
  if (!documentText) throw new Error(`Quote ${quoteId} has no text to extract from yet`);

  const schemaFields = await prisma.specSchema.findMany({ where: { category: quote.rfqEvent.category } });
  const jsonSchema = Object.fromEntries(
    schemaFields.map((f) => [f.fieldKey, { type: f.fieldType, unit: f.unit, required: f.required }])
  );

  const result = await extractStructured<ExtractionResult>({
    documentText,
    jsonSchema,
    instructions: `Extract these fields for a "${quote.rfqEvent.category}" quote.`,
  });

  for (const [fieldKey, field] of Object.entries(result)) {
    await prisma.extractedSpec.create({
      data: {
        quoteId,
        fieldKey,
        value: field.value,
        unit: field.unit,
        confidence: field.confidence,
        sourceSpan: field.sourceSpan,
      },
    });
  }

  const requiredKeys = schemaFields.filter((f) => f.required).map((f) => f.fieldKey);
  const missing = requiredKeys.filter((k) => !(k in result));
  const lowConfidence = Object.entries(result).filter(([, f]) => f.confidence < CONFIDENCE_THRESHOLD);

  const needsReview = missing.length > 0 || lowConfidence.length > 0;
  await prisma.quote.update({ where: { id: quoteId }, data: { status: needsReview ? "needs_review" : "ready" } });

  return { missing, lowConfidenceFields: lowConfidence.map(([k]) => k) };
}

// Human review action: a procurement analyst confirms or corrects a
// flagged field after seeing the source document snippet.
export async function reviewExtractedField(specId: string, reviewerId: string, correctedValue?: string) {
  await prisma.extractedSpec.update({
    where: { id: specId },
    data: {
      value: correctedValue ?? undefined,
      confidence: 1,
      reviewedById: reviewerId,
      reviewedAt: new Date(),
    },
  });

  const spec = await prisma.extractedSpec.findUniqueOrThrow({ where: { id: specId } });
  const remainingFlags = await prisma.extractedSpec.findMany({
    where: { quoteId: spec.quoteId, reviewedAt: null, confidence: { lt: CONFIDENCE_THRESHOLD } },
  });
  if (remainingFlags.length === 0) {
    await prisma.quote.update({ where: { id: spec.quoteId }, data: { status: "ready" } });
  }
}

// If a required field is genuinely absent from the document (not just a
// parsing miss), draft — don't send — a follow-up asking that vendor for
// just the missing spec, so the whole comparison isn't blocked on one gap.
export async function draftMissingSpecFollowUp(quoteId: string, missingFields: string[]) {
  const quote = await prisma.quote.findUniqueOrThrow({ where: { id: quoteId }, include: { vendor: true } });
  return {
    to: quote.vendor.contactEmail,
    subject: `Quick follow-up on your quote`,
    body: `Could you confirm the following for your quote: ${missingFields.join(", ")}?`,
  };
}
