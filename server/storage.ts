import {
    users,
    tasks,
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

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
    // User methods
    getUser(id: number): Promise<User | undefined>;

    getUserByUsername(username: string): Promise<User | undefined>;

    getUsers(): Promise<User[]>;

    createUser(user: InsertUser): Promise<User>;

    // Session methods
    createSession(session: InsertSession): Promise<SessionType>;

    getSession(id: number): Promise<SessionType | undefined>;

    getActiveSessions(): Promise<SessionType[]>;

    closeSession(id: number): Promise<SessionType | undefined>;

    // Task methods
    createTask(task: InsertTask): Promise<Task>;

    createBulkTasks(tasks: InsertTask[], sessionId?: string): Promise<Task[]>;

    getTask(id: number): Promise<Task | undefined>;

    getAllTasks(): Promise<Task[]>;

    getRecentTasks(limit?: number): Promise<Task[]>;

    getSessionTasks(sessionId: string): Promise<Task[]>;

    updateTaskFeedback(id: number, feedback: string): Promise<Task | undefined>;

    updateTaskSize(id: number, size: keyof typeof TShirtSize): Promise<Task | undefined>;

    addTaskVote(vote: TaskVote): Promise<Task | undefined>;

    finalizeTask(id: number, finalSize: keyof typeof TShirtSize): Promise<Task | undefined>;

    getTaskStats(): Promise<{
        totalTasks: number;
        averagePoints: number;
        sizeDistribution: Record<string, number>;
        predictionAccuracy: number;
    }>;
}

export class MemStorage implements IStorage {
    private users: Map<number, User>;
    private tasks: Map<number, Task>;
    private sessions: Map<number, SessionType>;
    private userCurrentId: number;
    private taskCurrentId: number;
    private sessionCurrentId: number;

    constructor() {
        this.users = new Map();
        this.tasks = new Map();
        this.sessions = new Map();
        this.userCurrentId = 1;
        this.taskCurrentId = 1;
        this.sessionCurrentId = 1;

        // Add some initial tasks for demo purposes
        this.seedInitialTasks();
        this.seedInitialUsers();
    }

    // User methods
    async getUser(id: number): Promise<User | undefined> {
        return this.users.get(id);
    }

    async getUserByUsername(username: string): Promise<User | undefined> {
        return Array.from(this.users.values()).find(
            (user) => user.username === username,
        );
    }

    async getUsers(): Promise<User[]> {
        return Array.from(this.users.values())
    }

    async createUser(insertUser: InsertUser): Promise<User> {
        const id = this.userCurrentId++;
        const user: User = {
            ...insertUser,
            id,
            displayName: insertUser.displayName || null
        };
        this.users.set(id, user);
        return user;
    }

    // Session methods
    async createSession(session: InsertSession): Promise<SessionType> {
        const id = this.sessionCurrentId++;
        const createdAt = new Date();
        const newSession: SessionType = {
            ...session,
            id,
            createdAt,
            isActive: true
        };
        this.sessions.set(id, newSession);
        return newSession;
    }

    async getSession(id: number): Promise<SessionType | undefined> {
        return this.sessions.get(id);
    }

    async getActiveSessions(): Promise<SessionType[]> {
        return Array.from(this.sessions.values())
            .filter(session => session.isActive)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    async closeSession(id: number): Promise<SessionType | undefined> {
        const session = this.sessions.get(id);
        if (!session) return undefined;

        const updatedSession = {...session, isActive: false};
        this.sessions.set(id, updatedSession);
        return updatedSession;
    }

    // Task methods
    async createTask(insertTask: InsertTask): Promise<Task> {
        const id = this.taskCurrentId++;
        const createdAt = new Date();

        // Ensure the task has default values for new fields
        const task: Task = {
            ...insertTask,
            id,
            createdAt,
            isFinalized: false,
            votes: [],
            sessionId: null,
            averageSize: insertTask.size,
            averagePoints: insertTask.points,
            similarTasks: insertTask.similarTasks || null
        };

        this.tasks.set(id, task);
        return task;
    }

    async createBulkTasks(insertTasks: InsertTask[], sessionId?: string): Promise<Task[]> {
        const tasks: Task[] = [];

        for (const insertTask of insertTasks) {
            const id = this.taskCurrentId++;
            const createdAt = new Date();

            const task: Task = {
                ...insertTask,
                id,
                createdAt,
                isFinalized: false,
                votes: [],
                sessionId: sessionId || null,
                averageSize: insertTask.size,
                averagePoints: insertTask.points,
                similarTasks: insertTask.similarTasks || null
            };

            this.tasks.set(id, task);
            tasks.push(task);
        }

        return tasks;
    }

    async getTask(id: number): Promise<Task | undefined> {
        return this.tasks.get(id);
    }

    async getAllTasks(): Promise<Task[]> {
        return Array.from(this.tasks.values());
    }

    async getRecentTasks(limit: number = 10): Promise<Task[]> {
        return Array.from(this.tasks.values())
            .filter(task => task.isFinalized)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, limit);
    }

    async getSessionTasks(sessionId: string): Promise<Task[]> {
        return Array.from(this.tasks.values())
            .filter(task => task.sessionId === sessionId)
            .sort((a, b) => a.id - b.id);
    }

    async updateTaskFeedback(id: number, feedback: string): Promise<Task | undefined> {
        const task = this.tasks.get(id);
        if (!task) return undefined;

        const updatedTask = {...task, feedback};
        this.tasks.set(id, updatedTask);
        return updatedTask;
    }

    async updateTaskSize(id: number, size: keyof typeof TShirtSize): Promise<Task | undefined> {
        const task = this.tasks.get(id);
        if (!task) return undefined;

        const updatedTask = {
            ...task,
            size,
            points: pointsMapping[size]
        };

        this.tasks.set(id, updatedTask);
        return updatedTask;
    }

    async addTaskVote(vote: TaskVote): Promise<Task | undefined> {
        const task = this.tasks.get(vote.taskId);
        if (!task) return undefined;

        // Remove any existing vote from this user
        const votes = task.votes?.filter(v => v.userId !== vote.userId) || [];

        // Add the new vote
        votes.push({
            userId: vote.userId,
            userName: vote.userName,
            size: vote.size
        });

        // Calculate average size and points
        let averageSize: keyof typeof TShirtSize = task.size as keyof typeof TShirtSize;
        let averagePoints = task.points;

        if (votes.length > 0) {
            // Count votes for each size
            const sizeCount: Record<string, number> = {
                [TShirtSize.XS]: 0,
                [TShirtSize.S]: 0,
                [TShirtSize.M]: 0,
                [TShirtSize.L]: 0,
                [TShirtSize.XL]: 0,
                [TShirtSize.XXL]: 0,
            };

            votes.forEach(v => {
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

        const updatedTask = {
            ...task,
            votes,
            averageSize,
            averagePoints
        };

        this.tasks.set(vote.taskId, updatedTask);
        return updatedTask;
    }

    async finalizeTask(id: number, finalSize: keyof typeof TShirtSize): Promise<Task | undefined> {
        const task = this.tasks.get(id);
        if (!task) return undefined;

        const updatedTask = {
            ...task,
            isFinalized: true,
            size: finalSize,
            points: pointsMapping[finalSize]
        };

        this.tasks.set(id, updatedTask);
        return updatedTask;
    }

    async getTaskStats(): Promise<{
        totalTasks: number;
        averagePoints: number;
        sizeDistribution: Record<string, number>;
        predictionAccuracy: number;
    }> {
        const allTasks = Array.from(this.tasks.values()).filter(task => task.isFinalized);
        const totalTasks = allTasks.length;

        // Calculate average points
        const totalPoints = allTasks.reduce((sum, task) => sum + task.points, 0);
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

        allTasks.forEach(task => {
            sizeDistribution[task.size as keyof typeof sizeDistribution] += 1;
        });

        // Convert to percentages
        Object.keys(sizeDistribution).forEach(key => {
            sizeDistribution[key] = totalTasks > 0
                ? Math.round((sizeDistribution[key] / totalTasks) * 100)
                : 0;
        });

        // Calculate prediction accuracy (placeholder for now - will improve with feedback data)
        const predictionAccuracy = 82; // Default value for now

        return {
            totalTasks,
            averagePoints,
            sizeDistribution,
            predictionAccuracy,
        };
    }

    // Seed initial users
    private seedInitialUsers(): void {
        const initialUsers: Omit<User, 'id'>[] = [
            {
                username: "robinc",
                password: "robinc", // In a real app, this would be hashed
                displayName: "Robin Chalia"
            },
            {
                username: "deepakr",
                password: "deepakr",
                displayName: "Deepak ji"
            },
            {
                username: "ankitt",
                password: "ankitt",
                displayName: "Ankit Tiwari"
            },
            {
                username: "akshatt",
                password: "akshatt",
                displayName: "Akshat Trigunait"
            },
            {
                username: "dineshk",
                password: "dineshk",
                displayName: "Dinesh Kashera"
            },
            {
                username: "prateekj",
                password: "prateekj",
                displayName: "Prateek Jain"
            },
            {
                username: "ankits",
                password: "ankits",
                displayName: "Ankit Soni"
            },
            {
                username: "amitt",
                password: "amitt",
                displayName: "Amit Tiwary"
            },
            {
                username: "mathieu",
                password: "mathieu",
                displayName: "Mathieu Lamiot"
            },
            {
                username: "sebs",
                password: "sebs",
                displayName: "Sebastian Singh"
            }
        ];

        initialUsers.forEach(user => {
            const id = this.userCurrentId++;
            this.users.set(id, {...user, id});
        });
    }

    // Seed initial tasks for demo purposes
    private seedInitialTasks(): void {
        const initialTasks: Omit<Task, 'id'>[] = [
            {
                title: "Implement OAuth integration",
                description: "Add support for Google, GitHub and Microsoft accounts",
                size: TShirtSize.L,
                points: pointsMapping.L,
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
                confidence: 85,
                similarTasks: [
                    {id: 101, title: "Add SSO for enterprise clients", size: TShirtSize.L, points: pointsMapping.L},
                    {id: 102, title: "Implement secure JWT auth", size: TShirtSize.M, points: pointsMapping.M}
                ],
                feedback: null,
                isFinalized: true,
                votes: [
                    {userId: "1", userName: "John Smith", size: TShirtSize.L},
                    {userId: "2", userName: "Ana Garcia", size: TShirtSize.L},
                    {userId: "3", userName: "Mike Wilson", size: TShirtSize.XL}
                ],
                averageSize: TShirtSize.L,
                averagePoints: pointsMapping.L
            },
            {
                title: "Create responsive dashboard",
                description: "Build UI components for the analytics dashboard with responsive design",
                size: TShirtSize.L,
                points: pointsMapping.L,
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
                confidence: 80,
                similarTasks: [
                    {
                        id: 103,
                        title: "Implement data visualization charts",
                        size: TShirtSize.M,
                        points: pointsMapping.M
                    },
                    {id: 104, title: "Create responsive admin panel", size: TShirtSize.L, points: pointsMapping.L}
                ],
                feedback: null,
                isFinalized: true,
                votes: [
                    {userId: "1", userName: "John Smith", size: TShirtSize.L},
                    {userId: "2", userName: "Ana Garcia", size: TShirtSize.XL},
                    {userId: "3", userName: "Mike Wilson", size: TShirtSize.L}
                ],
                averageSize: TShirtSize.L,
                averagePoints: pointsMapping.L
            },
            {
                title: "Fix pagination bug",
                description: "Resolve issue with pagination in the user list view",
                size: TShirtSize.S,
                points: pointsMapping.S,
                createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
                confidence: 92,
                similarTasks: [
                    {id: 105, title: "Fix sorting in table component", size: TShirtSize.S, points: pointsMapping.S},
                    {id: 106, title: "Implement search functionality", size: TShirtSize.M, points: pointsMapping.M}
                ],
                feedback: null,
                isFinalized: true,
                votes: [
                    {userId: "1", userName: "John Smith", size: TShirtSize.S},
                    {userId: "2", userName: "Ana Garcia", size: TShirtSize.S},
                    {userId: "3", userName: "Mike Wilson", size: TShirtSize.M}
                ],
                averageSize: TShirtSize.S,
                averagePoints: pointsMapping.S
            },
            {
                title: "Set up CI/CD pipeline",
                description: "Configure GitHub Actions for automated testing and deployment",
                size: TShirtSize.M,
                points: pointsMapping.M,
                createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
                confidence: 75,
                similarTasks: [
                    {id: 107, title: "Set up testing framework", size: TShirtSize.M, points: pointsMapping.M},
                    {id: 108, title: "Create Docker deployment", size: TShirtSize.L, points: pointsMapping.L}
                ],
                feedback: null,
                isFinalized: true,
                votes: [
                    {userId: "1", userName: "John Smith", size: TShirtSize.M},
                    {userId: "2", userName: "Ana Garcia", size: TShirtSize.S},
                    {userId: "3", userName: "Mike Wilson", size: TShirtSize.M}
                ],
                averageSize: TShirtSize.M,
                averagePoints: pointsMapping.M
            }
        ];

        initialTasks.forEach(task => {
            const id = this.taskCurrentId++;
            this.tasks.set(id, {...task, id});
        });
    }
}

// Switch to the database storage implementation
import {DatabaseStorage} from "./database-storage";

export const storage = new DatabaseStorage();