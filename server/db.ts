import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

const { Pool } = pg; // <--- destructure Pool here

export const pool = new Pool({
  host: 'localhost',
  port: 5435,
  user: 'postgres',
  password: 'postgres',
  database: 'scrumsizer',
});

export const db = drizzle(pool, { schema });

console.log("Database connection established");