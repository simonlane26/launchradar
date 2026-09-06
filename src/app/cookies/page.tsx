import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

const UPDATED = "6 September 2026";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "LaunchRadar uses only strictly-necessary cookies for authentication. No analytics, advertising or tracking cookies, and no consent banner.",
  alternates: { canonical: "/cookies" },
};

export default function CookiesPage() {
  return (
    <LegalPage title="Cookie Policy" updated={UPDATED} current="/cookies">
      <p>
        This policy explains the cookies and similar technologies used on
        <span> launchradar.app</span> and in the LaunchRadar application. It should be read
        alongside our <a href="/privacy">Privacy Policy</a>.
      </p>

      <h2>1. What cookies are</h2>
      <p>
        Cookies are small text files a website stores in your browser. Some are needed for the site
        to work; others are used for analytics or advertising. Similar technologies include
        <span> </span>local storage and session storage.
      </p>

      <h2>2. Cookies LaunchRadar uses</h2>
      <p>
        LaunchRadar uses <strong>strictly-necessary cookies only</strong>. We do not use analytics,
        advertising, profiling or cross-site tracking cookies.
      </p>
      <ul>
        <li>
          <strong>Authentication and session cookies</strong> set by our authentication provider,
          Clerk (for example <code>__session</code> and <code>__client</code>). They keep you signed
          in, protect your session against tampering, and are required for the app to function. They
          are removed when you sign out or when they expire.
        </li>
      </ul>
      <p>
        Because these cookies are essential to deliver a service you have requested, UK and EU rules
        do not require a consent banner for them, so we do not show one.
      </p>

      <h2>3. Third-party cookies</h2>
      <p>
        When you start a checkout or open the billing portal you are taken to a page hosted by
        Stripe. Stripe sets its own cookies there for payment functionality and fraud prevention,
        governed by{" "}
        <a href="https://stripe.com/cookie-settings/legal" target="_blank" rel="noopener noreferrer">
          Stripe&rsquo;s cookie policy
        </a>
        . We do not control those cookies.
      </p>
      <p>
        If we add analytics or other non-essential technologies in future, we will update this
        policy and put an appropriate consent mechanism in place first.
      </p>

      <h2>4. Managing cookies</h2>
      <p>
        You can block or delete cookies in your browser settings. If you block the authentication
        cookie you will not be able to sign in or use the app.
      </p>

      <h2>5. Changes and contact</h2>
      <p>
        We will update the &ldquo;last updated&rdquo; date above when this policy changes. Questions:{" "}
        <a href="mailto:launchradar@outlook.com">launchradar@outlook.com</a>.
      </p>
    </LegalPage>
  );
}
