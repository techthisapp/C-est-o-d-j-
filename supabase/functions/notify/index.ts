// Fonction Edge Supabase : envoie une notification push aux membres du sejour.
// Emplacement attendu : supabase/functions/notify/index.ts
// Elle lit les abonnements dans la table public.push_subs et envoie un push
// a chacun via les cles VAPID (definies en secrets).
// exclude : personne(s) a ne pas notifier (chaine ou liste, typiquement l'expediteur).
// only : si fourni, ne notifie QUE cette liste d'identifiants (utilise pour les mentions).

import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function toList(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x));
  if (v == null || v === "") return [];
  return [String(v)];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { type, title, body, tripCode, exclude, only, url } = await req.json();

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const PUB = Deno.env.get("VAPID_PUBLIC")!;
    const PRIV = Deno.env.get("VAPID_PRIVATE")!;
    const SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:contact@example.com";

    webpush.setVapidDetails(SUBJECT, PUB, PRIV);
    const supa = createClient(SUPABASE_URL, SERVICE);

    const { data, error } = await supa
      .from("push_subs")
      .select("*")
      .eq("trip_code", tripCode)
      .eq("enabled", true);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const exclureSet = new Set(toList(exclude));
    const onlyList = toList(only);
    const onlySet = onlyList.length ? new Set(onlyList) : null;

    const payload = JSON.stringify({ title, body, url: url || "./" });
    let sent = 0;

    for (const row of data || []) {
      const uid = row.user_id ? String(row.user_id) : "";
      if (uid && exclureSet.has(uid)) continue;
      if (onlySet && !(uid && onlySet.has(uid))) continue;
      const prefs = row.prefs || {};
      if (type && prefs[type] === false) continue;
      try {
        await webpush.sendNotification(row.sub, payload);
        sent++;
      } catch (e) {
        const code = (e && (e.statusCode || e.status)) || 0;
        if (code === 404 || code === 410) {
          await supa.from("push_subs").delete().eq("endpoint", row.endpoint);
        }
      }
    }

    return new Response(JSON.stringify({ sent }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 400, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
