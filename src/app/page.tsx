import Link from "next/link";
import { Show } from "@clerk/nextjs";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 font-sans dark:bg-black">
      <main className="flex w-full max-w-2xl flex-col items-center gap-6 py-32 text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-zinc-500">
          LaunchRadar
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-black sm:text-5xl dark:text-zinc-50">
          You vibe coded the app.
          <br />
          Now vibe market it.
        </h1>
        <p className="max-w-lg text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Give us your URL. We&apos;ll score your growth readiness, tell you
          exactly what&apos;s missing, and hand you a this-week action plan —
          not fifty generic marketing ideas.
        </p>
        <div className="flex flex-col gap-4 pt-4 sm:flex-row">
          <Show when="signed-out">
            <Link
              href="/sign-up"
              className="flex h-12 items-center justify-center rounded-full bg-foreground px-8 text-base font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
            >
              Get your Growth Score
            </Link>
          </Show>
          <Show when="signed-in">
            <Link
              href="/dashboard"
              className="flex h-12 items-center justify-center rounded-full bg-foreground px-8 text-base font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
            >
              Go to dashboard
            </Link>
          </Show>
        </div>
      </main>
    </div>
  );
}
