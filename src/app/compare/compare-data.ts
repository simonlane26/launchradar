/**
 * Head-to-head comparison content. One entry per alternative a vibe-coding
 * founder actually weighs LaunchRadar against. Each drives:
 *  - a card on /compare
 *  - a full page at /compare/<slug> (own metadata + JSON-LD)
 *  - a column in the matrix on /compare
 *
 * Written to be fair — every entry has a "when <alternative> is the better
 * choice" section — because AI assistants and readers both discount a
 * comparison page that only flatters itself.
 */

export type Comparison = {
  slug: string;
  /** e.g. "AI social media managers" */
  alternative: string;
  /** page + card headline, e.g. "LaunchRadar vs AI social media managers" */
  title: string;
  /** one-line summary for the card and meta description */
  summary: string;
  /** 2–3 short paragraphs: what the alternative is, how LaunchRadar differs */
  body: string[];
  /** honest "pick the other one when…" list */
  chooseAlternativeWhen: string[];
  /** "pick LaunchRadar when…" list */
  chooseLaunchRadarWhen: string[];
};

export const COMPARISONS: Comparison[] = [
  {
    slug: "ai-social-media-managers",
    alternative: "AI social media managers",
    title: "LaunchRadar vs AI social media managers",
    summary:
      "Content tools generate posts well. LaunchRadar decides what your product should actually do to get users, and finds demand that already exists.",
    body: [
      "AI social media managers — the category that includes tools marketed as autonomous posting agents — take a topic and produce a stream of social content: captions, threads, short-video scripts, a scheduling calendar. They are good at volume and consistency.",
      "LaunchRadar starts a layer up. It reads your live site, works out your category, ideal customer and positioning gaps, and produces a Growth Score plus a prioritised backlog of the specific moves that matter for this product. Content generation exists inside it — \"Create with AI\" drafts a comparison page or a launch post — but it is downstream of the strategy, not the whole product.",
      "The other difference is direction of effort. A content tool assumes posting more is the goal. LaunchRadar gives explicit skip verdicts on channels unlikely to work for you, and Opportunity Radar looks outward for people already describing the problem you solve, so your first move can be a helpful reply rather than a cold post.",
    ],
    chooseAlternativeWhen: [
      "You already know your channel strategy and just need a high volume of on-brand posts.",
      "Your growth is genuinely bottlenecked on content throughput, not on knowing what to do.",
      "You want fully hands-off scheduled publishing and are comfortable with generic output.",
    ],
    chooseLaunchRadarWhen: [
      "You are not sure which channels are worth your time for this specific product.",
      "You want to find people already asking for what you built, not just broadcast.",
      "You want a scored, completable backlog you can work through, not an endless feed.",
    ],
  },
  {
    slug: "generic-marketing-checklist",
    alternative: "a generic marketing checklist",
    title: "LaunchRadar vs a generic marketing checklist",
    summary:
      "A 50-item launch checklist treats every product the same. LaunchRadar tailors the list to your category and cuts the items that do not apply.",
    body: [
      "Generic checklists — the \"50 things to do before you launch\" templates and Notion docs — are a useful reminder that marketing has many surfaces. Their weakness is that they are identical for a consumer app, a B2B tool and a developer product, when the channels that matter for each are almost entirely different.",
      "LaunchRadar produces a backlog from your actual site: real positioning problems, real missing technical signals, a real ICP. Items are ordered by impact and effort, each has a one-click way to start, and completing them updates a projected Growth Score so you can see what is worth doing next.",
      "It also curates down. Launch Mode will tell you to submit to a specific short list of directories and skip the rest, or to skip Product Hunt entirely if it will not help you — the opposite of a checklist that only ever adds tasks.",
    ],
    chooseAlternativeWhen: [
      "You want a free, zero-setup reference and are happy to filter it yourself.",
      "You have done several launches and already know which items to ignore.",
    ],
    chooseLaunchRadarWhen: [
      "You want the list filtered to your product before you start.",
      "You want each item to come with the draft or the walkthrough attached.",
      "You want to know what to stop doing, not only what to add.",
    ],
  },
  {
    slug: "hiring-a-growth-marketer",
    alternative: "hiring a growth marketer",
    title: "LaunchRadar vs hiring a growth marketer",
    summary:
      "A good growth hire brings judgment you cannot automate. LaunchRadar covers the first few weeks of the role for a fraction of the cost while you decide.",
    body: [
      "Hiring a growth marketer — full-time, fractional or an agency — is the right move once you have budget, a working funnel and questions that need a human's judgment on brand and paid spend. It is also expensive, slow to ramp, and hard to evaluate before money is spent.",
      "LaunchRadar does the part that is systematisable: the audit, the channel go/skip strategy, the prioritised backlog, the first drafts, and ongoing discovery of live opportunities. That is roughly the first few weeks of a growth engagement, available immediately and priced in tens of pounds a month.",
      "The two are not mutually exclusive. Founders often use LaunchRadar to get the fundamentals in place and prove which channels move the needle, then bring in a marketer with a running start and a clear brief.",
    ],
    chooseAlternativeWhen: [
      "You have product-market fit, real budget, and need paid-acquisition or brand strategy.",
      "You need someone accountable for a number, not just a plan.",
      "Your bottleneck is execution capacity across many channels at once.",
    ],
    chooseLaunchRadarWhen: [
      "You are pre-revenue or early and cannot justify a growth salary yet.",
      "You want the strategy and backlog now, this week, for a low fixed cost.",
      "You want to learn which channels work before you brief a human.",
    ],
  },
  {
    slug: "asking-an-ai-chat-for-a-plan",
    alternative: "asking ChatGPT or Claude for a marketing plan",
    title: "LaunchRadar vs asking an AI chat for a marketing plan",
    summary:
      "A chat gives you a plausible generic plan. LaunchRadar grounds the plan in your real site and keeps it running as a backlog.",
    body: [
      "Asking a general assistant \"how should I market my app?\" returns a competent, generic answer in seconds. It is a fine starting point and costs nothing.",
      "What it does not do: read your live site for concrete positioning and technical gaps, hold a persistent backlog you work through over weeks, re-scan the web for people describing your problem, score your readiness on a consistent scale, or tell you which channels to stop. Those need state, grounding and repeat runs — an application, not a conversation.",
      "LaunchRadar is built on Claude for exactly the generation steps a chat is good at, then wraps them in the structure that turns advice into an operating system: a Growth Score with history, a completable backlog, Launch Mode, and Opportunity Radar.",
    ],
    chooseAlternativeWhen: [
      "You want a one-off orientation and will drive execution entirely yourself.",
      "You enjoy assembling and tracking your own plan from raw suggestions.",
    ],
    chooseLaunchRadarWhen: [
      "You want the plan grounded in your actual product, not a generic template.",
      "You want it to persist, update and surface new opportunities over time.",
      "You want the drafts, the scoring and the skip calls in one place.",
    ],
  },
];

export function getComparison(slug: string): Comparison | undefined {
  return COMPARISONS.find((c) => c.slug === slug);
}

/** Matrix rows shown on /compare. Order: LaunchRadar, AI content tools,
 *  generic checklist, growth hire, AI chat. */
export const MATRIX_COLUMNS = [
  "LaunchRadar",
  "AI content tools",
  "Generic checklist",
  "Growth hire",
  "AI chat plan",
] as const;

type Cell = "yes" | "no" | "partial";
export const MATRIX_ROWS: { label: string; values: [Cell, Cell, Cell, Cell, Cell] }[] = [
  { label: "Tailored to your specific product", values: ["yes", "partial", "no", "no", "partial"] },
  { label: "Tells you which channels to skip", values: ["yes", "no", "no", "yes", "partial"] },
  { label: "Finds people already asking for your product", values: ["yes", "no", "no", "partial", "no"] },
  { label: "Prioritised, completable backlog", values: ["yes", "no", "partial", "partial", "no"] },
  { label: "Consistent readiness score with history", values: ["yes", "no", "no", "no", "no"] },
  { label: "Drafts the assets for you", values: ["yes", "yes", "no", "yes", "partial"] },
  { label: "Ongoing, not one-off", values: ["yes", "yes", "no", "yes", "no"] },
  { label: "Costs under £25 / month", values: ["yes", "partial", "yes", "no", "yes"] },
  { label: "No hiring or onboarding", values: ["yes", "yes", "yes", "no", "yes"] },
];
