import type { ReactNode } from "react";

type IconComponent = (props: { size?: number; stroke?: number; className?: string }) => ReactNode;

export function ComingSoon({
  icon: Icon,
  feature,
  phase,
  blurb,
}: {
  icon: IconComponent;
  feature: string;
  phase: number;
  blurb: string;
}) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-6 py-16">
      <Icon size={40} stroke={1.5} className="text-zinc-400" />
      <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
        {feature}
      </h1>
      <span className="w-fit rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:bg-zinc-800">
        Coming in Phase {phase}
      </span>
      <p className="max-w-xl text-zinc-600 dark:text-zinc-400">{blurb}</p>
    </div>
  );
}
