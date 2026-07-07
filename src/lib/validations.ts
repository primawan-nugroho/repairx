import { z } from "zod";

// Form inputs submit blank numeric fields as "" (never omitted), and z.coerce.number()
// turns "" into 0 rather than treating it as absent — so an unfilled Tier field would
// fail a `.min(1)` check instead of being treated as "not set". This preprocesses blank
// strings to undefined before coercion so optional/nullable numeric fields behave as
// actually optional.
function optionalNumber(schema: z.ZodNumber) {
  return z.preprocess(
    (val) => (val === "" || val == null ? undefined : val),
    schema.nullable().optional(),
  );
}

// Same issue as optionalNumber but for date <input>s: an empty date field submits as
// "" (not omitted), and Postgres rejects "" for a `date` column — it must be null.
const optionalDateString = z.preprocess(
  (val) => (val === "" || val == null ? null : val),
  z.string().nullable().optional(),
);

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required").max(64),
  password: z.string().min(1, "Password is required"),
});

// Tier and waiting-repair are no longer editable from the order form (removed from
// the UI per product decision), so they're intentionally absent from this schema —
// not just unset in the form. If they were present with a `.default(...)`, zod would
// fill in a default value on every save (since the field is always missing from
// FormData now), silently overwriting existing DB values on every unrelated edit.
// Leaving them out of the parsed object means drizzle omits them from the SQL
// entirely, preserving whatever was already stored.
export const orderSchema = z.object({
  orderNumber: z.string().min(1, "Order number is required").max(32),
  dateIn: optionalDateString,
  gate4Target: optionalDateString,
  description: z.string().max(2000).nullable().optional(),
  serialNumber: z.string().max(64).nullable().optional(),
  engineType: z.string().max(32).nullable().optional(),
  mwcRouting: z.string().max(256).nullable().optional(),
  mwcToday: z.string().max(16).nullable().optional(),
  uicToday: z.string().max(32).nullable().optional(),
  planFinishDate: optionalDateString,
  status: z.string().max(64).nullable().optional(),
  remark: z.string().max(2000).nullable().optional(),
  location: z.string().max(128).nullable().optional(),
});

export type OrderInput = z.infer<typeof orderSchema>;

export const shiftReportEntrySchema = z.object({
  reportDate: z.string().min(1, "Date is required"),
  shift: z.enum(["AM", "PM", "Overtime"]),
  orderNumber: z.string().min(1, "Order number is required").max(32),
  workCenter: z.string().max(16).nullable().optional(),
  uic: z.string().max(32).nullable().optional(),
  ops: z.string().max(32).nullable().optional(),
  activity: z.string().max(2000).nullable().optional(),
  planMhrs: optionalNumber(z.coerce.number().nonnegative()),
  consumedMhrs: optionalNumber(z.coerce.number().nonnegative()),
  manhours: optionalNumber(z.coerce.number().nonnegative()),
  progressPct: optionalNumber(z.coerce.number().int().min(0).max(100)),
  stampPct: optionalNumber(z.coerce.number().int().min(0).max(100)),
  completenessStatus: z.enum(["Open", "Inprogress", "closed", "Final confirm"]).nullable().optional(),
  remark: z.string().max(2000).nullable().optional(),
});

export type ShiftReportEntryInput = z.infer<typeof shiftReportEntrySchema>;

// Editing an existing shift-report/daily-menu row never changes its date, shift, or
// order number (those are the row's identity) — only the work fields. Shared between
// the End Shift Report and Daily Menu edit dialogs, which have identical fields.
export const shiftEntryUpdateSchema = z.object({
  workCenter: z.string().max(16).nullable().optional(),
  uic: z.string().max(32).nullable().optional(),
  ops: z.string().max(32).nullable().optional(),
  activity: z.string().max(2000).nullable().optional(),
  planMhrs: optionalNumber(z.coerce.number().nonnegative()),
  consumedMhrs: optionalNumber(z.coerce.number().nonnegative()),
  manhours: optionalNumber(z.coerce.number().nonnegative()),
  progressPct: optionalNumber(z.coerce.number().int().min(0).max(100)),
  stampPct: optionalNumber(z.coerce.number().int().min(0).max(100)),
  completenessStatus: z.enum(["Open", "Inprogress", "closed", "Final confirm"]).nullable().optional(),
  remark: z.string().max(2000).nullable().optional(),
});

export type ShiftEntryUpdateInput = z.infer<typeof shiftEntryUpdateSchema>;

export const createUserSchema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(8, "Password must be at least 8 characters"),
  displayName: z.string().min(1).max(128),
  role: z.enum(["admin", "production_control", "viewer"]),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm the new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const resetPasswordSchema = z.object({
  userId: z.coerce.number().int().positive(),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const repairPlannerEntrySchema = z.object({
  engineApu: z.string().max(16).nullable().optional(),
  customer: z.string().max(128).nullable().optional(),
  engineType: z.string().max(32).nullable().optional(),
  serialNumber: z.string().max(64).nullable().optional(),
  eo: z.string().max(64).nullable().optional(),
  workscope: z.string().max(128).nullable().optional(),
  inductionDate: optionalDateString,
  rpc1: z.string().max(64).nullable().optional(),
  rpc2: z.string().max(64).nullable().optional(),
  gate4Status: z.string().max(32).nullable().optional(),
  projectStatus: z.string().max(32).nullable().optional(),
  remark: z.string().max(2000).nullable().optional(),
});

export type RepairPlannerEntryInput = z.infer<typeof repairPlannerEntrySchema>;
