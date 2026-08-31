"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { analyzeUrl } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-12 items-center justify-center rounded-full bg-foreground px-8 text-base font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
    >
      {pending ? "Analyzing…" : "Get your Growth Score"}
    </button>
  );
}

export function AnalyzeForm() {
  const [state, formAction] = useActionState(analyzeUrl, { error: null as string | null });

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <div className="flex-1">
        <input
          type="text"
          name="url"
          placeholder="https://yourapp.com"
          required
          className="h-12 w-full rounded-full border border-zinc-300 bg-white px-5 text-base outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
        />
        {state?.error && (
          <p className="mt-2 pl-2 text-sm text-red-600 dark:text-red-400">{state.error}</p>
        )}
      </div>
      <SubmitButton />
    </form>
  );
}
