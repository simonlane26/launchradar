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
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
