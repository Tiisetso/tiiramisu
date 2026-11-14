import { withDb } from "@/lib/server/db";
import { sendPush } from "@/lib/server/push";

/**
 * Clinic → patient outreach.
 * GET  /api/outreach?patient=aino → latest request + the patient's answer (if any), last 24 h
 * POST /api/outreach { patientId }                     (clinic: "Reach out")
 * POST /api/outreach { patientId, response: "..." }    (patient: chosen time / "message" / "not now")
 */
export async function GET(request: Request) {
  const patient = new URL(request.url).searchParams.get("patient") ?? "aino";
  return withDb(async (db) => {
    const r = await db.query(
      `select action, detail, created_at from clinic_actions
       where patient_id = $1 and action in ('outreach', 'outreach_response') and created_at > now() - interval '24 hours'
       order by created_at desc`,
      [patient],
    );
    const request_ = r.rows.find((x) => x.action === "outreach");
    const response = request_ ? r.rows.find((x) => x.action === "outreach_response" && x.created_at >= request_.created_at) : undefined;
    return Response.json({
      db: true,
      request: request_ ? { at: request_.created_at } : null,
      response: response ? { choice: response.detail, at: response.created_at } : null,
    });
  });
}

export async function POST(request: Request) {
  const b = (await request.json().catch(() => null)) as { patientId?: string; response?: string } | null;
  if (!b?.patientId) return Response.json({ error: "missing patientId" }, { status: 400 });
  const patientId = b.patientId.slice(0, 32);
  return withDb(async (db) => {
    if (b.response) {
      await db.query("insert into clinic_actions (patient_id, action, detail) values ($1, 'outreach_response', $2)", [
        patientId,
        b.response.slice(0, 80),
      ]);
      return Response.json({ db: true, ok: true });
    }
    await db.query("insert into clinic_actions (patient_id, action) values ($1, 'outreach')", [patientId]);
    const push = await sendPush(patientId, "clinic", "Choose a time that suits you. No rush.", "/?from=clinic");
    return Response.json({ db: true, ok: true, push });
  });
}
