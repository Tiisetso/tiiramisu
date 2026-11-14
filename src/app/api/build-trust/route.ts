import { withDb } from "@/lib/server/db";

interface Job {
  name: string;
  components: number;
  trackers: string[];
  dataFlows: { host: string; purpose: string; connections: number; bytesUp: number }[];
}

/** GET /api/build-trust → the latest build verified by the CRACI privacy guard (from CI → Aiven). */
export async function GET() {
  return withDb(async (db) => {
    const r = await db.query(
      "select run_id, sha, branch, status, report, created_at from build_attestations order by created_at desc limit 1",
    );
    const row = r.rows[0];
    if (!row) return Response.json({ db: true, build: null });
    const jobs: Job[] = row.report?.jobs ?? [];
    return Response.json({
      db: true,
      build: {
        runId: row.run_id,
        sha: String(row.sha ?? "").slice(0, 7),
        branch: row.branch,
        status: row.status,
        at: row.created_at,
        components: jobs.reduce((n, j) => Math.max(n, j.components), 0),
        trackers: jobs.reduce((n, j) => n + j.trackers.length, 0),
        dataGoesTo: [...new Set(jobs.flatMap((j) => j.dataFlows.map((f) => f.host)))],
        url: `https://github.com/Tiisetso/tiiramisu/actions/runs/${row.run_id}`,
      },
    });
  });
}
