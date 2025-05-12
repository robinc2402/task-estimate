import {pgTable, text, uuid, integer, timestamp, jsonb, boolean} from "drizzle-orm/pg-core";
import {createInsertSchema} from "drizzle-zod";
import {z} from "zod";

// Size enum for T-shirt sizes
export const TShirtSize = {
    XS: "XS",
    S: "S",
    M: "M",
    L: "L",
    XL: "XL",
    XXL: "XXL",
} as const;

export type TShirtSizeType = keyof typeof TShirtSize;

// Points mapping for each T-shirt size
export const pointsMapping = {
    XS: 1,
    S: 2,
    M: 3,
    L: 5,
    XL: 8,
    XXL: 13,
};

// Task schema
export const tasks = pgTable("tasks", {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    size: text("size").notNull(),
    points: integer("points").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    confidence: integer("confidence").notNull(),
    similarTasks: jsonb("similar_tasks").$type<{ id: number; title: string; size: string; points: number }[]>(),
    feedback: text("feedback"),
    sessionId: text("session_id"), // Group tasks in estimation sessions
    isFinalized: boolean("is_finalized").default(false), // Whether the task has been finalized
    votes: jsonb("votes").$type<{ userId: string; userName: string; size: TShirtSizeType }[]>(),
    averageSize: text("average_size"), // Average of all votes
    averagePoints: integer("average_points"), // Average points
});

// Task insert schema
export const insertTaskSchema = createInsertSchema(tasks)
    .omit({id: true, createdAt: true})
    .extend({
        size: z.enum([TShirtSize.XS, TShirtSize.S, TShirtSize.M, TShirtSize.L, TShirtSize.XL, TShirtSize.XXL]),
    });

// Task prediction schema
export const taskPredictionSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
});

// Task feedback schema
export const taskFeedbackSchema = z.object({
    id: z.number(),
    actualSize: z.enum([TShirtSize.XS, TShirtSize.S, TShirtSize.M, TShirtSize.L, TShirtSize.XL, TShirtSize.XXL]),
});

// Task import schema for CSV uploads
export const taskImportSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
});

// Task voting schema
export const taskVoteSchema = z.object({
    taskId: z.string().uuid(),
    userId: z.string().uuid(),
    userName: z.string(),
    size: z.enum([TShirtSize.XS, TShirtSize.S, TShirtSize.M, TShirtSize.L, TShirtSize.XL, TShirtSize.XXL]),
});

// Task finalize schema
export const taskFinalizeSchema = z.object({
    taskId: z.number(),
    finalSize: z.enum([TShirtSize.XS, TShirtSize.S, TShirtSize.M, TShirtSize.L, TShirtSize.XL, TShirtSize.XXL]),
});

// Session schema for grouping tasks
export const sessionSchema = z.object({
    name: z.string().min(1, "Session name is required"),
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
export type TaskPrediction = z.infer<typeof taskPredictionSchema>;
export type TaskFeedback = z.infer<typeof taskFeedbackSchema>;
export type TaskImport = z.infer<typeof taskImportSchema>;
export type TaskVote = z.infer<typeof taskVoteSchema>;
export type TaskFinalize = z.infer<typeof taskFinalizeSchema>;
export type Session = z.infer<typeof sessionSchema>;

// User schema
export const users = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey(),
    username: text("username").notNull().unique(),
    password: text("password").notNull(),
    displayName: text("display_name"),
});

export const insertUserSchema = createInsertSchema(users).pick({
    username: true,
    password: true,
    displayName: true,
});

// Session type for estimations
export const sessions = pgTable("sessions", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    isActive: boolean("is_active").default(true),
});

export const insertSessionSchema = createInsertSchema(sessions)
    .omit({id: true, createdAt: true});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type SessionType = typeof sessions.$inferSelect;
