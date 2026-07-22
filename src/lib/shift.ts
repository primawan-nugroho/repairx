// Default shift by wall-clock time (WIB) — removes the "pick a shift" click on the
// common case of opening Daily Menu / Shift Report to work on the current shift.
// Boundaries are a reasonable default (AM before 14:00, PM before 22:00, else
// Overtime); adjust here if the shop's actual shift handover times differ.
export type Shift = "AM" | "PM" | "Overtime";

export function currentShift(): Shift {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      hour12: false,
      timeZone: "Asia/Jakarta",
    }).format(new Date()),
  );
  if (hour < 14) return "AM";
  if (hour < 22) return "PM";
  return "Overtime";
}

// Dashboard greeting by wall-clock time (WIB) — separate from the shift boundaries
// above since "Good morning" vs. AM/PM/Overtime are different concepts that happen
// to both key off the current WIB hour.
export function greeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      hour12: false,
      timeZone: "Asia/Jakarta",
    }).format(new Date()),
  );
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
