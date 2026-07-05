import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required").max(64),
  password: z.string().min(1, "Password is required"),
});

export const orderSchema = z.object({
  orderNumber: z.string().min(1, "Order number is required").max(32),
  dateIn: z.string().nullable().optional(),
  gate4Target: z.string().nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  serialNumber: z.string().max(64).nullable().optional(),
  engineType: z.string().max(32).nullable().optional(),
  mwcRouting: z.string().max(256).nullable().optional(),
  mwcToday: z.string().max(16).nullable().optional(),
  uicToday: z.string().max(32).nullable().optional(),
  planFinishDate: z.string().nullable().optional(),
  waitingRepair: z.boolean().optional().default(false),
  tier: z.coerce.number().int().min(1).max(3).nullable().optional(),
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
  planMhrs: z.coerce.number().nonnegative().nullable().optional(),
  consumedMhrs: z.coerce.number().nonnegative().nullable().optional(),
  manhours: z.coerce.number().nonnegative().nullable().optional(),
  progressPct: z.coerce.number().int().min(0).max(100).nullable().optional(),
  stampPct: z.coerce.number().int().min(0).max(100).nullable().optional(),
  completenessStatus: z.enum(["Open", "Inprogress", "closed", "Final confirm"]).nullable().optional(),
  remark: z.string().max(2000).nullable().optional(),
});

export type ShiftReportEntryInput = z.infer<typeof shiftReportEntrySchema>;

export const createUserSchema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(8, "Password must be at least 8 characters"),
  displayName: z.string().min(1).max(128),
  role: z.enum(["admin", "production_control", "viewer"]),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
