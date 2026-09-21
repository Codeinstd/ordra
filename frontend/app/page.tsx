"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { ApprovalChainMockup } from "../components/ApprovalChainMockup";
import { BentoHowItWorks } from "../components/BentoHowItWorks";
import { FaqAccordion } from "../components/FaqAccordion";

const capabilities = [
  { title: "Vendor discovery", body: "Expand sourcing beyond your existing vendor list without manual cold outreach." },
  { title: "Automated quote requests", body: "Draft and send RFQs to every vendor on your list in one pass." },
  { title: "Spec comparison", body: "Every quote normalized into one matrix, with confidence flags on anything uncertain." },
  { title: "Price comparison", body: "True total cost of ownership — not just the number on the first page." },
  { title: "Vendor reliability scoring", body: "A transparent, explainable score built from real signals, not a black box." },
  { title: "AI-assisted negotiation", body: "Counter-offers drafted instantly. A person always approves before anything sends." },
  { title: "Configurable approvals", body: "Multi-level, audit-ready chains that re-route correctly when a deal changes." },
  { title: "Purchase order generation", body: "Generate and export a PO the moment approval clears — no re-keying." },
];



export default function LandingPage() {
  const { data: session, status } = useSession();
  const signedIn = status === "authenticated";

  return (
    <div className="bg-white">
      <nav className="sticky top-0 z-10 border-b border-white/10 bg-[#10151A]/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <span className="font-sans text-base font-semibold text-white">Procurement</span>
          <div className="flex items-center gap-5">
            {signedIn ? (
              <Link href="/approvals" className="bg-teal px-4 py-2 font-body text-sm text-white hover:bg-teal/90">
                Go to your approvals
              </Link>
            ) : (
              <>
                <Link href="/signin" className="font-body text-sm text-mist hover:text-white">
                  Sign in
                </Link>
                <Link href="/signin?mode=register" className="bg-teal px-4 py-2 font-body text-sm text-white hover:bg-teal/90">
                  Start for free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <header className="relative overflow-hidden bg-[#10151A]">
        <div
          className="pointer-events-none absolute -top-40 right-[-10%] h-[560px] w-[560px] rounded-full opacity-30 blur-[110px]"
          style={{ background: "radial-gradient(circle, #1C6E74 0%, transparent 70%)" }}
        />
        <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 px-6 py-24 lg:grid-cols-2 lg:py-32">
          <div>
            <h1 className="rise-in font-sans text-5xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl">
              Sourcing decisions your team can defend.
            </h1>
            <p className="rise-in mt-6 max-w-md font-body text-lg leading-relaxed text-mist" style={{ animationDelay: "0.1s" }}>
              Compare vendors, quotes, and specs automatically, with an approval trail built
              for audit, not just automation.
            </p>
            <div className="rise-in mt-9 flex items-center gap-3" style={{ animationDelay: "0.2s" }}>
              {signedIn ? (
                <Link href="/approvals" className="bg-teal px-6 py-3 font-body text-sm text-white hover:bg-teal/90">
                  Go to your approvals
                </Link>
              ) : (
                <>
                  <Link href="/signin?mode=register" className="bg-teal px-6 py-3 font-body text-sm text-white hover:bg-teal/90">
                    Start for free
                  </Link>
                  <Link href="/signin" className="border border-white/20 px-6 py-3 font-body text-sm text-white hover:bg-white/5">
                    Sign in
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="rise-in flex justify-center lg:justify-end" style={{ animationDelay: "0.15s" }}>
            <ApprovalChainMockup />
          </div>
        </div>
      </header>

      <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="mb-10 font-sans text-3xl font-semibold leading-tight text-ink">How it works</h2>
        <BentoHowItWorks />
      </section>

      <section className="border-t border-line bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <h2 className="mb-14 max-w-lg font-sans text-3xl font-semibold leading-tight text-ink">
            Everything between an RFQ and a signed-off purchase order.
          </h2>
          <div className="grid grid-cols-1 gap-x-12 sm:grid-cols-2">
            {capabilities.map((c, i) => (
              <div key={c.title} className={`py-6 ${i % 2 === 0 ? "sm:border-r sm:border-line sm:pr-12" : "sm:pl-12"} border-t border-line`}>
                <div className="font-body text-base font-medium text-ink">{c.title}</div>
                <p className="mt-1.5 max-w-sm font-body text-sm leading-relaxed text-slate">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-3xl px-6 py-24">
        <h2 className="mb-2 font-sans text-3xl font-semibold leading-tight text-ink">Questions procurement teams ask</h2>
        <FaqAccordion />
      </section>

      {!signedIn && (
        <section className="bg-[#10151A]">
          <div className="mx-auto max-w-2xl px-6 py-24 text-center">
            <h2 className="font-sans text-3xl font-semibold text-white">See it on your own quotes.</h2>
            <p className="mx-auto mt-3 max-w-sm font-body text-base text-mist">
              No credit card. Set up your first RFQ in a few minutes.
            </p>
            <div className="mt-8">
              <Link href="/signin?mode=register" className="bg-teal px-6 py-3 font-body text-sm text-white hover:bg-teal/90">
                Start for free
              </Link>
            </div>
          </div>
        </section>
      )}

      <footer className="bg-[#10151A]">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
            <div className="col-span-2">
              <span className="font-sans text-base font-semibold text-white">Procurement</span>
              <p className="mt-3 max-w-xs font-body text-sm text-mist">
                Vendor sourcing, comparison, and approvals, in one auditable flow.
              </p>
            </div>
            <div>
              <div className="font-body text-sm text-white">Product</div>
              <div className="mt-3 flex flex-col gap-2">
                <a href="#how-it-works" className="font-body text-sm text-mist hover:text-white">How it works</a>
                <a href="#faq" className="font-body text-sm text-mist hover:text-white">FAQ</a>
              </div>
            </div>
            <div>
              <div className="font-body text-sm text-white">Account</div>
              <div className="mt-3 flex flex-col gap-2">
                <Link href="/signin" className="font-body text-sm text-mist hover:text-white">Sign in</Link>
                <Link href="/signin?mode=register" className="font-body text-sm text-mist hover:text-white">Start for free</Link>
              </div>
            </div>
          </div>
          <div className="mt-14 border-t border-white/10 pt-6 font-mono text-xs text-mist">
            © {new Date().getFullYear()} Procurement
          </div>
        </div>
      </footer>
    </div>
  );
}
