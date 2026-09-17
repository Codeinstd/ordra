import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

// Used by spec extraction: constrains the model to return JSON matching a
// per-category schema, plus per-field confidence and the exact source text
// it pulled from (so a human reviewer can verify without reading the whole
// document).
export async function extractStructured<T>(params: {
  documentText: string;
  jsonSchema: Record<string, unknown>;
  instructions: string;
}): Promise<T> {
  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    system:
      "You extract structured data from vendor quote documents. " +
      "Return ONLY JSON matching the provided schema — no prose, no markdown fences. " +
      "For every field, include a confidence score (0-1) and the exact source " +
      "text span the value was taken from. If a required field is not present " +
      "in the document, omit it rather than guessing.",
    messages: [
      {
        role: "user",
        content: `${params.instructions}\n\nSchema:\n${JSON.stringify(params.jsonSchema)}\n\nDocument:\n${params.documentText}`,
      },
    ],
  });
  const text = msg.content.find((b) => b.type === "text")?.text ?? "{}";
  return JSON.parse(text) as T;
}

// Used by negotiation: drafts counter-offer language for a human to review
// and approve before anything is sent — never auto-sent.
export async function draftNegotiationMessage(params: {
  vendorQuoteSummary: string;
  comparableQuotesSummary: string;
  targetSavingsPct: number;
}): Promise<string> {
  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 500,
    system:
      "You draft professional, factual vendor negotiation emails for a procurement " +
      "officer to review before sending. Never invent facts not given to you. " +
      "Keep it concise, respectful, and specific about the ask.",
    messages: [
      {
        role: "user",
        content:
          `Draft a counter-offer email.\n\nOur quote: ${params.vendorQuoteSummary}\n` +
          `Comparable market quotes: ${params.comparableQuotesSummary}\n` +
          `Target savings: ${params.targetSavingsPct}%`,
      },
    ],
  });
  return msg.content.find((b) => b.type === "text")?.text ?? "";
}

// Used by reliability scoring: turns raw signals into a short, auditable
// rationale rather than a bare number — enterprise buyers need to see why.
export async function explainReliabilityScore(signals: Record<string, unknown>, score: number): Promise<string> {
  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 300,
    system: "You write a short, factual, auditable explanation (3-4 sentences) for a vendor reliability score. Only reference the signals given.",
    messages: [{ role: "user", content: `Score: ${score}/100\nSignals: ${JSON.stringify(signals)}` }],
  });
  return msg.content.find((b) => b.type === "text")?.text ?? "";
}
