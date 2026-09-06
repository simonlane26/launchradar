import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

const UPDATED = "6 September 2026";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How LaunchRadar collects, uses, shares and protects personal data, the sub-processors we rely on, and your rights under UK GDPR.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated={UPDATED} current="/privacy">
      <p>
        This policy explains how personal data is handled when you visit
        <span> launchradar.app</span> or use the LaunchRadar application (&ldquo;LaunchRadar&rdquo;).
        LaunchRadar is a service provided by <strong>IGNISTECH LTD</strong> (&ldquo;we&rdquo;,
        &ldquo;us&rdquo;), a company registered in England and Wales under company number 16892976,
        with its registered office at 21 Winterberry Way, Nantwich, Cheshire. IGNISTECH LTD is the
        data controller for the personal data described in this policy. If you have any question
        about this policy or want to exercise a right described below, email{" "}
        <a href="mailto:launchradar@outlook.com">launchradar@outlook.com</a>.
      </p>

      <h2>1. What we collect</h2>
      <ul>
        <li>
          <strong>Account data</strong> — handled by our authentication provider, Clerk: your name,
          email address, and authentication identifiers. If you sign in with a third-party provider,
          we receive the basic profile information you authorise.
        </li>
        <li>
          <strong>Workspace and billing data</strong> — your workspace name, current plan, and, if
          you subscribe, your Stripe customer and subscription identifiers and subscription status.
          We never see or store your card details — Stripe handles payment information directly.
        </li>
        <li>
          <strong>Project inputs you provide</strong> — the website URLs you submit for analysis and
          any details you add to a product profile.
        </li>
        <li>
          <strong>Content we fetch on your instruction</strong> — when you run an analysis we
          retrieve the publicly available HTML and text of the URL you submitted, at that moment, and
          store a copy to produce and show you the results.
        </li>
        <li>
          <strong>Generated outputs</strong> — Growth Scores, issue assessments, the Growth Backlog,
          Launch Mode plans, Search &amp; AI Visibility reports, and Opportunity Radar results
          created for your projects.
        </li>
        <li>
          <strong>Opportunity Radar third-party content</strong> — to find people already describing
          the problem your product solves, we run web searches and store, for the matches, the page
          URL, title, a short excerpt, and the author name or handle where it is shown publicly. This
          is content people have posted publicly on the open web.
        </li>
        <li>
          <strong>Usage data</strong> — counts of scans, AI actions and similar events per calendar
          month, used to apply plan limits.
        </li>
        <li>
          <strong>Technical and log data</strong> — IP address, request metadata and error logs,
          retained briefly for security, abuse prevention and debugging.
        </li>
      </ul>

      <h2>2. How we use it, and our lawful bases</h2>
      <ul>
        <li>
          <strong>To provide the service</strong> — running analyses, generating and storing your
          backlog and reports, and showing them to you. Lawful basis: performance of our contract
          with you.
        </li>
        <li>
          <strong>To take payment and manage subscriptions</strong>. Lawful basis: performance of a
          contract; compliance with a legal obligation (keeping financial records).
        </li>
        <li>
          <strong>To keep the service secure and working</strong> — authentication, rate limiting,
          fraud and abuse prevention, and diagnosing faults. Lawful basis: our legitimate interests
          in protecting the service and our users.
        </li>
        <li>
          <strong>To improve LaunchRadar</strong> — understanding which features are used and where
          the product falls short, using aggregated or de-identified information wherever possible.
          Lawful basis: our legitimate interests.
        </li>
        <li>
          <strong>To communicate with you</strong> — service messages such as billing notices and
          material changes to this policy. Lawful basis: performance of a contract; legitimate
          interests.
        </li>
        <li>
          <strong>To comply with the law</strong> and respond to lawful requests. Lawful basis:
          legal obligation.
        </li>
      </ul>
      <p>
        We do <strong>not</strong> sell your personal data, we do <strong>not</strong> use it for
        third-party advertising, and we do <strong>not</strong> use your content to train AI models.
      </p>

      <h2>3. AI processing</h2>
      <p>
        LaunchRadar&rsquo;s analysis and generation features send the fetched site content and the
        prompts we build from it to Anthropic&rsquo;s Claude API to produce your results. Anthropic
        processes this data as our sub-processor to return a response and, under its commercial API
        terms, does not use it to train its models. Some features use web-search grounding performed
        by Anthropic&rsquo;s tooling. AI output can be inaccurate or incomplete; you are responsible
        for reviewing it before acting on it.
      </p>

      <h2>4. Sub-processors and third parties we share data with</h2>
      <p>We share personal data only with service providers that process it on our behalf:</p>
      <table>
        <thead>
          <tr>
            <th>Provider</th>
            <th>Purpose</th>
            <th>Location</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Clerk</td>
            <td>Authentication and account management</td>
            <td>United States</td>
          </tr>
          <tr>
            <td>Railway</td>
            <td>Application hosting and the primary database</td>
            <td>United States / EU (region-dependent)</td>
          </tr>
          <tr>
            <td>Anthropic</td>
            <td>AI processing (Claude API) for analysis and generation</td>
            <td>United States</td>
          </tr>
          <tr>
            <td>Stripe</td>
            <td>Subscription billing and payment processing</td>
            <td>United States / global</td>
          </tr>
        </tbody>
      </table>
      <p>
        Where these providers are outside the UK, transfers are protected by an adequacy decision or
        by standard contractual clauses / the UK International Data Transfer Addendum, together with
        additional safeguards where needed. We may also disclose data if required by law or valid
        legal process, to protect our rights or users&rsquo; safety, or in connection with a merger,
        acquisition or sale of assets (in which case we will notify you).
      </p>

      <h2>5. Retention</h2>
      <p>
        We keep your account, project and generated data for as long as your account is active. If
        you delete your account, we delete or irreversibly anonymise the associated personal data
        within 90 days, except where we must keep certain records longer — for example, invoices and
        transaction records retained for 6 years to meet UK tax and accounting requirements.
        Server and error logs are rotated within 30 days.
      </p>

      <h2>6. Your rights</h2>
      <p>
        Under UK data protection law you have the right to access your personal data; to have
        inaccurate data corrected; to have data erased; to restrict or object to processing; to data
        portability; and to withdraw consent where we rely on it. To exercise any of these, email{" "}
        <a href="mailto:launchradar@outlook.com">launchradar@outlook.com</a>. You also have the right
        to complain to the Information Commissioner&rsquo;s Office (
        <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">ico.org.uk</a>),
        though we would welcome the chance to resolve your concern first.
      </p>

      <h2>7. Security</h2>
      <p>
        We protect data in transit with HTTPS and HSTS, restrict access on a least-privilege basis,
        isolate each customer&rsquo;s data by workspace, verify payment webhooks cryptographically,
        and apply rate limiting and other abuse controls. No method of transmission or storage is
        completely secure, so we cannot guarantee absolute security.
      </p>

      <h2>8. Children</h2>
      <p>
        LaunchRadar is a business tool intended for people aged 18 or over. It is not directed at
        children and we do not knowingly collect their personal data.
      </p>

      <h2>9. Third-party sites</h2>
      <p>
        LaunchRadar fetches, references and links to websites and online discussions we do not
        control. Their own privacy policies and terms apply to your interactions with them.
      </p>

      <h2>10. Changes to this policy</h2>
      <p>
        We may update this policy from time to time. We will change the &ldquo;last updated&rdquo;
        date above and, for material changes, notify you by email or in the app before they take
        effect.
      </p>

      <h2>11. Contact</h2>
      <p>
        Questions, requests or complaints:{" "}
        <a href="mailto:launchradar@outlook.com">launchradar@outlook.com</a>.
      </p>
    </LegalPage>
  );
}
