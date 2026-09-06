"use client";

import { useState, useTransition } from "react";
import { subscribePlaybook } from "@/app/playbook-actions";

/** Fire a conversion event into whatever analytics tool is wired up (none
 *  yet — these are all no-ops until Plausible / GA / a dataLayer exists), so
 *  playbook signups are countable separately from URL submissions. */
function trackSignup() {
  const w = window as unknown as {
    plausible?: (name: string, opts?: unknown) => void;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  };
  try {
    w.plausible?.("Playbook signup");
    w.gtag?.("event", "playbook_signup", { method: "landing_form" });
    w.dataLayer?.push({ event: "playbook_signup" });
  } catch {
    /* analytics must never break the form */
  }
}

export function PlaybookSignup() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<
    { kind: "idle" | "done" } | { kind: "error"; message: string }
  >({ kind: "idle" });
  const [pending, start] = useTransition();

  if (state.kind === "done") {
    return (
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white/60 p-4 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
        Check your inbox — the first-users playbook is on its way.
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await subscribePlaybook(email);
          if (res.ok) {
            trackSignup();
            setState({ kind: "done" });
          } else {
            setState({ kind: "error", message: res.error });
          }
        });
      }}
      className="w-full max-w-md rounded-xl border border-zinc-200 bg-white/50 p-4 text-left dark:border-zinc-800 dark:bg-zinc-950/40"
    >
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Not ready to run your Growth Score yet?
      </p>
      <p className="mt-0.5 text-sm text-zinc-500">
        Get the first-users playbook in your inbox — no URL required.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-10 flex-1 rounded-full border border-zinc-300 bg-white px-4 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          disabled={pending}
          className="h-10 shrink-0 rounded-full border border-zinc-400 px-4 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-600 hover:text-black disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:text-white"
        >
          {pending ? "Sending…" : "Send me the playbook"}
        </button>
      </div>
      {state.kind === "error" && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{state.message}</p>
      )}
    </form>
  );
}
