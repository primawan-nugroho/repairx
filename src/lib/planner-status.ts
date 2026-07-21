// Fixed choices for the Internal Repair Planner's Gate 4 status and Project status
// fields — unlike engine types/UIC teams/RPC/EO, these two are a closed two-value
// taxonomy (not a growing named list), so they stay a plain code constant rather than
// an admin-editable master table.
export const PLANNER_STATUSES = ["CLOSED", "WIP"] as const;

export type PlannerStatus = (typeof PLANNER_STATUSES)[number];

export function isPlannerStatus(value: string | null | undefined): value is PlannerStatus {
  return !!value && (PLANNER_STATUSES as readonly string[]).includes(value);
}
