// Work center -> UIC derivation and UIC/status auto-derivation rules. The mapping
// itself now lives in the DB (engine_types/uic_teams/work_centers tables, admin-
// editable from /masters — see lib/masters.ts's getMasters()) rather than being
// hardcoded here. These functions take that mapping as an explicit parameter so
// client components can derive synchronously as the user types, using the masters
// snapshot their page already loaded server-side.

function normalizeWorkCenter(workCenter: string | null | undefined): string | null {
  if (!workCenter) return null;
  const trimmed = workCenter.trim();
  return trimmed || null;
}

/** Derives the owning UIC for a work center per the current mapping. Returns null
 * for blank or unmapped work centers — callers should fall back to a neutral
 * display, never guess. */
export function deriveUic(workCenter: string | null | undefined, workCenterToUic: Record<string, string>): string | null {
  const wc = normalizeWorkCenter(workCenter);
  if (!wc) return null;
  return workCenterToUic[wc] ?? null;
}

/** Color slug for a known UIC value, or "unmapped" (neutral gray) otherwise. */
export function uicColorKey(uic: string | null | undefined, uicColorSlugs: Record<string, string>): string {
  if (!uic) return "unmapped";
  return uicColorSlugs[uic.trim()] ?? "unmapped";
}

/** Color slug for a work center, derived via its mapped UIC. */
export function wcColorKey(
  workCenter: string | null | undefined,
  workCenterToUic: Record<string, string>,
  uicColorSlugs: Record<string, string>,
): string {
  return uicColorKey(deriveUic(workCenter, workCenterToUic), uicColorSlugs);
}

/** Status auto-derives the same way UIC does (see deriveUic) — reaching the
 * serviceable store means the repair is done, so Status becomes "Ready" regardless
 * of what was there before. Everywhere else, the caller's own status is kept as-is.
 * `terminalUic` is null when no UIC team is currently flagged terminal (see
 * getMasters()), in which case nothing ever auto-derives to "Ready". */
export function deriveStatus(
  uic: string | null,
  fallback: string | null | undefined,
  terminalUic: string | null,
): string | null {
  if (terminalUic && uic === terminalUic) return "Ready";
  return fallback ?? null;
}
