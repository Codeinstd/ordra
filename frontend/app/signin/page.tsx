"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { registerAccount } from "../../lib/api";

// useSearchParams() opts this subtree out of static rendering, so Next
// requires it inside a Suspense boundary — split into an inner component
// so the outer page export itself stays a plain function.
function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/approvals";
  const [mode, setMode] = useState<"signin" | "register">(params.get("mode") === "register" ? "register" : "signin");

  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await signIn("credentials", { email, password, redirect: false, callbackUrl });
    setBusy(false);
    if (result?.error) setError("Incorrect email or password.");
    else router.push(callbackUrl);
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await registerAccount(name, email, password, companyName);
      // Registration doesn't itself start a session — sign in right after
      // with the same credentials so this is a single flow for the user.
      const result = await signIn("credentials", { email, password, redirect: false, callbackUrl });
      if (result?.error) throw new Error("Account created, but sign-in failed — try signing in below.");
      router.push(callbackUrl);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <div className="w-full max-w-sm border border-line bg-white p-8">
        <h1 className="mb-6 font-sans text-lg font-semibold text-ink">
          {mode === "signin" ? "Sign in" : "Create your account"}
        </h1>

        <button
          onClick={() => signIn("google", { callbackUrl })}
          className="mb-6 w-full border border-line py-2 font-body text-sm text-ink hover:bg-paper"
        >
          Continue with Google
        </button>

        <div className="mb-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-line" />
          <span className="font-mono text-xs text-slate">or</span>
          <div className="h-px flex-1 bg-line" />
        </div>

        <form onSubmit={mode === "signin" ? handleSignIn : handleRegister}>
          {mode === "register" && (
            <>
              <label className="mb-1 block font-body text-xs text-slate">Name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mb-4 w-full border border-line px-3 py-2 font-body text-sm text-ink"
              />
              <label className="mb-1 block font-body text-xs text-slate">Company name</label>
              <input
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Used unless a teammate already invited you"
                className="mb-4 w-full border border-line px-3 py-2 font-body text-sm text-ink"
              />
            </>
          )}
          <label className="mb-1 block font-body text-xs text-slate">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-4 w-full border border-line px-3 py-2 font-body text-sm text-ink"
          />
          <label className="mb-1 block font-body text-xs text-slate">Password</label>
          <input
            type="password"
            required
            minLength={mode === "register" ? 8 : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-4 w-full border border-line px-3 py-2 font-body text-sm text-ink"
          />
          {error && <div className="mb-4 font-body text-xs text-rust">{error}</div>}
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-teal py-2 font-body text-sm text-white hover:bg-teal/90 disabled:opacity-50"
          >
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "signin" ? "register" : "signin");
            setError(null);
          }}
          className="mt-4 w-full font-body text-xs text-slate hover:text-ink"
        >
          {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>

        {mode === "signin" && (
          <Link href="/forgot-password" className="mt-2 block text-center font-body text-xs text-slate hover:text-ink">
            Forgot password?
          </Link>
        )}
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}
