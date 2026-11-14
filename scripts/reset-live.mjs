// Usage: node --env-file=.env.local scripts/reset-live.mjs [--all]
// Clears live demo data on Aiven before going on stage. Default: today's rows; --all: everything.
import { readFileSync } from "node:fs";
import pg from "pg";

const all = process.argv.includes("--all");
const url = new URL(process.env.DATABASE_URL);
url.searchParams.delete("sslmode");
const client = new pg.Client({ connectionString: url.toString(), ssl: { ca: readFileSync("certs/aiven-ca.pem", "utf8"), rejectUnauthorized: true } });
await client.connect();
const where = all ? "" : "where created_at > now() - interval '24 hours'";
for (const t of ["checkins", "outcomes", "messages", "clinic_actions"]) {
  const r = await client.query(`delete from ${t} ${where}`);
  console.log(`${t}: deleted ${r.rowCount}`);
}
await client.query("delete from presence");
await client.end();
