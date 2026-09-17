"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AppNav } from "../../components/AppNav";
import { fetchVendors, createVendor } from "../../lib/api";
import { Vendor } from "../../lib/types";
import { VendorCard } from "../../components/VendorCard";

export default function VendorsPage() {
  const { data: session } = useSession();
  const token = session?.backendToken;
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [categories, setCategories] = useState("");
  const [busy, setBusy] = useState(false);

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
      await createVendor(token, { name, categories: categories.split(",").map((c) => c.trim()).filter(Boolean) });
      setName("");
      setCategories("");
      setShowForm(false);
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <AppNav />
      <div className="mx-auto max-w-2xl p-8">
        <div className="mb-6 flex items-baseline justify-between">
          <h1 className="font-sans text-xl font-semibold text-ink">Vendor directory</h1>
          <button onClick={() => setShowForm(!showForm)} className="font-body text-sm text-teal hover:underline">
            {showForm ? "Cancel" : "+ Add vendor"}
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

        {error && <div className="text-sm text-rust font-body">{error}</div>}
        {vendors.map((v) => (
          <VendorCard key={v.id} vendor={v} />
        ))}
      </div>
    </div>
  );
}
