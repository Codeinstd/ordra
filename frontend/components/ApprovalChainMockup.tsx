const rows = [
  { name: "Mo Manager", role: "direct manager", status: "Approved", color: "bg-moss" },
  { name: "Lee Legal", role: "legal reviewer", status: "Approved", color: "bg-moss" },
  { name: "Fran Finance", role: "finance reviewer", status: "Waiting", color: "bg-amber" },
  { name: "Devi Head", role: "department head", status: "Waiting", color: "bg-slate" },
];

export function ApprovalChainMockup() {
  return (
    <div className="w-full max-w-sm -rotate-1 rounded-2xl border border-white/10 bg-[#171F22] p-6 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)]">
      <div className="mb-5 flex items-baseline justify-between">
        <div>
          <div className="font-body text-sm text-white">Acme Industrial — CNC lathe</div>
          <div className="mt-0.5 font-body text-xs text-mist">Equipment, engineering</div>
        </div>
        <div className="font-mono text-lg text-white">$84,500</div>
      </div>
      <div className="space-y-3 border-t border-white/10 pt-4">
        {rows.map((r) => (
          <div key={r.name} className="flex items-center gap-3">
            <span className={`status-dot ${r.color}`} />
            <div className="flex-1">
              <div className="font-body text-sm text-white">{r.name}</div>
              <div className="font-body text-xs text-mist">{r.role}</div>
            </div>
            <span className="font-mono text-xs text-mist">{r.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
