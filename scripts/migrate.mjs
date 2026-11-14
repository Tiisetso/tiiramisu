// Usage: node --env-file=.env.local scripts/migrate.mjs — creates the tables on Aiven (idempotent).
// The app also does this automatically on first request; this is for a clean, explicit setup.
import { readFileSync } from "node:fs";
import pg from "pg";

const src = readFileSync("src/lib/server/db.ts", "utf8");
const schema = src.match(/export const SCHEMA = `([\s\S]*?)`;/)[1];
const url = new URL(process.env.DATABASE_URL);
url.searchParams.delete("sslmode");
const client = new pg.Client({ connectionString: url.toString(), ssl: { ca: readFileSync("certs/aiven-ca.pem", "utf8"), rejectUnauthorized: true } });
await client.connect();
await client.query(schema);
const t = await client.query("select table_name from information_schema.tables where table_schema = 'public' order by 1");
console.log("tables:", t.rows.map((r) => r.table_name).join(", "));
await client.end();
