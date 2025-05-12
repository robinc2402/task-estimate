import {defineConfig} from "drizzle-kit";

if (!process.env.DATABASE_URL) {
    // throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
    out: "./migrations",
    schema: "./shared/schema.ts",
    dialect: "postgresql",
    dbCredentials: {
        url: `postgresql://${process.env.DB_USER}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?sslcert=${process.env.DB_CERT}&sslkey=${process.env.DB_KEY}&sslmode=verify-full&sslrootcert=${process.env.DB_CA}`,
    },
});
