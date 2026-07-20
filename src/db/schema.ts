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
  uniqueIndex,
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
  // Stamped automatically the moment the order first reaches the Kitting/RPC
  // serviceable store (see deriveStatus/TERMINAL_UIC in wc-uic-map.ts) and cleared if
  // it ever moves back out — the source for turnaround-time metrics. Never
  // backfilled for orders that were already in the store before this column existed,
  // since we have no record of when that actually happened; fabricating a date would
  // corrupt the TAT average, so those rows simply stay excluded until they leave and
  // re-enter Kitting/RPC (which stamps it for real).
  completedAt: timestamp("completed_at", { withTimezone: true }),
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
  progressPct: integer("progress_pct"),
  stamp: boolean("stamp").notNull().default(false),
  completenessStatus: varchar("completeness_status", { length: 32 }),
  remark: text("remark"),
  archived: boolean("archived").notNull().default(false),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Daily Menu — the pre-shift plan shared with production personnel before a shift
// starts. Deliberately a separate table from shift_report_entries (not a "plan" flag
// on the same rows): it's seeded from the previous shift's report but then edited
// independently, and the end-shift report must stay an untouched operational record
// of what actually happened (see CLAUDE.md: never mutate operational records).
export const dailyMenuEntries = pgTable("daily_menu_entries", {
  id: serial("id").primaryKey(),
  menuDate: date("menu_date").notNull(),
  shift: shiftEnum("shift").notNull(),
  orderNumber: varchar("order_number", { length: 32 }).notNull(),
  workCenter: varchar("work_center", { length: 16 }),
  uic: varchar("uic", { length: 32 }),
  ops: varchar("ops", { length: 32 }),
  activity: text("activity"),
  planMhrs: numeric("plan_mhrs", { precision: 8, scale: 2 }),
  progressPct: integer("progress_pct"),
  stamp: boolean("stamp").notNull().default(false),
  completenessStatus: varchar("completeness_status", { length: 32 }),
  remark: text("remark"),
  archived: boolean("archived").notNull().default(false),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Internal Repair Planner — tracks longer-running engine/APU overhaul jobs
// (distinct from the day-to-day orders board): who's assigned (RPC-1/RPC-2),
// induction date, Gate 4 and overall project status.
export const repairPlannerEntries = pgTable("repair_planner_entries", {
  id: serial("id").primaryKey(),
  engineApu: varchar("engine_apu", { length: 16 }), // "Engine" | "APU"
  customer: varchar("customer", { length: 128 }),
  engineType: varchar("engine_type", { length: 32 }), // e.g. CFM56-7B, GTCP131-9A
  serialNumber: varchar("serial_number", { length: 64 }),
  eo: varchar("eo", { length: 64 }), // engineering officer / owner
  workscope: varchar("workscope", { length: 128 }),
  inductionDate: date("induction_date"),
  rpc1: varchar("rpc1", { length: 64 }),
  rpc2: varchar("rpc2", { length: 64 }),
  gate4Status: varchar("gate4_status", { length: 32 }), // CLOSED | INPROGRESS | -
  projectStatus: varchar("project_status", { length: 32 }), // CLOSED | WIP | -
  remark: text("remark"),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// AI-generated shift-handover briefing shown on the summary Dashboard — cached per
// date/shift (not regenerated on every page load) so the free-tier Groq quota is
// shared across the whole team rather than spent per pageview. Regeneration
// overwrites the existing row for that date/shift via the unique index below.
export const aiInsights = pgTable(
  "ai_insights",
  {
    id: serial("id").primaryKey(),
    insightDate: date("insight_date").notNull(),
    shift: shiftEnum("shift").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("ai_insights_date_shift_idx").on(table.insightDate, table.shift)],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type ShiftReportEntry = typeof shiftReportEntries.$inferSelect;
export type NewShiftReportEntry = typeof shiftReportEntries.$inferInsert;
export type RepairPlannerEntry = typeof repairPlannerEntries.$inferSelect;
export type NewRepairPlannerEntry = typeof repairPlannerEntries.$inferInsert;
export type DailyMenuEntry = typeof dailyMenuEntries.$inferSelect;
export type NewDailyMenuEntry = typeof dailyMenuEntries.$inferInsert;
export type AiInsight = typeof aiInsights.$inferSelect;
export type NewAiInsight = typeof aiInsights.$inferInsert;
