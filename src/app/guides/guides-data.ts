/**
 * Evergreen how-to content for indie/no-code founders — SEO landing pages
 * targeting specific "how do I X" searches. Each entry drives:
 *  - a card on /guides
 *  - a full page at /guides/<slug> (own metadata + HowTo/Breadcrumb JSON-LD)
 *
 * Structured as sequential steps (not free-form body copy like /compare)
 * since that's what both the reader and HowTo schema want — a step's `body`
 * becomes its JSON-LD `HowToStep.text` verbatim, so write it as something an
 * answer engine could quote directly.
 */

export type GuideStep = { title: string; body: string };

export type Guide = {
  slug: string;
  /** H1 / JSON-LD name. */
  title: string;
  /** Card summary + meta description. */
  description: string;
  /** 2-3 paragraphs, no heading — sets up the problem before the steps. */
  intro: string[];
  steps: GuideStep[];
  ctaHeading: string;
  ctaBody: string;
  ctaLabel: string;
};

export const GUIDES: Guide[] = [
  {
    slug: "how-to-find-first-users-for-your-product",
    title: "How to Find Your First Users When You Have Zero Marketing Experience",
    description:
      "You shipped your product. Now nobody's using it. Here's exactly how indie and no-code founders find their first 10-100 users without an ad budget or a marketing background.",
    intro: [
      "You built the thing. It works. You're proud of it. And now you're staring at an analytics dashboard with one visitor on it — you, refreshing it.",
      "This is the part nobody warns you about. Building the product is hard, but at least it's a problem you know how to solve. Finding your first users feels like a different sport entirely, and most \"growth\" advice online is written for teams with budgets, not solo founders with a live product and a Twitter account with 40 followers.",
      "Here's the actual playbook — no ad spend, no growth hacks, just the stuff that works when you're starting from zero.",
    ],
    steps: [
      {
        title: "Start where your users already are, not where you wish they were",
        body: "Don't build a content calendar or launch a podcast yet. Go find the 3-5 places online where people with your exact problem already hang out — specific subreddits, niche Slack/Discord communities, relevant Twitter/X threads, or Indie Hackers posts. Spend a week just reading before you post anything. You're looking for the language people use to describe their pain, not a place to drop your link.",
      },
      {
        title: "Launch where founders are already looking for new tools",
        body: "Platforms like Product Hunt, Betalist, and niche \"new launches\" communities exist because people are actively browsing for new products to try — this is the lowest-friction traffic you'll ever get. The catch: most founders launch once, get a spike, and disappear. The founders who actually convert this into real users treat launch day as the start of a conversation, not the finish line — replying to every comment, DMing people who seem genuinely interested, and following up a week later.",
      },
      {
        title: "Talk to people before you \"market\" to anyone",
        body: "Your first 10 users rarely come from content or ads — they come from DMs, cold emails, and conversations where you ask \"would this be useful to you?\" before you ask anyone to sign up. This feels slow and a little embarrassing. It's also the fastest path to a user who'll actually tell you why they churned, which is worth more than 100 anonymous signups.",
      },
      {
        title: "Make it easy for strangers to find you when you launch",
        body: "Every one of the steps above works better if you're not doing it alone. LaunchRadar tracks where other indie founders are launching, finding users, and getting traction right now — so you're not guessing which communities are worth your time or which launch platforms still convert.",
      },
    ],
    ctaHeading: "You don't need a marketing degree. You need a map.",
    ctaBody:
      "LaunchRadar shows indie founders where today's traction is actually coming from — so your first users aren't a mystery.",
    ctaLabel: "Start finding your users →",
  },
  {
    slug: "first-100-users",
    title: "How to Get Your First 100 Users as an Indie Founder",
    description:
      "A no-fluff playbook for solo founders who shipped something good and now need people to see it.",
    intro: [
      "You built the thing. That was the hard part, or so you thought. Now it's live, you've told your mom and two friends from Discord, and the user count is stuck at single digits. You're not alone — most indie founders hit this wall right after launch, and it has nothing to do with your product being bad.",
    ],
    steps: [
      {
        title: "Why \"just launch on Product Hunt\" isn't a strategy",
        body: "Product Hunt gives you a day. Reddit gives you a thread. Twitter gives you an afternoon. None of that is distribution — it's a spike. What actually gets you to 100 real users is a handful of repeatable channels run consistently for 2-4 weeks. That's it. Not virality. Repetition.",
      },
      {
        title: "Pick 3 channels, not 10",
        body: "Spreading yourself across every platform is how you end up with no presence anywhere. For most indie SaaS, the right starting three are: one community (where your ICP already hangs out), one content channel (SEO or Twitter/X), and one direct outreach channel (cold DMs or email to people who'd actually want this).",
      },
      {
        title: "Find where your ICP already complains",
        body: "Search Reddit, niche Slack/Discord communities, and X for the exact problem your product solves. Don't pitch. Answer the question like a human, then mention your tool only if it's genuinely relevant. This alone can bring in a meaningful chunk of your first users.",
      },
      {
        title: "Ship a \"launch week,\" not a launch day",
        body: "Stack your announcements: Product Hunt Tuesday, a relevant subreddit Wednesday, a cold outreach batch Thursday, a founder story post Friday. Momentum compounds across a week far better than one big push.",
      },
      {
        title: "Track what's actually working",
        body: "Most indie founders lose weeks guessing which channel drove signups because nothing's tracked. You don't need a full analytics stack for this — you need a lightweight way to see which launch moves actually move the needle, so you can double down instead of spraying and praying.",
      },
      {
        title: "Talk to every single one of your first users",
        body: "At this stage, 100 users isn't a vanity number — it's 100 conversations waiting to happen. Ask why they signed up, what almost stopped them, what they'd tell a friend. This is your actual marketing research, and it's free.",
      },
    ],
    ctaHeading: "You don't need a marketing team. You need a system.",
    ctaBody:
      "That's exactly what LaunchRadar is for — a lightweight dashboard that tracks your launch channels, signups, and what's actually converting, built for solo founders who don't have time to stitch together five tools just to know what's working.",
    ctaLabel: "Start tracking your launch free →",
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
