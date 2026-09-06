import Link from "next/link";
import { Show } from "@clerk/nextjs";
import RadarBackground from "@/components/radar-background";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function Home() {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-zinc-50 font-sans dark:bg-black">
      <RadarBackground offsetX="10%" offsetY="-6%" />
      <div className="relative z-[1] flex flex-1 flex-col">
        <SiteHeader />
        <main className="flex flex-1 flex-col items-center justify-center px-6">
          <div className="flex w-full max-w-2xl flex-col items-center gap-6 pb-32 text-center">
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
            <div className="flex flex-col items-center gap-4 pt-4 sm:flex-row">
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
              <Link
                href="/pricing"
                className="text-base font-medium text-zinc-600 transition-colors hover:text-black dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                See pricing
              </Link>
            </div>

            <p className="pt-2 text-sm text-zinc-500">
              New here?{" "}
              <Link href="/compare" className="font-medium underline hover:text-black dark:hover:text-zinc-100">
                See how it compares
              </Link>{" "}
              or{" "}
              <Link href="/faq" className="font-medium underline hover:text-black dark:hover:text-zinc-100">
                read the FAQ
              </Link>
              .
            </p>
          </div>
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
