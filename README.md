# ReadME

This is a reference-implementation AI procurement platform: vendor discovery, RFQs, spec/price
comparison, vendor reliability, negotiation, configurable multi-step approvals, and purchase
order generation, built multi-tenant from the ground up. `README.md` covers what's built, what
needs your own credentials, and how to run it. This doc is about how to safely change it.

Backend: Node.js + Express + Prisma/Postgres + BullMQ (Redis) 
Frontend: Next.js (App Router) + React + TypeScript + Tailwind.

## Quick start

```bash
git clone <this repo>
cd backend && npm install && cp ../.env.example .env   # fill in JWT_SECRET, ANTHROPIC_API_KEY
npx prisma migrate dev
npx ts-node prisma/seed.ts
npm run dev        # API on :4000
npm run workers     # separate terminal — spec extraction + escalation sweeps

cd ../frontend && npm install && cp ../.env.example .env.local   # fill in NEXTAUTH_SECRET
npm run dev          # http://localhost:3000
```

Sign in with any seeded demo account (see `backend/prisma/seed.ts` — password
`demo-password-123` for all of them), or register your own; a fresh registration creates its
own organization, isolated from the seeded one. Full env var reference is in the main README.

Or skip all of that and run `docker compose up --build` from the repo root with a filled-in
`.env` — see the Deployment section of the main README. (Worth knowing: that path hasn't been
exercised in this project's own dev environment, which had no Docker available — if you hit
something wrong with the Dockerfiles or compose file, that's the most likely place for it.)

## Before you touch anything: the invariants that must never break

Four rules hold this system together. Nearly every bug that matters here is one of these being
violated, usually by accident, usually in a new route someone added without realizing it.

### 1. Every list or lookup query must be scoped to the caller's organization

`organizationId` lives in the JWT (`auth.ts` → `req.user.organizationId` via
`middleware/requireAuth.ts`) and is the entire tenancy boundary. There is no other enforcement
layer — a query that forgets to filter by it is a cross-tenant data leak, not a missing
feature.

- **List routes** filter directly: `where: { organizationId: req.user!.organizationId }`.
- **Single-record routes** (`GET /purchase-requests/:id`, `/rfqs/:id/comparison`, negotiation
  and PO routes) can't just filter a list — the id itself is guessable/enumerable. Every one of
  these loads the record and checks ownership *before* doing anything else, returning `404`
  (never `403`) on a mismatch so a request from another org doesn't even confirm the id exists.
  See `loadOwnedPurchaseRequest` in `routes/purchaseRequests.ts`, `loadOwnedRfq` in
  `routes/rfqs.ts`, `quoteBelongsToOrg`/`threadBelongsToOrg` in `routes/negotiationAndPo.ts` —
  copy this pattern for any new by-id route, including ones with no frontend yet. Routes get
  added before UI; the ownership check doesn't get to wait.
- **Records without their own `organizationId`** (`Quote`, `ApprovalStep`, `ExtractedSpec`,
  `NegotiationThread`) are scoped implicitly by walking to a parent that has one (usually
  `RfqEvent` or `PurchaseRequest`). If you add a new child record type, decide explicitly
  whether it needs its own `organizationId` or can be scoped through its parent — don't leave
  it unscoped by default.
- Role/user lookups inside the routing engine (`resolveRoleToUser` in `routing-engine.ts`) are
  scoped by `organizationId` too — resolving a role name to a user without that filter would
  let one org's policy resolve to another org's employee.

### 2. There is exactly one function that decides "is this request's approval chain satisfied"

`reconcileRouting()` in `routing-engine.ts` is called from two places: whenever a
routing-relevant field changes (`onPurchaseRequestFieldsChanged`), and as a finalization gate
immediately before a request would flip to `approved` (`tryFinalize`, called after every step
approval). This is deliberate: a stale approval must never count as final authorization, even
if a field changed a split second before the last approver clicked approve. If you need new
logic that touches "what does this request require" or "is it satisfied," it goes inside or
alongside this function — never as a second, parallel decision path. Two functions that can
each say "approved" is how this kind of system quietly breaks.

### 3. AI-generated content drafts; a human sends

Negotiation messages (`negotiation.ts`) and quote request emails (`rfq.ts`) are always created
in a draft/unsent state first. There is exactly one function that can mark a negotiation
message sent — `approveAndSendDraft`, which requires an authenticated approver — and no code
path that skips it. If you add a new AI-generated outbound communication (another follow-up
type, a different message kind), follow the same shape: generate → store as draft → separate,
explicit, human-triggered send. Don't wire an LLM call directly to `sendEmail()`.

### 4. Audit-relevant records are append-only

`ApprovalPolicy` rows are never deleted, only retired (`activeUntil` set —
`POST /policies/:id/deactivate`), because an in-flight purchase request may have been routed
under one and `reconcileRouting()` re-resolves against "currently active" policies on every
change. `ApprovalStep` rows are never deleted or mutated once `approved`/`rejected`; a
re-routed chain creates new rows under a new `routingVersion` rather than editing old ones.
`Delegation` rows are the one exception — they're safe to hard-delete (`DELETE /delegations/:id`)
because they only affect chain *resolution* going forward; any step already created under a now-deleted
delegation already has its resolved `approverUserId` baked in. If you're not sure whether a new
record type needs this treatment, ask: "would deleting this silently rewrite what actually
happened?" If yes, soft-delete it.

## Adding a new API route: checklist

1. **Auth is automatic** — every router except `authRouter` is mounted behind `requireAuth` in
   `index.ts`, so `req.user` is always populated inside route handlers. Don't add your own auth
   check; do make sure your router is mounted in the `requireAuth` block, not the public one.
2. **Validate the body.** Add a schema to `schemas.ts` and wrap the handler with
   `validate(yourSchema)` (`middleware/validate.ts`). Look at an existing route for the pattern
   — validated `req.body` comes back type-coerced, so handlers shouldn't re-check shape.
3. **Scope by organization** per the invariant above — either a direct `where` filter, or an
   ownership-check helper for by-id routes. This is not optional and not something to defer to
   a follow-up PR.
4. **Write from `req.user`, never the body**, for anything that attributes an action to a
   person (`actorId`, `approverId`, etc.). The body is client-controlled; `req.user` isn't.
5. **If it's pure logic** (no DB/network access, deterministic output from its inputs), put it
   in `src/pure/` as its own small module and write a test for it — see "Testing" below. If
   it's not pure but you're extracting shared logic, a regular file under `src/` is fine.

## Frontend conventions

- **`lib/api.ts`** is the only place that calls the backend. Every function takes a
  `session.backendToken` (from `useSession()`) as its first argument and returns already-typed
  data — see `lib/types.ts` for the shapes. New backend routes get a matching function here,
  not an inline `fetch()` in a component (the few `fetch()` calls that still exist inline —
  e.g. the RFQ creation form — are inconsistencies worth cleaning up if you're touching that
  file, not a pattern to copy).
- **`components/AppNav.tsx`** is the persistent nav — add a link here for any new top-level
  page, and add the route to the `matcher` array in `middleware.ts` or it won't be
  auth-protected.
- **Design tokens** live in `tailwind.config.ts` (colors: `ink`, `paper`, `teal`, `amber`,
  `moss`, `rust`, `slate`, `mist`; fonts: `font-sans` for headings, `font-body` for UI text,
  `font-mono` reserved for genuinely tabular/data content — amounts, statuses, IDs — not
  decorative labels). Reuse these rather than introducing new colors or ad hoc styling; the
  whole app, marketing page included, is meant to read as one system.
- Pages that need the session use `useSession()` from `next-auth/react` and read
  `session?.backendToken`; there's no server-side session helper in use here, everything is
  client-rendered (`"use client"`) by convention in this codebase.

## Testing

```bash
cd backend && npm test
```

The test suite (`src/pure/*.test.ts`, `src/__tests__/*.test.ts`) covers pure business logic and
security-critical middleware in isolation — the approval chain's condition parser, the
reliability-scoring formula, TCO calculation, password hashing/JWT round-trips, and the
`requireAuth`/`validate` middleware — deliberately without a live database, so they run
anywhere instantly. There's no integration/e2e suite yet (nothing exercises routes + a real
Postgres together); if you add one, a real Postgres in CI (not mocking Prisma) is the more
valuable direction than deeper mocking.

When you add a pure function, add its test alongside it in `src/pure/`. When you touch
`routing-engine.ts`, at minimum extend the `chain-conditions` tests if you touched condition
parsing — the reconciliation logic itself still isn't unit-tested (see below), so tests on the
piece that is are worth keeping thorough.

CI (`.github/workflows/ci.yml`) runs `tsc --noEmit` + `npm test` for the backend and
`next build` for the frontend on every push/PR. It runs `prisma generate` first, which needs
real network access to Prisma's engine registry — this project's own dev sandbox couldn't
reach it, which is why backend commands here are sometimes run with Prisma-generation errors
filtered out; a real CI runner won't have that problem.

## Where to start

Genuinely open work, roughly in order of impact:

- **Integration tests for `routing-engine.ts` against a real Postgres** — the most
  consequential untested code in the repo. The unit tests cover its pure helpers; the
  stateful reconciliation logic (in-flight preservation, the finalization gate, segregation of
  duties) only gets exercised by using the app.
- **A real vendor financial-health data source** — `scoreVendor` takes `financialHealthScore`
  as a plain input; wiring a real API (D&B-style) means populating that field before the call,
  not redesigning `reliability.ts`.
- **Policy conflict handling** — if two policies of equal priority match the same request, the
  current behavior is whichever `findMatchingPolicy` finds first; explicit tie-breaking would
  be a good, self-contained improvement.
- **An actual verified Docker build** — see the caveat above.
- Accessibility and mobile-responsiveness pass — functional but not deeply audited.
- Anything in the main README's "Genuinely still open" list.

If you're adding a feature not listed here, the four invariants above are the review bar —
a PR that adds a new by-id route without an ownership check, or a new AI-drafted message that
sends without an explicit approval step, is the kind of thing that should get caught in review
even if the feature itself works.
