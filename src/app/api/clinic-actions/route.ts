import { withDb } from "@/lib/server/db";

/** GET /api/clinic-actions → today's actions (e.g. who was contacted). */
export async function GET() {
  return withDb(async (db) => {
    const r = await db.query(
      "select patient_id, action, created_at from clinic_actions where created_at > now() - interval '24 hours' order by created_at",
    );
    return Response.json({ db: true, actions: r.rows.map((x) => ({ patientId: x.patient_id, action: x.action, at: x.created_at })) });
  });
}

/** POST /api/clinic-actions { patientId, action: "contacted" } */
export async function POST(request: Request) {
  const b = (await request.json().catch(() => null)) as { patientId?: string; action?: string } | null;
  if (!b?.patientId || b.action !== "contacted") return Response.json({ error: "invalid action" }, { status: 400 });
  return withDb(async (db) => {
    await db.query("insert into clinic_actions (patient_id, action) values ($1, $2)", [b.patientId!.slice(0, 32), b.action]);
    return Response.json({ db: true, ok: true });
  });
}
