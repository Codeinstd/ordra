import { RequestIllustration, CompareIllustration, ApproveIllustration } from "./icons";

const tiles = [
  {
    n: "1",
    title: "Request",
    body: "Create an RFQ and send it to every vendor in one pass.",
    tone: "bg-white border border-line",
    accent: "text-ink",
    place: "lg:col-start-1 lg:row-start-1",
    illustration: <RequestIllustration className="h-10 w-14" />,
    visual: <div className="mt-4 font-mono text-xs text-slate">RFQ sent → 4 vendors</div>,
  },
  {
    n: "2",
    title: "Compare",
    body: "Specs, pricing, and reliability land in one side-by-side view.",
    tone: "bg-teal-dim border border-teal/20",
    accent: "text-teal",
    place: "lg:col-start-2 lg:row-start-1 lg:row-span-2",
    illustration: <CompareIllustration className="h-12 w-16" />,
    visual: (
      <div className="mt-5 space-y-2 border-t border-teal/20 pt-4">
        <div className="flex items-center justify-between">
          <span className="font-body text-sm text-ink">Acme Industrial</span>
          <span className="font-mono text-sm text-ink">$84,500</span>
        </div>
        <div className="flex items-center justify-between opacity-60">
          <span className="font-body text-sm text-ink">Global Supply Co</span>
          <span className="font-mono text-sm text-ink">$91,200</span>
        </div>
      </div>
    ),
  },
  {
    n: "3",
    title: "Approve",
    body: "Route through your org's real chain, fully audited end to end.",
    tone: "bg-moss-dim border border-moss/20",
    accent: "text-moss",
    place: "lg:col-start-1 lg:row-start-2",
    illustration: <ApproveIllustration className="h-10 w-10" />,
    visual: (
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className="status-dot bg-moss" />
          <span className="font-mono text-xs text-slate">Mo Manager — Approved</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="status-dot bg-amber" />
          <span className="font-mono text-xs text-slate">Fran Finance — Waiting</span>
        </div>
      </div>
    ),
  },
];

export function BentoHowItWorks() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:grid-rows-2 lg:gap-4">
      {tiles.map((t) => (
        <div key={t.n} className={`relative rounded-2xl p-7 ${t.tone} ${t.place}`}>
          <span className="absolute right-6 top-6 font-mono text-xs text-slate">{t.n}</span>
          <div className={t.accent}>{t.illustration}</div>
          <div className="mt-4 font-sans text-xl font-semibold text-ink">{t.title}</div>
          <p className="mt-1 max-w-xs font-body text-sm text-slate">{t.body}</p>
          {t.visual}
        </div>
      ))}
    </div>
  );
}
