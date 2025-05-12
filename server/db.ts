import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

const { Pool } = pg;

// Check for required environment variables
let connectionConfig;

// Use PostgreSQL for now, but keep CockroachDB code commented for future use
// For demonstration purposes, we'll use PostgreSQL for now
// console.log("Using PostgreSQL connection with DATABASE_URL");
// connectionConfig = {
//   connectionString: process.env.DATABASE_URL
// };


// Code ready for CockroachDB when needed:
// First priority: use CockroachDB if available
// Todo: move this to secrets file later
process.env.COCKROACHDB_URL = "postgresql://root@localhost:26257/defaultdb?sslcert=%2FUsers%2Frobinc%2F.cockroach-certs%2Fclient.root.crt&sslkey=%2FUsers%2Frobinc%2F.cockroach-certs%2Fclient.root.key&sslmode=verify-full&sslrootcert=%2FUsers%2Frobinc%2F.cockroach-certs%2Fca.crt";
if (process.env.COCKROACHDB_URL) {
  console.log("Using CockroachDB connection");
  connectionConfig = {
    connectionString: process.env.COCKROACHDB_URL,
    ssl: { rejectUnauthorized: false }
  };
} 
// Second priority: use PostgreSQL Database URL if available
else if (process.env.DATABASE_URL) {
  console.log("Using PostgreSQL connection with DATABASE_URL");
  connectionConfig = {
    connectionString: process.env.DATABASE_URL
  };
} 
// Third priority: use individual PostgreSQL environment variables
else if (process.env.PGHOST) {
  console.log("Using PostgreSQL connection with individual variables");
  connectionConfig = {
    host: process.env.PGHOST,
    port: parseInt(process.env.PGPORT || '5432'),
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD
  };
} else {
  throw new Error("No database connection details available. Set COCKROACHDB_URL, DATABASE_URL, or PostgreSQL environment variables.");
}


export const pool = new Pool(connectionConfig);
export const db = drizzle(pool, { schema });

console.log("Database connection established");