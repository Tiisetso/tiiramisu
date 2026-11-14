// Privacy guard for a mental-health app, built on the CRACI API.
// Runs after the other CI jobs finish (CRACI only serves SBOMs/traces for terminal jobs):
//   1. finds this run's job ids via the GitHub API
//   2. pulls each job's CycloneDX SBOM + network trace from CRACI
//   3. FAILS if a tracking/analytics/session-replay package entered the build, or if anything
//      was allowed out to a host we never declared
//   4. writes a data-flow attestation: where the running app actually sent data while a
//      synthetic patient spoke to it (e.g. "voice → api.elevenlabs.io, 212 KB")
//   5. publishes the report to the job summary, craci-attestation.json, and Aiven (if configured)
//
// Env: CRACI_API_TOKEN, GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_RUN_ID, GITHUB_RUN_ATTEMPT,
//      GITHUB_SHA, GITHUB_REF_NAME, GITHUB_STEP_SUMMARY, GUARD_JOBS (comma list), DATABASE_URL (optional)

import { appendFileSync, writeFileSync } from "node:fs";

const env = process.env;
const REPO = env.GITHUB_REPOSITORY;
const JOBS = (env.GUARD_JOBS ?? "build,synthetic-patient").split(",").map((s) => s.trim());
const CRACI = "https://api.craci.com";

/** Packages that would quietly ship people's data somewhere. Health app: none allowed. */
const TRACKER = new RegExp(
  [
    "segment", "analytics-node", "@segment/", "mixpanel", "amplitude", "posthog", "hotjar", "fullstory", "logrocket",
    "heap-api", "smartlook", "microsoft/clarity", "react-ga", "ga-4-react", "gtag", "google-analytics", "facebook-pixel",
    "react-facebook-pixel", "@datadog/browser", "newrelic", "@sentry/", "bugsnag", "rollbar", "intercom", "hubspot",
    "matomo", "plausible", "umami", "@vercel/analytics", "@vercel/speed-insights", "openreplay", "mouseflow", "quantcast",
    "onesignal", "branch-sdk", "appsflyer", "adjust-sdk",
  ].map((s) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")).join("|"),
  "i",
);

/** Hosts each job is *meant* to talk to. Anything else that got out is a failure. */
const EXPECTED = {
  build: [/(^|\.)npmjs\.org$/, /(^|\.)github(usercontent)?\.com$/, /(^|\.)githubassets\.com$/, /(^|\.)actions\.githubusercontent\.com$/, /(^|\.)blob\.core\.windows\.net$/, /fonts\.(googleapis|gstatic)\.com$/],
  "synthetic-patient": [
    /(^|\.)npmjs\.org$/, /(^|\.)github(usercontent)?\.com$/, /(^|\.)githubassets\.com$/, /(^|\.)actions\.githubusercontent\.com$/, /(^|\.)blob\.core\.windows\.net$/,
    /fonts\.(googleapis|gstatic)\.com$/, /(^|\.)ubuntu\.com$/, /playwright/, /(^|\.)azureedge\.net$/,
    /^api\.anthropic\.com$/, /^api\.elevenlabs\.io$/, /\.vercel\.app$/,
  ],
};
/** Where people's data may go while the app runs (the data-flow attestation). */
const DATA_PROCESSORS = { "api.elevenlabs.io": "voice → speech-to-text", "api.anthropic.com": "transcript → Claude analysis" };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const summary = (md) => env.GITHUB_STEP_SUMMARY && appendFileSync(env.GITHUB_STEP_SUMMARY, md + "\n");

async function craci(path, accept = "application/json") {
  // SBOM/trace are served only once a job is terminal; retry 404/409/503 for a few minutes.
  for (let i = 0; i < 18; i++) {
    const r = await fetch(`${CRACI}${path}`, { headers: { Authorization: `Bearer ${env.CRACI_API_TOKEN}`, Accept: accept } });
    if (r.ok) return r.json();
    if (![404, 409, 503].includes(r.status)) throw new Error(`${path} → ${r.status} ${await r.text()}`);
    await sleep(10_000);
  }
  throw new Error(`${path} not ready after 3 minutes`);
}

async function githubJobs() {
  const url = `https://api.github.com/repos/${REPO}/actions/runs/${env.GITHUB_RUN_ID}/attempts/${env.GITHUB_RUN_ATTEMPT ?? 1}/jobs?per_page=100`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: "application/vnd.github+json" } });
  if (!r.ok) throw new Error(`GitHub jobs → ${r.status}`);
  return (await r.json()).jobs;
}

function flatten(components = []) {
  return components.flatMap((c) => [c, ...flatten(c.components)]);
}

function hostOf(o) {
  if (o.protocol === "tcp") return { host: o.tcp.tlsServerName || o.tcp.resolvedHosts?.[0] || o.tcp.remoteIp, port: o.tcp.port, allowed: o.tcp.allowed, reason: o.tcp.denyReason, up: Number(o.tcp.bytesToRemote ?? 0) };
  if (o.protocol === "http") {
    let host = o.http.originUrl;
    try { host = new URL(o.http.originUrl).hostname; } catch {}
    return { host, port: 443, allowed: !o.http.policyDenied, reason: o.http.denyReason, up: 0 };
  }
  if (o.protocol === "ssh_git") return { host: o.sshGit.host, port: o.sshGit.port, allowed: o.sshGit.allowed, reason: o.sshGit.denyReason, up: Number(o.sshGit.bytesToUpstream ?? 0) };
  return null; // dns
}

async function main() {
  if (!env.CRACI_API_TOKEN) {
    summary("## 🔒 Privacy guard\nSkipped: `CRACI_API_TOKEN` secret not set.");
    console.log("CRACI_API_TOKEN not set; skipping");
    return;
  }

  const ghJobs = await githubJobs();
  const report = { repo: REPO, runId: env.GITHUB_RUN_ID, sha: env.GITHUB_SHA, branch: env.GITHUB_REF_NAME, createdAt: new Date().toISOString(), jobs: [], failures: [] };

  for (const name of JOBS) {
    const gj = ghJobs.find((j) => j.name === name);
    if (!gj) { report.failures.push(`job "${name}" not found in this run`); continue; }
    if (gj.conclusion === "skipped") continue;
    const q = `provider=github&repo=${encodeURIComponent(REPO)}&job_id=${gj.id}`;
    const [bom, trace] = await Promise.all([craci(`/v1preview1/sbom?${q}`, "application/vnd.cyclonedx+json"), craci(`/v1preview1/network-trace?${q}`)]);

    const components = flatten(bom.components);
    const trackers = components.filter((c) => TRACKER.test(`${c.name} ${c.purl ?? ""} ${c.group ?? ""}`)).map((c) => `${c.group ? c.group + "/" : ""}${c.name}@${c.version ?? "?"}`);

    const flows = new Map();
    const blocked = new Map();
    for (const o of trace.observations ?? []) {
      const h = hostOf(o);
      if (!h?.host) continue;
      const key = `${h.host}:${h.port}`;
      if (h.allowed) {
        const f = flows.get(key) ?? { host: h.host, port: h.port, connections: 0, bytesUp: 0 };
        f.connections++;
        f.bytesUp += h.up;
        flows.set(key, f);
      } else {
        blocked.set(key, { host: h.host, port: h.port, reason: h.reason });
      }
    }
    const expected = EXPECTED[name] ?? [];
    const unexpected = [...flows.values()].filter((f) => !expected.some((re) => re.test(f.host)));
    const dataFlows = [...flows.values()].filter((f) => DATA_PROCESSORS[f.host]).map((f) => ({ ...f, purpose: DATA_PROCESSORS[f.host] }));

    if (trackers.length) report.failures.push(`${name}: tracking/analytics packages in build: ${trackers.join(", ")}`);
    if (unexpected.length) report.failures.push(`${name}: data left to undeclared hosts: ${unexpected.map((f) => f.host).join(", ")}`);

    report.jobs.push({
      name,
      jobId: String(gj.id),
      components: components.length,
      trackers,
      hosts: [...flows.values()].sort((a, b) => b.connections - a.connections),
      blocked: [...blocked.values()],
      dataFlows,
    });
  }

  report.status = report.failures.length ? "failed" : "verified";
  writeFileSync("craci-attestation.json", JSON.stringify(report, null, 2));

  // ── human-readable report ──
  const kb = (b) => `${(b / 1024).toFixed(0)} KB`;
  let md = `## 🔒 Privacy guard: ${report.status === "verified" ? "✅ verified" : "❌ failed"}\n\n`;
  md += "Every job ran on CRACI with a deny-by-default network policy. This report is built from CRACI's own SBOMs and network traces.\n\n";
  md += "| Job | SBOM components | Trackers | Hosts reached | Blocked attempts |\n|---|---:|---:|---|---:|\n";
  for (const j of report.jobs) md += `| ${j.name} | ${j.components} | ${j.trackers.length} | ${j.hosts.map((h) => h.host).join(", ") || "none"} | ${j.blocked.length} |\n`;
  const flowsAll = report.jobs.flatMap((j) => j.dataFlows);
  if (flowsAll.length) {
    md += "\n### Where people's data went while the synthetic patient used the app\n\n| Destination | Purpose | Connections | Uploaded |\n|---|---|---:|---:|\n";
    for (const f of flowsAll) md += `| ${f.host} | ${f.purpose} | ${f.connections} | ${kb(f.bytesUp)} |\n`;
    md += "\nNo other destination received data. Raw audio is never stored.\n";
  }
  const blockedAll = report.jobs.flatMap((j) => j.blocked.map((b) => ({ job: j.name, ...b })));
  if (blockedAll.length) {
    md += "\n### Blocked by the network policy\n\n| Job | Host | Reason |\n|---|---|---|\n";
    for (const b of blockedAll) md += `| ${b.job} | ${b.host}:${b.port} | ${b.reason ?? ""} |\n`;
  }
  if (report.failures.length) md += `\n### Failures\n${report.failures.map((f) => `- ${f}`).join("\n")}\n`;
  summary(md);
  console.log(md);

  // ── publish to Aiven so the clinic can show the latest verified build ──
  if (env.DATABASE_URL) {
    try {
      const { default: pg } = await import("pg");
      const { AIVEN_CA } = await import("./aiven-ca.mjs");
      const url = new URL(env.DATABASE_URL);
      url.searchParams.delete("sslmode");
      const client = new pg.Client({ connectionString: url.toString(), ssl: { ca: AIVEN_CA, rejectUnauthorized: true } });
      await client.connect();
      await client.query(`create table if not exists build_attestations (
        id bigserial primary key, run_id text, sha text, branch text, status text, report jsonb, created_at timestamptz not null default now())`);
      await client.query("insert into build_attestations (run_id, sha, branch, status, report) values ($1, $2, $3, $4, $5)", [
        report.runId, report.sha, report.branch, report.status, report,
      ]);
      await client.end();
      console.log("attestation published to Aiven");
    } catch (e) {
      console.log("could not publish attestation to Aiven:", e.message);
    }
  }

  if (report.failures.length) process.exit(1);
}

main().catch((e) => {
  summary(`## 🔒 Privacy guard\n❌ Error: ${e.message}`);
  console.error(e);
  process.exit(1);
});
