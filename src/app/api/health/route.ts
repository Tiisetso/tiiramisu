import { dbConfigured, ensureSchema, pool } from "@/lib/server/db";

/** GET /api/health → is the shared database reachable? (clients use this to pick live vs local mode) */
export async function GET() {
  if (!dbConfigured()) return Response.json({ db: false });
  try {
    await ensureSchema();
    const t0 = Date.now();
    await pool().query("select 1");
    return Response.json({ db: true, latencyMs: Date.now() - t0, store: "Aiven for PostgreSQL · Frankfurt, EU" });
  } catch {
    return Response.json({ db: false, error: "unreachable" });
  }
}
