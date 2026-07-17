import { relations } from "drizzle-orm/relations";
import { users, dailyMenuEntries, shiftReportEntries } from "./schema";

export const dailyMenuEntriesRelations = relations(dailyMenuEntries, ({one}) => ({
	user: one(users, {
		fields: [dailyMenuEntries.createdBy],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	dailyMenuEntries: many(dailyMenuEntries),
	shiftReportEntries: many(shiftReportEntries),
}));

export const shiftReportEntriesRelations = relations(shiftReportEntries, ({one}) => ({
	user: one(users, {
		fields: [shiftReportEntries.createdBy],
		references: [users.id]
	}),
}));