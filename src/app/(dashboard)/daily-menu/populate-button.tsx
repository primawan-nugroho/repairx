"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast";
import { populateDailyMenu } from "./actions";

export function PopulateButton({ menuDate, shift }: { menuDate: string; shift: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          const count = await populateDailyMenu(menuDate, shift);
          showToast(
            count > 0
              ? `Pulled ${count} unfinished ${count === 1 ? "entry" : "entries"} from the previous shift`
              : "Nothing to pull — previous shift had no unfinished entries",
          );
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
