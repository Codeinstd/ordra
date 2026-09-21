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

// Used by vendor discovery: real web search (Claude's built-in web_search
// tool, executed server-side by the Anthropic API — no separate search API
// key needed beyond ANTHROPIC_API_KEY, which this whole app already
// requires). Returns candidate vendors for a human to review and add, not
// auto-added — same "AI proposes, person decides" pattern as negotiation
// drafts.
export async function discoverVendors(
  query: string
): Promise<{ name: string; website: string; summary: string }[]> {
  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    tools: [{ type: "web_search_20250305", name: "web_search" }],
    system:
      "You search the web to find real, currently-operating companies matching a procurement " +
      "search query. After searching, respond with ONLY a JSON array (no prose, no markdown " +
      'fences) of up to 5 candidates: [{"name": string, "website": string, "summary": string}]. ' +
      "Only include companies you found real evidence for in the search results — never invent " +
      "a company or guess a website URL. summary is one factual sentence about what they offer, " +
      "grounded in what the search actually returned.",
    messages: [{ role: "user", content: `Find vendors for: ${query}` }],
  });
  const text = msg.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("\n");
  try {
    return JSON.parse(text);
  } catch {
    // The model occasionally wraps JSON in a sentence despite instructions
    // — a last-resort extraction rather than failing the whole request.
    const match = text.match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : [];
  }
}

// Used by vendor enrichment: reads a vendor's own website text (fetched
// separately — this function only classifies it) and pulls out category
// tags and certifications actually mentioned on the page. Deliberately
// conservative: an empty array is a correct answer if the site doesn't
// say anything relevant, not a failure to fill in.
export async function classifyVendorFromWebsite(
  websiteText: string
): Promise<{ categories: string[]; certifications: string[]; summary: string }> {
  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 500,
    system:
      "You read a company's website text and classify what it sells and what certifications " +
      "it holds, for a procurement vendor directory. Return ONLY JSON: " +
      '{"categories": string[], "certifications": string[], "summary": string}. ' +
      "categories should be short lowercase-with-hyphens tags (e.g. \"industrial-equipment\", " +
      "\"packaging\"). certifications should only include ones explicitly mentioned on the page " +
      "(e.g. \"ISO9001\", \"SOC2\") — never infer or guess a certification that isn't stated. " +
      "summary is one factual sentence about what the company does.",
    messages: [{ role: "user", content: websiteText }],
  });
  const text = msg.content.find((b) => b.type === "text")?.text ?? "{}";
  return JSON.parse(text);
}
