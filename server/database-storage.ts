import {
    tasks,
    users,
    sessions,
    type User,
    type InsertUser,
    type Task,
    type InsertTask,
    type InsertSession,
    type SessionType,
    type TaskVote,
    TShirtSize,
    pointsMapping
} from "@shared/schema";
import {IStorage} from "./storage";
import {db} from "./db";
import {eq, desc, and, sql} from "drizzle-orm";

export class DatabaseStorage implements IStorage {
    // User methods
    async getUser(id: number): Promise<User | undefined> {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user;
    }

    async getUserByUsername(username: string): Promise<User | undefined> {
        const [user] = await db.select().from(users).where(eq(users.username, username));
        return user;
    }

    async getUsers(): Promise<User[]> {
        const userList = await db.select().from(users);
        return userList;
    }

    async createUser(user: InsertUser): Promise<User> {
        const [newUser] = await db.insert(users).values(user).returning();
        return newUser;
    }

    // Session methods
    async createSession(session: InsertSession): Promise<SessionType> {
        const [newSession] = await db.insert(sessions).values(session).returning();
        return newSession;
    }

    async getSession(id: number): Promise<SessionType | undefined> {
        const [session] = await db.select().from(sessions).where(eq(sessions.id, id));
        return session;
    }

    async getActiveSessions(): Promise<SessionType[]> {
        return db.select().from(sessions).where(eq(sessions.isActive, true));
    }

    async closeSession(id: number): Promise<SessionType | undefined> {
        const [updatedSession] = await db
            .update(sessions)
            .set({isActive: false})
            .where(eq(sessions.id, id))
            .returning();
        return updatedSession;
    }

    // Task methods
    async createTask(task: InsertTask): Promise<Task> {
        const [newTask] = await db
            .insert(tasks)
            .values({
                ...task,
                isFinalized: false
            })
            .returning();
        return newTask;
    }

    async createBulkTasks(tasksList: InsertTask[], sessionId?: string): Promise<Task[]> {
        // Prepare tasks with additional fields
        const tasksToInsert = tasksList.map(task => ({
            ...task,
            sessionId: sessionId || null,
            isFinalized: false
        }));

        // Insert all tasks at once
        const newTasks = await db
            .insert(tasks)
            .values(tasksToInsert)
            .returning();

        return newTasks;
    }

    async getTask(id: number): Promise<Task | undefined> {
        const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
        return task;
    }

    async getAllTasks(): Promise<Task[]> {
        return db.select().from(tasks);
    }

    async getRecentTasks(limit: number = 10): Promise<Task[]> {
        return db
            .select()
            .from(tasks)
            .where(eq(tasks.isFinalized, true))
            .orderBy(desc(tasks.createdAt))
            .limit(limit);
    }

    async getSessionTasks(sessionId: string): Promise<Task[]> {
        return db
            .select()
            .from(tasks)
            .where(eq(tasks.sessionId, sessionId))
            .orderBy(tasks.id);
    }

    async updateTaskFeedback(id: number, feedback: string): Promise<Task | undefined> {
        const [updatedTask] = await db
            .update(tasks)
            .set({feedback})
            .where(eq(tasks.id, id))
            .returning();
        return updatedTask;
    }

    async updateTaskSize(id: number, size: keyof typeof TShirtSize): Promise<Task | undefined> {
        const points = pointsMapping[size];
        const [updatedTask] = await db
            .update(tasks)
            .set({size, points})
            .where(eq(tasks.id, id))
            .returning();
        return updatedTask;
    }

    async addTaskVote(vote: TaskVote): Promise<Task | undefined> {
        // First, get the current task
        const [task] = await db
            .select()
            .from(tasks)
            .where(eq(tasks.id, vote.taskId));

        if (!task) return undefined;

        // Create a new votes array or use the existing one
        const votes = task.votes ? [...task.votes] : [];

        // Remove any existing vote from this user
        const filteredVotes = votes.filter(v => v.userId !== vote.userId);

        // Add the new vote
        filteredVotes.push({
            userId: vote.userId,
            userName: vote.userName,
            size: vote.size
        });

        // Calculate average size and points
        let averageSize: keyof typeof TShirtSize = task.size as keyof typeof TShirtSize;
        let averagePoints = task.points;

        if (filteredVotes.length > 0) {
            // Count votes for each size
            const sizeCount: Record<string, number> = {
                [TShirtSize.XS]: 0,
                [TShirtSize.S]: 0,
                [TShirtSize.M]: 0,
                [TShirtSize.L]: 0,
                [TShirtSize.XL]: 0,
                [TShirtSize.XXL]: 0,
            };

            filteredVotes.forEach(v => {
                sizeCount[v.size]++;
            });

            // Find the most common size
            let maxCount = 0;
            Object.entries(sizeCount).forEach(([size, count]) => {
                if (count > maxCount) {
                    maxCount = count;
                    averageSize = size as keyof typeof TShirtSize;
                }
            });

            // Calculate average points
            averagePoints = pointsMapping[averageSize];
        }

        // Update the task with the new votes and average size/points
        const [updatedTask] = await db
            .update(tasks)
            .set({
                votes: filteredVotes,
                averageSize,
                averagePoints
            })
            .where(eq(tasks.id, vote.taskId))
            .returning();

        return updatedTask;
    }

    async finalizeTask(id: string, finalSize: keyof typeof TShirtSize): Promise<Task | undefined> {
        const points = pointsMapping[finalSize];

        const [updatedTask] = await db
            .update(tasks)
            .set({
                size: finalSize,
                points,
                isFinalized: true
            })
            .where(eq(tasks.id, id))
            .returning();

        return updatedTask;
    }

    async getTaskStats(): Promise<{
        totalTasks: number;
        averagePoints: number;
        sizeDistribution: Record<string, number>;
        predictionAccuracy: number;
    }> {
        // Get finalized tasks
        const finalizedTasks = await db
            .select()
            .from(tasks)
            .where(eq(tasks.isFinalized, true));

        const totalTasks = finalizedTasks.length;

        // Calculate average points
        const totalPoints = finalizedTasks.reduce((sum, task) => sum + task.points, 0);
        const averagePoints = totalTasks > 0 ? Math.round((totalPoints / totalTasks) * 10) / 10 : 0;

        // Calculate size distribution
        const sizeDistribution: Record<string, number> = {
            XS: 0,
            S: 0,
            M: 0,
            L: 0,
            XL: 0,
            XXL: 0,
        };

        finalizedTasks.forEach(task => {
            sizeDistribution[task.size as keyof typeof sizeDistribution] += 1;
        });

        // Convert to percentages
        Object.keys(sizeDistribution).forEach(key => {
            sizeDistribution[key] = totalTasks > 0
                ? Math.round((sizeDistribution[key] / totalTasks) * 100)
                : 0;
        });

        // Calculate prediction accuracy based on feedback
        let correctPredictions = 0;
        let tasksWithFeedback = 0;

        finalizedTasks.forEach(task => {
            if (task.feedback) {
                tasksWithFeedback++;
                if (task.size === task.averageSize) {
                    correctPredictions++;
                }
            }
        });

        const predictionAccuracy = tasksWithFeedback > 0
            ? Math.round((correctPredictions / tasksWithFeedback) * 100)
            : 82; // Default placeholder value

        return {
            totalTasks,
            averagePoints,
            sizeDistribution,
            predictionAccuracy
        };
    }
}