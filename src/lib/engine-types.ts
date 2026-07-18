// Canonical engine/APU type values — shown as a fixed dropdown in the Orders and
// Repair Planner dialogs instead of free text, so the same physical engine type is
// never spelled two different ways across rows.
export const ENGINE_TYPES = [
  "CFM56-3",
  "CFM56-5B",
  "CFM56-7B",
  "GTCP131-9A",
  "GTCP131-9B",
  "GTCP331-350C",
  "GTCP85",
  "Other",
] as const;

export type EngineType = (typeof ENGINE_TYPES)[number];

export function isEngineType(value: string | null | undefined): value is EngineType {
  return !!value && (ENGINE_TYPES as readonly string[]).includes(value);
}
