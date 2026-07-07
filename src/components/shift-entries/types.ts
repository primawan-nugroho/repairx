// Shared shape between the End Shift Report and the Daily Menu (pre-shift plan) —
// both tables have identical columns (see db/schema.ts: shift_report_entries and
// daily_menu_entries), so the grouped-table and edit-dialog UI is shared here rather
// than duplicated per feature.
export interface EditableShiftEntry {
  id: number;
  orderNumber: string;
  workCenter: string | null;
  uic: string | null;
  ops: string | null;
  activity: string | null;
  planMhrs: string | null;
  consumedMhrs: string | null;
  manhours: string | null;
  progressPct: number | null;
  stampPct: number | null;
  completenessStatus: string | null;
  remark: string | null;
  orderDescription?: string | null;
}
