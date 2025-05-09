import fs from 'fs';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

const { Pool } = pg; // <--- destructure Pool here

export const pool = new Pool({
  host: 'localhost',
  port: 26257,
  user: 'root',
  database: 'defaultdb',
  ssl: {
    rejectUnauthorized: true,
    cert: fs.readFileSync('/Users/robinc/.cockroach-certs/client.root.crt').toString(),
    key: fs.readFileSync('/Users/robinc/.cockroach-certs/client.root.key').toString(),
    ca: fs.readFileSync('/Users/robinc/.cockroach-certs/ca.crt').toString(),
  },
});

// export const pool = new Pool({
//   host: 'localhost',
//   port: 26257,
//   user: 'root',
//   password: 'postgres',
//   database: 'defaultdb',
// });

// postgresql://root@localhost:26257/defaultdb?sslcert=%2FUsers%2Frobinc%2F.cockroach-certs%2Fclient.root.crt&sslkey=%2FUsers%2Frobinc%2F.cockroach-certs%2Fclient.root.key&sslmode=verify-full&sslrootcert=%2FUsers%2Frobinc%2F.cockroach-certs%2Fca.crt

export const db = drizzle(pool, { schema });

console.log("Database connection established");