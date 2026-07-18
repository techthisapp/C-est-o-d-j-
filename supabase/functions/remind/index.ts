// Rappel serveur : envoie une notification push une heure avant chaque activite.
// Declenchee par pg_cron toutes les 5 minutes (voir migrations/reminders.sql).
// Autonome : lit l'etat du sejour dans la table trips, les abonnements dans push_subs,
// et evite les doublons via la table reminders_sent.

import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PUB = Deno.env.get("VAPID_PUBLIC")!;
const PRIV = Deno.env.get("VAPID_PRIVATE")!;
const SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:contact@example.com";

const HEURE_MS = 3600000;
const FENETRE_MS = 12 * 60 * 1000; // marge apres l'instant du rappel, alignee sur un cron de 5 min

// Decalage (ms) du fuseau tz a l'instant utcMs
function decalageFuseau(utcMs: number, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const m: Record<string, string> = {};
  for (const p of parts) m[p.type] = p.value;
  const asUtc = Date.UTC(+m.year, +m.month - 1, +m.day, +m.hour, +m.minute, +m.second);
  return asUtc - utcMs;
}

// Instant UTC (ms) du debut d'une activite (jour + heure locale du sejour)
function debutActiviteMs(startISO: string, day: number, hhmm: string, tz: string): number | null {
  const d = String(startISO).split("-").map(Number);
  const h = String(hhmm).split(":").map(Number);
  if (d.length < 3 || h.length < 2 || d.some(isNaN) || h.some(isNaN)) return null;
  const base = Date.UTC(d[0], d[1] - 1, d[2]) + day * 86400000;
  const bd = new Date(base);
  const estim = Date.UTC(bd.getUTCFullYear(), bd.getUTCMonth(), bd.getUTCDate(), h[0], h[1]);
  return estim - decalageFuseau(estim, tz);
}

function titreActivite(e: Record<string, unknown>): string {
  const t = e.title ? String(e.title).trim() : "";
  return t || "Activité";
}

Deno.serve(async () => {
  if (!SUPABASE_URL || !SERVICE) {
    return new Response(JSON.stringify({ error: "config manquante" }), { status: 500 });
  }
  webpush.setVapidDetails(SUBJECT, PUB, PRIV);
  const supa = createClient(SUPABASE_URL, SERVICE);
  const now = Date.now();

  const { data: trips, error } = await supa.from("trips").select("code, data");
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  let envois = 0;
  let rappels = 0;

  for (const trip of trips ?? []) {
    const d = (trip.data ?? {}) as Record<string, any>;
    const s = (d.settings ?? {}) as Record<string, any>;
    const startISO = s.startISO;
    if (!startISO) continue;
    const tz = s.tz || "Europe/Athens";
    const events = (Array.isArray(d.events) ? d.events : [])
      .filter((e: any) => e && typeof e.day === "number" && e.start && !e.alt && !e.parent);
    if (!events.length) continue;

    const { data: subs } = await supa
      .from("push_subs").select("endpoint, sub, prefs, enabled")
      .eq("trip_code", trip.code).eq("enabled", true);
    if (!subs || !subs.length) continue;

    for (const e of events) {
      const debut = debutActiviteMs(startISO, e.day, e.start, tz);
      if (debut == null) continue;
      const instantRappel = debut - HEURE_MS;
      if (!(instantRappel <= now && now - instantRappel < FENETRE_MS)) continue;

      // Reserve le rappel de facon atomique : si la ligne existe deja, on n'envoie pas
      const { data: reserve } = await supa
        .from("reminders_sent")
        .upsert({ trip_code: trip.code, event_id: e.id, sent_at: now }, { onConflict: "trip_code,event_id", ignoreDuplicates: true })
        .select("event_id");
      if (!reserve || !reserve.length) continue;
      rappels++;

      const lieu = e.place && e.place.name && e.place.name !== "À définir" ? e.place.name : "";
      const corps = "À " + String(e.start).replace(":", "h") + (lieu ? " · " + lieu : "") + ", dans moins d'une heure.";
      const payload = JSON.stringify({ title: "Bientôt : " + titreActivite(e), body: corps, tag: "rappel-" + e.id, url: "./" });

      for (const row of subs) {
        if (row.prefs && row.prefs.nextActivity === false) continue;
        try { await webpush.sendNotification(row.sub, payload); envois++; }
        catch (err: any) {
          const code = (err && (err.statusCode || err.status)) || 0;
          if (code === 404 || code === 410) await supa.from("push_subs").delete().eq("endpoint", row.endpoint);
        }
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, rappels, envois }), { headers: { "Content-Type": "application/json" } });
});
