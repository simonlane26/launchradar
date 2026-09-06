"use server";

import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/errors";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { sendPlaybookEmail } from "@/lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type PlaybookResult = { ok: true; alreadySent: boolean } | { ok: false; error: string };

/**
 * Landing-page "first-users playbook" signup. Captures the address, then
 * (once per email, ever) fires the autoresponder. Kept deliberately thin —
 * one field, no account.
 */
export async function subscribePlaybook(rawEmail: string): Promise<PlaybookResult> {
  const email = String(rawEmail ?? "").trim().toLowerCase();
  if (email.length > 254 || !EMAIL_RE.test(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const ip = await clientIp();
  const rl = rateLimit(`playbook:${ip}`, { limit: 5, windowMs: 60 * 60_000 });
  if (!rl.ok) return { ok: false, error: "Too many attempts. Try again in a bit." };

  let subscriber;
  try {
    subscriber = await prisma.subscriber.upsert({
      where: { email },
      create: { email, source: "playbook" },
      update: {},
    });
  } catch (err) {
    logError("subscribePlaybook:upsert", err);
    return { ok: false, error: "Something went wrong. Try again." };
  }

  if (subscriber.playbookSentAt) {
    return { ok: true, alreadySent: true };
  }

  const sent = await sendPlaybookEmail(email);
  if (sent) {
    await prisma.subscriber
      .update({ where: { email }, data: { playbookSentAt: new Date() } })
      .catch((err) => logError("subscribePlaybook:markSent", err));
  }
  // The address is captured regardless — if email isn't configured yet the
  // playbook goes out once it is (playbookSentAt still null).
  return { ok: true, alreadySent: false };
}
