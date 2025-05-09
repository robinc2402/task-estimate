import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
import fs from "fs";

// Load .env if needed
dotenv.config();

export default defineConfig({
  schema: "./shared/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    host: "localhost",
    port: 26257,
    user: "root",
    database: "defaultdb",
    ssl: {
      rejectUnauthorized: true,
      ca: fs.readFileSync("/Users/robinc/.cockroach-certs/ca.crt").toString(),
      cert: fs.readFileSync("/Users/robinc/.cockroach-certs/client.root.crt").toString(),
      key: fs.readFileSync("/Users/robinc/.cockroach-certs/client.root.key").toString(),
    },
  },
});