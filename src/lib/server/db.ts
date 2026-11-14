import "server-only";

import { Pool } from "pg";
import { AIVEN_CA } from "@/lib/server/aiven-ca";

/**
 * Aiven for PostgreSQL (Frankfurt, EU). One small pool per server instance (the free plan
 * has no PgBouncer), TLS verified against Aiven's CA. Without DATABASE_URL the app runs
 * in local mode and every DB route answers 503 { db: false }.
 */

export const SCHEMA = `
create table if not exists checkins (
  id uuid primary key default gen_random_uuid(),
  patient_id text not null,
  day int not null,
  transcript text,
  analysis jsonb not null,
  voice jsonb,
  source text,
  created_at timestamptz not null default now()
);
create index if not exists checkins_created_idx on checkins (created_at desc);
create index if not exists checkins_patient_idx on checkins (patient_id, created_at desc);

create table if not exists outcomes (
  id uuid primary key default gen_random_uuid(),
  patient_id text not null,
  day int not null,
  intervention text not null,
  helped boolean,
  created_at timestamptz not null default now()
);
create index if not exists outcomes_patient_idx on outcomes (patient_id, created_at);

create table if not exists messages (
  id text primary key,
  room text not null,
  sender text not null,
  text text not null,
  kind text not null default 'text',
  reported boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists messages_created_idx on messages (created_at);

create table if not exists presence (
  who text primary key,
  seen_at timestamptz not null default now()
);

create table if not exists clinic_actions (
  id uuid primary key default gen_random_uuid(),
  patient_id text not null,
  action text not null,
  created_at timestamptz not null default now()
);
`;

const g = globalThis as unknown as { __tiiPool?: Pool; __tiiSchema?: Promise<void> };

export const dbConfigured = () => Boolean(process.env.DATABASE_URL);

export function pool(): Pool {
  if (!g.__tiiPool) {
    const url = new URL(process.env.DATABASE_URL!);
    url.searchParams.delete("sslmode"); // TLS is configured explicitly below
    g.__tiiPool = new Pool({
      connectionString: url.toString(),
      ssl: { ca: process.env.DATABASE_CA ?? AIVEN_CA, rejectUnauthorized: true },
      max: 3,
      idleTimeoutMillis: 10_000, // give connections back quickly (15-connection free plan)
      connectionTimeoutMillis: 5_000,
      allowExitOnIdle: true,
    });
    g.__tiiPool.on("error", (e) => console.error("[db] idle client error:", e.message));
  }
  return g.__tiiPool;
}

/** Idempotent; runs once per server instance. */
export function ensureSchema() {
  g.__tiiSchema ??= pool()
    .query(SCHEMA)
    .then(() => undefined)
    .catch((e) => {
      g.__tiiSchema = undefined;
      throw e;
    });
  return g.__tiiSchema;
}

/** Wrap a route handler: 503 when no DB is configured, 500 (never a crash) on DB errors. */
export async function withDb(handler: (db: Pool) => Promise<Response>): Promise<Response> {
  if (!dbConfigured()) return Response.json({ db: false }, { status: 503 });
  try {
    await ensureSchema();
    return await handler(pool());
  } catch (e) {
    console.error("[db]", e instanceof Error ? e.message : e);
    return Response.json({ db: true, error: "database unavailable" }, { status: 500 });
  }
}
