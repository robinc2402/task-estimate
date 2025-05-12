import {defineConfig} from "drizzle-kit";

if (!process.env.DATABASE_URL) {
    // throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
    out: "./migrations",
    schema: "./shared/schema.ts",
    dialect: "postgresql",
    dbCredentials: {
        url: "postgresql://wordpress@localhost:26257/defaultdb?sslcert=/Users/ankitt/Documents/work/cockroach-db-certificates/certs/client.wordpress.crt&sslkey=/Users/ankitt/Documents/work/cockroach-db-certificates/certs/client.wordpress.key&sslmode=verify-full&sslrootcert=/Users/ankitt/Documents/work/cockroach-db-certificates/certs/ca.crt",
    },
});
