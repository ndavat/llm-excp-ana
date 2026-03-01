import { mysqlTable, serial, varchar, text, timestamp, int, json, mysqlEnum } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
});

export const exceptions = mysqlTable("exceptions", {
  id: serial("id").primaryKey(),
  exceptionType: varchar("exception_type", { length: 255 }).notNull(),
  message: text("message").notNull(),
  stackTrace: text("stack_trace").notNull(),
  simulatedCode: text("simulated_code").notNull(),
  triggeredBy: int("triggered_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").onUpdateNow(),
});

export const analysisResults = mysqlTable("analysis_results", {
  id: serial("id").primaryKey(),
  exceptionId: int("exception_id").notNull(),
  rootCause: text("root_cause").notNull(),
  solutions: text("solutions").notNull(), // JSON string
  recommendations: text("recommendations").notNull(),
  analyzedAt: timestamp("analyzed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const emailLogs = mysqlTable("email_logs", {
  id: serial("id").primaryKey(),
  exceptionId: int("exception_id").notNull(),
  analysisId: int("analysis_id").notNull(),
  recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["pending", "sent", "failed"]).notNull(),
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const exceptionsRelations = relations(exceptions, ({ one, many }) => ({
  user: one(users, {
    fields: [exceptions.triggeredBy],
    references: [users.id],
  }),
  analysisResults: many(analysisResults),
}));

export const analysisResultsRelations = relations(analysisResults, ({ one }) => ({
  exception: one(exceptions, {
    fields: [analysisResults.exceptionId],
    references: [exceptions.id],
  }),
}));
