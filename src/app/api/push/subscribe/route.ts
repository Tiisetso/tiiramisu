import { withDb } from "@/lib/server/db";

interface Sub {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
}

/** POST /api/push/subscribe { patientId, subscription } · DELETE { endpoint } */
export async function POST(request: Request) {
  const b = (await request.json().catch(() => null)) as { patientId?: string; subscription?: Sub } | null;
  const s = b?.subscription;
  if (!b?.patientId || !s?.endpoint?.startsWith("https://") || !s.keys?.p256dh || !s.keys?.auth) {
    return Response.json({ error: "invalid subscription" }, { status: 400 });
  }
  return withDb(async (db) => {
    await db.query(
      `insert into push_subscriptions (endpoint, patient_id, subscription) values ($1, $2, $3)
       on conflict (endpoint) do update set patient_id = excluded.patient_id, subscription = excluded.subscription`,
      [s.endpoint, b.patientId!.slice(0, 32), s],
    );
    return Response.json({ db: true, ok: true });
  });
}

export async function DELETE(request: Request) {
  const b = (await request.json().catch(() => null)) as { endpoint?: string } | null;
  if (!b?.endpoint) return Response.json({ error: "missing endpoint" }, { status: 400 });
  return withDb(async (db) => {
    await db.query("delete from push_subscriptions where endpoint = $1", [b.endpoint]);
    return Response.json({ db: true, ok: true });
  });
}
