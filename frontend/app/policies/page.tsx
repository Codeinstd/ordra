"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AppNav } from "../../components/AppNav";
import { fetchPolicies, createPolicy, deactivatePolicy } from "../../lib/api";
import { ApprovalPolicy, ChainSlot } from "../../lib/types";

type StepDraft = { type: "sequential" | "parallel_group"; role: string; roles: string; condition: string };

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function emptyStep(): StepDraft {
  return { type: "sequential", role: "", roles: "", condition: "" };
}

function describeChain(chain: ChainSlot[]) {
  return chain
    .map((slot) => (slot.type === "parallel_group" ? slot.roles.join(" + ") : slot.role))
    .join(" → ");
}

export default function PoliciesPage() {
  const { data: session } = useSession();
  const token = session?.backendToken;
  const [policies, setPolicies] = useState<ApprovalPolicy[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState("");
  const [priority, setPriority] = useState("10");
  const [department, setDepartment] = useState("");
  const [category, setCategory] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [steps, setSteps] = useState<StepDraft[]>([emptyStep()]);

  function load() {
    if (!token) return;
    fetchPolicies(token).then(setPolicies).catch((e) => setError(e.message));
  }
  useEffect(load, [token]);

  function updateStep(i: number, patch: Partial<StepDraft>) {
    setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  function buildChainTemplate(): ChainSlot[] {
    return steps.map((s, i) => {
      const order = i + 1;
      if (s.type === "parallel_group") {
        return {
          order,
          type: "parallel_group",
          groupId: `group-${i}`,
          roles: s.roles.split(",").map((r) => r.trim()).filter(Boolean),
          condition: s.condition || undefined,
        };
      }
      return { order, type: "sequential", role: s.role.trim(), condition: s.condition || undefined };
    });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      await createPolicy(token, {
        name,
        priority: Number(priority),
        department: department || null,
        category: category || null,
        amountMin: amountMin === "" ? null : Number(amountMin),
        amountMax: amountMax === "" ? null : Number(amountMax),
        chainTemplate: buildChainTemplate(),
      });
      setName("");
      setDepartment("");
      setCategory("");
      setAmountMin("");
      setAmountMax("");
      setSteps([emptyStep()]);
      setShowForm(false);
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDeactivate(id: string) {
    if (!token) return;
    await deactivatePolicy(token, id);
    load();
  }

  return (
    <div>
      <AppNav />
      <div className="mx-auto max-w-2xl p-8">
        <div className="mb-2 flex items-baseline justify-between">
          <h1 className="font-sans text-xl font-semibold text-ink">Approval policies</h1>
          <button onClick={() => setShowForm(!showForm)} className="font-body text-sm text-teal hover:underline">
            {showForm ? "Cancel" : "+ New policy"}
          </button>
        </div>
        <p className="mb-6 font-body text-sm text-slate">
          A request is routed by the highest-priority policy whose department, category, and
          amount range match it. Every org gets a wildcard fallback automatically.
        </p>

        {showForm && (
          <form onSubmit={handleCreate} className="mb-8 border border-line bg-paper p-5">
            <label className="mb-1 block font-body text-xs text-slate">Policy name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mb-4 w-full border border-line bg-white px-3 py-2 font-body text-sm text-ink"
            />

            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block font-body text-xs text-slate">Department (blank = any)</label>
                <input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full border border-line bg-white px-3 py-2 font-body text-sm text-ink"
                />
              </div>
              <div>
                <label className="mb-1 block font-body text-xs text-slate">Category (blank = any)</label>
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-line bg-white px-3 py-2 font-body text-sm text-ink"
                />
              </div>
              <div>
                <label className="mb-1 block font-body text-xs text-slate">Min amount (blank = none)</label>
                <input
                  type="number"
                  value={amountMin}
                  onChange={(e) => setAmountMin(e.target.value)}
                  className="w-full border border-line bg-white px-3 py-2 font-body text-sm text-ink"
                />
              </div>
              <div>
                <label className="mb-1 block font-body text-xs text-slate">Max amount (blank = none)</label>
                <input
                  type="number"
                  value={amountMax}
                  onChange={(e) => setAmountMax(e.target.value)}
                  className="w-full border border-line bg-white px-3 py-2 font-body text-sm text-ink"
                />
              </div>
            </div>

            <label className="mb-1 block font-body text-xs text-slate">
              Priority (higher wins when multiple policies match)
            </label>
            <input
              type="number"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="mb-5 w-full border border-line bg-white px-3 py-2 font-body text-sm text-ink"
            />

            <label className="mb-2 block font-body text-xs text-slate">Approval chain, in order</label>
            {steps.map((step, i) => (
              <div key={i} className="mb-3 border border-line bg-white p-3">
                <div className="mb-2 flex items-center gap-3">
                  <span className="font-mono text-xs text-slate">{i + 1}.</span>
                  <select
                    value={step.type}
                    onChange={(e) => updateStep(i, { type: e.target.value as StepDraft["type"] })}
                    className="border border-line px-2 py-1 font-body text-sm text-ink"
                  >
                    <option value="sequential">One approver</option>
                    <option value="parallel_group">Multiple, all required</option>
                  </select>
                  {steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setSteps((prev) => prev.filter((_, idx) => idx !== i))}
                      className="ml-auto font-mono text-xs text-slate hover:text-rust"
                    >
                      remove
                    </button>
                  )}
                </div>
                {step.type === "sequential" ? (
                  <input
                    required
                    placeholder="role, e.g. direct_manager"
                    value={step.role}
                    onChange={(e) => updateStep(i, { role: e.target.value })}
                    className="mb-2 w-full border border-line px-3 py-2 font-body text-sm text-ink"
                  />
                ) : (
                  <input
                    required
                    placeholder="roles, comma-separated, e.g. legal_reviewer, finance_reviewer"
                    value={step.roles}
                    onChange={(e) => updateStep(i, { roles: e.target.value })}
                    className="mb-2 w-full border border-line px-3 py-2 font-body text-sm text-ink"
                  />
                )}
                <input
                  placeholder="condition, optional, e.g. amount > 100000"
                  value={step.condition}
                  onChange={(e) => updateStep(i, { condition: e.target.value })}
                  className="w-full border border-line px-3 py-2 font-body text-sm text-ink"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => setSteps((prev) => [...prev, emptyStep()])}
              className="mb-5 font-body text-sm text-teal hover:underline"
            >
              + Add step
            </button>

            {error && <div className="mb-4 font-body text-xs text-rust">{error}</div>}
            <button disabled={busy} type="submit" className="bg-teal px-4 py-2 font-body text-sm text-white hover:bg-teal/90 disabled:opacity-50">
              Create policy
            </button>
          </form>
        )}

        {!showForm && error && <div className="mb-4 font-body text-sm text-rust">{error}</div>}

        <div className="divide-y divide-line border-t border-line">
          {policies.map((p) => (
            <div key={p.id} className="py-4">
              <div className="flex items-baseline justify-between">
                <div className="font-body text-sm text-ink">{p.name}</div>
                <span className="font-mono text-xs text-slate">priority {p.priority}</span>
              </div>
              <div className="mt-1 font-body text-xs text-slate">
                {p.department ?? "any department"} · {p.category ?? "any category"} ·{" "}
                {p.amountMin != null ? currency.format(p.amountMin) : "no min"}
                {p.amountMax != null ? ` – ${currency.format(p.amountMax)}` : "+"}
              </div>
              <div className="mt-1 font-mono text-xs text-slate">{describeChain(p.chainTemplate)}</div>
              {p.activeUntil ? (
                <div className="mt-1 font-mono text-xs text-rust">retired</div>
              ) : (
                <button onClick={() => handleDeactivate(p.id)} className="mt-1 font-mono text-xs text-slate hover:text-rust">
                  deactivate
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
