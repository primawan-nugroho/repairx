"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { populateDailyMenu } from "./actions";

export function PopulateButton({ menuDate, shift }: { menuDate: string; shift: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          await populateDailyMenu(menuDate, shift);
          router.refresh();
        })
      }
      disabled={pending}
      className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
    >
      {pending ? "Populating…" : "Populate from previous shift"}
    </button>
  );
}
