"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AppNav } from "../../components/AppNav";
import { fetchOrg, fetchOrgInvites, inviteTeammate } from "../../lib/api";
import { Organization, OrgInvite } from "../../lib/types";
import { DelegationsSection } from "../../components/DelegationsSection";

export default function TeamPage() {
  const { data: session } = useSession();
  const token = session?.backendToken;
  const [org, setOrg] = useState<Organization | null>(null);
  const [invites, setInvites] = useState<OrgInvite[]>([]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function load() {
    if (!token) return;
    fetchOrg(token).then(setOrg).catch((e) => setError(e.message));
    fetchOrgInvites(token).then(setInvites).catch(() => {});
  }

  useEffect(load, [token]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      await inviteTeammate(token, email);
      setEmail("");
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const me = org?.users.find((u) => u.email === session?.user?.email);

  return (
    <div>
      <AppNav />
      <div className="mx-auto max-w-2xl p-8">
        <h1 className="mb-1 font-sans text-xl font-semibold text-ink">{org?.name ?? "Team"}</h1>
        <p className="mb-8 font-body text-sm text-slate">
          Anyone who signs up with an invited email joins this organization automatically.
        </p>

        <form onSubmit={handleInvite} className="mb-8 flex gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@company.com"
            className="flex-1 border border-line px-3 py-2 font-body text-sm text-ink"
          />
          <button
            disabled={busy}
            type="submit"
            className="bg-teal px-4 py-2 font-body text-sm text-white hover:bg-teal/90 disabled:opacity-50"
          >
            Invite
          </button>
        </form>
        {!me?.isOrgOwner && (
          <p className="-mt-6 mb-8 font-body text-xs text-slate">Only the organization owner can send invites.</p>
        )}
        {error && <div className="mb-6 font-body text-xs text-rust">{error}</div>}

        <h2 className="mb-3 font-body text-sm font-medium text-slate">Members</h2>
        <div className="mb-8 divide-y divide-line border-t border-line">
          {org?.users.map((u) => (
            <div key={u.id} className="flex items-center justify-between py-3">
              <div>
                <div className="font-body text-sm text-ink">{u.name}</div>
                <div className="font-body text-xs text-slate">{u.email}</div>
              </div>
              <div className="font-mono text-xs text-slate">{u.isOrgOwner ? "Owner" : u.role.replace(/_/g, " ")}</div>
            </div>
          ))}
        </div>

        {invites.length > 0 && (
          <>
            <h2 className="mb-3 font-body text-sm font-medium text-slate">Pending invites</h2>
            <div className="divide-y divide-line border-t border-line">
              {invites.map((i) => (
                <div key={i.id} className="py-3 font-body text-sm text-slate">
                  {i.email}
                </div>
              ))}
            </div>
          </>
        )}

        {token && <DelegationsSection token={token} />}
      </div>
    </div>
  );
}
