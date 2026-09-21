# AI procurement tool — reference implementation

Backend: Node.js + Express + Prisma/Postgres + BullMQ (Redis).
Frontend: Next.js (App Router) + React + TypeScript + Tailwind.

## What's real vs. what still needs your own credentials

Everything below is real, working code — nothing is a placeholder that only pretends to
function. The distinction that actually matters now is which integrations need *your*
credentials to do something in the real world versus running self-contained:

- **Approval workflow engine** (`routing-engine.ts`) — policy resolution, versioned
  reconciliation, in-flight preservation + final-state reconciliation gate, segregation-of-
  duties, delegation. Fully self-contained, no external service required.
- **Spec extraction pipeline** (`spec-extraction.ts`, `llm.ts`) — category-aware schema
  loading, structured LLM extraction with per-field confidence + source span, review queue
  (`/review`), missing-field follow-up drafting. Needs `ANTHROPIC_API_KEY`.
- **Price comparison** (`price-comparison.ts`) — normalized matrix builder, TCO calculation.
  Self-contained.
- **Vendor reliability scoring** (`reliability.ts`, `/vendors`) — transparent weighted scoring
  from signals you enter (on-time delivery, financial health, certifications, years in
  business, defect rate) + an LLM-written rationale. There's no free, credential-less
  equivalent to a real D&B-style financial-health API, so this takes the signals as input
  rather than pretending to fetch them from somewhere — wiring a real data source is a matter
  of populating `financialHealthScore` from that source before calling `scoreVendor`, not
  redesigning anything here.
- **Vendor website enrichment** (`vendors.ts`, "enrich from website" on `/vendors`) — a real
  HTTP fetch of the vendor's site plus an LLM classification call, not a stub. Needs
  `ANTHROPIC_API_KEY`; no other credential required since it just fetches a public page.
- **Negotiation** (`negotiation.ts`, `/negotiations/[id]`) — draft generation is separate from
  sending; exactly one function (`approveAndSendDraft`) can mark a message sent, gated on an
  authenticated approver. Needs `ANTHROPIC_API_KEY` to draft, SMTP to actually deliver.
- **Email** (`mailer.ts`) — real SMTP via nodemailer, used for quote requests, negotiation
  sends, password reset, and email verification. Without `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS`
  set, it logs the email to the console instead of failing — useful for local dev, not
  something to leave unset in production.
- **ERP export** (`po.ts`) — delivers the PO as a signed webhook POST to `ERP_WEBHOOK_URL`
  (HMAC-signed with `ERP_WEBHOOK_SECRET`, same pattern Stripe/GitHub use for outbound
  webhooks) rather than one specific ERP's SDK, since which ERP you're integrating with is a
  decision only you can make. Any real endpoint — a genuine SAP Ariba/Coupa/NetSuite inbound
  webhook, or middleware like Zapier/Make sitting in front of one — can receive this today.
  Without a URL configured, it logs instead of failing.
- **PO generation** (`po.ts`) — gated on `PurchaseRequest.status === "approved"`; won't
  generate a document otherwise.

Not built, and not planned — **billing**. This product has no seats, subscription state, or
paywall anywhere, by design.

Genuinely still open:
- **Vendor discovery beyond a directory** — finding *new* vendors (web search / directory
  crawl) isn't built; enrichment above only works on a vendor you've already added.
- Deeper integration/end-to-end tests (see Testing below for what *is* covered) and CI.
- Input validation is currently whatever Prisma's schema enforces — no dedicated request
  validation layer (e.g. zod) yet.

## Policy management, negotiation, and spec review

All three now have real UI, not just backend logic:

- **`/policies`** — create/list/retire `ApprovalPolicy` rows: department, category, amount
  range, priority, and a step-by-step chain builder (sequential or "all required" parallel
  steps, with an optional condition like `amount > 100000`). Policies are never hard-deleted —
  "deactivate" sets `activeUntil`, since an in-flight purchase request may have been routed
  under one and `reconcileRouting()` re-resolves against "currently active" policies on every
  change.
- **`/rfqs/[id]`** — add a quote by pasting in vendor-quote text against an existing vendor;
  this runs the *real* spec-extraction pipeline (queues the same job a real inbound quote
  would), not a shortcut. From there, **Negotiate** starts a thread at `/negotiations/[id]`:
  generate an AI-drafted counter-offer, and — the one invariant that matters here — nothing
  sends until a person clicks "Approve & send"; there's exactly one function
  (`approveAndSendDraft`) that can mark a message sent. A "simulate vendor reply" box lets you
  test the loop without real email integration.
- **`/review`** — every extracted spec field below the confidence threshold, org-wide, each
  shown next to the exact source text it was pulled from so confirming or correcting it takes
  seconds rather than re-reading the whole document.

## Multi-tenancy

Every organization is isolated: `Organization` is the tenancy root, and `User`, `Vendor`,
`RfqEvent`, `ApprovalPolicy`, and `PurchaseRequest` all carry an `organizationId`. Records
without their own `organizationId` (`Quote`, `ApprovalStep`, `ExtractedSpec`, ...) are scoped
implicitly through their parent — every route that reaches them checks ownership by walking
that relation (see `loadOwnedPurchaseRequest`/`loadOwnedRfq`/`quoteBelongsToOrg` etc. in the
route files) rather than trusting the id alone, since ids are guessable/enumerable.

`organizationId` is embedded in the JWT at issue time (`auth.ts`) and read from
`req.user.organizationId` everywhere — never from a request body. **Any new list or lookup
route that skips this filter is a cross-tenant data leak, not just a missing feature.**

**How org membership works:** the first person to sign up for a company creates a new
`Organization` and becomes its `isOrgOwner`. `createOrganization()` (`org.ts`) also seeds a
wildcard fallback `ApprovalPolicy` (role `org_owner`) so a brand-new org can route a request
to its owner even before anyone configures a real policy — see `routing-engine.ts`'s
`resolveRoleToUser`, which special-cases `org_owner` to look up whoever holds that flag in the
request's organization. A teammate joins the *same* org instead of creating their own by being
invited first (`/team` page, `POST /org/invites`, owner-only) — registration checks for a
pending `OrgInvite` matching the signup email before defaulting to "create a new org".

## Authentication, account security, and rate limiting

Sign-in supports email/password and Google, both converging on the same backend-issued JWT
so the Express API only ever has to verify one kind of token.

- **Backend** (`auth.ts`, `middleware/requireAuth.ts`, `routes/auth.ts`) — bcrypt password
  hashing, JWT issuance/verification (carrying `organizationId`), and `/auth/google` which
  independently verifies the Google ID token server-side (never trusts the frontend's claim
  about who signed in). Every route except `/auth/*` requires `requireAuth`, and write actions
  read the actor from `req.user`, not from the request body.
- **Frontend** (`lib/auth-options.ts`, `app/api/auth/[...nextauth]/route.ts`, `app/signin/`) —
  NextAuth (Auth.js) with a Google provider and a Credentials provider. The Credentials
  provider's `authorize()` calls the backend's `/auth/login` directly; the Google provider's
  `jwt` callback exchanges Google's ID token for a backend JWT via `/auth/google`. Either way,
  `session.backendToken` ends up holding the same kind of token, and `lib/api.ts` attaches it
  as `Authorization: Bearer <token>` on every call. `middleware.ts` redirects unauthenticated
  visitors to `/signin` for the protected routes.
- **Password reset** — `/forgot-password` → `/auth/forgot-password` issues a single-use,
  hashed, 1-hour token (`verification.ts`) and emails a link; `/reset-password` consumes it.
  The forgot-password response is identical whether or not the email has an account, so it
  can't be used to enumerate registered emails.
- **Email verification** — registration emails a 7-day verification link automatically;
  Google sign-in skips this since Google already verified that email. `AppNav` shows a banner
  with a resend link for any unverified account. Nothing is currently gated on verification
  status — it's tracked and surfaced, not yet enforced as a hard requirement to use the app.
- **Rate limiting** (`express-rate-limit`) — a strict limiter (20 req/15 min/IP) on
  `/auth/login`, `/auth/register`, `/auth/forgot-password`, and `/auth/reset-password`
  specifically, since those are the endpoints brute-forcing or spam-registering would target;
  a lighter general ceiling (300 req/min/IP) on everything else in `index.ts`.

Required env vars:

```
# backend/.env
JWT_SECRET=...
GOOGLE_CLIENT_ID=...        # same OAuth client as the frontend
ANTHROPIC_API_KEY=...
DATABASE_URL=postgres://...
REDIS_URL=redis://localhost:6379
FRONTEND_URL=http://localhost:3000   # used to build reset/verify links in emails

# optional — without these, email is logged to the console instead of sent
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
MAIL_FROM=no-reply@your-domain.example

# optional — without this, ERP export is logged instead of delivered
ERP_WEBHOOK_URL=...
ERP_WEBHOOK_SECRET=...

# frontend/.env.local
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
BACKEND_API_BASE=http://localhost:4000/api        # server-side (NextAuth callbacks)
NEXT_PUBLIC_API_BASE=http://localhost:4000/api    # client-side (lib/api.ts)
```

Seeded demo org "Acme Demo Co" (see `prisma/seed.ts`) — all users share the password
`demo-password-123`. `admin@example.com` is the org owner (catch-all approver via the wildcard
policy); `mo@example.com` / `lee@example.com` / `fran@example.com` / `devi@example.com` /
`dana@example.com` are the engineering approval chain; `rae@example.com` is the requester.
A self-registered account creates its own separate organization and won't see any of this —
that's the multi-tenancy boundary working as intended, not a bug.

## Testing

```bash
cd backend
npm test
```

20 unit tests across the logic that's genuinely worth testing in isolation: the approval
chain's condition parser (`amount > 100000` etc.), the reliability-scoring formula, the
total-cost-of-ownership calculation, and password hashing/JWT issue-verify round trips. These
were deliberately extracted into `src/pure/*` — small, dependency-free modules — specifically
so they're testable without a live Postgres/Redis connection; the route and routing-engine
logic that talks to the database is exercised by using the app itself (see the demo accounts
above), not by an automated integration suite yet.

## Deployment

`docker-compose.yml` at the repo root wires up Postgres, Redis, the API, the BullMQ worker
process, and the frontend, each from its own `Dockerfile`. Copy `.env.example` to `.env`, fill
in at least `JWT_SECRET`, `NEXTAUTH_SECRET`, and `ANTHROPIC_API_KEY`, then:

```bash
docker compose up --build
```

The frontend's `NEXT_PUBLIC_API_BASE` is baked in at build time (it's a browser-side env var,
not a runtime one — a Next.js/Docker gotcha worth knowing about), so if you're deploying
behind a real domain rather than localhost, set it in `.env` before building, not after.

The backend Dockerfile runs `prisma generate` during the image build; the compose file runs
`prisma migrate deploy` + the seed script once via a one-shot `migrate` service before the API
and worker start.

## Running it locally without Docker

```bash
# Backend
cd backend
npm install
npm run prisma:migrate
npx ts-node prisma/seed.ts
npm run dev       # API on :4000
npm run workers   # separate process — spec-extraction + escalation sweeps

# Frontend
cd frontend
npm install
npm run dev        # http://localhost:3000
```

Pages: `/` (marketing landing), `/signin` (sign-in/register), `/forgot-password` +
`/reset-password` + `/verify-email`, `/approvals` (queue + detail), `/requests` (your
submitted requests), `/requests/new` (quick-create for testing the approval flow), `/rfqs` +
`/rfqs/[id]` (list, detail, add quote), `/rfqs/[id]/compare` (comparison matrix),
`/negotiations/[id]` (draft/approve/send), `/review` (spec review queue), `/policies`
(approval chain configuration), `/vendors` (directory, reliability scoring, website
enrichment), `/team` (org members + invites).

## The one invariant worth re-reading before extending any of this

`reconcileRouting()` in `routing-engine.ts` is called both on every routing-relevant field
change and as the finalization gate right before a request would flip to `approved`. If you
add a new feature that mutates a `PurchaseRequest`'s amount/department/category outside of
`onPurchaseRequestFieldsChanged` (e.g. a bulk-import script), route it through that function
too — that's the only way the "never let a stale approval count as final authorization"
guarantee holds.
