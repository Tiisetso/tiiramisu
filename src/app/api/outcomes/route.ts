import { INTERVENTIONS } from "@/lib/analysis";
import { withDb } from "@/lib/server/db";

/** GET /api/outcomes?patient=aino → this person's live "did that help?" answers. */
export async function GET(request: Request) {
  const patient = new URL(request.url).searchParams.get("patient") ?? "aino";
  return withDb(async (db) => {
    const r = await db.query("select day, intervention, helped from outcomes where patient_id = $1 order by created_at", [patient]);
    return Response.json({ db: true, outcomes: r.rows });
  });
}

/** POST /api/outcomes { patientId, day, intervention, helped } */
export async function POST(request: Request) {
  const b = (await request.json().catch(() => null)) as { patientId?: string; day?: number; intervention?: string; helped?: boolean | null } | null;
  if (!b?.patientId || typeof b.day !== "number" || !(INTERVENTIONS as readonly string[]).includes(b.intervention ?? "")) {
    return Response.json({ error: "invalid outcome" }, { status: 400 });
  }
  return withDb(async (db) => {
    await db.query("insert into outcomes (patient_id, day, intervention, helped) values ($1, $2, $3, $4)", [
      b.patientId!.slice(0, 32),
      b.day,
      b.intervention,
      typeof b.helped === "boolean" ? b.helped : null,
    ]);
    return Response.json({ db: true, ok: true });
  });
}
