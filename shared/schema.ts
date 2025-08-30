import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const conflictEvents = pgTable("conflict_events", {
  id: varchar("id").primaryKey(),
  eventDate: timestamp("event_date").notNull(),
  country: text("country").notNull(),
  region: text("region"),
  location: text("location").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  eventType: text("event_type").notNull(),
  subEventType: text("sub_event_type"),
  actor1: text("actor1"),
  actor2: text("actor2"),
  fatalities: integer("fatalities").default(0),
  notes: text("notes"),
  source: text("source"),
  sourceScale: text("source_scale"),
  severity: text("severity").notNull(), // 'low', 'medium', 'high', 'critical'
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertConflictEventSchema = createInsertSchema(conflictEvents).omit({
  id: true,
  lastUpdated: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type ConflictEvent = typeof conflictEvents.$inferSelect;
export type InsertConflictEvent = z.infer<typeof insertConflictEventSchema>;

// Additional types for filtering and API responses
export const conflictFiltersSchema = z.object({
  severity: z.array(z.enum(['low', 'medium', 'high', 'critical'])).optional(),
  eventTypes: z.array(z.string()).optional(),
  countries: z.array(z.string()).optional(),
  region: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.number().default(1000),
});

export type ConflictFilters = z.infer<typeof conflictFiltersSchema>;

export const conflictStatsSchema = z.object({
  totalEvents: z.number(),
  totalFatalities: z.number(),
  affectedCountries: z.number(),
  recentEvents: z.number(),
  severityCounts: z.object({
    low: z.number(),
    medium: z.number(),
    high: z.number(),
    critical: z.number(),
  }),
  eventTypeCounts: z.record(z.string(), z.number()),
});

export type ConflictStats = z.infer<typeof conflictStatsSchema>;
