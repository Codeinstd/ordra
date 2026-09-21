import { ApprovalStep, StepStatus } from "../lib/types";

function statusColor(status: StepStatus) {
  switch (status) {
    case "approved": return "bg-moss";
    case "rejected": return "bg-rust";
    case "superseded": return "bg-slate";
    default: return "bg-amber";
  }
}

function statusLabel(status: StepStatus) {
  switch (status) {
    case "approved": return "Approved";
    case "rejected": return "Rejected";
    case "superseded": return "No longer required";
    default: return "Waiting";
  }
}

function StepRow({ step }: { step: ApprovalStep }) {
  const superseded = step.status === "superseded";
  return (
    <div className={`flex items-start gap-3 py-2 ${superseded ? "opacity-50" : ""}`}>
      <span className={`status-dot mt-1.5 ${statusColor(step.status)}`} />
      <div className="flex-1">
        <div className="flex items-baseline justify-between">
          <span className="font-body text-sm text-ink">{step.approver?.name ?? step.approverRole}</span>
          <span className="font-mono text-xs text-slate">{statusLabel(step.status)}</span>
        </div>
        <div className="text-xs text-slate font-body">{step.approverRole.replace(/_/g, " ")}</div>
        {step.comments && <div className="mt-1 text-xs italic text-slate font-body">"{step.comments}"</div>}
      </div>
    </div>
  );
}

export function ChainTimeline({ steps }: { steps: ApprovalStep[] }) {
  const ordered = [...steps].sort((a, b) => a.stepOrder - b.stepOrder);

  // Group consecutive steps that share a groupId so parallel approvers are
  // rendered as one bracketed unit rather than a false sequence.
  const groups: ApprovalStep[][] = [];
  for (const step of ordered) {
    const last = groups[groups.length - 1];
    if (step.groupId && last && last[0].groupId === step.groupId) {
      last.push(step);
    } else {
      groups.push([step]);
    }
  }

  return (
    <div className="border-l border-line pl-4">
      {groups.map((group, i) => (
        <div key={i} className="relative mb-1">
          {group[0].stepType === "parallel_group" && group.length > 1 && (
            <div className="mb-1 text-xs font-mono text-slate">both required</div>
          )}
          <div className={group[0].stepType === "parallel_group" ? "border-l-2 border-line pl-3" : ""}>
            {group.map((step) => (
              <StepRow key={step.id} step={step} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
