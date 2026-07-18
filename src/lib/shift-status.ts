// Canonical barcode-status values for shift-report / daily-menu entries. Shown as a
// fixed dropdown; existing rows holding a value outside this list (legacy "Closed",
// import artifacts, etc.) are treated as unset in the edit dialog rather than kept
// as a preserved option — the next save clears them to a real value instead of
// perpetuating stale statuses (see order-status.ts for the same rule on Orders).
export const BARCODE_STATUSES = ["Open", "In progress", "Final Confirm"] as const;

export type BarcodeStatus = (typeof BARCODE_STATUSES)[number];

export function isBarcodeStatus(value: string | null | undefined): value is BarcodeStatus {
  return !!value && (BARCODE_STATUSES as readonly string[]).includes(value);
}
