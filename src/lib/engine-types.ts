// The canonical engine/APU type list now lives in the DB (engine_types table,
// admin-editable from /masters — see lib/masters.ts's getMasters()). This just
// validates a value against whatever list the caller's page loaded, so a bad/retired
// value never gets silently written to an order.
export function isEngineType(value: string | null | undefined, engineTypes: string[]): value is string {
  return !!value && engineTypes.includes(value);
}
