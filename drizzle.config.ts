import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load .env if needed
dotenv.config();


export default defineConfig({
  schema: "./shared/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    host: 'localhost',
    port: 5435,
    user: 'postgres',
    password: 'postgres',
    database: 'scrumsizer',
    ssl: false,
  },
});