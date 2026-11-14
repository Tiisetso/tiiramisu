import { withDb } from "@/lib/server/db";

/** POST /api/messages/report { id } → hide a peer message for everyone. */
export async function POST(request: Request) {
  const b = (await request.json().catch(() => null)) as { id?: string } | null;
  if (!b?.id) return Response.json({ error: "missing id" }, { status: 400 });
  return withDb(async (db) => {
    await db.query("update messages set reported = true where id = $1", [b.id!.slice(0, 64)]);
    return Response.json({ db: true, ok: true });
  });
}
