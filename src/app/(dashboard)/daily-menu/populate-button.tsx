"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { populateDailyMenu } from "./actions";

export function PopulateButton({
  menuDate,
  shift,
  defaultSourceDate,
  defaultSourceShift,
}: {
  menuDate: string;
  shift: string;
  /** Previous-shift date/shift, used only as a sensible starting point in the picker
   * below — the user can change it to pull from any earlier shift instead. */
  defaultSourceDate: string;
  defaultSourceShift: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [sourceDate, setSourceDate] = useState(defaultSourceDate);
  const [sourceShift, setSourceShift] = useState(defaultSourceShift);
  const [pending, startTransition] = useTransition();

  function handlePopulate() {
    startTransition(async () => {
      try {
        const count = await populateDailyMenu(menuDate, shift, sourceDate, sourceShift);
        showToast(
          count > 0
            ? `Pulled ${count} unfinished ${count === 1 ? "entry" : "entries"} from ${sourceShift} on ${sourceDate}`
            : `Nothing to pull — ${sourceShift} on ${sourceDate} had no unfinished entries`,
        );
        setOpen(false);
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Unable to populate.", "error");
      }
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button">Populate from…</Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <div className="flex flex-col gap-3">
          <span className="text-xs font-medium text-text-secondary">Pull unfinished entries from…</span>
          <div className="flex flex-col gap-1">
            <Label htmlFor="populateSourceDate">Date</Label>
            <Input
              id="populateSourceDate"
              type="date"
              value={sourceDate}
              onChange={(e) => setSourceDate(e.target.value)}
              className="data-mono"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Shift</Label>
            <Select value={sourceShift} onValueChange={setSourceShift}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AM">AM</SelectItem>
                <SelectItem value="PM">PM</SelectItem>
                <SelectItem value="Overtime">Overtime</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="button" onClick={handlePopulate} disabled={pending || !sourceDate}>
            {pending ? "Populating…" : "Populate"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
