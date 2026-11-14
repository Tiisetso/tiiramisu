import { pushConfigured } from "@/lib/server/push";

/** GET /api/push/key → the public VAPID key the browser needs to subscribe (evaluated per request). */
export function GET(request: Request) {
  void request.headers; // read the request so this stays dynamic, not prerendered at build time
  if (!pushConfigured()) return Response.json({ key: null });
  return Response.json({ key: process.env.VAPID_PUBLIC_KEY }, { headers: { "Cache-Control": "no-store" } });
}
