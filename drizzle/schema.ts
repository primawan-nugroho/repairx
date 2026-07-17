import { pgTable, unique, check, serial, varchar, date, text, boolean, integer, timestamp, foreignKey, numeric, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const shift = pgEnum("shift", ['AM', 'PM', 'Overtime'])
export const userRole = pgEnum("user_role", ['admin', 'production_control', 'viewer'])


export const orders = pgTable("orders", {
	id: serial().primaryKey().notNull(),
	orderNumber: varchar("order_number", { length: 32 }).notNull(),
	dateIn: date("date_in"),
	gate4Target: date("gate4_target"),
	description: text(),
	serialNumber: varchar("serial_number", { length: 64 }),
	engineType: varchar("engine_type", { length: 32 }),
	mwcRouting: varchar("mwc_routing", { length: 256 }),
	mwcToday: varchar("mwc_today", { length: 16 }),
	uicToday: varchar("uic_today", { length: 32 }),
	planFinishDate: date("plan_finish_date"),
	waitingRepair: boolean("waiting_repair").default(false).notNull(),
	tier: integer(),
	status: varchar({ length: 64 }),
	remark: text(),
	location: varchar({ length: 128 }),
	archived: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		ordersOrderNumberUnique: unique("orders_order_number_unique").on(table.orderNumber),
		ordersIdNotNull: check("orders_id_not_null", sql`NOT NULL id`),
		ordersOrderNumberNotNull: check("orders_order_number_not_null", sql`NOT NULL order_number`),
		ordersWaitingRepairNotNull: check("orders_waiting_repair_not_null", sql`NOT NULL waiting_repair`),
		ordersArchivedNotNull: check("orders_archived_not_null", sql`NOT NULL archived`),
		ordersCreatedAtNotNull: check("orders_created_at_not_null", sql`NOT NULL created_at`),
		ordersUpdatedAtNotNull: check("orders_updated_at_not_null", sql`NOT NULL updated_at`),
	}
});

export const dailyMenuEntries = pgTable("daily_menu_entries", {
	id: serial().primaryKey().notNull(),
	menuDate: date("menu_date").notNull(),
	shift: shift().notNull(),
	orderNumber: varchar("order_number", { length: 32 }).notNull(),
	workCenter: varchar("work_center", { length: 16 }),
	uic: varchar({ length: 32 }),
	ops: varchar({ length: 32 }),
	activity: text(),
	planMhrs: numeric("plan_mhrs", { precision: 8, scale:  2 }),
	progressPct: integer("progress_pct"),
	stamp: integer(),
	completenessStatus: varchar("completeness_status", { length: 32 }),
	remark: text(),
	archived: boolean().default(false).notNull(),
	createdBy: integer("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	consumedMhrs: numeric("consumed_mhrs").default('0'),
}, (table) => {
	return {
		dailyMenuEntriesCreatedByUsersIdFk: foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "daily_menu_entries_created_by_users_id_fk"
		}),
		dailyMenuEntriesIdNotNull: check("daily_menu_entries_id_not_null", sql`NOT NULL id`),
		dailyMenuEntriesMenuDateNotNull: check("daily_menu_entries_menu_date_not_null", sql`NOT NULL menu_date`),
		dailyMenuEntriesShiftNotNull: check("daily_menu_entries_shift_not_null", sql`NOT NULL shift`),
		dailyMenuEntriesOrderNumberNotNull: check("daily_menu_entries_order_number_not_null", sql`NOT NULL order_number`),
		dailyMenuEntriesArchivedNotNull: check("daily_menu_entries_archived_not_null", sql`NOT NULL archived`),
		dailyMenuEntriesCreatedAtNotNull: check("daily_menu_entries_created_at_not_null", sql`NOT NULL created_at`),
		dailyMenuEntriesUpdatedAtNotNull: check("daily_menu_entries_updated_at_not_null", sql`NOT NULL updated_at`),
	}
});

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	username: varchar({ length: 64 }).notNull(),
	passwordHash: text("password_hash").notNull(),
	displayName: varchar("display_name", { length: 128 }).notNull(),
	role: userRole().default('production_control').notNull(),
	active: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		usersUsernameUnique: unique("users_username_unique").on(table.username),
		usersIdNotNull: check("users_id_not_null", sql`NOT NULL id`),
		usersUsernameNotNull: check("users_username_not_null", sql`NOT NULL username`),
		usersPasswordHashNotNull: check("users_password_hash_not_null", sql`NOT NULL password_hash`),
		usersDisplayNameNotNull: check("users_display_name_not_null", sql`NOT NULL display_name`),
		usersRoleNotNull: check("users_role_not_null", sql`NOT NULL role`),
		usersActiveNotNull: check("users_active_not_null", sql`NOT NULL active`),
		usersCreatedAtNotNull: check("users_created_at_not_null", sql`NOT NULL created_at`),
	}
});

export const repairPlannerEntries = pgTable("repair_planner_entries", {
	id: serial().primaryKey().notNull(),
	engineApu: varchar("engine_apu", { length: 16 }),
	customer: varchar({ length: 128 }),
	engineType: varchar("engine_type", { length: 32 }),
	serialNumber: varchar("serial_number", { length: 64 }),
	eo: varchar({ length: 64 }),
	workscope: varchar({ length: 128 }),
	inductionDate: date("induction_date"),
	rpc1: varchar({ length: 64 }),
	rpc2: varchar({ length: 64 }),
	gate4Status: varchar("gate4_status", { length: 32 }),
	projectStatus: varchar("project_status", { length: 32 }),
	remark: text(),
	archived: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		repairPlannerEntriesIdNotNull: check("repair_planner_entries_id_not_null", sql`NOT NULL id`),
		repairPlannerEntriesArchivedNotNull: check("repair_planner_entries_archived_not_null", sql`NOT NULL archived`),
		repairPlannerEntriesCreatedAtNotNull: check("repair_planner_entries_created_at_not_null", sql`NOT NULL created_at`),
		repairPlannerEntriesUpdatedAtNotNull: check("repair_planner_entries_updated_at_not_null", sql`NOT NULL updated_at`),
	}
});

export const shiftReportEntries = pgTable("shift_report_entries", {
	id: serial().primaryKey().notNull(),
	reportDate: date("report_date").notNull(),
	shift: shift().notNull(),
	orderNumber: varchar("order_number", { length: 32 }).notNull(),
	workCenter: varchar("work_center", { length: 16 }),
	uic: varchar({ length: 32 }),
	ops: varchar({ length: 32 }),
	activity: text(),
	planMhrs: numeric("plan_mhrs", { precision: 8, scale:  2 }),
	progressPct: integer("progress_pct"),
	stamp: integer(),
	completenessStatus: varchar("completeness_status", { length: 32 }),
	remark: text(),
	archived: boolean().default(false).notNull(),
	createdBy: integer("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	consumedMhrs: numeric("consumed_mhrs"),
}, (table) => {
	return {
		shiftReportEntriesCreatedByUsersIdFk: foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "shift_report_entries_created_by_users_id_fk"
		}),
		shiftReportEntriesIdNotNull: check("shift_report_entries_id_not_null", sql`NOT NULL id`),
		shiftReportEntriesReportDateNotNull: check("shift_report_entries_report_date_not_null", sql`NOT NULL report_date`),
		shiftReportEntriesShiftNotNull: check("shift_report_entries_shift_not_null", sql`NOT NULL shift`),
		shiftReportEntriesOrderNumberNotNull: check("shift_report_entries_order_number_not_null", sql`NOT NULL order_number`),
		shiftReportEntriesArchivedNotNull: check("shift_report_entries_archived_not_null", sql`NOT NULL archived`),
		shiftReportEntriesCreatedAtNotNull: check("shift_report_entries_created_at_not_null", sql`NOT NULL created_at`),
		shiftReportEntriesUpdatedAtNotNull: check("shift_report_entries_updated_at_not_null", sql`NOT NULL updated_at`),
	}
});
