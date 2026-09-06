/**
 * FAQ source of truth. Answers are plain strings (one or two short
 * paragraphs, split on "\n\n") so the same array feeds both the rendered
 * page and the `FAQPage` JSON-LD — answer engines lift these near-verbatim,
 * so each one leads with a direct answer in the first sentence.
 */
export type FaqItem = { q: string; a: string };
export type FaqSection = { heading: string; items: FaqItem[] };

export const FAQ_SECTIONS: FaqSection[] = [
  {
    heading: "The basics",
    items: [
      {
        q: "What is LaunchRadar?",
        a: "LaunchRadar is an AI growth agent for vibe-coded apps. You give it your product URL and it tells you who needs your product, where those people already are, and what to do this week to reach them — then does as much of the work as it can itself.\n\nIt is built for founders who shipped a product with tools like Lovable, Bolt, Replit, Cursor or Claude Code and now need users, without hiring a marketer or wading through a generic 50-item checklist.",
      },
      {
        q: "Who is LaunchRadar for?",
        a: "Solo founders and small teams who have a live product and no dedicated growth person. It works for consumer apps, B2B SaaS and developer tools — the plan it produces is different for each, because the channels that matter are different for each.",
      },
      {
        q: "What do I need to get started?",
        a: "Just your product's URL. LaunchRadar fetches the page, works out your category, ideal customer and positioning, runs deterministic technical checks, and produces a Growth Score plus a prioritised backlog. You do not connect your codebase, analytics or ad accounts to get the first result.",
      },
      {
        q: "How long does the first analysis take?",
        a: "Usually under a minute for the website analysis and Growth Score. Deeper runs — Launch Mode and the Search & AI Visibility report — take a few minutes because they make several web-grounded AI calls.",
      },
      {
        q: "Is there a free plan?",
        a: "Yes. The Free plan covers one project with the full website analysis, Growth Score, a limited Growth Backlog, basic visibility checks and one Opportunity Radar scan a month. No card required. Paid plans (Builder £12/mo, Growth £24/mo) raise the limits and unlock Competitor Radar and scheduled scans. See the pricing page for the full breakdown.",
      },
    ],
  },
  {
    heading: "How it works",
    items: [
      {
        q: "What is a Growth Score?",
        a: "The Growth Score is a 0–100 measure of how ready your product is to acquire users. It is the equal-weight mean of six dimensions — Positioning, Conversion, SEO, Trust, Distribution and Analytics — each scored from concrete issues found on your site and a set of technical readiness checks. It is calculated in code, not guessed by a model, and every run is stored so you can see the trend as you fix things.",
      },
      {
        q: "What is Opportunity Radar?",
        a: "Opportunity Radar finds people who are already the customer by searching for the circumstances that create demand — posts like \"I have dyslexia and writing emails at work takes forever\" — rather than mentions of your product name or category. It classifies and scores what it finds, and drafts a genuinely useful reply you can copy and post yourself.",
      },
      {
        q: "Does LaunchRadar post or send anything automatically?",
        a: "No. It never auto-posts, auto-comments or sends email on your behalf. Everything it writes — replies, launch copy, comparison pages — is a draft you review, edit and publish yourself.",
      },
      {
        q: "What is the Growth Backlog?",
        a: "The Growth Backlog is a prioritised, completable list of growth tasks specific to your product, ordered highest impact and lowest effort first. Each item has a one-click CTA: \"Create with AI\" drafts the asset for you, \"Show me how\" writes a step-by-step walkthrough. You mark items done and the score projection updates.",
      },
      {
        q: "Which channels does it cover?",
        a: "Launch Mode gives an explicit go or skip verdict on around fifteen channels — Product Hunt, Hacker News, Indie Hackers, Reddit, LinkedIn, X, TikTok, YouTube Shorts, directories, cold email, communities, SEO and comparison pages, press and micro-influencers — plus a 30-day schedule and ready-to-post copy for the channels worth doing. The skip verdicts are the point: most products should ignore several channels.",
      },
      {
        q: "What is the Search & AI Visibility report?",
        a: "It answers \"how easy are you to find?\" across Google (SEO), answer engines (AEO) and AI assistants (GEO). It runs deterministic on-site checks, scores five plain-language dimensions, and runs real customer questions through web-grounded AI to see whether it recommends you or your competitors — then turns the gaps into backlog items.",
      },
    ],
  },
  {
    heading: "How it compares",
    items: [
      {
        q: "How is this different from an AI social media manager?",
        a: "Tools that generate social content well already exist. LaunchRadar's job is judgment: what should this specific product actually do to get users, which channels to skip, and where real demand already exists — not another feed of generic posts. Content generation is a small part of it, downstream of the strategy.",
      },
      {
        q: "Can LaunchRadar replace a growth marketer?",
        a: "It replaces the first few weeks of one: the audit, the channel strategy, the backlog and the first drafts. It does not replace a senior marketer's judgment on brand, paid budget or long-term positioning. Most early-stage founders do not have a growth marketer at all, which is the gap it fills.",
      },
      {
        q: "Why not just ask ChatGPT or Claude for a marketing plan?",
        a: "A general chat gives you a plausible generic plan. LaunchRadar grounds its plan in your actual site — real positioning gaps, real technical checks, a real ICP — keeps a persistent backlog you work through, finds live opportunities on an ongoing basis, and tells you what to stop doing. It is the difference between advice and an operating system.",
      },
      {
        q: "How does LaunchRadar relate to VibeCheck?",
        a: "VibeCheck answers \"is my app safe to launch?\" and LaunchRadar answers \"now get people using it.\" They are separate products that pair naturally — a security score leads into a growth score.",
      },
    ],
  },
  {
    heading: "Data and trust",
    items: [
      {
        q: "What data does LaunchRadar need about my product?",
        a: "Only what is publicly on your website, plus anything you choose to edit in the product profile. It does not require access to your source code, private analytics, customer lists or ad accounts.",
      },
      {
        q: "Which AI models power it?",
        a: "The analysis and generation pipeline runs on Claude (Anthropic), with web-search grounding for the Opportunity Radar and AI Visibility test. Deterministic checks — technical readiness, structured-data signals, scoring maths — run in code with no model involved, so they are consistent and free.",
      },
      {
        q: "Is my project data shared with other users?",
        a: "No. Every project is scoped to your organisation. Analyses, backlogs and opportunities are private to your account.",
      },
      {
        q: "Can I use LaunchRadar for more than one product?",
        a: "Yes. The Free plan covers one project; Builder covers three and Growth covers ten, which is aimed at founders running several products or an agency-style portfolio.",
      },
    ],
  },
];

export const FAQ_FLAT: FaqItem[] = FAQ_SECTIONS.flatMap((s) => s.items);
