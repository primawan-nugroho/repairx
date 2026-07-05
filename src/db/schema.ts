import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  numeric,
  date,
  timestamp,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "production_control",
  "viewer",
]);

export const shiftEnum = pgEnum("shift", ["AM", "PM", "Overtime"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: varchar("display_name", { length: 128 }).notNull(),
  role: userRoleEnum("role").notNull().default("production_control"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("order_number", { length: 32 }).notNull().unique(),
  dateIn: date("date_in"),
  gate4Target: date("gate4_target"),
  description: text("description"),
  serialNumber: varchar("serial_number", { length: 64 }),
  engineType: varchar("engine_type", { length: 32 }),
  mwcRouting: varchar("mwc_routing", { length: 256 }),
  mwcToday: varchar("mwc_today", { length: 16 }),
  uicToday: varchar("uic_today", { length: 32 }),
  planFinishDate: date("plan_finish_date"),
  waitingRepair: boolean("waiting_repair").notNull().default(false),
  tier: integer("tier"),
  status: varchar("status", { length: 64 }),
  remark: text("remark"),
  location: varchar("location", { length: 128 }),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const shiftReportEntries = pgTable("shift_report_entries", {
  id: serial("id").primaryKey(),
  reportDate: date("report_date").notNull(),
  shift: shiftEnum("shift").notNull(),
  orderNumber: varchar("order_number", { length: 32 }).notNull(),
  workCenter: varchar("work_center", { length: 16 }),
  uic: varchar("uic", { length: 32 }),
  ops: varchar("ops", { length: 32 }),
  activity: text("activity"),
  planMhrs: numeric("plan_mhrs", { precision: 8, scale: 2 }),
  consumedMhrs: numeric("consumed_mhrs", { precision: 8, scale: 2 }),
  manhours: numeric("manhours", { precision: 8, scale: 2 }),
  progressPct: integer("progress_pct"),
  stampPct: integer("stamp_pct"),
  completenessStatus: varchar("completeness_status", { length: 32 }),
  remark: text("remark"),
  archived: boolean("archived").notNull().default(false),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type ShiftReportEntry = typeof shiftReportEntries.$inferSelect;
export type NewShiftReportEntry = typeof shiftReportEntries.$inferInsert;
