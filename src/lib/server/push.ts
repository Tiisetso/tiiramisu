import "server-only";

import { sendNotification, setVapidDetails } from "web-push";
import { dbConfigured, ensureSchema, pool } from "@/lib/server/db";

/**
 * Gentle push (DESIGN.md → Notifications): one notification per kind (`tag` replaces the
 * previous one, never a pile), never a badge count, quiet hours for anything non-urgent.
 */

export type PushKind = "clinic" | "wave";

const COPY: Record<PushKind, { title: string; urgent: boolean }> = {
  clinic: { title: "Your clinic would like to check in", urgent: true },
  wave: { title: "A wave from your circle", urgent: false },
};

let configured = false;
export function pushConfigured() {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return false;
  if (!configured) {
    setVapidDetails("https://tiiramisu.vercel.app", process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
    configured = true;
  }
  return true;
}

/** 22:00–08:00 Helsinki: hold non-urgent notifications. */
function quietHours(now = new Date()) {
  const h = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Europe/Helsinki" }).format(now));
  return h >= 22 || h < 8;
}

export async function sendPush(patientId: string, kind: PushKind, body: string, url = "/") {
  if (!pushConfigured() || !dbConfigured()) return { sent: 0, skipped: "not configured" };
  if (!COPY[kind].urgent && quietHours()) return { sent: 0, skipped: "quiet hours" };
  await ensureSchema();
  const r = await pool().query("select endpoint, subscription from push_subscriptions where patient_id = $1", [patientId]);
  const payload = JSON.stringify({ title: COPY[kind].title, body, tag: kind, url });
  let sent = 0;
  await Promise.all(
    r.rows.map(async (row) => {
      try {
        await sendNotification(row.subscription, payload, { TTL: 60 * 60 * 6, urgency: COPY[kind].urgent ? "high" : "normal", topic: kind });
        sent++;
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) await pool().query("delete from push_subscriptions where endpoint = $1", [row.endpoint]);
        else console.error("[push]", status, (e as Error).message);
      }
    }),
  );
  return { sent };
}
