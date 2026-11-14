import type { StoredCheckin } from "@/lib/clinic";
import { withDb } from "@/lib/server/db";

/** GET /api/checkins?since=ISO[&patient=aino] → recent live check-ins (newest first). */
export async function GET(request: Request) {
  const u = new URL(request.url);
  const since = u.searchParams.get("since") ?? new Date(Date.now() - 24 * 3600_000).toISOString();
  const patient = u.searchParams.get("patient");
  return withDb(async (db) => {
    const r = await db.query(
      `select id, patient_id, day, transcript, analysis, voice, source, created_at from checkins
       where created_at > $1 ${patient ? "and patient_id = $2" : ""} order by created_at desc limit 50`,
      patient ? [since, patient] : [since],
    );
    const checkins: StoredCheckin[] = r.rows.map((x) => ({
      id: x.id,
      patientId: x.patient_id,
      day: x.day,
      transcript: x.transcript,
      analysis: x.analysis,
      voice: x.voice,
      source: x.source,
      createdAt: new Date(x.created_at).toISOString(),
    }));
    return Response.json({ db: true, checkins });
  });
}

/** POST /api/checkins { patientId, day, transcript, analysis, voice, source } — no raw audio is ever stored. */
export async function POST(request: Request) {
  const b = (await request.json().catch(() => null)) as Partial<StoredCheckin> | null;
  if (!b?.patientId || typeof b.day !== "number" || !b.analysis?.gentle_reflection) {
    return Response.json({ error: "invalid check-in" }, { status: 400 });
  }
  return withDb(async (db) => {
    const r = await db.query(
      "insert into checkins (patient_id, day, transcript, analysis, voice, source) values ($1, $2, $3, $4, $5, $6) returning id, created_at",
      [b.patientId!.slice(0, 32), b.day, b.transcript?.slice(0, 5000) ?? null, b.analysis, b.voice ?? null, b.source ?? null],
    );
    return Response.json({ db: true, id: r.rows[0].id, createdAt: r.rows[0].created_at });
  });
}
