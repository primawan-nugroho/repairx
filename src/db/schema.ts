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
  // serviceable store (see deriveStatus in wc-uic-map.ts and terminalUic in
  // lib/masters.ts) and cleared if
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

// Master data — engine types, UIC teams, and work centers. Previously hardcoded in
// src/lib/engine-types.ts and src/lib/wc-uic-map.ts; now admin-editable from
// /masters (see src/lib/masters.ts, which reads and shapes these for the rest of the
// app). Rows are deactivated, never deleted, so historical orders/entries that
// reference a retired value keep displaying correctly.
export const engineTypes = pgTable("engine_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 32 }).notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const uicTeams = pgTable("uic_teams", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 32 }).notNull().unique(),
  // One of the 10 categorical "uic-a".."uic-j" CSS color slugs — assigned once at
  // creation (next free slug) so a team's badge color stays stable, not recomputed.
  colorSlug: varchar("color_slug", { length: 16 }).notNull(),
  // Reaching this UIC means the repair is finished and the part is in the
  // serviceable store, not queued for work (see deriveStatus in wc-uic-map.ts).
  // Exactly one team should have this set at a time — enforced in the admin UI, not
  // the DB, since a brief zero-or-two-terminal window during an edit is harmless.
  isTerminal: boolean("is_terminal").notNull().default(false),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const workCenters = pgTable("work_centers", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 16 }).notNull().unique(),
  uicTeamId: integer("uic_team_id").references(() => uicTeams.id),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type EngineTypeRow = typeof engineTypes.$inferSelect;
export type UicTeamRow = typeof uicTeams.$inferSelect;
export type WorkCenterRow = typeof workCenters.$inferSelect;

// Repair Planner master lists — RPC-1/RPC-2 (repair production control assignee) and
// EO (engine owner) are plain free-text columns on repair_planner_entries (no FK),
// so unlike engine types/UIC teams these are hard-deleted rather than deactivated:
// deleting a name here can never orphan a reference, it just stops offering that name
// for new assignments while old entries keep their stored text untouched.
export const rpcPeople = pgTable("rpc_people", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 64 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const engineOwners = pgTable("engine_owners", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 64 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type RpcPersonRow = typeof rpcPeople.$inferSelect;
export type EngineOwnerRow = typeof engineOwners.$inferSelect;
