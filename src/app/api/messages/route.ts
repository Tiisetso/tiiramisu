import { withDb } from "@/lib/server/db";

const ROOMS = new Set(["maya", "juho", "mum", "peers"]);
const PEOPLE = new Set(["aino", "maya", "juho", "mum", "willow", "harbor", "fern"]);

/** GET /api/messages?since=ISO&who=aino → new messages + who else is online (presence heartbeat). */
export async function GET(request: Request) {
  const u = new URL(request.url);
  const since = u.searchParams.get("since") ?? new Date(Date.now() - 6 * 3600_000).toISOString();
  const who = u.searchParams.get("who");
  return withDb(async (db) => {
    if (who && PEOPLE.has(who)) {
      await db.query("insert into presence (who, seen_at) values ($1, now()) on conflict (who) do update set seen_at = now()", [who]);
    }
    const [msgs, online] = await Promise.all([
      db.query(
        "select id, room, sender, text, kind, reported, created_at from messages where created_at > $1 order by created_at limit 300",
        [since],
      ),
      db.query("select who from presence where seen_at > now() - interval '8 seconds'"),
    ]);
    return Response.json({
      db: true,
      now: new Date().toISOString(),
      messages: msgs.rows.map((r) => ({
        id: r.id,
        room: r.room,
        from: r.sender,
        text: r.text,
        kind: r.kind,
        reported: r.reported,
        at: new Date(r.created_at).getTime(),
      })),
      online: online.rows.map((r) => r.who).filter((w: string) => w !== who),
    });
  });
}

/** POST /api/messages { id, room, from, text, kind } */
export async function POST(request: Request) {
  const m = (await request.json().catch(() => null)) as { id?: string; room?: string; from?: string; text?: string; kind?: string } | null;
  if (!m?.id || !ROOMS.has(m.room ?? "") || !PEOPLE.has(m.from ?? "") || typeof m.text !== "string" || !m.text.trim()) {
    return Response.json({ error: "invalid message" }, { status: 400 });
  }
  return withDb(async (db) => {
    await db.query(
      "insert into messages (id, room, sender, text, kind) values ($1, $2, $3, $4, $5) on conflict (id) do nothing",
      [m.id!.slice(0, 64), m.room, m.from, m.text!.slice(0, 1000), m.kind === "wave" ? "wave" : "text"],
    );
    return Response.json({ db: true, ok: true });
  });
}
