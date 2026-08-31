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
  Model: `claude-opus-5`. Structured output via `client.messages.parse()` +
  `zodOutputFormat(schema)` — see `src/lib/analysis.ts`.
- Multi-tenant convention (matches FireXCheck/TwnCryr): every row scoped by
  an `organisationId`. Clerk organisations map 1:1 to `Organisation` rows;
  solo founders without a Clerk org get a synthetic
  `user_<clerkUserId>` organisation (see `src/lib/org.ts`).

## Project structure

```
prisma/schema.prisma        Organisation, Project, Analysis (Phase 1 models)
src/lib/prisma.ts           Prisma client singleton
src/lib/anthropic.ts        Anthropic client + model constant
src/lib/org.ts              requireOrganisation() — resolves/creates tenant row
src/lib/website.ts          Deterministic technical checks (fetch + regex, no LLM)
src/lib/analysis.ts         Orchestrates website.ts + Claude → Analysis row
src/app/dashboard/          Add-a-URL form + project list
src/app/projects/[id]/      Growth Score, issues, action plan, checklist, history
src/proxy.ts                Clerk route protection (Next 16 "proxy" convention)
docs/CONCEPT.md             Full original feature brainstorm (all phases)
```

## Data model (Phase 1)

```
Organisation (clerkOrgId, name)
  └── Project (url, name, category, icp, pricing, stage)
        └── Analysis (status, growthScore, issues, readinessChecklist,
                       actionPlan, rawExtraction) — versioned per run,
                       not upserted, so score history/trend works.
```

### Analysis JSON shapes (Zod-validated, see `src/lib/analysis.ts`)

- `issues`: exactly 7 entries, one per fixed area (`positioning`,
  `comparison_pages`, `demo_video`, `seo_coverage`, `directory_presence`,
  `social_proof`, `signup_flow`), each `{ area, severity: red|amber|green, summary }`.
- `readinessChecklist`: technical marketing-infra checks computed
  deterministically in `website.ts` (GA, GTM, Meta Pixel, OG tags/image,
  sitemap.xml, robots.txt, structured data, cookie consent, email capture,
  favicon, meta description) — **not** LLM-judged, so it's trustworthy and
  free to compute.
- `actionPlan`: 3–5 Monday–Friday items, `{ day, title, detail }`.
- `growthScore`: **computed in code, not asked of Claude** —
  `round(readinessPassRate * 0.4 + issuesScore * 0.6, ×100)` where
  `issuesScore` averages red=0/amber=0.5/green=1 across the 7 issues. Keeps
  the headline number deterministic and comparable across runs even though
  the qualitative judgments come from the model.

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
- [ ] Real Clerk + Postgres credentials wired up, first live analysis run
- [ ] Move analysis off the request path (server action currently runs the
      fetch + Claude call synchronously — fine for a demo, but will hit
      serverless timeout limits on real-world slow sites; needs a queue or
      `after()`/background job before this ships)
- [ ] Basic empty/error/loading states polish
- [ ] Deploy (Vercel, matching sibling projects)

### Phase 2 — Launch Mode

30-day launch campaign generator: Product Hunt assets, Indie Hackers post,
Show HN post, Reddit strategy, LinkedIn/X launch content, directory
submissions, founder story, email campaign — but **curated**, not
indiscriminate (explicitly recommend *skipping* channels unlikely to help
this specific product, per the original brainstorm's point that only
15–20 directories tend to matter).

### Phase 3 — Opportunity Radar

The most differentiated feature. Continuously searches Reddit/HN/forums for
conversations showing buying intent for the connected product's problem
space, scores buying intent, and drafts a suggested response for the
founder to edit and post. Needs: scheduled search jobs, a
`Opportunity` model (source, url, buyingIntentScore, suggestedResponse,
status), and a way to detect duplicate/stale opportunities.

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

### Phase 8 — VibeCheck cross-sell

If/when VibeCheck and LaunchRadar both exist: surface a "Ready to find your
first 100 users?" CTA from a VibeCheck security score, and vice versa.

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
