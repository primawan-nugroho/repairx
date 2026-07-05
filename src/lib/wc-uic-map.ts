// Work center → UIC mapping — the authoritative rule for which team owns which
// work center. The database's uic_today column is DERIVED from this mapping (via
// mwc_today), not independently entered — see CLAUDE.md domain model notes.
//
// This lives in code for now; it moves into an editable masters table in a later
// phase (see DESIGN.md Masters placeholder).
export const WC_TO_UIC: Record<string, string> = {
  ADU: "TVU-1",
  ADE: "TVP-1/2",
  BL: "TVU-1",
  CC: "TVP-4",
  PT: "TCS-3",
  EP: "TCS-3",
  LB: "TCY-3",
  MC: "TCS-3",
  SP: "TCS-3",
  MN: "TVU-3",
  TS: "TVU-3",
  MR: "TVU-4",
  WD: "TVU-4",
  HT: "TVU-4",
  ND: "TVP-4",
  BR: "TVP-4",
  BC: "TVP-4",
  "SERV/Finish": "Kitting/RPC",
  W303: "TCS",
  WBLG: "TCW",
};

function normalizeWorkCenter(workCenter: string | null | undefined): string | null {
  if (!workCenter) return null;
  const trimmed = workCenter.trim();
  return trimmed || null;
}

/** Derives the owning UIC for a work center per the mapping rule. Returns null for
 * blank or unmapped work centers — callers should fall back to a neutral display,
 * never guess. */
export function deriveUic(workCenter: string | null | undefined): string | null {
  const wc = normalizeWorkCenter(workCenter);
  if (!wc) return null;
  return WC_TO_UIC[wc] ?? null;
}

// One color slug per distinct UIC in the mapping (10 total). Work centers inherit
// their UIC's color; UICs not in the mapping (e.g. legacy TVU-2, TBR data predating
// this rule) fall back to "unmapped" gray.
const UIC_COLOR_SLUGS: Record<string, string> = {
  "TVU-1": "uic-a",
  "TVP-1/2": "uic-b",
  "TVP-4": "uic-c",
  "TCS-3": "uic-d",
  "TCY-3": "uic-e",
  "TVU-3": "uic-f",
  "TVU-4": "uic-g",
  "Kitting/RPC": "uic-h",
  TCS: "uic-i",
  TCW: "uic-j",
};

/** Color slug for a known UIC value, or "unmapped" (neutral gray) otherwise. */
export function uicColorKey(uic: string | null | undefined): string {
  if (!uic) return "unmapped";
  return UIC_COLOR_SLUGS[uic.trim()] ?? "unmapped";
}

/** Color slug for a work center, derived via its mapped UIC. */
export function wcColorKey(workCenter: string | null | undefined): string {
  return uicColorKey(deriveUic(workCenter));
}

export const ALL_MAPPED_UICS = Array.from(new Set(Object.values(WC_TO_UIC))).sort();
export const ALL_MAPPED_WORK_CENTERS = Object.keys(WC_TO_UIC).sort();
