// Canonical order status values shown in the Orders edit dropdown.
// Kept in source (not master data) because they map directly to statusColorKey()
// in ./utils.ts — adding a new value there requires a matching entry here.
// Legacy DB values (OPEN, PROGRESS, URGENT, w/f …) are preserved by the edit dialog
// as a disabled "current" option so old rows remain editable.
export const ORDER_STATUSES = [
  "Ready",
  "Partially Ready",
  "Pending Raw Material",
  "Pending BDP",
  "Pending Decision",
  "Pending Tooling",
  "Completed",
  "Cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export function isCanonicalOrderStatus(value: string | null | undefined): value is OrderStatus {
  return !!value && (ORDER_STATUSES as readonly string[]).includes(value);
}
