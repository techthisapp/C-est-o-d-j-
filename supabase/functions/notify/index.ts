// Notification push a la demande : declenchee par l'app lors d'un message, sondage,
// ajout ou modification d'activite, partage de position, ou mention.
// Cible tous les abonnes du sejour en respectant leurs preferences.
// exclude : personne(s) a ne pas notifier (chaine ou liste, typiquement l'expediteur).
// only : si fourni, ne notifie QUE cette liste d'identifiants (utilise pour les mentions).

import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PUB = Deno.env.get("VAPID_PUBLIC")!;
const PRIV = Deno.env.get("VAPID_PRIVATE")!;
const SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:contact@example.com";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function toList(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x));
  if (v == null || v === "") return [];
  return [String(v)];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (!SUPABASE_URL || !SERVICE) {
    return new Response(JSON.stringify({ error: "config manquante" }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }

  let body: Record<string, any> = {};
  try { body = await req.json(); } catch (_) { /* corps vide */ }

  const tripCode = body.tripCode;
  const title = body.title;
  if (!tripCode || !title) {
    return new Response(JSON.stringify({ error: "tripCode et title requis" }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
  }

  const type = body.type ? String(body.type) : "";
  const exclure = new Set(toList(body.exclude));
  const only = toList(body.only);
  const onlySet = only.length ? new Set(only) : null;

  webpush.setVapidDetails(SUBJECT, PUB, PRIV);
  const supa = createClient(SUPABASE_URL, SERVICE);

  const { data: subs, error } = await supa
    .from("push_subs").select("endpoint, user_id, sub, prefs, enabled")
    .eq("trip_code", tripCode).eq("enabled", true);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });

  const payload = JSON.stringify({ title, body: body.body || "", url: body.url || "./" });
  let envois = 0;

  for (const row of subs ?? []) {
    const uid = row.user_id ? String(row.user_id) : "";
    if (uid && exclure.has(uid)) continue;
    if (onlySet && !(uid && onlySet.has(uid))) continue;
    if (type && row.prefs && row.prefs[type] === false) continue;
    try { await webpush.sendNotification(row.sub, payload); envois++; }
    catch (err: any) {
      const code = (err && (err.statusCode || err.status)) || 0;
      if (code === 404 || code === 410) await supa.from("push_subs").delete().eq("endpoint", row.endpoint);
    }
  }

  return new Response(JSON.stringify({ ok: true, envois }), { headers: { ...CORS, "Content-Type": "application/json" } });
});
