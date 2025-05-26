import { db, pool } from "./db";
import { users, tasks, sessions, TShirtSize, pointsMapping } from "@shared/schema";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { sql } from "drizzle-orm";

// Initialize the database
async function main() {
  console.log("Initializing database...");
  try {
    // Test the database connection first
    console.log("Testing database connection...");
    const client = await pool.connect();
    console.log("Successfully connected to database");
    // Get database information
    const dbInfoResult = await client.query('SELECT current_database(), version()');
    console.log(`Database: ${dbInfoResult.rows[0].current_database}, Version: ${dbInfoResult.rows[0].version}`);
    client.release();
    // Push schema to database (create tables if they don't exist)
    console.log("Migrating schema...");
    try {
      await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    } catch (err) {
      const error = err as Error;
      console.warn("Note: Could not create uuid-ossp extension. This might be expected for CockroachDB:", error.message);
      // Continue anyway, as this might not be critical
    }
    // Create seed users if they don't exist
    const existingUsers = await db.select().from(users);
    if (existingUsers.length === 0) {
      console.log("Seeding users...");
      await db.insert(users).values([
        {
          username: "jsmith",
          password: "password123", // In a real app, this would be hashed
          displayName: "John Smith"
        },
        {
          username: "agarcia",
          password: "password123",
          displayName: "Ana Garcia"
        },
        {
          username: "mwilson",
          password: "password123",
          displayName: "Mike Wilson"
        }
      ]);
    }
    // Create seed tasks if they don't exist
    const existingTasks = await db.select().from(tasks);
    if (existingTasks.length === 0) {
      console.log("Seeding tasks...");
      await db.insert(tasks).values([
        {
          title: "Implement OAuth integration",
          description: "Add support for Google, GitHub and Microsoft accounts",
          size: TShirtSize.L,
          points: pointsMapping.L,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          confidence: 85,
          similarTasks: [
            { id: 101, title: "Add SSO for enterprise clients", size: TShirtSize.L, points: pointsMapping.L },
            { id: 102, title: "Implement secure JWT auth", size: TShirtSize.M, points: pointsMapping.M }
          ],
          feedback: null,
          sessionId: null,
          isFinalized: true,
          votes: [
            { userId: "1", userName: "John Smith", size: TShirtSize.L },
            { userId: "2", userName: "Ana Garcia", size: TShirtSize.L },
            { userId: "3", userName: "Mike Wilson", size: TShirtSize.XL }
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
            { id: 103, title: "Implement data visualization charts", size: TShirtSize.M, points: pointsMapping.M },
            { id: 104, title: "Create responsive admin panel", size: TShirtSize.L, points: pointsMapping.L }
          ],
          feedback: null,
          sessionId: null,
          isFinalized: true,
          votes: [
            { userId: "1", userName: "John Smith", size: TShirtSize.L },
            { userId: "2", userName: "Ana Garcia", size: TShirtSize.XL },
            { userId: "3", userName: "Mike Wilson", size: TShirtSize.L }
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
            { id: 105, title: "Fix sorting in table component", size: TShirtSize.S, points: pointsMapping.S },
            { id: 106, title: "Implement search functionality", size: TShirtSize.M, points: pointsMapping.M }
          ],
          feedback: null,
          sessionId: null,
          isFinalized: true,
          votes: [
            { userId: "1", userName: "John Smith", size: TShirtSize.S },
            { userId: "2", userName: "Ana Garcia", size: TShirtSize.S },
            { userId: "3", userName: "Mike Wilson", size: TShirtSize.M }
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
            { id: 107, title: "Set up testing framework", size: TShirtSize.M, points: pointsMapping.M },
            { id: 108, title: "Create Docker deployment", size: TShirtSize.L, points: pointsMapping.L }
          ],
          feedback: null,
          sessionId: null,
          isFinalized: true,
          votes: [
            { userId: "1", userName: "John Smith", size: TShirtSize.M },
            { userId: "2", userName: "Ana Garcia", size: TShirtSize.S },
            { userId: "3", userName: "Mike Wilson", size: TShirtSize.M }
          ],
          averageSize: TShirtSize.M,
          averagePoints: pointsMapping.M
        }
      ]);
    }
    console.log("Database initialization complete");
  } catch (err) {
    const error = err as Error;
    console.error("Error initializing database:", error.message, error.stack);
  }
}

// Run the initialization
main();