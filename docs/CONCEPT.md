# LaunchRadar — Original Concept Brainstorm

Source: ChatGPT brainstorm, pasted 2026-08-31 (originally shared as a
ChatGPT conversation link, which could not be fetched directly — the full
text was pasted into the conversation instead). Preserved verbatim as the
canonical reference for the full product vision. `CLAUDE.md` tracks what's
actually being built and in what order — read that first for current
status; come here for the complete original feature set and reasoning.

---

One of the biggest challenges for vibe-coded apps is marketing. There are
apps addressing this already (e.g. Native, at native.no) but there may be a
gap in the market to do something differently.

## The opportunity

Native is already comprehensive: reads a website, researches the
business/industry/competitors, creates a content plan, generates social
posts, publishes them, creates images, runs ads, tracks analytics. Pro plan
$79/month.

The more interesting problem is one level above: **vibe coding has made
building ridiculously easy — it hasn't made finding customers easy.**
Founders report building multiple apps quickly but say "getting people to
care" is the bulk of the remaining work; others describe launching on the
usual channels, hearing "crickets," and abandoning products because
distribution is exhausting.

### The product to build: An AI Growth Agent specifically for vibe-coded apps

The sequence:

```
Lovable / Replit / Bolt / Cursor / Claude Code  → build the app
VibeCheck                                       → make it safe to launch
[LaunchRadar]                                   → actually get users
```

Rather than "we'll write 30 LinkedIn posts for you," the promise is: **"Give
us your app. We'll figure out how to get your first 100 customers."**

### The gap

The market has lots of content generation. What it doesn't solve well:
**"What should I actually do to get users for THIS app?"** A consumer app
(e.g. a plant-diagnosis app) shouldn't have the same marketing plan as a
B2B fire-safety SaaS tool. One might need TikTok → Instagram → gardening
Facebook groups → micro-influencers → ASO. Another might need LinkedIn →
industry engineers → fire-safety companies → Google Search → industry
associations → outbound email. A developer security product might need
Reddit → GitHub → Hacker News → Product Hunt → developer newsletters →
YouTube/TikTok security content. The AI needs to understand that
distinction automatically.

Newer products are starting to attack pieces of this (validating the
problem): PromoteOS ranks directories/subreddits/PH/HN/YouTube/blog
opportunities; Xoru recommends organic channels and gives weekly
distribution tasks; Zarek (appeared on Indie Hackers) promises an
AI-generated launch roadmap, launch copy, directory submission and
verification. The opportunity is to go considerably further than all of
these.

## Concept: Growth Engineer for Vibe Coders

Founder enters `https://mynewapp.com`. System spends a few minutes
analysing it, then returns:

```
Growth Score: 41/100

Product: Invoice AI
Category: B2B SaaS
ICP: UK freelancers / small agencies
Price: £12/month
Stage: New launch
Marketing budget: £200/month

Your biggest growth problems
🔴 Positioning unclear
🔴 No comparison pages
🔴 No demo video
🟠 Weak SEO coverage
🟠 No directory presence
🟠 No social proof
🟢 Good signup flow
```

Then a **Growth Plan** — not 50 generic ideas, a concrete week:

```
MONDAY    Submit to 8 relevant SaaS directories.
TUESDAY   Post this Reddit discussion in r/freelance.
WEDNESDAY Publish: "I was spending 3 hours every Friday chasing invoices…"
THURSDAY  Contact these 10 micro-influencers.
FRIDAY    Publish SEO page: Best invoicing software for UK freelancers
```

Critically: **the software does as much of this as possible itself**, not
just suggests it.

## Killer feature: Opportunity Radar

The agent continually searches the internet for places where someone is
experiencing the exact problem the app solves, and scores buying intent.

Examples from the brainstorm:

- FireXcheck: Reddit — *"Does anyone have a decent way of tracking
  extinguisher servicing?"* → Buying Intent: 94/100 → suggested response
  drafted, founder edits and posts.
- PlantMedic: Facebook/Reddit — *"Why are the leaves on my monstera turning
  brown?"* → potential user.
- VibeCheck: Reddit — *"Just launched my first Lovable app. How do I know
  whether my Supabase database is secure?"* → 🔥 extremely high intent.

This is fundamentally different from generating social content — it's
**finding existing demand**, aligned with how founders increasingly prefer
targeting people showing an actual buying/problem signal over blind cold
outreach.

## Killer feature: Marketing Autopilot With Experiments

Instead of "post on LinkedIn," the AI creates and runs hypotheses:

```
Experiment #14
Hypothesis: Founder-story videos will outperform feature demos.
Test: 3 TikTok founder stories vs 3 product demonstrations.

After 7 days:
Campaign         Views    Clicks  Signups
Product demos    4,281    61      7
Founder stories  19,442   384     48

AI conclusion: Founder stories generated 6.8× more registrations.
Therefore next week: 70% founder content / 20% educational / 10% product demos.
```

The software learns how to market *this particular product* — that's the
moat.

## Launch Mode

Founder clicks **🚀 LAUNCH MY APP**. System builds a 30-day launch
campaign: Product Hunt assets, Indie Hackers post, Show HN post, Reddit
strategy, LinkedIn launch, X thread, TikTok concepts, YouTube Shorts, press
pitch, directory submissions, founder story, email campaign,
micro-influencer list, SEO pages, comparison pages.

Importantly it **chooses which are appropriate** — evidence suggests
indiscriminate directory submission isn't very useful (perhaps 15–20
directories generate most of the meaningful benefit). So the system says
things like:

```
❌ Skip Product Hunt
❌ Skip TikTok
❌ Don't waste money on Meta Ads yet

✓ Target these 4 subreddits
✓ Contact these 27 businesses
✓ Create these 5 SEO pages
✓ List on these 11 directories
```

That judgment is the valuable part.

## Competitor Hijack / Demand Capture

System discovers competitors automatically. E.g. competitor "XYZ Invoice" →
people searching "XYZ Invoice alternative", "XYZ Invoice pricing", "XYZ
Invoice reviews", "XYZ Invoice too expensive" → system recommends creating
`/xyz-invoice-alternative`, generates a legitimate comparison page, then
monitors search performance. This is marketing *infrastructure*, not
content generation.

## Build-in-Public automation

Vibe coders are unusually suited to this. Connect GitHub. System sees
"Added Stripe subscriptions / Fixed onboarding / Added PDF export / Added
dark mode" and turns those changes into a LinkedIn post ("Another week
building InvoiceAI..."), an X post ("Shipped 4 things this week 🚀..."), a
TikTok concept ("3 things I added to my SaaS this week"), and an
automatically generated changelog. The founder isn't continually trying to
invent things to talk about.

## First 10 Customers Mode

Potentially one of the strongest differentiators. Instead of pretending SEO
will immediately deliver customers:

```
MISSION: GET 10 USERS
AI finds: 48 relevant conversations / 27 potential users / 13 communities /
          8 influencers / 5 newsletters

TODAY
15 min  Reply to these 3 conversations.
10 min  Contact these two potential users.
5 min   Publish this post.

3 / 10 customers acquired  ██████░░░░░░░░░░░░
```

Makes marketing feel like completing a product backlog — developers should
respond extremely well to that UX.

## The broader product: "the operating system for launching vibe-coded businesses"

Three phases:

```
BUILD (Lovable/Bolt/Replit/Cursor/Claude Code)
  → SECURE (VibeCheck)
    → GROW (LaunchRadar)
```

Grow handles, as a pipeline:

```
Understand  → website analysis, ICP, competitors, positioning, pricing, market
Prepare     → landing page audit, SEO, ASO, analytics, conversion tracking, launch assets
Launch      → Product Hunt, Reddit, HN, directories, social, email, communities
Acquire     → intent monitoring, lead discovery, outreach, influencers, partnerships
Create      → videos, social posts, graphics, blogs, comparison pages
Optimise    → conversion tracking, attribution, A/B tests, CAC, channel ROI
Learn       → "Reddit generates your cheapest customers. Stop spending on Meta
               and increase Reddit/community activity."
```

### The AI should eventually say STOP

Rare in marketing software. Example:

```
⚠️ Stop posting on X
You've published 31 posts in 60 days.
14,800 impressions / 43 website visits / 0 registrations

Meanwhile Reddit generated:
2,180 visits / 147 registrations / 18 paid customers.

Recommendation: move your X allocation to Reddit.
```

## Marketing readiness before launch

A vibe coder thinks "my app works, time to advertise." The system should
instead say:

```
❌ DO NOT LAUNCH YET
Growth Readiness: 38/100

Missing: Google Analytics, Search Console, Meta pixel, conversion events,
privacy/cookie consent, OpenGraph image, sitemap, structured data, email
capture, onboarding emails, demo video, screenshots, testimonials, favicon,
social profiles, support email, pricing analytics

FIX WITH AI
```

Could even generate code/instructions for Cursor/Lovable/Claude Code to
implement what's missing — a nice bridge between building and marketing.

## Positioning

Don't call it an "AI Marketing Platform" — far too generic. Position around
the emerging builder category instead:

- "You vibe coded the app. Now vibe market it."
- "From 0 users → your first 100."
- "Cursor built your app. We find the customers."

The user doesn't need to understand SEO, content marketing, Reddit, Product
Hunt, attribution, CRO, outreach, or influencer marketing. They say "I built
this." The system answers "here's who needs it, here's where they are,
here's what we're going to do to reach them" — and executes as much as
possible.

## Why this might be bigger than VibeCheck

Not because security is less important, but because **every** vibe-coded
app has a distribution problem, whereas only a proportion of founders
realise they have a security problem. Natural brand-ecosystem sequence:

```
VibeCheck   — "Is my app safe to launch?"
LaunchRadar — "Now get people using it."
```

With a natural cross-sell: "Security score: 94/100 ✓ Your app is ready.
Ready to find your first 100 users? → Start Growth Campaign."

## Validation idea

Run the finished system against several of Simon's own, completely
different products (FireXCheck, PlantMedic, TwnCryr, fire-risk-assessment,
...) and check whether it correctly recommends radically different
acquisition strategies for each. If the core AI decision engine gets that
right, it works.
