# LaunchRadar

**Positioning:** "You vibe coded the app. Now vibe market it."

An AI growth agent for vibe-coded apps. Founders can build a product in an
afternoon with Lovable/Bolt/Replit/Cursor/Claude Code — but getting anyone
to notice it is still all manual, generic, and exhausting. LaunchRadar takes
a URL and tells the founder *who* needs their product, *where* those people
are, and *what to do this week* to reach them — then does as much of the
work as possible itself.

Brand ecosystem context: **VibeCheck** answers "is my app safe to launch?".
LaunchRadar answers "now get people using it." Natural cross-sell once both
exist: a VibeCheck security score links to "Ready to find your first 100
users? → Start your Growth Score."

Full original brainstorm this project is based on is preserved in
`docs/CONCEPT.md` — read that for the complete feature vision (Opportunity
Radar, Experiments, Competitor Hijack, build-in-public automation, etc.)
before starting any Phase 2+ work.

## Why this over "another AI social media manager"

The market (Native, PromoteOS, Xoru, Zarek) already does content generation
well. The gap is judgment: **what should THIS specific app actually do** to
get users — not a generic 50-item marketing checklist. A consumer app, a
B2B SaaS tool, and a developer security product each need completely
different channels. LaunchRadar's differentiation, in priority order:

1. Tailor the plan to the actual product (ICP/category-aware), not generic.
2. Find *existing* demand (Opportunity Radar) rather than only generating
   new content.
3. Say **stop** — call out channels that aren't working and reallocate
   effort, which most marketing tools never do.
4. Curate rather than dump — "submit to these 11 directories, skip Product
   Hunt" beats "submit everywhere."

## Tech stack

- **Next.js 16** (App Router, Turbopack), TypeScript, React 19
- **Tailwind CSS v4**
- **`@tabler/icons-react`** for every icon in the UI — no emoji as icons
  (nav items, buttons, status/impact indicators). Import icons directly
  (`import { IconRocket } from "@tabler/icons-react"`), no wrapper module.
  Where an icon is passed as a prop (`ComingSoon`, nav `Item.icon`), the prop
  type is a small structural type — `(props: { size?, stroke?, className? })
  => ReactNode` — not an imported Tabler type, since the package doesn't
  export one. Colour/severity dots (`IMPACT_DOT` etc.) stay as plain CSS
  dots, not icons — that convention predates and is kept independent of this.
- **Prisma 6** + **PostgreSQL** — `prisma-client` generator (new ESM
  generator, not the old `prisma-client-js`). Import from
  `@/generated/prisma/client`, not `@/generated/prisma` (no index barrel).
- **Clerk** (`@clerk/nextjs` v7 — "Core 3") for auth.
  - ⚠️ Core 3 breaking change vs. older Clerk docs/training data: `<SignedIn>`
    / `<SignedOut>` / `<Protect>` are **removed**. Use `<Show when="signed-in">`
    / `<Show when="signed-out">` / `<Show when={{ role: ... }}>` instead
    (from `@clerk/nextjs`).
  - Route protection lives in `src/proxy.ts` (Next 16 renamed the
    `middleware.ts` convention to `proxy.ts`; `clerkMiddleware` still works
    unchanged, just relocate the file).
- **Claude API** (`@anthropic-ai/sdk`) for the analysis/generation pipeline.
  Structured output via `client.messages.parse()` + `zodOutputFormat(schema)`
  — see `src/lib/analysis.ts`. **Model tiers** (`src/lib/anthropic.ts`):
  `MODEL_FAST` = `claude-haiku-4-5` (query generation, opportunity
  classification), `MODEL_WRITE` = `claude-sonnet-5` (issue summaries,
  "Why:" rationales, visibility diagnosis, launch copy, how-to guides,
  web-search retrieval passes), `MODEL_JUDGE` = `claude-opus-5` (one call
  per analysis — `refineTopAction`, picks + sharpens the single next-best
  action). Don't reach for `MODEL_JUDGE` elsewhere without a reason.
- Multi-tenant convention (matches FireXCheck/TwnCryr): every row scoped by
  an `organisationId`. Clerk organisations map 1:1 to `Organisation` rows;
  solo founders without a Clerk org get a synthetic
  `user_<clerkUserId>` organisation (see `src/lib/org.ts`).

## Project structure

```
prisma/schema.prisma        Organisation (+ tier + stripe fields + email/firstName/welcomeSentAt/
                              emailOptOut), Project, Analysis, LaunchPlan,
                              Action, VisibilityReport, ProductProfile, RadarQuery, RadarScan,
                              Opportunity, OpportunityFeedback, Usage, Subscriber
src/lib/prisma.ts           Prisma client singleton
src/lib/plan.ts             Pricing-tier limits (PLAN_LIMITS) + monthly usage metering —
                              the single source of truth behind the /pricing table
src/lib/anthropic.ts        Anthropic client + model constant
src/lib/org.ts              requireOrganisation() — resolves/creates tenant row; adds `isAdmin`
                              from the ADMIN_CLERK_USER_IDS allowlist. Also fires the one-time
                              welcome email via `after()` → `syncOrgContact` (backfills
                              Organisation.email/firstName from Clerk, stamps welcomeSentAt) —
                              only runs when email or welcomeSentAt is missing
src/lib/website.ts          Deterministic technical + discovery (AEO/GEO) checks, no LLM
src/lib/url.ts              URL normalisation + SSRF guard for founder-supplied URLs; domainOf()
src/lib/analysis.ts         Orchestrates website.ts + Claude → Analysis row + seeds Actions
src/lib/score.ts            Growth Score → 6-dimension breakdown + backlog projection (pure)
src/lib/launch.ts           Phase 2 — latest Analysis + Claude → LaunchPlan row
src/lib/visibility.ts       Phase 3a — on-site checks + Claude dims + live AI Visibility test
src/lib/radar.ts            Phase 3 — product profile + intent queries + web-search scan →
                              classify → score → Opportunity rows
src/lib/action-dedup.ts     Loose title-similarity dedup shared by every Action-seeding path
src/lib/action-guide.ts     Backlog CTA — Claude → asset draft ("Create with AI") or how-to
src/app/page.tsx            Public landing (hero) — SiteHeader + RadarBackground
src/app/pricing/          Public pricing page — server `page.tsx` (hero + metadata + current
                              tier) wraps the `pricing-plans.tsx` client component: monthly/annual
                              toggle (annual ≈ 20% off — Builder £12/mo·£115/yr, Growth
                              £24/mo·£229/yr), 3 tier cards + feature comparison. Signed-out CTA →
                              /sign-up; signed-in CTA → Stripe Checkout (`startCheckout`) or the
                              portal for existing subscribers. Linked from landing + SiteHeader.
src/app/faq/               Public FAQ — `faq-data.ts` (sectioned Q&A, single source) →
                              rendered page + `FAQPage` JSON-LD
src/app/compare/          Public comparison hub (`compare-data.ts`) + `/compare/[slug]`
                              head-to-head pages (statically generated, per-page metadata +
                              JSON-LD). LaunchRadar vs AI content tools / generic checklist /
                              growth hire / AI-chat plan.
src/app/{privacy,terms,cookies}/   Legal pages — share `components/legal-page.tsx` shell.
                              Operator: IGNISTECH LTD (England & Wales, co. no. 16892976,
                              21 Winterberry Way, Nantwich, Cheshire), contact
                              launchradar@outlook.com. UK GDPR / PECR framing; governing law
                              England & Wales; retention 90d / logs 30d / invoices 6y.
src/components/site-footer.tsx   Shared footer (nav + legal + contact) on every marketing +
                              legal page
src/lib/seo.ts             SITE_URL + absoluteUrl + schema.org JSON-LD builders (Organization,
                              SoftwareApplication, FAQPage, BreadcrumbList)
src/lib/errors.ts          SafeError + toUserMessage/logError — full detail server-side, generic
                              text to the client
src/lib/rate-limit.ts      Per-process burst limiter for the Claude-triggering server actions
                              (swap for Redis/KV before multi-instance)
src/lib/stripe.ts          Stripe client (optional — null when STRIPE_SECRET_KEY unset) +
                              price-id ↔ tier/cadence maps + tierFromSubscription()
src/app/billing/actions.ts   startCheckout(tier, cadence) → hosted Checkout redirect;
                              openBillingPortal() → hosted Customer Portal redirect
src/app/api/webhooks/stripe/route.ts   Verifies signature, syncs subscription → Organisation.tier
                              (the real writer once billing is live)
src/lib/email.ts           Resend client (optional — null when RESEND_API_KEY unset; every send
                              is a logged no-op until the key + a verified domain are set). Four
                              emails, one shared `shell()`/`btn()`/`esc()`/`send()` core:
                              `sendPlaybookEmail` (landing autoresponder) and `sendWelcomeEmail`
                              (first sign-in) are pure transactional — no unsub footer;
                              `sendAnalysisCompleteEmail` (first Growth Score) and
                              `sendRadarAlertEmail` (Radar opportunity ≥ 85) carry an unsubscribe
                              link and are suppressed by `Organisation.emailOptOut`. HMAC unsub
                              token: `unsubToken`/`verifyUnsubToken` (sha256 over orgId, keyed by
                              CLERK_SECRET_KEY, base64url, 24 chars).
src/app/api/unsubscribe/route.ts   GET `?o=<orgId>&t=<token>` — verifies the HMAC token, sets
                              Organisation.emailOptOut, returns a minimal HTML confirmation page.
                              Public route (listed in proxy.ts isPublicRoute).
src/app/playbook-actions.ts   subscribePlaybook(email) — 1-field landing signup: upsert Subscriber,
                              send the playbook once (playbookSentAt gate), IP rate-limited
src/components/playbook-signup.tsx   The subtle landing email form + a no-op analytics event
                              (plausible/gtag/dataLayer) so signups count separately from URL runs
src/components/json-ld.tsx  <JsonLd> — server-renders a schema.org <script type=ld+json>
src/app/sitemap.ts         Public routes only (static + every /compare/[slug])
src/app/robots.ts          Allow all; disallow /dashboard, /projects/, /sign-in, /sign-up
src/components/site-header.tsx  Shared top bar for the public marketing pages (Compare / FAQ /
                              Pricing + auth link)
src/app/dashboard/          Add-a-URL form + project list
src/app/projects/[id]/      Per-project shell: layout.tsx + project-nav.tsx sidebar wrap
                              every child route below
  ├─ page.tsx (Overview)   Metric row (Growth Score tile → /score), next-best-action, Launch
                              CTA, collapsible full analysis
  ├─ score/                "Why your Growth Score is N" — 6 dimension bars + projected score
  ├─ actions/              Full Growth Backlog + done/skipped (ActionList)
  ├─ visibility/           "How easy are you to find?" — 5 plain-language bars + AI Visibility
                              test (brand vs competitor leaderboard) + findings → backlog
  ├─ launch/               Launch Mode: channel go/skip, 30-day schedule, copy, directories
  ├─ radar/                Opportunity Radar: editable profile, scan, ranked 🔥/🟠/🟡
  │                          opportunity cards, draft reply, feedback
  └─ create|analytics|experiments/   ComingSoon placeholders (Phases 4/7)
  components: metric-row / next-action-card / action-list / project-nav / coming-soon /
    step-checklist (checkable TASK steps) / use-complete-animation (shared "mark done" motion);
    load-actions.ts (shared Action shaping); server actions in action-actions.ts
src/components/radar-scan.tsx  Animated radar "scanning" state (SVG/CSS) — analyze form,
                                 rerun overlay, RUNNING analysis state
src/app/projects/[id]/template.tsx  150ms fade/slide on every project sub-page navigation
src/proxy.ts                Clerk route protection (Next 16 "proxy" convention)
scripts/tier.ts             Dev helper — list/set Organisation.tier + a read-only quota probe
                              (`npx tsx scripts/tier.ts …`); stand-in until billing owns the column
docs/CONCEPT.md             Full original feature brainstorm (all phases)
```

## Data model (Phase 1)

```
Organisation (clerkOrgId, name)
  └── Project (url, name, category, icp, pricing, stage)
        └── Analysis (status, growthScore, issues, readinessChecklist,
                       actionPlan, rawExtraction, contentHash) — versioned per
                       run, not upserted, so score history/trend works.
```

**Skip-if-unchanged.** `runAnalysis` fetches the site, then `hashSiteContent`
= SHA-256 of `bodyText` + the deterministic `website.ts` signals +
`ANALYSIS_REV`. If a prior COMPLETE `Analysis` for the project has the same
`contentHash`, the model calls (extraction + `refineTopAction`) are skipped
entirely — a new versioned row is written that copies the prior result, and
only `maybeSeedSecurityAction` runs. So mashing "Re-analyze" on an unchanged
site costs one HTTP fetch and two DB writes, no tokens. Old rows have
`contentHash: null` and never match; bump `ANALYSIS_REV` to invalidate every
cache after a prompt change.

### Analysis JSON shapes (Zod-validated, see `src/lib/analysis.ts`)

- `issues`: exactly 7 entries, one per fixed area (`positioning`,
  `comparison_pages`, `demo_video`, `seo_coverage`, `directory_presence`,
  `social_proof`, `signup_flow`), each `{ area, severity: red|amber|green, summary }`.
- `readinessChecklist`: technical marketing-infra checks computed
  deterministically in `website.ts` (GA, GTM, Meta Pixel, OG tags/image,
  sitemap.xml, robots.txt, structured data, cookie consent, email capture,
  favicon, meta description) — **not** LLM-judged, so it's trustworthy and
  free to compute.
- `nextActions`: prioritised **Growth Backlog** items,
  `{ title, category, rationale, detail, impact: HIGH|MEDIUM|LOW,
  deliverable: TASK|ASSET, effortMinutes }`, highest-impact/lowest-effort
  first. Seeded into `Action` rows after the analysis run
  (`seedActionsFromAnalysis`) — this drives the dashboard backlog.
  `deliverable` picks the card CTA (`ctaLabel` in `action-format.ts`):
  `ASSET` → "Create with AI" (the agent drafts the copy/page), `TASK` →
  "Show me how" (a walkthrough). Future third state: "Fix with AI" once the
  agent can apply changes directly.
- `area` on issues is parsed as a loose string (Claude sometimes emits an 8th
  off-list entry); `normalizeIssues` pins it back to the 7 canonical areas.
- The Monday–Friday `actionPlan` was dropped — a dated week plan doesn't fit
  the backlog model, and vibe-coders read a backlog faster. The
  `Analysis.actionPlan` column is now vestigial (nullable, unwritten).
- `growthScore`: **computed in code, not asked of Claude** — the equal-weight
  mean of the 6 dimension scores from `src/lib/score.ts`
  (`overallFromBreakdown(computeScoreBreakdown(issues, readiness))`), so the
  headline reconciles with the `/score` breakdown page. Each dimension
  (Positioning, Conversion, SEO, Trust, Distribution, Analytics) is a mean of
  its mapped issues (red 0 / amber 0.5 / green 1) and readiness checks (pass
  1 / fail 0 / `unknown` excluded). `score.ts` also exposes
  `projectScore(breakdown, openActions)` — the *projected* score if the open
  backlog were cleared (impact-weighted bump per action, mapped to a
  dimension by category keyword). Pure, no LLM.
- **One canonical number**: the stored `Analysis.growthScore` is the single
  value shown everywhere (Overview tile + delta, dashboard list, `/score`
  headline, Score history). It's a **frozen snapshot** — written once at
  analysis time via `computeGrowthScore` (= the dimension mean) and never
  recomputed for display, so history stays a true record of where the
  founder was. `/score` recomputes only the *bars* (same run, same formula →
  they sum to the stored headline). Existing rows were backfilled when the
  formula changed.
- **Projected ≠ observed** in the UI: projected dimension gains render as
  dashed/hollow bar segments + a "→ N potential" chip, and the summary sits
  in a dashed "PROJECTED — not yet achieved" card.

## Data model (Phase 2 — Launch Mode)

```
Project
  └── LaunchPlan (status, summary, channels, schedule, assets, directories,
                   rawOutput, analysisId) — versioned per run like Analysis.
```

Built on top of the project's **latest COMPLETE `Analysis`** (needs its
ICP/category/positioning/issues as prompt input) — `runLaunchPlan` throws if
there isn't one. `analysisId` records which analysis a plan came from.

### LaunchPlan JSON shapes (Zod-validated, see `src/lib/launch.ts`)

- `channels`: exactly one entry per fixed channel (`product_hunt`,
  `hacker_news`, `indie_hackers`, `reddit`, `linkedin`, `x_twitter`,
  `tiktok`, `youtube_shorts`, `directories`, `cold_email`, `communities`,
  `seo_pages`, `comparison_pages`, `press`, `micro_influencers`), each
  `{ channel, verdict: go|skip, priority: high|medium|low, effort: low|medium|high, rationale }`.
  The explicit **skip** verdict is the differentiator — most products should
  skip several channels.
- `schedule`: exactly 4 entries, `{ week: 1-4, theme, tasks: [{ day, title, detail }] }`
  (2–6 tasks per week) — the 30-day timeline.
- `assets`: 4–12 entries of ready-to-post copy, `{ key, channel, format, title, body }`
  — only for `go` channels.
- `directories`: 8–20 entries, `{ name, url, category, submit: boolean, rationale }`
  — `submit: false` = known directory deliberately skipped.
- `summary`: one-paragraph headline strategy, including what's deliberately
  *not* being done.
- No computed headline score for Launch Mode (unlike `growthScore`) — the
  value is the curation, not a number.

## Data model (cross-phase) — Action

```
Project
  └── Action (source, title, category, detail, rationale, impact,
               deliverable: TASK|ASSET, effortMinutes, rank,
               status: TODO|DONE|SKIPPED, guide, analysisId,
               visibilityDimension)
```

The persistent, completable unit of work the **project dashboard** runs on —
LaunchRadar's core "growth agent" primitive. Unlike `Analysis` / `LaunchPlan`
(immutable per-run snapshots), an `Action` has a lifecycle the founder drives.

- `source`: `ANALYSIS` (from `Analysis.nextActions`, `seedActionsFromAnalysis`),
  `VISIBILITY` (from a `VisibilityReport`'s findings,
  `seedActionsFromVisibility`), `SECURITY` (the one deterministic
  cross-product action — see `maybeSeedSecurityAction` under Phase 8),
  `LAUNCH` / `MANUAL` reserved. Later phases add more (Opportunity Radar,
  First 10 Customers, Experiments).
- **`externalUrl`**: set only on the `SECURITY` action. When present the
  card CTA is an external link (opens VibeCheck in a new tab) instead of the
  guide-generation button, and `steps` render directly — no Claude call.
- **Two seeding modes**:
  - *Automatic top-up* (`seedActionsFromAnalysis`, on every re-scan): only
    refills the open (`TODO`) queue back up to `OPEN_QUEUE_TARGET` (6) and
    skips anything whose title loosely token-matches an existing Action — so
    the queue doesn't balloon with paraphrased duplicates.
  - *Explicit add* (`seedActionsFromVisibility`, "Add all to Growth Backlog"
    button): the founder asked for these, so **no queue cap** — but still
    the same loose-title dedup against existing Actions.
- **`guide` / `steps`**: the backlog-card CTA output, generated on demand by
  `action-guide.ts` and cached on the row (one Claude call per action, ever).
  `deliverable === "ASSET"` → `messages.create` drafts the finished copy/page
  into `guide` (plain text, `steps: null`). `TASK` → `messages.parse` with a
  Zod schema (`{ goal, steps: string[], doneWhen }`, no `.max()` on `steps` —
  same over-generation lesson as `issues`/`nextActions`) — `guide` stores
  `goal + doneWhen`, `steps` stores the checkable list rendered by
  `step-checklist.tsx` (stagger-in via `.lr-step-in`, replays every time the
  card reopens since the list unmounts when hidden — reads as a small reward
  each time rather than a bug worth suppressing).
- **"Mark done"/"Mark complete"** plays a short animation before the mutation
  fires (`use-complete-animation.ts`: checkmark fade → title strikethrough →
  card collapses → *then* `completeAction` runs) — the row is already
  visually gone by the time the server round-trip/revalidation removes it
  from the list, so nothing jumps.
- **No per-action point value.** A per-action `scoreValue` was considered and
  rejected — the Growth Score is dimension-based (`score.ts`), not a linear
  sum, and a separate per-action figure would drift from the canonical
  number shown on `/score` (the exact class of bug the "one canonical
  number" rule above exists to prevent). The Actions page instead shows
  "clearing this backlog could take your Growth Score to N" using the same
  `computeScoreBreakdown`/`projectScore` call `/score` makes, over the same
  open actions (`loadProjectActions`'s `rawOpen`) — one calculation, reused.
- Mutations (`completeAction` / `reopenAction` / `skipAction` /
  `generateActionGuide`) live in `src/app/projects/[id]/action-actions.ts`,
  each tenant-scoped via `requireOrganisation()`, and each revalidate all
  three views that render an Action list (Overview, `/actions`,
  `/visibility` — its dimension counts read Actions too), not just the one
  the click happened on.
- Dedup helper (`similarTitle`/`titleTokens`, loose token-overlap) lives in
  `src/lib/action-dedup.ts` — shared by `seedActionsFromAnalysis`,
  `seedActionsFromVisibility` and `generateDimensionActions` rather than
  copied per module.
- **`visibilityDimension`**: which of the 5 Search & AI Visibility
  dimensions (below) this action addresses, when known explicitly — set
  when an action is generated from a dimension's diagnosis
  (`generateActionsForDimension`) or seeded from a visibility finding
  (`seedActionsFromVisibility`, via the `categoryToVisibilityDimension`
  heuristic on `category`). Null for general/analysis-sourced actions.
  `actionMatchesDimension` (in `visibility.ts`) checks this tag first and
  falls back to the same category heuristic for untagged actions — so the
  Visibility page's per-dimension counts include pre-existing backlog items
  too, not just ones it created itself.

## Data model (Phase 3a) — VisibilityReport

```
Project
  └── VisibilityReport (status, overallScore, dimensions, onSiteChecks,
                         queries, aiSummary, findings, analysisId)
                         — versioned per run, built on latest COMPLETE Analysis
```

"How easy are you to find?" — reframes SEO/AEO/GEO for a vibe-coder. One
**opt-in run** (like Launch Mode; ~3 min, several web-search-grounded Claude
calls) from `/projects/[id]/visibility`. Not part of the scan.

- `dimensions`: exactly 5, plain-language, `{ key, label, score 0-100,
  acronym, detail }` — Findable on Google (SEO), AI answer-ready (AEO), Brand
  authority (GEO), Community presence, Directory presence. `overallScore` =
  rounded mean (computed in code).
- `onSiteChecks`: deterministic AEO/GEO signals from `website.ts`
  `discoverySignals` (JSON-LD `@type`s, canonical, single-H1 + heading
  outline, FAQ shape, plain "what is it" lede) + sitemap/robots/meta.
- **AI Visibility test** (isolated — a failure still saves the scoring, with
  `aiSummary: null`): Claude generates 8 ICP queries → each run in parallel
  through `client.messages.stream` with the **`web_search_20260209`** server
  tool (`name: "web_search"`, no beta header on `claude-opus-5`) →
  `.finalMessage()`; brand + competitor names matched (word-boundary) in the
  answer text (`mentioned`) and source domains (`cited`), in code. Aggregates
  to `aiSummary` = `{ brandMentionRate, brandCitationRate,
  competitorMentionRate, competitorCitationRate, leaderboard: [{name,
  appearances, isBrand}], gaps }`.
- Competitors come from `Analysis.rawExtraction.competitors` (added to
  `ExtractionSchema` — no `Analysis` migration, it rides in the existing JSON).
- `findings`: 2–4 `{ severity: red|amber, title, detail, suggestedActions:
  [{ title, category, deliverable, impact, effortMinutes }] }` — seeded into
  `Action` rows (`source: VISIBILITY`) only on the explicit "Add all" click.
- No auto-seed, and no headline in the Growth Score — visibility findings
  reach the Growth Score only once accepted onto the backlog.
- **Each dimension row links to its own actions**: counts open `Action`s via
  `actionMatchesDimension` and either links to `/actions?dimension=<key>`
  (pre-filtered) when ≥1 exists, or — only when the dimension scores below
  67 — offers **"No actions yet — generate some"**
  (`generateActionsForDimension` / `generateDimensionActions`), which turns
  that dimension's one-sentence diagnosis directly into 1–2 tagged Action
  rows. A dimension scoring ≥67 with no actions shows "already strong"
  instead of prompting for one — Actions stays the single source of truth
  for *things to do*, Visibility for *how you're scored*, same relationship
  the `/score` page has with the Growth Backlog.

## Data model (Phase 3) — Opportunity Radar

```
Project
  ├── ProductProfile (audiences, problems, alternatives, commercialIntents)
  │                    — one mutable row, founder-editable, unlike every
  │                      other model here which is an immutable per-run snapshot
  ├── RadarQuery[]     (query, intentType, weight, active)
  │                    — persists across scans; weight nudged by feedback
  └── RadarScan[]      (status, queriesRun, resultsFound, candidates, saved)
        └── Opportunity[] (source, url, title, excerpt, intent, the five
                            0-100 match scores, aiReason, suggestedAction,
                            competitorName?, advantage?, opportunityScore,
                            status, reply?) — @@unique([projectId, url])
              └── OpportunityFeedback[] (rating: "up"|"down")
```

The pipeline (`src/lib/radar.ts`), one call per stage:

1. **`ensureProductProfile`** — generated once from the latest COMPLETE
   Analysis (`rawExtraction.competitors` seeds `alternatives`), then
   founder-editable. The one instruction that matters most: `problems` must
   be phrased **the way a real person would actually type them** — first
   person, no product/category jargon ("writing emails at work takes me
   forever", not "inefficient written communication"). Everything downstream
   depends on getting this right, since Radar searches for the problem
   language, not the product name.
2. **`ensureRadarQueries`** — 16 queries generated once (4 each:
   `BUYING`/`RECOMMENDATION`/`PROBLEM`/`COMPETITOR_PAIN`) and reused on every
   scan, not regenerated — so `recordOpportunityFeedback`'s weight nudges
   (+0.15 on 👍, −0.25 on 👎, clamped 0.1–2.0) actually compound over time.
   `PROBLEM`/`RECOMMENDATION` queries are prompted to read like an actual
   frustrated post; `BUYING`/`COMPETITOR_PAIN` can look like search phrases.
3. **`webSearchProvider`** — the sole V1 source. One `web_search_20260209`
   call per query (16 in parallel), prompted to return **only a JSON array**
   of distinct results (`url, title, excerpt, author, publishedAt`) rather
   than a synthesized answer; parsed leniently (find the outer `[...]`,
   `JSON.parse`, drop malformed entries) since combining the web-search tool
   with `output_config.format` in one call isn't confirmed compatible.
   Returns the provider-agnostic `RawResult` shape
   (`{ source, url, title, content, author, publishedAt, queryMatched }`) —
   a real Reddit Developer Platform provider (deferred, needs the user to
   register an app) would return the same shape and slot in alongside it.
4. **Cheap filter** (code, no LLM) — drops URLs already saved for this
   project, near-empty excerpts, listicle titles, discussions older than
   `MAX_RESULT_AGE_DAYS` (365 — a stale thread isn't live demand;
   `parsePublishedAt` also reads relative dates like "5 years ago"), and the
   project's own domain; caps at 40 candidates. The search prompt also asks
   for results from the last 12 months so undated-old ones are rarer.
5. **One batched classification call** (not one per candidate) — Zod array
   schema scoring `audienceMatch`/`problemMatch`/`purchaseIntent`/
   `productFit`/`urgency` (0-100 each) + `intent` + a grounded one-line
   `reason`. Sets `competitorName`/`advantage` only for
   `COMPETITOR_DISSATISFACTION`.
6. **Score** (code): `0.30×productFit + 0.25×purchaseIntent +
   0.20×problemMatch + 0.10×recency + 0.10×audienceMatch +
   0.05×engagement`. `recency` decays from `publishedAt` (100/80/60/40/30/20
   over 1d/7d/30d/90d/180d/older, via `parsePublishedAt`);
   `engagement` is a constant 50 in V1 — generic web search has no
   upvote/reply-count signal, a placeholder until a real provider supplies
   one. Below ~35 isn't saved at all (keeps the list from "300 found" noise).
- **"Draft reply"** (`generateOpportunityReply`, cached on `Opportunity.reply`)
  writes genuinely useful advice first and mentions the product only if it
  naturally fits — LaunchRadar never auto-posts; it's draft → copy → the
  founder pastes it themselves.

## Plan tiers & usage metering

The `/pricing` table (Free £0 / Builder £12 / Growth £24) is **enforced**.

```
Organisation.tier : Tier  @default(FREE)   // FREE | BUILDER | GROWTH
Organisation.stripeCustomerId / .stripeSubscriptionId / .subscriptionStatus / .currentPeriodEnd
Usage (organisationId, period "YYYY-MM", metric, count)
       @@unique([organisationId, period, metric])
       metric : UsageMetric  // RADAR_SCAN | RADAR_RESULT | AI_ACTION | DRAFT_REPLY
```

- **`tier` is written by the Stripe webhook** (`/api/webhooks/stripe` →
  `tierFromSubscription`) once billing keys are set, or by hand via
  `scripts/tier.ts` in dev / for the ungated period. It is the *only* thing
  that should write the column. Everything else reads it via
  `requireOrganisation()` (returns the full row).
- **Billing is optional at the code level.** `src/lib/stripe.ts` exports
  `stripe` as `null` when `STRIPE_SECRET_KEY` is unset; `startCheckout` /
  `openBillingPortal` then throw a `SafeError`, the webhook route 503s, and
  the pricing page falls back to "Go to dashboard" CTAs. So the app runs
  fine with no Stripe config.
- **Admin bypass.** `requireOrganisation()` stamps `isAdmin` on the returned
  row when the signed-in Clerk *user* id is in `ADMIN_CLERK_USER_IDS`
  (env, comma/space separated). `limitsForOrg(org)` then returns
  `ADMIN_LIMITS` (every metered limit `Infinity`, every feature gate open),
  so the owner keeps full access across *every* org they open, including
  ones created later — no per-org tier change. `recordUsage` still runs for
  admins; it just never blocks. UI shows plan "Admin" and `formatLimit`
  renders `Infinity` as "∞". The plan helpers (`quota` / `assertQuota` /
  `projectQuota` / `assertProjectQuota`) take the org row (`OrgLike`:
  `{ id, tier, isAdmin? }`), not a bare `(id, tier)` pair, so the flag
  can't be forgotten at a call site.
- **`src/lib/plan.ts` is the single source of truth** — `PLAN_LIMITS` mirrors
  the pricing table as data; `quota()` / `assertQuota()` / `recordUsage()` do
  the bookkeeping. Pattern at every gated action: `assertQuota` (throws
  `PlanLimitError`) *before* the work, `recordUsage` *after* it succeeds.
- **Monthly reset is free** — the `period` is a `"YYYY-MM"` string key, so a
  new month is just a new row at count 0. No cron.
- **Projects** are a live cap (`prisma.project.count`), not a `Usage` metric.
  Orgs already over a lowered cap keep their existing projects but can't add.
- **Cached AI output never re-charges**: a second "Show me how" on an Action
  with a stored `guide`, or "Draft reply" on an `Opportunity` with a stored
  `reply`, returns the cache and spends no quota.
- **Non-numeric gates** (also in `PLAN_LIMITS`): `backlogSize` (Free tops the
  open backlog up to 3, paid to 6 — `seedActionsFromAnalysis`);
  `visibilityAiTest` (Free runs the on-site visibility scan only, not the
  live web-search AI Visibility test — `aiSummary` stays null, same path as
  "no competitors"); `competitorRadar` (Free saves opportunities without the
  `competitorName`/`advantage` competitor-dissatisfaction detail).
- **Blocked UX = no error pages.** Gated buttons render as a disabled
  upgrade link with an "X / Y this month" line; the server action re-checks
  and returns `{ error }` / no-ops defensively.
- Analytics, Experiments and scheduled scans in the pricing table are
  `ComingSoon` — no real gate until those features exist.

## Public marketing surface (SEO / AEO / GEO / SXO)

The unauthenticated pages are `/`, `/pricing`, `/faq`, `/compare` and
`/compare/[slug]`. They exist to be found — by Google, by answer engines and
by AI assistants when someone asks "how do I market my vibe-coded app" or
"LaunchRadar vs …".

- **One canonical origin.** `NEXT_PUBLIC_SITE_URL` (no trailing slash;
  falls back to `http://localhost:3000`) drives `metadataBase`, every
  page's `alternates.canonical`, OpenGraph URLs, `sitemap.ts` and
  `robots.ts`. Set it in production.
- **Structured data** (`src/lib/seo.ts` + `<JsonLd>`), server-rendered so
  crawlers see it without JS:
  - `layout.tsx` emits `Organization` + `SoftwareApplication` site-wide.
  - `/faq` emits `FAQPage` from `faq-data.ts` — the same array renders the
    page, so an answer engine lifting a `<dd>` gets the same text as the
    `acceptedAnswer`. Answers lead with a direct first sentence for that
    reason.
  - `/compare` and `/compare/[slug]` emit `BreadcrumbList` + a `FAQPage`
    built from the "choose X when / choose LaunchRadar when" lists.
- **Titles**: `layout.tsx` sets a `%s · LaunchRadar` template; short child
  titles (`"Pricing"`) use it, hand-crafted SEO titles that already contain
  the brand use `title: { absolute: … }`.
- **`robots.ts`** allows everything except the auth-gated app
  (`/dashboard`, `/projects/`, `/sign-in`, `/sign-up`) — those are also
  listed in `proxy.ts`'s `isPublicRoute` (along with `/sitemap.xml` and
  `/robots.txt`, which the middleware matcher would otherwise gate).
- **Editing content**: FAQ Q&A lives in `src/app/faq/faq-data.ts`;
  comparison copy + the at-a-glance matrix live in
  `src/app/compare/compare-data.ts`. Adding a `COMPARISONS` entry
  automatically creates its `/compare/[slug]` page, sitemap row and hub
  card. Keep comparisons fair — every entry has a "choose the alternative
  when" list; AI assistants discount a one-sided comparison page.
- **Homepage** (`src/app/page.tsx`): plain-language `<h1>` ("what is it"),
  brand tagline demoted to a non-heading kicker, then real `<h2>`/`<h3>`
  sections ("What is LaunchRadar?", "How LaunchRadar works", "Frequently
  asked questions") for a crawlable outline. The homepage FAQ is the
  `FAQ` array in `page.tsx` — plain text only; `/faq` still owns the
  `FAQPage` JSON-LD, and homepage FAQ schema is a deliberate later step
  (keep the two question sets from drifting if you add it). Under the hero
  CTA sits the low-key **first-users
  playbook** email form (`PlaybookSignup`) for visitors not ready to run a
  score: one field → `subscribePlaybook` → `Subscriber` row → one
  autoresponder via Resend (`sendPlaybookEmail`, checklist copy lives in
  `src/lib/email.ts`) with a UTM'd link back to `/sign-up`. Conversion is
  measurable two ways: `count(Subscriber where source='playbook')` vs
  `count(Project)`, and the client fires a `playbook_signup` analytics event
  (no-op until Plausible/GA is wired). Without `RESEND_API_KEY` the form
  still captures the address; the playbook goes out when the key is set.
- Not done yet: real OG images (`opengraph-image`), a shared marketing
  footer, per-`[slug]` `Article`/`datePublished` metadata, `HowTo` schema
  on walkthrough content.

## Transactional email (Resend)

All email goes through `src/lib/email.ts` → Resend. **Optional and
fail-open**: with `RESEND_API_KEY` unset every `send()` logs and returns
`false`, and every caller treats a non-send as a no-op — the app never
blocks on email. Turn it on by setting `RESEND_API_KEY` + `RESEND_FROM`
(a verified sending domain).

Four emails, each fired from the flow it belongs to (no cron, no webhook):

| Email | Trigger | Fired from | Unsub? |
|---|---|---|---|
| Playbook | Landing "first-users playbook" form submit | `subscribePlaybook` (`playbook-actions.ts`), `Subscriber.playbookSentAt` gate | no (opt-in) |
| Welcome | First authenticated request for a new org | `requireOrganisation` → `after()` → `syncOrgContact` (`org.ts`), `Organisation.welcomeSentAt` gate | no |
| Analysis complete | The org's **first** COMPLETE Analysis | `runAnalysis` → `maybeSendAnalysisEmail` (`analysis.ts`), guarded on `count(Analysis COMPLETE) === 1` | yes |
| Radar alert | Scan produces an Opportunity scoring **≥ 85** not yet alerted | `runRadarScan` → `maybeSendRadarAlert` (`radar.ts`), `RADAR_ALERT_MIN_SCORE`, `Opportunity.alertedAt` dedupe (set on every ≥85 row in the scan, so one email per scan and never re-alerted) | yes |

- The two unsub-carrying emails also check `Organisation.emailOptOut` before
  sending. Opt-out is set by `GET /api/unsubscribe?o=<orgId>&t=<hmac>` — the
  footer link — which verifies an HMAC-over-orgId token
  (`verifyUnsubToken`, keyed by `CLERK_SECRET_KEY`) so no login is needed.
- Send failures are swallowed and logged (`logError`) — a Radar scan or
  analysis run never fails because an email didn't go out.
- `welcomeSentAt` and `playbookSentAt` are written only after a *successful*
  send, so a transient failure retries on the next request. `alertedAt` is
  the opposite: `maybeSendRadarAlert` stamps every ≥85 row in the scan
  *before* sending (and regardless of whether the org has an address or has
  opted out), because its job is "alert once, ever" — a missed send is not
  worth resurfacing the same opportunity on the next scan.

## Security posture

- **Auth is Clerk-hosted.** No custom auth/JWT/password/verification code in
  this repo — signup, sign-in, email verification, password reset and their
  rate limits all run on Clerk. `src/proxy.ts` (`clerkMiddleware` +
  `auth.protect()`) gates everything except `isPublicRoute`; it **fails
  closed** (missing/invalid session → redirect, never pass-through). The
  admin bypass (`ADMIN_CLERK_USER_IDS`) also fails closed — unset env → empty
  set → `isAdmin: false`.
- **Tenant isolation is application-level**, not Postgres RLS: every Prisma
  query is scoped `where: { organisationId }` from `requireOrganisation()`.
  This is defense-by-discipline — a missing `where` clause is a cross-tenant
  leak. Real RLS (`SET app.current_org` per tx + policies) is the
  defence-in-depth upgrade if this ever handles regulated data.
- **No API route handlers.** All mutations are Server Actions, each starting
  with `requireOrganisation()` then an org-scoped row lookup (IDOR-safe).
- **Security headers**: `next.config.ts` `headers()` sets CSP (self + Clerk
  (host derived from the publishable key) + Turnstile for scripts/frames;
  `img-src` also allows `api.producthunt.com` for the landing review badge;
  `script-src` still has `'unsafe-inline'` — see the file's note on the
  nonce upgrade), HSTS (2y, preload), `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`,
  COOP. `poweredByHeader: false`.
- **Error hygiene** (`src/lib/errors.ts`): `toUserMessage(context, error,
  fallback)` logs the full error server-side and returns the message only if
  it's a `SafeError` (thrown for genuinely user-facing conditions —
  unreachable host, "run an analysis first", quota, rate limit); everything
  else (Prisma/Anthropic/Zod internals) is replaced with `fallback`. The
  stored `Analysis/LaunchPlan/RadarScan/VisibilityReport.errorMessage`
  columns now hold only sanitised text.
- **Rate limiting** (`src/lib/rate-limit.ts`): burst cap on every
  Claude-triggering server action, keyed by org id — `ai-heavy` (analysis /
  radar scan / visibility / launch) 8 per 10 min, `ai-light` (guide / draft
  reply / dimension actions) 20 per 10 min. This is a per-process Map —
  **swap for Upstash/Vercel KV before scaling past one instance** (call
  sites don't change). It sits on top of the monthly plan quotas in
  `plan.ts`.
- **SSRF** (`src/lib/url.ts` + `website.ts` `safeFetch`): the only
  attacker-controlled fetch is the founder's site URL. http/https only,
  per-redirect-hop re-check of the resolved IP against a
  private/loopback/link-local/CGNAT/cloud-metadata blocklist, manual redirect
  following (max 5), 10s timeout, capped streaming read (5 MB). Residual
  risk: DNS-rebinding TOCTOU (check and fetch resolve independently) — accept
  or fix with an undici agent that pins the checked IP.
- **Stripe webhook** (`/api/webhooks/stripe`, `isPublicRoute` so
  `auth.protect()` is skipped): reads the raw body, verifies the
  `stripe-signature` HMAC with `STRIPE_WEBHOOK_SECRET` via
  `stripe.webhooks.constructEvent` *before* touching the payload — bad sig →
  400, no retry; handler error → 500, Stripe retries. Node runtime,
  `force-dynamic`. Handlers are idempotent (re-derive tier from the current
  subscription object). Hosted Checkout / Portal are full-page redirects to
  `*.stripe.com`, so no CSP change is needed; embedding Stripe Elements
  later would need `js.stripe.com` (script), `api.stripe.com` (connect) and
  `checkout.stripe.com` (frame) added to the CSP.
- **Not applicable here**: file upload, custom CORS, raw SQL (`$queryRaw*`
  unused — all Prisma), `eval`/`Function`/`child_process`, Dockerfile,
  GitHub Actions.
- **`npm audit`**: 3 high, all transitive `deepmerge-ts` (stack exhaustion)
  via the `prisma` CLI / `@prisma/config` — build-time only, not the runtime
  `@prisma/client`, not attacker-reachable. Fix requires `prisma@6.12.0` (a
  breaking downgrade) — deferred pending a Prisma patch on the 6.x line.

## Roadmap

### Phase 1 — Analyze + Score (MVP) — **in progress, scaffolded**

Chosen as the starting point because it's the cheapest slice to build (no
scraping/monitoring infrastructure, no scheduled jobs), is useful
standalone, and produces the ICP/category/competitor data every later phase
needs.

- [x] Repo scaffold: Next.js + Tailwind + Prisma + Clerk + Anthropic SDK
- [x] Prisma schema (Organisation/Project/Analysis) + multi-tenant helper
- [x] Deterministic technical readiness checks (`website.ts`)
- [x] Claude structured-output extraction + issue scoring (`analysis.ts`)
- [x] Dashboard (submit URL, list projects + scores)
- [x] Project detail page (score, issues, action plan, checklist, history)
- [x] Sign-in/sign-up (Clerk)
- [x] Real Clerk + Postgres (Railway) credentials wired; `init` +
      `add_actions` migrations applied; first live analysis run verified
      (analysis ~25–50s, `nextActions` seeded into the queue)
- [ ] Move analysis off the request path (server action currently runs the
      fetch + Claude call synchronously — fine for a demo, but will hit
      serverless timeout limits on real-world slow sites; needs a queue or
      `after()`/background job before this ships)
- [ ] Basic empty/error/loading states polish (project page still says
      "refresh in a moment" for RUNNING — no polling)
- [ ] Deploy (Railway/Vercel, matching sibling projects)

### Phase 1.5 — Operating dashboard — **built**

Reframe: the analysis is *onboarding*, not the product. LaunchRadar is a
growth **agent**, so after the first scan each project shows a persistent
operating dashboard, not a one-page report.

- [x] `Action` model — the cross-phase completable-work primitive (see the
      "Data model (cross-phase) — Action" section above)
- [x] `Analysis` extended with `nextActions` (title/category/impact/
      deliverable/effort); `seedActionsFromAnalysis` seeds/tops-up the queue
- [x] Project page rebuilt: 5-tile metric row (Growth Score +Δ, Actions
      completed live; Customers / Opportunities / Experiments dimmed "soon"),
      "🎯 your next best action" card, **Growth Backlog (N)** of priority-
      sorted cards (impact dot + heading, `category · effort`, one CTA),
      collapsible full-analysis sections. The old Mon–Fri plan is gone.
- [x] Backlog CTA → `action-guide.ts`: "Create with AI" drafts the asset for
      `ASSET` items, "Show me how" writes a walkthrough for `TASK` items;
      cached on `Action.guide`
- [x] Per-project **navigation shell** — `layout.tsx` + `project-nav.tsx`
      sidebar (Overview / Actions / Radar / Create / Launch / Analytics /
      Experiments). Overview trimmed to next-best-action + "view full
      backlog" link; full backlog lives at `/actions`. Radar/Create/
      Analytics/Experiments are `ComingSoon` placeholder routes.
- [x] **Clickable Growth Score** → `/score` breakdown page: 6 dimension bars
      + "complete your backlog → estimated score N" (see `src/lib/score.ts`)
- [x] Motion where it earns its keep: radar-sweep scan state
      (`radar-scan.tsx`), Growth Score count-up + colour ramp
      (`count-up-score.tsx`), stagger-fill score bars (`.lr-seg`), 150ms
      page-transition fade (`template.tsx`). All keyframes in `globals.css`,
      all disabled under `prefers-reduced-motion`.
- [ ] Wire the 3 stub tiles + placeholder routes as Phases 3 (Opportunities) /
      5 (Customers) / 7 (Experiments/Analytics) land
- [ ] "Help me do it" could go further than a text guide — actually draft the
      asset / open the right tool

### Phase 2 — Launch Mode — **scaffolded**

30-day launch campaign generator: Product Hunt assets, Indie Hackers post,
Show HN post, Reddit strategy, LinkedIn/X launch content, directory
submissions, founder story, email campaign — but **curated**, not
indiscriminate (explicitly recommend *skipping* channels unlikely to help
this specific product, per the original brainstorm's point that only
15–20 directories tend to matter).

- [x] `LaunchPlan` model (versioned per run, built on latest `Analysis`)
- [x] `src/lib/launch.ts` — curated go/skip channel verdicts + 30-day
      schedule + ready-to-post copy + submit/skip directory list, all via
      one `messages.parse()` structured call
- [x] `/projects/[id]/launch` page + "Launch Mode" entry point on the
      project page (gated on a COMPLETE analysis)
- [x] Generate / regenerate server action (tenant-scoped)
- [ ] First live run against real products; tune the prompt so channel
      verdicts genuinely diverge by category (CONCEPT.md validation idea)
- [ ] Move generation off the request path (same background-job need as
      Phase 1's analysis — it's a bigger Claude call, `max_tokens: 32000`)
- [ ] Copy-to-clipboard on assets; mark directories/tasks done
- [ ] Loading/polling state instead of "refresh in a moment"

### Phase 3a — Search & AI Visibility — **built**

SEO/AEO/GEO as an intelligence layer that feeds the growth engine, not a
standalone audit. Framed as "How easy are you to find?".

- [x] `competitors` added to `Analysis` extraction (rides in `rawExtraction`)
- [x] `website.ts` `discoverySignals` — deterministic AEO/GEO checks
- [x] `VisibilityReport` model + `src/lib/visibility.ts` — 5 plain-language
      dimension scores + deterministic on-site checks
- [x] **Live AI Visibility test** — 8 ICP queries × `web_search_20260209`
      (parallel), brand-vs-competitor mention/citation + leaderboard
- [x] `/projects/[id]/visibility` page + 🔍 nav item + Overview link card;
      findings → Growth Backlog via explicit "Add all" (`seedActionsFromVisibility`)
- [x] Each dimension row links to the actions addressing it
      (`?dimension=<key>` filter on `/actions`) or offers "generate some"
      straight from its diagnosis (`generateActionsForDimension`) when
      scoring below 67 with none yet
- [ ] Move the run off the request path (~3 min, ~11 Claude calls incl. 8
      web-search — same background-job need as analysis / Launch Mode)
- [ ] Recurring "measure again" digest (needs scheduled jobs)
- [ ] SERP opportunity discovery + competitor content-gap crawl → feed Radar
- [ ] Multi-provider AI testing; the multi-tab Radar (All / Customers /
      Search / AI Visibility / Competitors / Partnerships / Promotion)

### Phase 3 — Opportunity Radar — **built**

The most differentiated feature. Finds people who are already the customer
by searching for the *circumstances* that create demand — "I have dyslexia
and writing emails at work takes forever" — not the product name or
category. See "Data model (Phase 3)" below for the full pipeline.

- [x] `ProductProfile` — auto-generated from the latest Analysis
      (`ensureProductProfile`), founder-editable, drives everything downstream
- [x] `RadarQuery` — 16 intent queries (4 each: buying / recommendation /
      problem / competitor-pain), generated once and reused across scans so
      feedback nudges accumulate (`ensureRadarQueries`)
- [x] `src/lib/radar.ts` — web-search provider (behind a swappable
      `RawResult` interface) → cheap filter (dedupe/noise, no LLM) → one
      batched AI classification call → score in code → save
      (`runRadarScan`)
- [x] `/projects/[id]/radar` page — editable profile, `RadarScan` animation
      while scanning, ranked 🔥/🟠/🟡 opportunity cards with distinct
      competitor-dissatisfaction treatment, "Draft reply" (cached, manual
      copy — never auto-posts), 👍/👎 feedback
- [x] Feedback → `RadarQuery.weight` nudge (`recordOpportunityFeedback`) —
      a heuristic adjustment, not ML; reorders which queries `ensureRadarQueries`
      prioritises next scan
- [ ] A real Reddit Developer Platform provider (needs a registered app +
      credentials) alongside the web-search provider
- [ ] Move the scan off the request path (~4 min, 16 parallel web-search
      calls + 1 batched classification call — same background-job debt as
      analysis / Launch Mode / Visibility)
- [ ] Recurring/scheduled scans (needs the same job infra)
- [ ] "Find me customers" — a simple radio-button front door over this same
      engine, planned as a fast-follow once the core pipeline is proven
- [ ] Raise past 16 queries once scan latency is off the request path

### Phase 4 — Build-in-Public automation

GitHub webhook → commit/PR digest → Claude turns it into changelog +
LinkedIn/X/TikzTok-script drafts. Needs a `Changelog` model and GitHub App
or PAT-based webhook integration.

### Phase 5 — First 10 Customers Mode

Gamified daily task engine ("15 min: reply to these 3 conversations") that
sits on top of Opportunity Radar + directory/community data, with a visible
progress bar toward 10 acquired customers. Needs a `Task`/`DailyMission`
model and a way to mark tasks done → attribute to signups.

### Phase 6 — Competitor Hijack

Detect named competitors (from Phase 1's extraction + ongoing search),
generate `/competitor-alternative` comparison pages, track their search
performance. Needs a `Competitor` model and rank-tracking integration.

### Phase 7 — Experiments + Attribution

A/B test channel and content hypotheses ("founder stories vs. product
demos"), track CAC per channel, and generate "stop doing X, do more Y"
recommendations — the standout differentiator from the brainstorm (the AI
telling founders to stop wasting effort). Needs `Experiment`, `Channel`,
and event/attribution tracking models.

### Phase 8 — VibeCheck cross-sell — **first link built**

If/when VibeCheck and LaunchRadar both exist: surface a "Ready to find your
first 100 users?" CTA from a VibeCheck security score, and vice versa.

- [x] **Security as a Trust signal.** `maybeSeedSecurityAction` (in
      `analysis.ts`, after `seedActionsFromAnalysis`) seeds one
      `source: SECURITY` Action — *"Run a security check and show the
      result"*, category `Trust`, `externalUrl` → VibeCheck — when the
      Growth Score's Trust dimension is below 67 **and** `website.ts`'s
      `hasSecuritySignal` regex found no security page / cert / disclosure
      on the site. Once per project (any status), and only when `VIBECHECK_URL`
      is set (else the action is skipped — no broken link). This is framed
      as genuine advice, not a cross-link: an independent, visible security
      check is a real credibility signal for the buyers of a vibe-coded app.
- [ ] The reverse direction (CTA from a VibeCheck score into LaunchRadar).
- [ ] Deep link that pre-fills the project URL into VibeCheck.

### Pricing & billing — **gates + Stripe integration built; needs Stripe dashboard config + live test**

- [x] `/pricing` page (Free / Builder / Growth £0/£12/£24) — cards + table
- [x] `Organisation.tier` + `Usage` model + `src/lib/plan.ts` limits/metering
- [x] Enforcement wired at every point in the pricing table: project cap,
      monthly Radar scans / opportunities / AI actions / draft replies,
      Free backlog top-up of 3, Free = on-site visibility scan only, Free =
      no competitor-dissatisfaction detail. See "Plan tiers & usage metering".
- [x] Admin bypass — `ADMIN_CLERK_USER_IDS` env allowlist (Clerk user ids);
      `requireOrganisation()` stamps `isAdmin`, `limitsForOrg` waives every
      gate. See "Plan tiers & usage metering".
- [x] Pricing page offers **monthly or annual** billing (annual ≈ 20% off:
      Builder £12/mo · £115/yr, Growth £24/mo · £229/yr). Cadence is a
      billing concern only — it does not touch `PLAN_LIMITS` (a BUILDER org
      has the same limits either way).
- [x] **Stripe integration** — `src/lib/stripe.ts`, `src/app/billing/actions.ts`
      (hosted Checkout + Customer Portal, both redirect flows),
      `/api/webhooks/stripe` (signature-verified, syncs subscription →
      `Organisation.tier` + stripe columns), migration `add_stripe_fields`.
      Env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, four Price IDs
      `STRIPE_PRICE_{BUILDER,GROWTH}_{MONTHLY,ANNUAL}`.
- [ ] **Stripe dashboard setup + live test** — create the 2 products × 2
      prices (GBP recurring), enable the Customer Portal (allow all 4 prices
      as switch targets), add the webhook endpoint + copy its signing
      secret, then run a test-mode subscribe / upgrade / cancel and confirm
      `Organisation.tier` tracks. `scripts/tier.ts` stays the manual
      override until then.
- [ ] Usage-reset / "you're near your limit" email; in-app usage meter page
- [ ] Real gates for Analytics / Experiments / scheduled scans once those
      features exist (today they're `ComingSoon`, ungated)

## Conventions

- TypeScript everywhere, strict mode on.
- `organisationId` on every tenant-scoped table/query — never trust a
  client-supplied org id; always resolve it server-side via
  `requireOrganisation()`.
- Structured LLM output goes through Zod schemas + `messages.parse()`, not
  hand-parsed JSON strings — see `src/lib/analysis.ts` for the pattern to
  copy in later phases.
- Deterministic/free checks (regex, fetch) stay out of the LLM prompt as
  ground-truth *inputs* where possible (see `website.ts` → `analysis.ts`);
  don't ask Claude to judge things a regex can already answer reliably.
- Keep `docs/CONCEPT.md` as the source of truth for the full feature vision;
  update *this* file's Roadmap checkboxes as phases progress, and add new
  Prisma models to the relevant phase section here before building them.

## Environment

Copy `.env.example` → `.env`. Needs `DATABASE_URL` (Postgres),
`ANTHROPIC_API_KEY`, and Clerk's publishable/secret keys (see
`.env.example` for the full list). `npx prisma migrate dev` once
`DATABASE_URL` points at a real database.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
