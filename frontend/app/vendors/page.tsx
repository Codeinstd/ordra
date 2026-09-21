"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AppNav } from "../../components/AppNav";
import { fetchVendors, createVendor, discoverVendorCandidates } from "../../lib/api";
import { Vendor, VendorCandidate } from "../../lib/types";
import { VendorCard } from "../../components/VendorCard";

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "general";
}

export default function VendorsPage() {
  const { data: session } = useSession();
  const token = session?.backendToken;
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [categories, setCategories] = useState("");
  const [busy, setBusy] = useState(false);

  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<VendorCandidate[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [addedNames, setAddedNames] = useState<Set<string>>(new Set());

  function load() {
    if (!token) return;
    fetchVendors(token).then(setVendors).catch((e) => setError(e.message));
  }

  useEffect(load, [token]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    try {
      await createVendor(token, {
        name,
        website: website || undefined,
        categories: categories.split(",").map((c) => c.trim()).filter(Boolean),
      });
      setName("");
      setWebsite("");
      setCategories("");
      setShowForm(false);
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !query.trim()) return;
    setSearching(true);
    setError(null);
    try {
      setCandidates(await discoverVendorCandidates(token, query));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSearching(false);
    }
  }

  async function handleAddCandidate(c: VendorCandidate) {
    if (!token) return;
    try {
      await createVendor(token, { name: c.name, website: c.website || undefined, categories: [slugify(query)] });
      setAddedNames((prev) => new Set(prev).add(c.name));
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div>
      <AppNav />
      <div className="mx-auto max-w-2xl p-8">
        <h1 className="mb-6 font-sans text-xl font-semibold text-ink">Vendor directory</h1>

        <form onSubmit={handleSearch} className="mb-3 flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for vendors, e.g. 'industrial equipment suppliers'"
            className="flex-1 border border-line px-3 py-2 font-body text-sm text-ink"
          />
          <button disabled={searching} type="submit" className="border border-line px-4 py-2 font-body text-sm text-ink hover:bg-paper disabled:opacity-50">
            {searching ? "Searching…" : "Search"}
          </button>
        </form>

        {candidates && (
          <div className="mb-8 divide-y divide-line border-t border-line">
            {candidates.length === 0 && <div className="py-3 font-body text-sm text-slate">No results.</div>}
            {candidates.map((c) => (
              <div key={c.name} className="flex items-center justify-between py-3">
                <div>
                  <div className="font-body text-sm text-ink">{c.name}</div>
                  <div className="font-body text-xs text-slate">{c.summary}</div>
                  {c.website && <div className="font-mono text-xs text-teal">{c.website}</div>}
                </div>
                <button
                  onClick={() => handleAddCandidate(c)}
                  disabled={addedNames.has(c.name)}
                  className="shrink-0 font-body text-xs text-teal hover:underline disabled:text-slate disabled:no-underline"
                >
                  {addedNames.has(c.name) ? "Added" : "Add to directory"}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="font-body text-sm font-medium text-slate">Your directory</h2>
          <button onClick={() => setShowForm(!showForm)} className="font-body text-sm text-teal hover:underline">
            {showForm ? "Cancel" : "+ Add manually"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="mb-8 border border-line bg-paper p-5">
            <label className="mb-1 block font-body text-xs text-slate">Vendor name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mb-4 w-full border border-line bg-white px-3 py-2 font-body text-sm text-ink"
            />
            <label className="mb-1 block font-body text-xs text-slate">Website (optional — enables "enrich from website")</label>
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
              className="mb-4 w-full border border-line bg-white px-3 py-2 font-body text-sm text-ink"
            />
            <label className="mb-1 block font-body text-xs text-slate">Categories (comma-separated)</label>
            <input
              required
              value={categories}
              onChange={(e) => setCategories(e.target.value)}
              placeholder="equipment, packaging"
              className="mb-4 w-full border border-line bg-white px-3 py-2 font-body text-sm text-ink"
            />
            <button disabled={busy} type="submit" className="bg-teal px-4 py-2 font-body text-sm text-white hover:bg-teal/90 disabled:opacity-50">
              Add vendor
            </button>
          </form>
        )}

        {error && <div className="mb-4 text-sm text-rust font-body">{error}</div>}
        {token && vendors.map((v) => <VendorCard key={v.id} vendor={v} token={token} onChanged={load} />)}
      </div>
    </div>
  );
}
