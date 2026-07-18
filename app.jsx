import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import {
  MapPin, Clock3, Users, Plus, X, Play, Pause, Wallet, StickyNote,
  Sparkles, Waves, Pencil, Check, Sun, CloudSun, Timer, Sailboat, Gamepad2,
  Cloud, CloudRain, CloudSnow, CloudFog, CloudDrizzle, CloudLightning, Sunrise, Sunset, Wind, Umbrella, Thermometer, Heart,
  CalendarDays, Rewind, Clock, UserMinus, UserPlus, MessageCircle,
  Send, ImagePlus, Images, Navigation, CornerDownRight, LogIn, LogOut,
  Settings, RotateCcw, User, RefreshCw, Phone, Mail, Trash2, BarChart3, Star, SmilePlus, Map as MapIcon, Share2, HelpCircle, Volume2, VolumeX
} from "lucide-react";

/* =========================================================================
   MAQUETTE R1  (dispositif de démonstration, sans code de production)
   Programme + vue "maintenant" + discussion + photos + carte + parallèle.
   Style centralisé dans T. Fonctions de dérivation pures.
   ========================================================================= */

/* ---- Tokens ------------------------------------------------------------ */
const LIGHT = {
  ink: "#123A4B", inkSoft: "#5A7480", inkFaint: "#8496A0",
  card: "#FFFFFF", line: "#E7EFEC", lineSoft: "#EEF4F2",
  sea: "#0FB0AE", seaDeep: "#0A8F8D", seaSoft: "#E1F4F3",
  coral: "#FF7A66", coralDeep: "#F0604A", coralSoft: "#FFE9E4",
  sun: "#F2A93B", sunSoft: "#FBEED4",
  sky: "#5AB6E4", skySoft: "#E4F2FB",
  green: "#3FB98A", greenSoft: "#E1F5EC", pink: "#E86A9A", pinkSoft: "#FCE3EE",
  ring: "#FFFFFF", glass: "rgba(255,255,255,0.85)", glassNav: "rgba(255,255,255,0.93)",
  bg: "radial-gradient(120% 55% at 50% 0%, #E4F2FB 0%, transparent 52%), linear-gradient(180deg, #E1F4F3 0%, #FDF6EC 44%, #FFF3E4 100%)",
};
const DARK = {
  ink: "#EAF2F4", inkSoft: "#A9BEC6", inkFaint: "#7C949E",
  card: "#16242C", line: "#2A3A43", lineSoft: "#1E2E36",
  sea: "#22C3BE", seaDeep: "#7FE0DB", seaSoft: "#123536",
  coral: "#FF8E7B", coralDeep: "#FFB0A2", coralSoft: "#39241F",
  sun: "#F4B65A", sunSoft: "#33290F",
  sky: "#79C4EC", skySoft: "#12303F",
  green: "#5CC89E", greenSoft: "#123329", pink: "#F08AB1", pinkSoft: "#331523",
  ring: "#16242C", glass: "rgba(14,24,30,0.74)", glassNav: "rgba(14,24,30,0.88)",
  bg: "radial-gradient(120% 55% at 50% 0%, #14313F 0%, transparent 52%), linear-gradient(180deg, #0E1B22 0%, #0B171D 60%, #0A141A 100%)",
};
const T = {
  c: { ...LIGHT },
  r: { sm: 12, md: 16, lg: 22, xl: 28, pill: 999 },
  sh: {
    soft: "0 12px 34px rgba(6,20,26,0.16)",
    card: "0 4px 14px rgba(6,20,26,0.08)",
    lift: "0 18px 48px rgba(6,20,26,0.28)",
  },
};
const fD = "'Fredoka', ui-rounded, system-ui, sans-serif";
const fB = "'DM Sans', system-ui, sans-serif";
const fH = "'Caveat', 'Bradley Hand', cursive";

/* ---- Registre des types ------------------------------------------------ */
const TYPES = {
  activite: { label: "Activité", emoji: "🏄", color: T.c.sea, deep: T.c.seaDeep, soft: T.c.seaSoft },
  repas: { label: "Repas", emoji: "🍽️", color: T.c.coral, deep: T.c.coralDeep, soft: T.c.coralSoft },
  fete: { label: "Fête", emoji: "🎉", color: T.c.pink, deep: "#C43D77", soft: T.c.pinkSoft },
  hebergement: { label: "Hébergement", emoji: "🏡", color: T.c.sun, deep: "#D98B1F", soft: T.c.sunSoft },
  transport: { label: "Transport", emoji: "🚗", color: T.c.sky, deep: "#3A93C4", soft: T.c.skySoft },
  libre: { label: "Temps libre", emoji: "🌴", color: T.c.green, deep: "#2E9E74", soft: T.c.greenSoft },
};
const TYPE_ORDER = ["activite", "repas", "fete", "libre", "hebergement", "transport"];
const BUILTIN_TYPE_IDS = ["activite", "repas", "fete", "hebergement", "transport", "libre"];
const CATEGORY_COLORS = ["#FF7A66", "#0FB0AE", "#F2A93B", "#5AB6E4", "#E86A9A", "#3FB98A", "#9B7EDE", "#E4A11B", "#2FB0C6", "#D96AA0"];
function applyCategories() {
  Object.keys(TYPES).forEach((k) => { if (!BUILTIN_TYPE_IDS.includes(k)) delete TYPES[k]; });
  (SETTINGS.categories || []).forEach((c) => {
    if (!c || !c.id) return;
    TYPES[c.id] = { label: c.label || "Catégorie", emoji: c.emoji || "📍", color: c.color, deep: c.color, soft: (c.color || "#888888") + "26" };
  });
}

/* ---- Participants ------------------------------------------------------ */
/* ---- Participants : roster modifiable, personne connectée paramétrable -- */
const META = {
  lea: { emoji: "🌻", color: T.c.coral }, tom: { emoji: "🏄", color: T.c.sea },
  cam: { emoji: "🎒", color: T.c.sun }, hugo: { emoji: "🐚", color: T.c.sky },
  sarah: { emoji: "🍉", color: T.c.pink }, max: { emoji: "🎸", color: T.c.green },
  g7: { emoji: "🌊", color: T.c.seaDeep }, g8: { emoji: "⛱️", color: T.c.coralDeep },
};
let ROSTER = [
  { id: "lea", name: "Jérôme", role: "organisateur", active: true },
  { id: "tom", name: "Romain", role: "co-éditeur", active: true },
  { id: "cam", name: "Fred", role: "participant", active: true },
  { id: "hugo", name: "Vincent", role: "participant", active: true },
  { id: "sarah", name: "François", role: "participant", active: true },
  { id: "max", name: "", role: "participant", active: false },
  { id: "g7", name: "", role: "participant", active: false },
  { id: "g8", name: "", role: "participant", active: false },
].map((p) => ({ ...META[p.id], ...p }));
let ME = "lea";
const AVATAR_EMOJIS = ["🌻", "🏄", "🎒", "🐚", "🍉", "🎸", "🌊", "⛱️", "😎", "🐬", "🦩", "🍹", "🌴", "⚓", "🐙", "🦀", "🍦", "🕶️", "🐢", "🚤", "🥥", "🌺", "🪐", "🦜"];
const AVATAR_COLORS = ["#FF7A66", "#0FB0AE", "#F2A93B", "#5AB6E4", "#E86A9A", "#3FB98A", "#0A8F8D", "#F0604A", "#9B7EDE", "#E4A11B", "#2FB0C6", "#D96AA0"];
const ROLES = ["organisateur", "co-éditeur", "participant"];
const ROLE_LABEL = { organisateur: "Organisateur", "co-éditeur": "Co-éditeur", participant: "Membre" };
const person = (id) => ROSTER.find((p) => p.id === id) || { id, name: id, emoji: "🙂", color: "#8AA0A8" };
const activeIds = () => ROSTER.filter((p) => p.active).map((p) => p.id);

/* ---- Jours ------------------------------------------------------------- */
const WK = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const WL = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const MO = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const todayISO = () => { const d = new Date(); const p = (n) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };
function buildDays(startISO, n) {
  const s = new Date(startISO + "T00:00:00");
  return Array.from({ length: Math.max(1, n) }, (_, i) => {
    const d = new Date(s); d.setDate(s.getDate() + i);
    return { i, short: WK[d.getDay()], d: String(d.getDate()), long: `${WL[d.getDay()]} ${d.getDate()} ${MO[d.getMonth()]}` };
  });
}
let SETTINGS = { name: "Mykonos entre amis", place: "Mykonos", startISO: "2026-07-10", days: 6 };
let DAYS = buildDays(SETTINGS.startISO, SETTINGS.days);
function isoPlusDays(iso, n) {
  const d = new Date(iso + "T00:00:00"); d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function daysBetweenISO(a, b) {
  const da = new Date(a + "T00:00:00"), db = new Date(b + "T00:00:00");
  return Math.round((db - da) / 86400000) + 1;
}

/* ---- Programme d'exemple ----------------------------------------------
   Présence par défaut : tout le monde. On stocke les désistements (skip).
   Une activité parallèle porte parallelOf et une liste who en opt-in.     */
const V = { lat: 37.4642, lng: 25.3486 }; // Aiolos Villa, Panormos (repli)
const SEED = [
  // Vendredi 10 juillet
  { id: "e01", day: 0, start: "14:00", end: "15:30", type: "hebergement", title: "Arrivée à la villa", place: { name: "Aiolos Villa", area: "Panormos", coord: V }, note: "Installation et choix des chambres." },
  { id: "e02", day: 0, start: "16:00", end: "16:30", type: "transport", title: "Scooters et quads livrés", place: { name: "Aiolos Villa", area: "Panormos", coord: V }, note: "Livraison à la villa." },
  { id: "e03", day: 0, start: "19:00", end: "20:30", type: "repas", title: "Apéro chill", place: { name: "Aiolos Villa", area: "terrasse", coord: V } },
  { id: "e04", day: 0, start: "21:00", end: "23:00", type: "repas", title: "Jackie O' (résa 21h)", place: { name: "Jackie O'", area: "en ville", coord: { lat: 37.4470, lng: 25.3265 } } },

  // Samedi 11 juillet
  { id: "e05", day: 1, start: "11:00", end: "17:00", type: "activite", title: "Elia Beach Club (résa 11h)", place: { name: "Elia Beach Club", area: "sunbeds réservés", coord: { lat: 37.4278, lng: 25.3930 } } },
  { id: "e06", day: 1, start: "19:00", end: "20:30", type: "repas", title: "Apéro villa", place: { name: "Aiolos Villa", area: "Panormos", coord: V } },
  { id: "e07", day: 1, start: "21:00", end: "23:00", type: "repas", title: "Baboulas Ouzeri (résa 21h)", place: { name: "Baboulas Ouzeri", area: "en ville", coord: { lat: 37.4472, lng: 25.3268 } } },
  { id: "e08", day: 1, start: "23:30", end: "23:59", type: "activite", title: "Bars et clubs", place: { name: "En ville", area: "VOID ou Cavo Paradiso", coord: { lat: 37.4460, lng: 25.3290 } }, note: "VOID en ville ou Cavo Paradiso à Paradise." },

  // Dimanche 12 juillet
  { id: "e09", day: 2, start: "11:00", end: "18:00", type: "activite", title: "Tournée scooter, plages de l'est", place: { name: "Plages de l'est", area: "en scooter", coord: { lat: 37.4356, lng: 25.4000 } } },
  { id: "e10", day: 2, start: "20:30", end: "22:30", type: "repas", title: "Dîner maison", place: { name: "Aiolos Villa", area: "Panormos", coord: V } },

  // Lundi 13 juillet
  { id: "e11", day: 3, start: "12:00", end: "18:00", type: "libre", title: "Journée à définir", place: { name: "Aiolos Villa", area: "Panormos", coord: V }, note: "Programme à caler." },
  { id: "e12", day: 3, start: "21:00", end: "23:00", type: "repas", title: "Kastro's (à confirmer)", place: { name: "Kastro's", area: "Petite Venise", coord: { lat: 37.4452, lng: 25.3256 } }, note: "Table à confirmer au plus vite." },

  // Mardi 14 juillet
  { id: "e13", day: 4, start: "13:00", end: "21:00", type: "activite", title: "Alemagou (résa 13h)", place: { name: "Alemagou", area: "Ftelia", coord: { lat: 37.4586, lng: 25.3667 } }, note: "Beach, late lunch, sunset DJ set, dîner à confirmer." },

  // Mercredi 15 juillet
  { id: "e14", day: 5, start: "11:00", end: "16:00", type: "libre", title: "Chill villa", place: { name: "Aiolos Villa", area: "Panormos", coord: V } },
  { id: "e15", day: 5, start: "17:00", end: "18:00", type: "transport", title: "Départ (à préciser)", place: { name: "Aiolos Villa", area: "Panormos", coord: V } },
];

/* ---- Messages d'exemple (canal général et fils d'activité) ------------- */
const SEED_MSG = [];

/* ---- Photos d'exemple (rattachées à une activité) ---------------------- */
const SEED_PHOTO = [];
const PHOTO_TONE = {
  sea: `linear-gradient(150deg, ${T.c.sea}, ${T.c.sky})`,
  sky: `linear-gradient(150deg, ${T.c.sky}, ${T.c.seaSoft})`,
  sun: `linear-gradient(150deg, ${T.c.sun}, #FFD98A)`,
  coral: `linear-gradient(150deg, ${T.c.coral}, #FFB4A6)`,
  sunset: `linear-gradient(150deg, ${T.c.coral}, ${T.c.sun})`,
  green: `linear-gradient(150deg, ${T.c.green}, #A7E3C6)`,
};
const PHOTO_TONES = ["sea", "sky", "sun", "coral", "sunset", "green"];
const PHOTO_EMO = ["📸", "🌊", "🌴", "🍹", "😎", "⛱️"];

/* ---- Thème clair/sombre ------------------------------------------------ */
function rederiveTokens() {
  const c = T.c;
  TYPES.activite.color = c.sea; TYPES.activite.deep = c.seaDeep; TYPES.activite.soft = c.seaSoft;
  TYPES.repas.color = c.coral; TYPES.repas.deep = c.coralDeep; TYPES.repas.soft = c.coralSoft;
  TYPES.hebergement.color = c.sun; TYPES.hebergement.soft = c.sunSoft;
  TYPES.transport.color = c.sky; TYPES.transport.soft = c.skySoft;
  TYPES.libre.color = c.green; TYPES.libre.soft = c.greenSoft;
  TYPES.fete.color = c.pink; TYPES.fete.soft = c.pinkSoft;
  META.lea.color = c.coral; META.tom.color = c.sea; META.cam.color = c.sun; META.hugo.color = c.sky;
  META.sarah.color = c.pink; META.max.color = c.green; META.g7.color = c.seaDeep; META.g8.color = c.coralDeep;
  Object.assign(PHOTO_TONE, {
    sea: `linear-gradient(150deg, ${c.sea}, ${c.sky})`,
    sky: `linear-gradient(150deg, ${c.sky}, ${c.seaSoft})`,
    sun: `linear-gradient(150deg, ${c.sun}, #FFD98A)`,
    coral: `linear-gradient(150deg, ${c.coral}, #FFB4A6)`,
    sunset: `linear-gradient(150deg, ${c.coral}, ${c.sun})`,
    green: `linear-gradient(150deg, ${c.green}, #A7E3C6)`,
  });
  applyCategories();
}
const THEME_KEY = "vacances_theme_v1";
function loadThemeMode() { try { return localStorage.getItem(THEME_KEY) || "auto"; } catch (e) { return "auto"; } }
function saveThemeMode(m) { try { localStorage.setItem(THEME_KEY, m); } catch (e) { /* rien */ } }
function systemPrefersDark() {
  try { return typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches; } catch (e) { return false; }
}
let IS_DARK = false;
function applyTheme(mode) {
  const dark = mode === "dark" || (mode === "auto" && systemPrefersDark());
  IS_DARK = dark;
  Object.assign(T.c, dark ? DARK : LIGHT);
  rederiveTokens();
  if (typeof document !== "undefined") {
    const solid = dark ? "#0B171D" : "#E1F4F3";
    if (document.documentElement) document.documentElement.style.background = solid;
    if (document.body) document.body.style.background = solid;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dark ? "#0B171D" : "#0FB0AE");
  }
  return dark;
}

/* ---- Fonctions de dérivation (pures) ---------------------------------- */
const pad = (n) => String(n).padStart(2, "0");
const toAbs = (day, hhmm) => { const [h, m] = hhmm.split(":").map(Number); return day * 1440 + h * 60 + m; };
const startAbs = (e) => toAbs(e.day, e.start);
const endAbs = (e) => toAbs(e.day, e.end);
const sortByStart = (list) => [...list].sort((a, b) => startAbs(a) - startAbs(b));
const skipOf = (e) => e.skip || [];
const isAlt = (e) => !!e.parallelOf;
const attendeesOf = (e) => isAlt(e) ? (e.who || []) : activeIds().filter((id) => !skipOf(e).includes(id));
const lieuSecondaire = (e) => { const p = (e && e.place) || {}; const n = p.name || ""; if (!n || n === "À définir") return ""; return (e.title || "").toLowerCase().includes(n.toLowerCase()) ? "" : n; };
const iAmIn = (e) => attendeesOf(e).includes(ME);
const mainList = (events) => events.filter((e) => !isAlt(e));
const parallelsOf = (events, id) => events.filter((e) => e.parallelOf === id);

const currentEvent = (events, now) => sortByStart(mainList(events).filter((e) => startAbs(e) <= now && now < endAbs(e)))[0] || null;
const nextEvent = (events, now) => sortByStart(mainList(events).filter((e) => startAbs(e) > now))[0] || null;
const upcomingSameDay = (events, now, day) => sortByStart(mainList(events).filter((e) => e.day === day && startAbs(e) > now));

const remainingLabel = (mins) => {
  if (mins <= 0) return "maintenant";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h${pad(m)}`;
};
const dayOfNow = (now) => Math.floor(now / 1440);
const minsInDay = (now) => ((now % 1440) + 1440) % 1440;

/* Fond évolutif selon l'heure : ancrages de couleurs interpolés en continu. */
const SKY_LIGHT = [
  { t: 0, sky: [203, 214, 232], mid: [224, 234, 243], bot: [233, 238, 244] },
  { t: 330, sky: [214, 210, 232], mid: [228, 226, 240], bot: [236, 236, 244] },
  { t: 400, sky: [255, 222, 208], mid: [255, 236, 224], bot: [255, 243, 235] },
  { t: 540, sky: [225, 244, 251], mid: [225, 244, 243], bot: [253, 246, 236] },
  { t: 780, sky: [220, 240, 251], mid: [228, 244, 249], bot: [238, 246, 252] },
  { t: 1050, sky: [255, 236, 205], mid: [255, 243, 225], bot: [255, 240, 226] },
  { t: 1230, sky: [255, 210, 200], mid: [255, 224, 220], bot: [255, 234, 228] },
  { t: 1350, sky: [222, 212, 240], mid: [230, 226, 242], bot: [237, 235, 246] },
  { t: 1440, sky: [203, 214, 232], mid: [224, 234, 243], bot: [233, 238, 244] },
];
const SKY_DARK = [
  { t: 0, sky: [18, 40, 58], mid: [14, 27, 34], bot: [10, 20, 26] },
  { t: 330, sky: [26, 34, 58], mid: [16, 22, 34], bot: [11, 18, 26] },
  { t: 400, sky: [48, 34, 44], mid: [24, 20, 26], bot: [15, 16, 22] },
  { t: 540, sky: [20, 49, 63], mid: [14, 27, 34], bot: [11, 23, 29] },
  { t: 780, sky: [20, 54, 72], mid: [14, 31, 41], bot: [11, 23, 29] },
  { t: 1050, sky: [54, 41, 26], mid: [27, 22, 16], bot: [17, 18, 20] },
  { t: 1230, sky: [56, 30, 34], mid: [29, 20, 23], bot: [18, 16, 20] },
  { t: 1350, sky: [34, 30, 54], mid: [22, 20, 32], bot: [14, 16, 24] },
  { t: 1440, sky: [18, 40, 58], mid: [14, 27, 34], bot: [10, 20, 26] },
];
const lerpN = (a, b, t) => Math.round(a + (b - a) * t);
const mixRGB = (c1, c2, t) => [lerpN(c1[0], c2[0], t), lerpN(c1[1], c2[1], t), lerpN(c1[2], c2[2], t)];
const rgbStr = (c) => `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
function skyColorsAt(now, dark) {
  const anchors = dark ? SKY_DARK : SKY_LIGHT;
  const m = minsInDay(now);
  let i = 0; while (i < anchors.length - 1 && m > anchors[i + 1].t) i++;
  const a = anchors[i], b = anchors[Math.min(i + 1, anchors.length - 1)];
  const span = (b.t - a.t) || 1;
  const t = Math.max(0, Math.min(1, (m - a.t) / span));
  return { sky: mixRGB(a.sky, b.sky, t), mid: mixRGB(a.mid, b.mid, t), bot: mixRGB(a.bot, b.bot, t) };
}
function dayBg(now, dark) {
  const c = skyColorsAt(now, dark);
  return `radial-gradient(120% 55% at 50% 0%, ${rgbStr(c.sky)} 0%, transparent 52%), linear-gradient(180deg, ${rgbStr(c.mid)} 0%, ${rgbStr(c.bot)} 100%)`;
}
const greeting = (now) => { const m = minsInDay(now); return m < 12 * 60 ? "Bonjour" : m < 18 * 60 ? "Bel après-midi" : "Bonne soirée"; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const SEJOUR_MIN = Math.min(...SEED.map(startAbs));
const SEJOUR_MAX = Math.max(...SEED.map(endAbs));

/* ======================================================================= */
/* Composants de base                                                       */
/* ======================================================================= */
function Avatar({ id, size = 30 }) {
  const p = person(id);
  return (
    <div title={p.name} style={{ width: size, height: size, borderRadius: T.r.pill, background: p.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.5, flex: "0 0 auto" }}>{p.emoji}</div>
  );
}
function AvatarRow({ ids, size = 26 }) {
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {ids.map((id, i) => (
        <div key={id} style={{ marginLeft: i === 0 ? 0 : -8, boxShadow: `0 0 0 2px ${T.c.ring}`, borderRadius: T.r.pill }}>
          <Avatar id={id} size={size} />
        </div>
      ))}
    </div>
  );
}
function TypeChip({ type, small = false }) {
  const t = TYPES[type];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: t.soft, color: t.color, padding: small ? "3px 9px" : "5px 12px", borderRadius: T.r.pill, fontFamily: fD, fontWeight: 600, fontSize: small ? 12 : 13, lineHeight: 1 }}>
      <span style={{ fontSize: small ? 12 : 14 }}>{t.emoji}</span>{t.label}
    </span>
  );
}
function Row({ icon, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, fontFamily: fB, fontSize: 14.5, color: T.c.inkSoft }}>
      <span style={{ flex: "0 0 auto" }}>{icon}</span>
      <span style={{ minWidth: 0 }}>{children}</span>
    </div>
  );
}
function SectionTitle({ children, right }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "2px 0 8px" }}>
      <span style={{ fontFamily: fD, fontWeight: 600, color: T.c.inkSoft, fontSize: 14 }}>{children}</span>
      {right}
    </div>
  );
}
function UnreadBadge({ n, light }) {
  if (!n) return null;
  return (
    <span style={{ minWidth: 18, height: 18, padding: "0 5px", borderRadius: T.r.pill, background: T.c.coral, color: "#fff", fontFamily: fD, fontWeight: 700, fontSize: 11, lineHeight: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 0 2px ${light ? "#ffffff55" : T.c.ring}`, flex: "0 0 auto", animation: "vpop .18s ease-out" }}>{n > 9 ? "9+" : n}</span>
  );
}

/* ---- Photos ------------------------------------------------------------ */
function PhotoTile({ photo, size, onClick }) {
  const ctx = React.useContext(PhotoCtx);
  const [armed, setArmed] = useState(false);
  const pressRef = useRef(null);
  const longRef = useRef(false);
  const startRef = useRef(null);
  const autoRef = useRef(null);
  const monRole = (person(ME) || {}).role || "participant";
  const canDel = !!(ctx && ctx.del) && !photo.uploading && (photo.who === ME || monRole === "organisateur" || monRole === "co-éditeur");
  const finPresse = () => { if (pressRef.current) { clearTimeout(pressRef.current); pressRef.current = null; } };
  const desarmer = () => { setArmed(false); if (autoRef.current) { clearTimeout(autoRef.current); autoRef.current = null; } };
  useEffect(() => () => { finPresse(); if (autoRef.current) clearTimeout(autoRef.current); }, []);
  const debut = (e) => {
    if (!canDel || armed) return;
    startRef.current = { x: e.clientX || 0, y: e.clientY || 0 };
    longRef.current = false;
    finPresse();
    pressRef.current = setTimeout(() => { longRef.current = true; setArmed(true); autoRef.current = setTimeout(() => setArmed(false), 4000); }, 550);
  };
  const bouge = (e) => {
    if (!pressRef.current || !startRef.current) return;
    if (Math.abs((e.clientX || 0) - startRef.current.x) > 10 || Math.abs((e.clientY || 0) - startRef.current.y) > 10) finPresse();
  };
  const clic = () => {
    if (longRef.current) { longRef.current = false; return; }
    if (armed) { desarmer(); return; }
    if (onClick) onClick();
  };
  const tags = photo.tags || [];
  const reactions = photo.reactions || {};
  let reactCount = 0; Object.keys(reactions).forEach((pid) => { reactCount += (reactions[pid] || []).length; });
  const media = photo.url
    ? <img src={photo.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
    : <div style={{ width: "100%", height: "100%", background: PHOTO_TONE[photo.tone], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>{photo.emoji}</div>;
  return (
    <div style={{ position: "relative", aspectRatio: "1 / 1", width: size || "100%", borderRadius: T.r.md, overflow: "hidden", boxShadow: T.sh.card, background: T.c.lineSoft }}>
    <button onClick={clic} onPointerDown={debut} onPointerMove={bouge} onPointerUp={finPresse} onPointerLeave={finPresse} onPointerCancel={() => { finPresse(); }}
      onContextMenu={(e) => { if (canDel) e.preventDefault(); }}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", borderRadius: T.r.md, overflow: "hidden", cursor: onClick ? "pointer" : "default", border: "none", padding: 0, background: T.c.lineSoft, display: "block", WebkitTouchCallout: "none", WebkitUserSelect: "none", userSelect: "none", touchAction: "manipulation" }}>
      {media}
      {photo.uploading && <span style={{ position: "absolute", inset: 0, background: "rgba(6,14,18,0.35)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: fD, fontWeight: 600, fontSize: 11 }}>Envoi...</span>}
      {photo.failed && <span style={{ position: "absolute", top: 5, right: 5, background: T.c.coral, color: "#fff", borderRadius: T.r.pill, padding: "2px 7px", fontFamily: fD, fontWeight: 700, fontSize: 10 }}>Échec</span>}
      {reactCount > 0 && !photo.uploading && (
        <span style={{ position: "absolute", top: 5, right: 5, background: "rgba(6,14,18,0.55)", color: "#fff", borderRadius: T.r.pill, padding: "2px 7px", fontFamily: fD, fontWeight: 700, fontSize: 10, display: "inline-flex", alignItems: "center", gap: 3 }}>❤ {reactCount}</span>
      )}
      {photo.who && !photo.uploading && (
        <span style={{ position: "absolute", left: 5, bottom: 5, borderRadius: T.r.pill, boxShadow: "0 0 0 2px rgba(255,255,255,0.85)" }}><Avatar id={photo.who} size={18} /></span>
      )}
      {tags.length > 0 && (
        <span style={{ position: "absolute", left: 5, bottom: 5, display: "flex" }}>
          {tags.slice(0, 3).map((id, i) => (
            <span key={id} style={{ marginLeft: i === 0 ? 0 : -6, boxShadow: `0 0 0 2px ${T.c.ring}`, borderRadius: T.r.pill }}><Avatar id={id} size={18} /></span>
          ))}
        </span>
      )}
    </button>
      {armed && (
        <div onClick={desarmer} style={{ position: "absolute", inset: 0, background: "rgba(214,60,44,0.82)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, animation: "vfade .14s ease-out", cursor: "pointer" }}>
          <button onClick={(e) => { e.stopPropagation(); desarmer(); if (ctx && ctx.del) ctx.del(photo.id); }} aria-label="Supprimer cette photo"
            style={{ cursor: "pointer", border: "none", background: "#fff", color: "#C4392B", width: 38, height: 38, borderRadius: T.r.pill, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
            <Trash2 size={17} />
          </button>
          <span style={{ fontFamily: fD, fontWeight: 700, fontSize: 10, color: "#fff" }}>Supprimer</span>
        </div>
      )}
    </div>
  );
}
const PHOTO_LOT_MAX = 20;
function readAndDownscale(file, cb, onFail) {
  const rate = () => { if (onFail) onFail(); };
  try {
    const reader = new FileReader();
    reader.onerror = rate;
    reader.onload = () => {
      const img = new Image();
      img.onerror = rate;
      img.onload = () => {
        const max = 1280;
        let w = img.width, h = img.height;
        if (w > h && w > max) { h = Math.round(h * max / w); w = max; }
        else if (h > max) { w = Math.round(w * max / h); h = max; }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        cb(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  } catch (e) { rate(); }
}
function lireLot(e, onEach, onDone) {
  const files = [...((e.target && e.target.files) || [])].slice(0, PHOTO_LOT_MAX);
  if (e.target) e.target.value = "";
  if (!files.length) return;
  let i = 0;
  const suite = () => {
    if (i >= files.length) { if (onDone) onDone(files.length); return; }
    const f = files[i]; i += 1;
    readAndDownscale(f, (url) => { if (url) onEach(url); setTimeout(suite, 0); }, () => setTimeout(suite, 0));
  };
  suite();
}
const PhotoCtx = React.createContext(null);
function AddPhotoTile({ onPick }) {
  const ref = useRef(null);
  return (
    <>
      <input ref={ref} type="file" accept="image/*" multiple style={{ display: "none" }}
        onChange={(e) => lireLot(e, onPick)} />
      <button onClick={() => ref.current && ref.current.click()} aria-label="Ajouter des photos" style={{ aspectRatio: "1 / 1", cursor: "pointer", borderRadius: T.r.md, border: `2px dashed ${T.c.line}`, background: T.c.lineSoft, color: T.c.inkSoft, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
        <ImagePlus size={20} />
        <span style={{ fontFamily: fB, fontSize: 11 }}>Ajouter</span>
      </button>
    </>
  );
}
function PhotoGrid({ photos, onAdd, onOpen, cols = 3 }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 8 }}>
      {photos.map((ph) => <PhotoTile key={ph.id} photo={ph} onClick={onOpen ? () => onOpen(ph, photos) : undefined} />)}
      {onAdd && <AddPhotoTile onPick={onAdd} />}
    </div>
  );
}
function PhotoViewer({ photos, startId, onClose, onToggleTag, onReact, onDelete }) {
  const list = [...(photos || [])].sort((a, b) => (b.at || 0) - (a.at || 0));
  const idx0 = Math.max(0, list.findIndex((p) => p.id === startId));
  const [idx, setIdx] = useState(idx0);
  const [confirmDel, setConfirmDel] = useState(false);
  const scRef = useRef(null);
  useEffect(() => { const el = scRef.current; if (el) el.scrollLeft = idx0 * el.clientWidth; }, []);
  useEffect(() => { setConfirmDel(false); }, [idx]);
  const photo = list[Math.min(idx, Math.max(0, list.length - 1))];
  if (!startId || !photo) return null;
  const tags = photo.tags || [];
  const roster = ROSTER.filter((p) => p.active);
  const reactions = photo.reactions || {};
  const counts = {}; const mineSet = new Set(reactions[ME] || []);
  Object.keys(reactions).forEach((pid) => (reactions[pid] || []).forEach((em) => { counts[em] = (counts[em] || 0) + 1; }));
  const myRole = (person(ME) || {}).role || "participant";
  const canDelete = onDelete && (photo.who === ME || myRole === "organisateur" || myRole === "co-éditeur");
  const doDelete = () => {
    if (!confirmDel) { setConfirmDel(true); setTimeout(() => setConfirmDel(false), 3200); return; }
    setConfirmDel(false);
    onDelete(photo.id);
    if (list.length <= 1) onClose();
  };
  const note = photo.uploading ? "Envoi en cours..." : photo.failed ? "Envoi impossible, visible sur cet appareil." : photo.remote || (photo.url && !String(photo.url).startsWith("data:")) ? "Partagée avec le groupe." : "Enregistrée sur cet appareil.";
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(6,14,18,0.94)", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "calc(10px + env(safe-area-inset-top)) 14px 6px" }}>
        <span style={{ fontFamily: fD, fontWeight: 700, color: "#fff", fontSize: 16 }}>Photo {Math.min(idx, list.length - 1) + 1}/{list.length}</span>
        <span style={{ display: "inline-flex", gap: 8 }}>
          {canDelete && (
            <button onClick={doDelete} aria-label="Supprimer la photo" style={{ cursor: "pointer", border: "none", background: confirmDel ? T.c.coral : "#ffffff22", color: "#fff", height: 38, minWidth: 38, padding: confirmDel ? "0 13px" : 0, borderRadius: T.r.pill, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: fD, fontWeight: 700, fontSize: 12.5 }}>
              <Trash2 size={17} />{confirmDel ? "Supprimer ?" : ""}
            </button>
          )}
          <button onClick={onClose} aria-label="Fermer" style={{ cursor: "pointer", border: "none", background: "#ffffff22", color: "#fff", width: 38, height: 38, borderRadius: T.r.pill, display: "flex", alignItems: "center", justifyContent: "center" }}><X size={20} /></button>
        </span>
      </div>
      <div ref={scRef} onScroll={(e) => { const el = e.currentTarget; const i = clamp(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)), 0, list.length - 1); if (i !== idx) setIdx(i); }}
        style={{ flex: 1, minHeight: 0, display: "flex", overflowX: "auto", scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}>
        {list.map((p) => (
          <div key={p.id} style={{ flex: "0 0 100%", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 12px", scrollSnapAlign: "start", minWidth: 0 }}>
            {p.url ? <img src={p.url} alt="" style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: T.r.lg, objectFit: "contain" }} /> : <div style={{ fontSize: 90 }}>{p.emoji}</div>}
          </div>
        ))}
      </div>
      <div style={{ padding: "14px 16px calc(18px + env(safe-area-inset-bottom))" }}>
        {onReact && (
          <div style={{ display: "flex", gap: 7, marginBottom: 10, flexWrap: "wrap" }}>
            {REACTIONS.map((em) => {
              const on = mineSet.has(em); const n = counts[em] || 0;
              return (
                <button key={em} onClick={() => onReact(photo.id, em)} style={{ cursor: "pointer", border: on ? "1px solid #ffffffcc" : "1px solid #ffffff33", background: on ? "#ffffff26" : "#ffffff0d", color: "#fff", borderRadius: T.r.pill, padding: "6px 11px", fontFamily: fD, fontWeight: 600, fontSize: 14, display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <span style={{ fontSize: 16 }}>{em}</span>{n > 0 ? " " + n : ""}
                </button>
              );
            })}
          </div>
        )}
        {Object.keys(counts).length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
            {REACTIONS.filter((em) => (counts[em] || 0) > 0).map((em) => (
              <span key={em} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 13 }}>{em}</span>
                {Object.keys(reactions).filter((pid) => (reactions[pid] || []).includes(em)).map((pid) => <Avatar key={pid} id={pid} size={17} />)}
              </span>
            ))}
          </div>
        )}
        <div style={{ fontFamily: fB, color: "#ffffffcc", fontSize: 13, marginBottom: 9 }}>Qui est sur la photo ?</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {roster.map((p) => {
            const on = tags.includes(p.id);
            return (
              <button key={p.id} onClick={() => onToggleTag(photo.id, p.id)} style={{ cursor: "pointer", border: on ? `2px solid ${(META[p.id] && META[p.id].color) || T.c.sea}` : "1px solid #ffffff33", background: on ? "#ffffff1f" : "#ffffff0d", color: "#fff", borderRadius: T.r.pill, padding: "5px 12px 5px 5px", display: "inline-flex", alignItems: "center", gap: 7 }}>
                <Avatar id={p.id} size={22} />
                <span style={{ fontFamily: fB, fontSize: 13 }}>{person(p.id).name}</span>
                {on && <Check size={14} color="#fff" />}
              </button>
            );
          })}
        </div>
        <div style={{ fontFamily: fB, color: "#ffffff88", fontSize: 11.5, marginTop: 10 }}>{note}</div>
      </div>
    </div>
  );
}
const pollVotersOf = (m, oid) => Object.keys(m.votes || {}).filter((pid) => ((m.votes || {})[pid] || []).includes(oid));
const isPoll = (m) => m.kind === "poll" || (!!m.q && Array.isArray(m.opts));
const leadOptionOf = (m) => {
  const counts = {};
  Object.values(m.votes || {}).forEach((arr) => (arr || []).forEach((oid) => { counts[oid] = (counts[oid] || 0) + 1; }));
  let best = null, bestN = -1;
  (m.opts || []).forEach((o) => { const n = counts[o.id] || 0; if (n > bestN) { best = o; bestN = n; } });
  return best;
};
function PollComposer({ scope, onCreate, onCancel }) {
  const [q, setQ] = useState("");
  const [opts, setOpts] = useState(["", ""]);
  const [multi, setMulti] = useState(false);
  const [allowComments, setAllowComments] = useState(false);
  const clean = opts.map((o) => o.trim()).filter(Boolean);
  const ok = q.trim().length > 0 && clean.length >= 2;
  const optField = { fontFamily: fB, fontSize: 14, color: T.c.ink, flex: 1, minWidth: 0, boxSizing: "border-box", padding: "9px 11px", border: `1px solid ${T.c.line}`, borderRadius: T.r.md, background: T.c.card, outline: "none" };
  const settingRow = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 };
  const settingLbl = { fontFamily: fB, fontSize: 13.5, color: T.c.inkSoft };
  return (
    <div style={{ background: T.c.card, border: `1px solid ${T.c.line}`, borderRadius: T.r.lg, padding: "13px 14px", display: "flex", flexDirection: "column", gap: 10, boxShadow: T.sh.card }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <span style={{ width: 30, height: 30, borderRadius: T.r.pill, background: T.c.seaSoft, display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>
          <BarChart3 size={15} color={T.c.seaDeep} />
        </span>
        <span style={{ fontFamily: fD, fontWeight: 700, color: T.c.ink, fontSize: 15.5, flex: 1 }}>Nouveau sondage</span>
        <button onClick={onCancel} aria-label="Annuler le sondage" style={{ cursor: "pointer", border: "none", background: T.c.lineSoft, color: T.c.inkSoft, width: 30, height: 30, borderRadius: T.r.pill, display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}><X size={16} /></button>
      </div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Posez votre question au groupe"
        style={{ fontFamily: fD, fontWeight: 600, fontSize: 15, color: T.c.ink, width: "100%", boxSizing: "border-box", padding: "11px 13px", border: `1.5px solid ${q.trim() ? T.c.sea : T.c.line}`, borderRadius: T.r.md, background: T.c.card, outline: "none", transition: "border-color .15s ease" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {opts.map((o, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 26, height: 26, borderRadius: T.r.pill, background: T.c.lineSoft, color: T.c.inkSoft, display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: fD, fontWeight: 700, fontSize: 12.5, flex: "0 0 auto" }}>{String.fromCharCode(65 + i)}</span>
            <input style={optField} value={o} onChange={(e) => setOpts((l) => l.map((x, j) => (j === i ? e.target.value : x)))} placeholder={i === 0 ? "Première option" : i === 1 ? "Deuxième option" : "Autre option"} />
            {opts.length > 2 && (
              <button onClick={() => setOpts((l) => l.filter((_, j) => j !== i))} aria-label={`Retirer l'option ${String.fromCharCode(65 + i)}`} style={{ cursor: "pointer", border: "none", background: "transparent", color: T.c.inkFaint, width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto", padding: 0 }}><X size={15} /></button>
            )}
          </div>
        ))}
        {opts.length < 5 && (
          <button onClick={() => setOpts((l) => [...l, ""])} style={{ cursor: "pointer", border: "none", background: "transparent", color: T.c.seaDeep, padding: "3px 0 0 34px", fontFamily: fD, fontWeight: 600, fontSize: 13, textAlign: "left" }}>+ Ajouter une option</button>
        )}
      </div>
      <div style={{ borderTop: `1px solid ${T.c.lineSoft}`, paddingTop: 10, display: "flex", flexDirection: "column", gap: 9 }}>
        <div style={settingRow}>
          <span style={settingLbl}>Plusieurs réponses possibles</span>
          <Toggle on={multi} onClick={() => setMulti(!multi)} />
        </div>
        <div style={settingRow}>
          <span style={settingLbl}>Autoriser les commentaires</span>
          <Toggle on={allowComments} onClick={() => setAllowComments(!allowComments)} />
        </div>
      </div>
      <button onClick={() => { if (ok) onCreate(scope, q.trim(), clean, multi, allowComments); }} disabled={!ok}
        style={{ cursor: ok ? "pointer" : "default", border: "none", background: ok ? T.c.sea : T.c.line, color: "#fff", borderRadius: T.r.pill, padding: "12px", fontFamily: fD, fontWeight: 700, fontSize: 14.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <Send size={16} /> Lancer le sondage
      </button>
    </div>
  );
}
function PollBubble({ m, onVote, onClosePoll, onPollToActivity, onComment }) {
  const p = person(m.who);
  const mine = m.who === ME;
  const [ctext, setCtext] = useState("");
  const total = Object.values(m.votes || {}).filter((v) => (v || []).length > 0).length;
  const myRole = (person(ME) || {}).role || "participant";
  const canClose = !m.closed && (mine || myRole === "organisateur" || myRole === "co-éditeur");
  const canCreate = m.scope === "general" && (myRole === "organisateur" || myRole === "co-éditeur") && total > 0 && onPollToActivity;
  const lead = m.closed ? leadOptionOf(m) : null;
  const comments = m.comments || [];
  const sendComment = () => { const t = ctext.trim(); if (!t || !onComment) return; onComment(m.id, t); setCtext(""); };
  return (
    <div style={{ display: "flex", gap: 9 }}>
      <Avatar id={m.who} size={30} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: fD, fontWeight: 600, fontSize: 12, color: mine ? T.c.inkFaint : p.color, margin: "0 0 2px 2px" }}>
          {mine ? "Vous" : p.name}  ·  sondage{m.closed ? " (clos)" : ""}
        </div>
        <div style={{ background: T.c.lineSoft, borderRadius: 16, borderBottomLeftRadius: 4, padding: "11px 13px" }}>
          <div style={{ fontFamily: fD, fontWeight: 700, color: T.c.ink, fontSize: 15, marginBottom: 3 }}>{m.q}</div>
          <div style={{ fontFamily: fB, color: T.c.inkFaint, fontSize: 11.5, marginBottom: 9 }}>
            {m.multi ? "Plusieurs réponses possibles  ·  " : ""}{total} vote{total > 1 ? "s" : ""}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {m.opts.map((o) => {
              const voters = pollVotersOf(m, o.id);
              const pct = total ? Math.round((voters.length / total) * 100) : 0;
              const iVoted = voters.includes(ME);
              const isLead = lead && lead.id === o.id;
              return (
                <button key={o.id} onClick={() => { if (!m.closed) onVote(m.id, o.id); }} disabled={m.closed}
                  style={{ position: "relative", overflow: "hidden", textAlign: "left", cursor: m.closed ? "default" : "pointer", border: iVoted || isLead ? `2px solid ${T.c.sea}` : `1px solid ${T.c.line}`, background: T.c.card, borderRadius: T.r.md, padding: "9px 11px" }}>
                  <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, background: `${T.c.sea}22` }} />
                  <span style={{ position: "relative", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ flex: 1, minWidth: 0, fontFamily: fB, fontSize: 14, color: T.c.ink, fontWeight: iVoted || isLead ? 600 : 400 }}>{o.label}</span>
                    {voters.slice(0, 4).map((id, i) => (
                      <span key={id} style={{ marginLeft: i === 0 ? 0 : -8, borderRadius: T.r.pill, boxShadow: `0 0 0 2px ${T.c.card}` }}><Avatar id={id} size={19} /></span>
                    ))}
                    <span style={{ fontFamily: fD, fontWeight: 700, fontSize: 12, color: T.c.inkSoft, flex: "0 0 auto", minWidth: 30, textAlign: "right" }}>{pct}%</span>
                    {iVoted && <Check size={15} color={T.c.sea} style={{ flex: "0 0 auto" }} />}
                  </span>
                </button>
              );
            })}
          </div>
          {m.allowComments && (
            <div style={{ marginTop: 11, borderTop: `1px solid ${T.c.line}`, paddingTop: 10 }}>
              <div style={{ fontFamily: fD, fontWeight: 700, fontSize: 12, color: T.c.inkSoft, marginBottom: comments.length ? 8 : 6 }}>Commentaires{comments.length ? ` (${comments.length})` : ""}</div>
              {comments.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 9 }}>
                  {comments.map((c) => {
                    const cp = person(c.who);
                    return (
                      <div key={c.id} style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
                        <Avatar id={c.who} size={22} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontFamily: fD, fontWeight: 700, fontSize: 12, color: c.who === ME ? T.c.inkSoft : cp.color }}>{c.who === ME ? "Vous" : cp.name}</span>
                          <span style={{ fontFamily: fB, fontSize: 13.5, color: T.c.ink, marginLeft: 6 }}>{c.text}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {onComment && (
                <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
                  <input value={ctext} onChange={(e) => setCtext(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendComment()} placeholder="Ajouter un commentaire" style={{ flex: 1, minWidth: 0, fontFamily: fB, fontSize: 13.5, color: T.c.ink, padding: "8px 12px", border: `1px solid ${T.c.line}`, borderRadius: T.r.pill, outline: "none", background: T.c.card }} />
                  <button onClick={sendComment} aria-label="Envoyer le commentaire" style={{ cursor: "pointer", border: "none", background: T.c.sea, color: "#fff", width: 34, height: 34, borderRadius: T.r.pill, display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}><Send size={15} /></button>
                </div>
              )}
            </div>
          )}
          {(canClose || canCreate) && (
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              {canClose && <button onClick={() => onClosePoll(m.id)} style={{ flex: 1, cursor: "pointer", border: `1px solid ${T.c.line}`, background: T.c.card, color: T.c.inkSoft, borderRadius: T.r.md, padding: "8px", fontFamily: fD, fontWeight: 600, fontSize: 12.5 }}>Clore le sondage</button>}
              {canCreate && <button onClick={() => onPollToActivity(m)} style={{ flex: 1, cursor: "pointer", border: "none", background: T.c.sea, color: "#fff", borderRadius: T.r.md, padding: "8px", fontFamily: fD, fontWeight: 700, fontSize: 12.5 }}>Créer l'activité</button>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---- Devine le lieu ----------------------------------------------------- */
const isGuess = (m) => m.kind === "guess";
const isLoc = (m) => m.kind === "loc";
function LocBubble({ m }) {
  const p = person(m.who);
  const d = new Date(m.at);
  const c = { lat: m.lat, lng: m.lng };
  return (
    <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
      <Avatar id={m.who} size={30} />
      <div style={{ flex: 1, minWidth: 0, background: T.c.card, border: `1px solid ${T.c.line}`, borderRadius: T.r.lg, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 12px 7px" }}>
          <MapPin size={15} color={T.c.sea} />
          <span style={{ fontFamily: fD, fontWeight: 700, fontSize: 13.5, color: T.c.ink, flex: 1 }}>{p.name} est là</span>
          <span style={{ fontFamily: fB, fontSize: 11, color: T.c.inkFaint }}>{fmtMin(d.getHours() * 60 + d.getMinutes())}</span>
        </div>
        <MapPreview coord={c} name={`Position de ${p.name}`} />
        <a href={dirUrl(c)} target="_blank" rel="noreferrer" style={{ display: "block", textAlign: "center", padding: "9px", fontFamily: fD, fontWeight: 700, fontSize: 13, color: T.c.seaDeep, textDecoration: "none", borderTop: `1px solid ${T.c.lineSoft}` }}>M'y rejoindre</a>
      </div>
    </div>
  );
}
const isVibe = (m) => m.kind === "vibe";
const vibeTotal = (m) => Object.values((m && m.hits) || {}).reduce((a, b) => a + (b || 0), 0);
function VibeLine({ m }) {
  const hits = m.hits || {};
  const pids = Object.keys(hits).filter((p) => hits[p] > 0);
  const total = vibeTotal(m);
  if (total === 0) return null;
  const names = pids.slice(0, 3).map((p) => (p === ME ? "vous" : person(p).name)).join(", ");
  return (
    <div style={{ textAlign: "center", fontFamily: fB, fontSize: 12, color: T.c.inkFaint, padding: "1px 0" }}>
      🤩 {total} · On est bien ici · {names}{pids.length > 3 ? ` et ${pids.length - 3} autres` : ""}
    </div>
  );
}
function GuessComposer({ scope, onCreate, onCancel }) {
  const [url, setUrl] = useState(null);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);
  const field = { fontFamily: fB, fontSize: 14.5, color: T.c.ink, width: "100%", boxSizing: "border-box", padding: "10px 12px", border: `1px solid ${T.c.line}`, borderRadius: T.r.md, background: T.c.card, outline: "none" };
  const ok = url && answer.trim().length > 0 && !busy;
  const launch = async () => {
    if (!ok) return;
    setBusy(true); setError("");
    try { await onCreate(scope, url, answer.trim()); }
    catch (e) { setBusy(false); setError("Envoi impossible pour le moment. Réessayez."); }
  };
  return (
    <div style={{ background: T.c.lineSoft, borderRadius: T.r.lg, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: fD, fontWeight: 700, color: T.c.ink, fontSize: 14.5 }}>
        <MapPin size={16} color={T.c.sea} /> Devine le lieu
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) readAndDownscale(f, setUrl); e.target.value = ""; }} />
      {url ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={url} alt="" style={{ width: 56, height: 56, borderRadius: T.r.md, objectFit: "cover" }} />
          <button onClick={() => fileRef.current && fileRef.current.click()} style={{ cursor: "pointer", border: `1px solid ${T.c.line}`, background: T.c.card, color: T.c.seaDeep, borderRadius: T.r.pill, padding: "8px 13px", fontFamily: fD, fontWeight: 600, fontSize: 12.5 }}>Changer la photo</button>
        </div>
      ) : (
        <button onClick={() => fileRef.current && fileRef.current.click()} style={{ cursor: "pointer", border: `1px dashed ${T.c.line}`, background: "transparent", color: T.c.seaDeep, borderRadius: T.r.md, padding: "12px", fontFamily: fD, fontWeight: 600, fontSize: 13 }}>Choisir la photo mystère</button>
      )}
      <input style={field} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="La réponse (gardée secrète)" />
      {error && <div style={{ fontFamily: fB, color: T.c.coralDeep, fontSize: 12.5 }}>{error}</div>}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onCancel} style={{ flex: 1, cursor: "pointer", border: `1px solid ${T.c.line}`, background: T.c.card, color: T.c.inkSoft, borderRadius: T.r.md, padding: "10px", fontFamily: fD, fontWeight: 600, fontSize: 13.5 }}>Annuler</button>
        <button onClick={launch} disabled={!ok} style={{ flex: 1, cursor: ok ? "pointer" : "default", border: "none", background: ok ? T.c.sea : T.c.line, color: "#fff", borderRadius: T.r.md, padding: "10px", fontFamily: fD, fontWeight: 700, fontSize: 13.5 }}>{busy ? "Envoi..." : "Lancer le jeu"}</button>
      </div>
    </div>
  );
}
function GuessBubble({ m, onGuess, onReveal }) {
  const p = person(m.who);
  const mine = m.who === ME;
  const guesses = m.guesses || {};
  const myGuess = (guesses[ME] || {}).text || "";
  const [txt, setTxt] = useState(myGuess);
  const players = Object.keys(guesses).filter((pid) => guesses[pid] && guesses[pid].text);
  const myRole = (person(ME) || {}).role || "participant";
  const canReveal = !m.closed && (mine || myRole === "organisateur" || myRole === "co-éditeur");
  const send = () => { const t = txt.trim(); if (t && onGuess) onGuess(m.id, t); };
  return (
    <div style={{ display: "flex", gap: 9 }}>
      <Avatar id={m.who} size={30} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: fD, fontWeight: 600, fontSize: 12, color: mine ? T.c.inkFaint : p.color, margin: "0 0 2px 2px" }}>
          {mine ? "Vous" : p.name}  ·  devine le lieu{m.closed ? " (révélé)" : ""}
        </div>
        <div style={{ background: T.c.lineSoft, borderRadius: 16, borderBottomLeftRadius: 4, padding: "11px 13px" }}>
          {m.url && <img src={m.url} alt="" style={{ width: "100%", maxHeight: 230, objectFit: "cover", borderRadius: T.r.md, display: "block", marginBottom: 9 }} />}
          <div style={{ fontFamily: fD, fontWeight: 700, color: T.c.ink, fontSize: 15, marginBottom: 7 }}>Où est-ce ?</div>
          {m.closed ? (
            <>
              <div style={{ fontFamily: fD, fontWeight: 700, color: T.c.seaDeep, fontSize: 14.5, marginBottom: 8 }}>Réponse : {m.answer}</div>
              {players.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {players.map((pid) => (
                    <div key={pid} style={{ display: "flex", gap: 7, alignItems: "center" }}>
                      <Avatar id={pid} size={20} />
                      <span style={{ fontFamily: fB, fontSize: 13.5, color: T.c.ink }}><span style={{ fontFamily: fD, fontWeight: 700, fontSize: 12, color: T.c.inkSoft }}>{person(pid).name} : </span>{guesses[pid].text}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : mine ? (
            <>
              <div style={{ fontFamily: fB, color: T.c.inkFaint, fontSize: 12.5, marginBottom: 8 }}>{players.length > 0 ? `${players.length} proposition${players.length > 1 ? "s" : ""} reçue${players.length > 1 ? "s" : ""} :` : "En attente de propositions."}</div>
              {players.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 4 }}>
                  {players.map((pid) => (
                    <div key={pid} style={{ display: "flex", gap: 7, alignItems: "center" }}>
                      <Avatar id={pid} size={20} />
                      <span style={{ fontFamily: fB, fontSize: 13.5, color: T.c.ink }}>{guesses[pid].text}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ display: "flex", gap: 7, alignItems: "center", marginBottom: players.length ? 8 : 0 }}>
                <input value={txt} onChange={(e) => setTxt(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Votre proposition" style={{ flex: 1, minWidth: 0, fontFamily: fB, fontSize: 13.5, color: T.c.ink, padding: "8px 12px", border: `1px solid ${T.c.line}`, borderRadius: T.r.pill, outline: "none", background: T.c.card }} />
                <button onClick={send} aria-label="Proposer" style={{ cursor: "pointer", border: "none", background: T.c.sea, color: "#fff", width: 34, height: 34, borderRadius: T.r.pill, display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}><Check size={16} /></button>
              </div>
              {myGuess && <div style={{ fontFamily: fB, color: T.c.sea, fontSize: 12, marginBottom: players.length ? 6 : 0 }}>Votre réponse est enregistrée. Modifiable jusqu'à la révélation.</div>}
              {players.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {players.slice(0, 6).map((pid, i) => <span key={pid} style={{ marginLeft: i === 0 ? 0 : -7 }}><Avatar id={pid} size={19} /></span>)}
                  <span style={{ fontFamily: fB, fontSize: 12, color: T.c.inkFaint, marginLeft: 5 }}>ont proposé</span>
                </div>
              )}
            </>
          )}
          {canReveal && (
            <button onClick={() => onReveal(m.id)} style={{ marginTop: 10, width: "100%", cursor: "pointer", border: "none", background: T.c.sea, color: "#fff", borderRadius: T.r.md, padding: "8px", fontFamily: fD, fontWeight: 700, fontSize: 12.5 }}>Révéler la réponse</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---- Message : bulle et saisie ---------------------------------------- */
const REACTIONS = ["❤️", "👍", "😂", "🔥", "😮", "🙏"];
function MessageBubble({ m, onReact }) {
  const mine = m.who === ME;
  const p = person(m.who);
  const [pick, setPick] = useState(false);
  const reactions = m.reactions || {};
  const counts = {}; const mineSet = new Set(reactions[ME] || []);
  Object.keys(reactions).forEach((pid) => (reactions[pid] || []).forEach((em) => { counts[em] = (counts[em] || 0) + 1; }));
  const chips = REACTIONS.filter((em) => counts[em]);
  const react = (em) => { if (onReact) onReact(m.id, em); setPick(false); };
  return (
    <div style={{ display: "flex", gap: 9, flexDirection: mine ? "row-reverse" : "row" }}>
      <Avatar id={m.who} size={30} />
      <div style={{ maxWidth: "78%", display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start" }}>
        <div style={{ fontFamily: fD, fontWeight: 600, fontSize: 12, color: mine ? T.c.inkFaint : p.color, margin: mine ? "0 2px 2px 0" : "0 0 2px 2px", textAlign: mine ? "right" : "left" }}>{mine ? "Vous" : p.name}</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, flexDirection: mine ? "row-reverse" : "row" }}>
          <div style={{
            fontFamily: fB, fontSize: 14.5, color: mine ? "#fff" : T.c.ink,
            background: mine ? T.c.sea : T.c.lineSoft, padding: "9px 13px",
            borderRadius: 16, borderBottomRightRadius: mine ? 4 : 16, borderBottomLeftRadius: mine ? 16 : 4,
          }}>{m.text}</div>
          {onReact && (
            <button onClick={() => setPick(!pick)} aria-label="Réagir" style={{ flex: "0 0 auto", cursor: "pointer", border: "none", background: "transparent", color: T.c.inkFaint, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.7 }}>
              <SmilePlus size={16} />
            </button>
          )}
        </div>
        {pick && onReact && (
          <div style={{ display: "flex", gap: 4, background: T.c.card, border: `1px solid ${T.c.line}`, borderRadius: T.r.pill, padding: "5px 7px", boxShadow: T.sh.soft, marginTop: 5 }}>
            {REACTIONS.map((em) => (
              <button key={em} onClick={() => react(em)} style={{ cursor: "pointer", border: "none", background: mineSet.has(em) ? T.c.seaSoft : "transparent", borderRadius: T.r.pill, width: 32, height: 32, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>{em}</button>
            ))}
          </div>
        )}
        {chips.length > 0 && (
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 5, justifyContent: mine ? "flex-end" : "flex-start" }}>
            {chips.map((em) => {
              const on = mineSet.has(em);
              return (
                <button key={em} onClick={() => onReact && onReact(m.id, em)} style={{ cursor: "pointer", border: on ? `1px solid ${T.c.sea}` : `1px solid ${T.c.line}`, background: on ? T.c.seaSoft : T.c.card, color: T.c.ink, borderRadius: T.r.pill, padding: "2px 8px", fontFamily: fD, fontWeight: 600, fontSize: 12.5, display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 13 }}>{em}</span> {counts[em]}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
function MessageInput({ onSend, scope, onCreatePoll, onShareLocation }) {
  const [text, setText] = useState("");
  const [pollOpen, setPollOpen] = useState(false);
  const [locBusy, setLocBusy] = useState(false);
  const [locErr, setLocErr] = useState(false);
  const send = () => { const t = text.trim(); if (!t) return; onSend(scope, t); setText(""); };
  const shareLoc = async () => {
    if (locBusy) return;
    setLocBusy(true); setLocErr(false);
    try { await onShareLocation(scope); } catch (e) { setLocErr(true); setTimeout(() => setLocErr(false), 3500); }
    setLocBusy(false);
  };
  if (pollOpen) return <PollComposer scope={scope} onCreate={(s, q, opts, multi, allowComments) => { onCreatePoll(s, q, opts, multi, allowComments); setPollOpen(false); }} onCancel={() => setPollOpen(false)} />;
  return (
    <div>
      {locErr && <div style={{ fontFamily: fB, fontSize: 12, color: T.c.coralDeep, padding: "0 4px 6px" }}>Position indisponible. Vérifiez l'autorisation de localisation.</div>}
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      {onCreatePoll && (
        <button onClick={() => setPollOpen(true)} aria-label="Lancer un sondage" style={{ cursor: "pointer", border: `1px solid ${T.c.line}`, background: T.c.card, color: T.c.inkSoft, width: 42, height: 42, borderRadius: T.r.pill, display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>
          <BarChart3 size={18} />
        </button>
      )}
      {onShareLocation && (
        <button onClick={shareLoc} aria-label="Je suis là : partager ma position" title="Je suis là" style={{ cursor: "pointer", border: `1px solid ${T.c.line}`, background: T.c.card, color: locBusy ? T.c.inkFaint : T.c.inkSoft, width: 42, height: 42, borderRadius: T.r.pill, display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>
          <MapPin size={18} style={locBusy ? { animation: "vbreath 1s ease-in-out infinite" } : undefined} />
        </button>
      )}
      <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
        placeholder="Écrire un message" style={{ flex: 1, minWidth: 0, fontFamily: fB, fontSize: 14.5, color: T.c.ink, padding: "11px 14px", border: `1px solid ${T.c.line}`, borderRadius: T.r.pill, outline: "none", background: T.c.card }} />
      <button onClick={send} aria-label="Envoyer" style={{ cursor: "pointer", border: "none", background: T.c.sea, color: "#fff", width: 42, height: 42, borderRadius: T.r.pill, display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>
        <Send size={18} />
      </button>
    </div>
    </div>
  );
}

/* ---- Fil de discussion (dans une fiche d'activité) --------------------- */
function Thread({ scope, messages, onSend, emptyLabel, pollHandlers }) {
  const list = messages.filter((m) => m.scope === scope);
  const ph = pollHandlers || {};
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {list.length === 0 && (
        <div style={{ fontFamily: fB, color: T.c.inkFaint, fontSize: 13.5, padding: "6px 0" }}>{emptyLabel}</div>
      )}
      {list.map((m) => isVibe(m)
        ? <VibeLine key={m.id} m={m} />
        : isLoc(m)
        ? <LocBubble key={m.id} m={m} />
        : isPoll(m)
        ? <PollBubble key={m.id} m={m} onVote={ph.onVote} onClosePoll={ph.onClosePoll} onPollToActivity={ph.onPollToActivity} onComment={ph.onComment} />
        : isGuess(m)
        ? <GuessBubble key={m.id} m={m} onGuess={ph.onGuess} onReveal={ph.onReveal} />
        : <MessageBubble key={m.id} m={m} onReact={ph.onReact} />)}
      <div style={{ marginTop: 2 }}><MessageInput onSend={onSend} scope={scope} onCreatePoll={ph.onCreatePoll} onShareLocation={ph.onShareLocation} /></div>
    </div>
  );
}

/* ---- Carte OpenStreetMap ---------------------------------------------- */
const IS_IOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent || "");
const dirUrl = (c) => IS_IOS
  ? `https://maps.apple.com/?daddr=${c.lat},${c.lng}&dirflg=d`
  : `https://www.google.com/maps/dir/?api=1&destination=${c.lat}%2C${c.lng}`;
const dirUrlFor = (place) => {
  if (place && place.coord) return dirUrl(place.coord);
  const q = encodeURIComponent((place && place.name) || "");
  return IS_IOS ? `https://maps.apple.com/?daddr=${q}&dirflg=d` : `https://www.google.com/maps/dir/?api=1&destination=${q}`;
};
const placeUrl = (c, name) => IS_IOS
  ? `https://maps.apple.com/?q=${encodeURIComponent(name || "Lieu")}&ll=${c.lat},${c.lng}`
  : `https://www.google.com/maps/search/?api=1&query=${c.lat}%2C${c.lng}`;

function MapPreview({ coord, name }) {
  if (!coord) return null;
  const d = 0.006;
  const bbox = `${coord.lng - d}%2C${coord.lat - d}%2C${coord.lng + d}%2C${coord.lat + d}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${coord.lat}%2C${coord.lng}`;
  return (
    <div style={{ borderRadius: T.r.lg, overflow: "hidden", border: `1px solid ${T.c.line}` }}>
      <div style={{ position: "relative", height: 150 }}>
        <iframe title={`Carte de ${name}`} src={src} loading="lazy" style={{ width: "100%", height: 150, border: 0, display: "block" }} />
        <a href={placeUrl(coord, name)} target="_blank" rel="noreferrer" aria-label="Ouvrir dans Plans" style={{ position: "absolute", inset: 0 }} />
      </div>
      <a href={dirUrl(coord)} target="_blank" rel="noreferrer" style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        padding: "11px", background: T.c.seaSoft, color: T.c.seaDeep, textDecoration: "none",
        fontFamily: fD, fontWeight: 600, fontSize: 14.5,
      }}>
        <Navigation size={16} /> Itinéraire
      </a>
    </div>
  );
}

/* ======================================================================= */
/* Arc du soleil                                                            */
/* ======================================================================= */
function sunTimes(lat, lng, d) {
  const rad = Math.PI / 180;
  const startYear = new Date(d.getFullYear(), 0, 0);
  const doy = Math.floor((d - startYear) / 864e5);
  const decl = -23.44 * Math.cos(rad * (360 / 365) * (doy + 10));
  const cosH = (Math.cos(90.833 * rad) - Math.sin(lat * rad) * Math.sin(decl * rad)) / (Math.cos(lat * rad) * Math.cos(decl * rad));
  if (cosH < -1 || cosH > 1) return null;
  const H = Math.acos(cosH) / rad;
  const B = rad * (360 / 365) * (doy - 81);
  const eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
  const noon = 720 - 4 * lng - eot - d.getTimezoneOffset();
  return { sunrise: Math.round(noon - 4 * H), sunset: Math.round(noon + 4 * H) };
}
const wmoIcon = (c) => {
  if (c === 0) return Sun;
  if (c <= 2) return CloudSun;
  if (c === 3) return Cloud;
  if (c <= 48) return CloudFog;
  if (c <= 57) return CloudDrizzle;
  if (c <= 67) return CloudRain;
  if (c <= 77) return CloudSnow;
  if (c <= 82) return CloudRain;
  if (c <= 86) return CloudSnow;
  return CloudLightning;
};
const LAND_PALETTE = {
  mer: "#4E9EBD", ville: "#8C9BA8", ski: "#9FC6DE",
  rando: "#B98F63", mariage: "#D8B4A8", detente: "#D9BC82", anniversaire: "#C79ED6",
};
const LAND_BASEOP = (t) => (t === "ville" ? 0.20 : t === "rando" ? 0.26 : 0.30);
function Landscape({ type, night }) {
  const c = T.c;
  const t = LAND_PALETTE[type] ? type : "mer";
  const col = LAND_PALETTE[t];
  const baseOp = LAND_BASEOP(t);
  const op = night ? baseOp * 0.45 : baseOp;
  const gid = "ground-" + t;
  const figOp = night ? 0.4 : 0.58;
  const ink = c.inkSoft;
  const firework = (bx, by, colr, delay, sc) => (
    <g key={"fw" + bx} opacity="0.5" style={{ transformOrigin: `${bx}px ${by}px`, animation: `vbreath 3.6s ease-in-out ${delay}s infinite` }}>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
        const rad = (a * Math.PI) / 180;
        return <line key={a} x1={bx + 2.2 * sc * Math.cos(rad)} y1={by + 2.2 * sc * Math.sin(rad)} x2={bx + 6.2 * sc * Math.cos(rad)} y2={by + 6.2 * sc * Math.sin(rad)} stroke={colr} strokeWidth="1" strokeLinecap="round" />;
      })}
      <circle cx={bx} cy={by} r="0.8" fill={colr} />
    </g>
  );
  let deco = null, fig = null;
  if (t === "ville") {
    const gauche = [[14, 13, 18], [31, 10, 26], [45, 15, 13], [64, 11, 21], [79, 14, 10]];
    const droite = [[226, 13, 12], [243, 11, 24], [258, 16, 15], [278, 12, 20], [294, 13, 9]];
    deco = (
      <g>
        {[...gauche, ...droite].map(([bx, bw, bh], i) => (
          <rect key={i} x={bx} y={92 - bh} width={bw} height={bh} rx="1" fill={ink} opacity={i % 2 ? 0.10 : 0.14} />
        ))}
        {night && [[34, 70], [67, 75], [246, 72], [281, 76]].map(([wx2, wy2], i) => (
          <rect key={"f" + i} x={wx2} y={wy2} width="2.4" height="3.2" fill={c.sun} opacity="0.5" style={{ animation: `vblink ${3.2 + i}s ease-in-out ${i * 0.9}s infinite` }} />
        ))}
      </g>
    );
    fig = (
      <g style={{ animation: "vdrift 13s ease-in-out infinite alternate" }}>
      <g transform="translate(-13, 0)">
        <circle cx="100" cy="89.3" r="2.7" fill="none" stroke={ink} strokeWidth="1.7" />
        <circle cx="110" cy="89.3" r="2.7" fill="none" stroke={ink} strokeWidth="1.7" />
        <path d="M 100 89.3 L 104 85.2 L 109 85.2 L 110 89.3 M 104 85.2 L 105.6 89.3 L 100 89.3" fill="none" stroke={ink} strokeWidth="1.55" strokeLinejoin="round" />
        <path d="M 109 85.2 L 109.9 83.4 M 109.1 83.3 L 110.7 83.5" fill="none" stroke={ink} strokeWidth="1.35" strokeLinecap="round" />
        <path d="M 103.2 84.4 L 105.2 84.4" stroke={ink} strokeWidth="1.55" strokeLinecap="round" />
        <circle cx="107.9" cy="78.9" r="1.55" fill={ink} />
        <rect x="105.2" y="80.2" width="3" height="5" rx="1.5" fill={ink} transform="rotate(30 106.7 82.7)" />
        <rect x="104.4" y="84.6" width="1.7" height="3.4" rx="0.85" fill={ink} transform="rotate(18 105.25 86.3)" />
        <path d="M 107.7 81 L 109.5 83.5" stroke={ink} strokeWidth="1.3" strokeLinecap="round" />
      </g>
      </g>
    );
  } else if (t === "ski") {
    deco = (
      <g>
        <path d="M 0 92 L 30 58 L 64 92 Z" fill={c.sky} opacity="0.16" />
        <path d="M 34 92 L 66 48 L 104 92 Z" fill={c.sea} opacity="0.13" />
        <path d="M 30 58 L 36.5 66.5 L 31 64.5 L 25 67 Z" fill="#ffffff" opacity="0.7" />
        <path d="M 66 48 L 73 57 L 67 54.5 L 60 58 Z" fill="#ffffff" opacity="0.7" />
        <path d="M 218 92 L 252 54 L 292 92 Z" fill={c.sea} opacity="0.13" />
        <path d="M 262 92 L 292 62 L 320 92 Z" fill={c.sky} opacity="0.16" />
        <path d="M 252 54 L 259 62.5 L 253 60 L 246 63 Z" fill="#ffffff" opacity="0.7" />
      </g>
    );
    fig = (
      <g transform="translate(86, 70) rotate(30)">
        <rect x="-5.5" y="0.6" width="11.4" height="1.25" rx="0.62" fill={ink} />
        <circle cx="2.3" cy="-7.6" r="1.6" fill={ink} />
        <rect x="-0.6" y="-6.8" width="3" height="5.4" rx="1.5" fill={ink} transform="rotate(18 0.9 -4.1)" />
        <rect x="-1.9" y="-2.6" width="2.6" height="3.4" rx="1.3" fill={ink} transform="rotate(-14 -0.6 -0.9)" />
        <path d="M 2.6 -5.2 L 5.4 0.4" stroke={ink} strokeWidth="1.05" strokeLinecap="round" />
      </g>
    );
  } else if (t === "rando") {
    deco = (
      <g>
        <path d="M 0 92 Q 42 68 84 92 Z" fill={c.sea} opacity="0.13" />
        <path d="M 210 92 Q 258 64 320 92 Z" fill={c.sea} opacity="0.15" />
        <path d="M 96 78 L 101 87 L 91 87 Z" fill={c.sea} opacity="0.26" />
        <path d="M 96 82 L 102.5 92 L 89.5 92 Z" fill={c.sea} opacity="0.26" />
        <path d="M 110 83 L 114 90 L 106 90 Z" fill={c.sea} opacity="0.22" />
        <path d="M 110 86 L 115 92 L 105 92 Z" fill={c.sea} opacity="0.22" />
        <g style={{ animation: "vdrift 15s ease-in-out infinite alternate" }}>
          <path d="M 226 26 q 3 -2.6 6 0 q 3 -2.6 6 0" fill="none" stroke={ink} strokeWidth="1.1" opacity="0.42" strokeLinecap="round" />
        </g>
      </g>
    );
    fig = (
      <g transform="translate(238, 80.7) rotate(-8)">
        <circle cx="0.5" cy="-9.9" r="1.6" fill={ink} />
        <rect x="-1.1" y="-8.4" width="3" height="5.2" rx="1.5" fill={ink} transform="rotate(10 0.4 -5.8)" />
        <rect x="-0.3" y="-3.8" width="1.9" height="4.4" rx="0.95" fill={ink} transform="rotate(-22 0.65 -1.6)" />
        <rect x="-1.7" y="-3.8" width="1.9" height="4.2" rx="0.95" fill={ink} transform="rotate(26 -0.75 -1.7)" />
        <path d="M 2.2 -5.6 L 3.5 0.3" stroke={ink} strokeWidth="1.05" strokeLinecap="round" />
        <rect x="-2.5" y="-8" width="1.9" height="3.1" rx="0.9" fill={ink} transform="rotate(8 -1.55 -6.4)" />
      </g>
    );
  } else if (t === "mariage") {
    deco = (
      <g>
        <path d="M 0 92 Q 46 76 92 92 Z" fill={c.sun} opacity="0.11" />
        <path d="M 224 92 Q 272 74 320 92 Z" fill={c.coral} opacity="0.10" />
        {firework(40, 24, c.coral, 0, 1)}
        {firework(63, 37, c.sun, 1.3, 0.68)}
        {firework(277, 20, c.sea, 0.7, 1)}
        {firework(255, 35, c.coral, 1.9, 0.62)}
      </g>
    );
    fig = (
      <g transform="translate(79, 88.1)">
      <g style={{ animation: "vfloat 7s ease-in-out infinite" }}>
        <circle cx="-2.3" cy="-8.7" r="1.5" fill={ink} />
        <path d="M -2.3 -7.2 L -4.4 0 L -0.4 0 Z" fill={ink} />
        <circle cx="2.4" cy="-9.2" r="1.6" fill={ink} />
        <rect x="1.4" y="-7.7" width="2" height="7.7" rx="1" fill={ink} />
        <path d="M -1.3 -4.8 L 1.5 -5" stroke={ink} strokeWidth="1" strokeLinecap="round" />
      </g>
      </g>
    );
  } else if (t === "detente") {
    deco = (
      <g>
        <path d="M 0 92 Q 46 74 92 92 Z" fill={c.sea} opacity="0.13" />
        <path d="M 228 92 Q 274 72 320 92 Z" fill={c.sea} opacity="0.15" />
        <g style={{ animation: "vdrift 15s ease-in-out infinite alternate" }}>
          <path d="M 64 26 q 3 -2.6 6 0 q 3 -2.6 6 0" fill="none" stroke={ink} strokeWidth="1.1" opacity="0.42" strokeLinecap="round" />
        </g>
        <g style={{ animation: "vdrift 18s ease-in-out infinite alternate-reverse" }}>
          <path d="M 248 20 q 2.6 -2.2 5.2 0 q 2.6 -2.2 5.2 0" fill="none" stroke={ink} strokeWidth="1" opacity="0.38" strokeLinecap="round" />
        </g>
      </g>
    );
    fig = (
      <g>
        <g transform="translate(80, 92) rotate(-7)">
          <g style={{ animation: "vsway 10s ease-in-out infinite alternate" }}>
            <path d="M -7 -7 A 7 7 0 0 1 7 -7 Z" fill={ink} />
            <path d="M 0 -7 L 0 0.6" stroke={ink} strokeWidth="1.15" strokeLinecap="round" />
          </g>
        </g>
        <rect x="92.5" y="86.2" width="11" height="1.4" rx="0.7" fill={ink} />
        <path d="M 95.4 87.6 L 93.6 92 M 100.6 87.6 L 102.4 92" stroke={ink} strokeWidth="1.1" strokeLinecap="round" />
        <rect x="90.6" y="88.9" width="3.7" height="1.15" rx="0.57" fill={ink} />
        <rect x="101.7" y="88.9" width="3.7" height="1.15" rx="0.57" fill={ink} />
      </g>
    );
  } else if (t === "anniversaire") {
    const balloons = [[26, 64, c.coral, 0], [33, 71, c.sun, 1.4], [41, 65, c.sea, 0.7], [281, 60, c.sun, 1.1], [290, 67, c.coral, 0.3], [298, 61, c.sea, 1.8]];
    deco = (
      <g>
        <path d="M 0 92 Q 46 76 92 92 Z" fill={c.sun} opacity="0.11" />
        <path d="M 226 92 Q 274 74 320 92 Z" fill={c.coral} opacity="0.10" />
        {balloons.map(([bx, by, bc, dl], i) => (
          <g key={i} style={{ transformOrigin: `${bx}px ${by}px`, animation: `vfloat ${5.5 + i}s ease-in-out ${dl}s infinite` }}>
            <path d={`M ${bx} ${by + 2.6} Q ${bx + 1.4} ${by + 8} ${bx - 1} ${by + 12}`} fill="none" stroke={c.inkFaint} strokeWidth="0.8" opacity="0.5" />
            <ellipse cx={bx} cy={by} rx="2.3" ry="2.8" fill={bc} opacity="0.55" />
          </g>
        ))}
      </g>
    );
    fig = (
      <g>
        <rect x="226.5" y="85.2" width="16" height="1.5" rx="0.75" fill={ink} />
        <path d="M 229.5 86.7 L 228.5 92 M 239.5 86.7 L 240.5 92" stroke={ink} strokeWidth="1.15" strokeLinecap="round" />
        <rect x="231.4" y="81.4" width="6.6" height="3.8" rx="1" fill={ink} />
        <path d="M 234.7 81.4 L 234.7 79.1" stroke={ink} strokeWidth="1" strokeLinecap="round" />
        <circle cx="234.7" cy="78.3" r="0.85" fill={ink} style={{ animation: "vtwinkle 2.4s ease-in-out infinite" }} />
        <g style={{ animation: "vfloat 5.5s ease-in-out infinite" }}>
          <circle cx="220" cy="79.4" r="1.9" fill={ink} />
          <path d="M 218 77.7 L 220 73.6 L 222 77.7 Z" fill={ink} />
          <path d="M 218.5 81.5 L 221.5 81.5 L 222.2 87.7 L 217.8 87.7 Z" fill={ink} />
          <rect x="218.2" y="87.5" width="1.2" height="4.6" rx="0.6" fill={ink} />
          <rect x="220.5" y="87.5" width="1.2" height="4.6" rx="0.6" fill={ink} />
          <rect x="215.6" y="76.8" width="1.2" height="4.8" rx="0.6" fill={ink} transform="rotate(-42 216.2 79)" />
          <rect x="223.1" y="76.8" width="1.2" height="4.8" rx="0.6" fill={ink} transform="rotate(42 223.7 79)" />
        </g>
      </g>
    );
  } else {
    deco = (
      <g>
        <path d="M 0 92 Q 34 81 70 92 Z" fill={c.sea} opacity="0.13" />
        <path d="M 262 92 Q 292 79 320 92 Z" fill={c.sea} opacity="0.15" />
      </g>
    );
    fig = (
      <g style={{ transformOrigin: "250px 91px", animation: "vsway 7s ease-in-out infinite alternate" }}>
        <path d="M 242 91 L 258 91 L 254.5 94 L 245.5 94 Z" fill={ink} />
        <path d="M 249.5 90.5 L 249.5 79 L 242.5 90.5 Z" fill={ink} />
        <path d="M 251.5 90.5 L 251.5 81.5 L 257.5 90.5 Z" fill={ink} />
      </g>
    );
  }
  return (
    <g>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={col} stopOpacity={op} />
          <stop offset="1" stopColor={col} stopOpacity={op * 0.55} />
        </linearGradient>
      </defs>
      <rect x="0" y="92.4" width="320" height="25.6" fill={"url(#" + gid + ")"} />
      {deco}
      <g opacity={figOp}>{fig}</g>
    </g>
  );
}
function SunArc({ now, wx, coord, endMin }) {
  const dISO = isoPlusDays(SETTINGS.startISO, clamp(dayOfNow(now), 0, DAYS.length - 1));
  const st = coord ? sunTimes(coord.lat, coord.lng, new Date(dISO + "T12:00:00")) : null;
  const sunrise = st ? st.sunrise : 6.5 * 60, sunset = st ? st.sunset : 21.5 * 60;
  const mid = minsInDay(now);
  const p = clamp((mid - sunrise) / (sunset - sunrise), 0, 1);
  const theta = (1 - p) * Math.PI;
  const cx = 160, cy = 92, rx = 118, ry = 70;
  const x = cx + rx * Math.cos(theta), y = cy - ry * Math.sin(theta);
  const night = mid < sunrise || mid > sunset;
  const dIdx = clamp(dayOfNow(now), 0, DAYS.length - 1);
  const dateLabel = DAYS[dIdx] ? DAYS[dIdx].long : "";
  const glowColor = night ? T.c.sky : T.c.sun;
  const infoTxt = { fontFamily: fD, fontWeight: 600, fontSize: 12, fill: T.c.inkSoft, fontVariantNumeric: "tabular-nums" };
  const WIcon = wx && wx.t != null ? wmoIcon(wx.code) : null;
  let SIcon = null, sColor = T.c.sea, sValue = null;
  if (wx) {
    const t = SETTINGS.tripType || "mer";
    if (t === "mer" && wx.wind != null) { SIcon = Wind; sValue = `${Math.round(wx.wind)} km/h`; }
    else if (t === "rando" && wx.rain != null) { SIcon = Umbrella; sValue = `${Math.round(wx.rain)}%`; }
    else if (wx.app != null) { SIcon = Thermometer; sColor = T.c.coral; sValue = `${Math.round(wx.app)}°`; }
  }
  const stars = [[48, 26], [96, 13], [160, 8], [224, 13], [272, 26]];
  const lpT = LAND_PALETTE[SETTINGS.tripType] ? SETTINGS.tripType : "mer";
  const lpHex = LAND_PALETTE[lpT] + Math.round(LAND_BASEOP(lpT) * (night ? 0.45 : 1) * 0.55 * 255).toString(16).padStart(2, "0");
  return (
    <div style={{ position: "relative" }}>
    <svg viewBox="0 0 320 118" aria-hidden="true" style={{ display: "block", width: "calc(100% + 36px)", height: "auto", margin: "0 -18px" }}>
      <defs>
        <linearGradient id="arcTrail" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={T.c.sun} stopOpacity="0.45" />
          <stop offset="0.55" stopColor={T.c.sun} stopOpacity="0.95" />
          <stop offset="1" stopColor={T.c.coral} stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="horizonGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={T.c.inkFaint} stopOpacity="0" />
          <stop offset="0.12" stopColor={T.c.inkFaint} stopOpacity="0.55" />
          <stop offset="0.88" stopColor={T.c.inkFaint} stopOpacity="0.55" />
          <stop offset="1" stopColor={T.c.inkFaint} stopOpacity="0" />
        </linearGradient>
        <radialGradient id="skyGlow" cx="0.5" cy="1" r="0.95">
          <stop offset="0" stopColor={glowColor} stopOpacity={night ? 0.14 : 0.24} />
          <stop offset="0.55" stopColor={glowColor} stopOpacity={night ? 0.06 : 0.11} />
          <stop offset="1" stopColor={glowColor} stopOpacity="0" />
        </radialGradient>
        <clipPath id="aboveHorizon"><rect x="0" y="0" width="320" height="92" /></clipPath>
        <radialGradient id="sunGlow">
          <stop offset="0" stopColor={glowColor} stopOpacity="0.5" />
          <stop offset="0.55" stopColor={glowColor} stopOpacity="0.18" />
          <stop offset="1" stopColor={glowColor} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="160" cy="92" rx="150" ry="84" fill="url(#skyGlow)" clipPath="url(#aboveHorizon)" />
      <Landscape type={SETTINGS.tripType || "mer"} night={night} />
      {night && stars.map(([sx, sy], i) => (
        <circle key={i} cx={sx} cy={sy} r={i % 2 ? 1.3 : 1.8} fill={T.c.sky} opacity="0.7" style={{ transformOrigin: `${sx}px ${sy}px`, animation: `vbreath ${3.5 + i * 0.7}s ease-in-out ${i * 0.5}s infinite` }} />
      ))}
      <path d="M 42 92 A 118 70 0 0 1 278 92" fill="none" stroke={T.c.sun} strokeOpacity={night ? 0.26 : 0.48} strokeWidth="2.8" strokeDasharray="2 7" strokeLinecap="round" />
      {!night && p > 0.01 && (
        <path d="M 42 92 A 118 70 0 0 1 278 92" fill="none" stroke="url(#arcTrail)" strokeWidth="3.6" pathLength="100" strokeDasharray={`${(p * 100).toFixed(1)} 100`} strokeLinecap="round" />
      )}
      <line x1="14" y1="92" x2="306" y2="92" stroke="url(#horizonGrad)" strokeWidth="2.4" />
      <text x="160" y="60" textAnchor="middle" style={{ fontFamily: fD, fontWeight: 600, fontSize: 11.5, letterSpacing: 0.6, fill: T.c.inkFaint }}>{dateLabel}</text>
      <text x="160" y="86" textAnchor="middle" style={{ fontFamily: fD, fontWeight: 700, fontSize: 22, fill: T.c.ink, fontVariantNumeric: "tabular-nums" }}>{pad(Math.floor(mid / 60))}h{pad(mid % 60)}</text>
      {endMin != null && endMin > mid && !night && (() => {
        const pe = (endMin - sunrise) / (sunset - sunrise);
        if (pe <= 0.02 || pe >= 0.98) return null;
        const te = (1 - pe) * Math.PI;
        return <circle cx={cx + rx * Math.cos(te)} cy={cy - ry * Math.sin(te)} r="3.2" fill="none" stroke={T.c.coral} strokeWidth="2" opacity="0.8" />;
      })()}
      <circle cx={x} cy={y} r="30" fill="url(#sunGlow)" />
      <circle cx={x} cy={y} r="15" fill={glowColor} opacity="0.2" style={{ transformOrigin: `${x}px ${y}px`, animation: "vbreath 5.5s ease-in-out infinite" }} />
      <circle cx={x} cy={y} r="9" fill={glowColor} />
      {(() => {
        const groups = [];
        if (st) groups.push({ Icon: Sunrise, color: T.c.sun, value: fmtMin(st.sunrise) });
        if (WIcon) groups.push({ Icon: WIcon, color: T.c.sun, value: `${Math.round(wx.t)}°` });
        if (SIcon) groups.push({ Icon: SIcon, color: sColor, value: sValue });
        if (st) groups.push({ Icon: Sunset, color: T.c.coral, value: fmtMin(st.sunset) });
        return groups.map((g, i) => {
          const gx = 160 + (i - (groups.length - 1) / 2) * 72;
          const w = 17 + g.value.length * 6.6;
          const ix = gx - w / 2;
          const GIcon = g.Icon;
          return (
            <g key={i}>
              <GIcon x={ix} y={97} width={13} height={13} color={g.color} strokeWidth={2.2} />
              <text x={ix + 17} y="107.5" textAnchor="start" style={infoTxt}>{g.value}</text>
            </g>
          );
        });
      })()}
    </svg>
    <div aria-hidden style={{ position: "absolute", left: -18, right: -18, top: "100%", height: 58, zIndex: -1, pointerEvents: "none", background: `linear-gradient(to bottom, ${lpHex}, transparent)` }} />
    </div>
  );
}

/* Carte principale : prochaine activité */
function PollBanner({ count, onOpen, light }) {
  if (!count) return null;
  return (
    <button onClick={(e) => { e.stopPropagation(); onOpen(); }} style={{
      width: "100%", textAlign: "left", cursor: "pointer", marginTop: 11,
      display: "flex", alignItems: "center", gap: 9, borderRadius: T.r.md, padding: "10px 12px",
      ...(light ? { background: "#ffffff26", color: "#fff", border: "none" } : { background: T.c.sunSoft, color: T.c.ink, border: `1px solid ${T.c.sun}55` }),
    }}>
      <BarChart3 size={16} color={light ? "#fff" : T.c.sun} style={{ flex: "0 0 auto" }} />
      <span style={{ flex: 1, minWidth: 0, fontFamily: fD, fontWeight: 600, fontSize: 13.5 }}>
        {count > 1 ? `${count} sondages à répondre` : "Un sondage vous attend"}
      </span>
      <span style={{ fontFamily: fB, fontSize: 12, opacity: 0.75, flex: "0 0 auto" }}>répondre</span>
    </button>
  );
}

const BURST_EMOJIS = ["🤩", "✨", "🎉", "❤️", "😍", "🙌"];
function QuickActions({ event, unread, onOpen, onDiscuss, onAddPhoto, onVibe, vibeCount, light, onJoin, going }) {
  const fileRef = useRef(null);
  const [burst, setBurst] = useState([]);
  const burstTimer = useRef(null);
  const spawnBurst = () => {
    const items = Array.from({ length: 8 }, (_, i) => ({
      id: Math.random().toString(36).slice(2),
      e: BURST_EMOJIS[Math.floor(Math.random() * BURST_EMOJIS.length)],
      dx: Math.round(-38 + Math.random() * 76),
      rot: Math.round(-45 + Math.random() * 90),
      delay: i * 45,
      dur: 780 + Math.round(Math.random() * 320),
    }));
    setBurst((l) => [...l, ...items]);
    if (burstTimer.current) clearTimeout(burstTimer.current);
    burstTimer.current = setTimeout(() => setBurst([]), 1700);
  };
  const t = TYPES[event.type];
  const base = {
    position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
    padding: "9px 10px", borderRadius: T.r.pill, fontFamily: fD, fontWeight: 600, fontSize: 12.5,
    cursor: "pointer", textDecoration: "none", flex: 1, minWidth: 0, border: "none",
    ...(light ? { background: "#ffffff40", color: "#fff" } : { background: t.soft, color: t.deep }),
  };
  const stop = (e) => e.stopPropagation();
  const sep = light ? "#ffffff33" : T.c.line;
  const iconColor = light ? "#fff" : t.color;
  return (
    <div onClick={stop}>
      <div style={{ height: 1, background: sep, margin: "13px 0 11px" }} />
      <div style={{ display: "flex", gap: 8 }}>
        {event.place && (event.place.coord || (event.place.name && event.place.name !== "À définir")) && (
          <a href={dirUrlFor(event.place)} target="_blank" rel="noreferrer" onClick={stop} style={base}>
            <Navigation size={15} color={iconColor} /> Itinéraire
          </a>
        )}
        <button onClick={(e) => { stop(e); (onDiscuss || onOpen)(); }} style={base}>
          <MessageCircle size={15} color={iconColor} /> Discussion
          {unread > 0 && (
            <span style={{ position: "absolute", top: -5, right: -3, minWidth: 17, height: 17, padding: "0 4px", borderRadius: T.r.pill, background: T.c.coral, color: "#fff", fontFamily: fD, fontWeight: 700, fontSize: 10.5, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 2px #fff", animation: "vpop .18s ease-out" }}>{unread > 9 ? "9+" : unread}</span>
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }}
          onChange={(e) => lireLot(e, (url) => onAddPhoto(event.id, url))} />
        {onJoin ? (
          <button onClick={(e) => { stop(e); onJoin(); }} style={base}>
            {going ? <><UserMinus size={15} color={iconColor} /> Je passe</> : <><UserPlus size={15} color={iconColor} /> Je reviens</>}
          </button>
        ) : (
          <button onClick={(e) => { stop(e); if (fileRef.current) fileRef.current.click(); }} style={base}>
            <ImagePlus size={15} color={iconColor} /> Photo
          </button>
        )}
        {onVibe && featureOn("quickvibe") && (
          <button onClick={(e) => { stop(e); spawnBurst(); onVibe(); }} aria-label="J'adore" title="J'adore" style={{ ...base, flex: "0 0 auto", padding: "9px 12px", gap: 5 }}>
            <span style={{ fontSize: 15 }}>🤩</span> J'adore
            {vibeCount > 0 && <span style={{ fontFamily: fD, fontWeight: 700, fontSize: 12.5 }}>{vibeCount}</span>}
            {burst.map((b) => (
              <span key={b.id} style={{ position: "absolute", left: "50%", top: 0, fontSize: 17, pointerEvents: "none", opacity: 0, animation: `vburst ${b.dur}ms ease-out ${b.delay}ms forwards`, "--dx": b.dx + "px", "--rot": b.rot + "deg" }}>{b.e}</span>
            ))}
          </button>
        )}
      </div>
    </div>
  );
}

function NextCard({ event, now, onOpen, onDiscuss, onAddPhoto, onVibe, vibeCount, unread, openPolls, onJoin, going }) {
  const t = TYPES[event.type];
  const mins = startAbs(event) - now;
  return (
    <div onClick={onOpen} role="button" tabIndex={0} style={{ width: "100%", textAlign: "left", cursor: "pointer", background: T.c.card, borderRadius: T.r.xl, padding: 20, boxShadow: T.sh.soft }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: fB, fontWeight: 600, color: T.c.inkFaint, fontSize: 12, letterSpacing: 0.6 }}>PROCHAINE ACTIVITÉ</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <UnreadBadge n={unread} />
          <TypeChip type={event.type} small />
        </span>
      </div>
      <h2 style={{ fontFamily: fD, fontWeight: 700, color: T.c.ink, fontSize: 31, lineHeight: 1.1, margin: "12px 0 12px" }}>{event.title}</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        <Row icon={<MapPin size={17} color={t.color} />}>
          <b style={{ color: T.c.ink, fontWeight: 600 }}>{event.place.name}</b>
          {event.place.area ? <span>  {event.place.area}</span> : null}
        </Row>
        <Row icon={<Clock3 size={17} color={t.color} />}>{hFr(event.start)} à {hFr(event.end)}</Row>
      </div>
      <div style={{ marginTop: 16, background: t.color, borderRadius: T.r.lg, padding: "13px 18px", color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: fB, fontWeight: 500, fontSize: 14, opacity: 0.94 }}>
          <Timer size={19} color="#ffffffd0" /> Ça commence dans
        </span>
        <span style={{ fontFamily: fD, fontWeight: 700, fontSize: 25, fontVariantNumeric: "tabular-nums" }}>{remainingLabel(mins)}</span>
      </div>
      <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <AvatarRow ids={attendeesOf(event)} size={28} />
        {!iAmIn(event) && <span style={{ fontFamily: fB, fontSize: 12.5, color: T.c.inkFaint }}>vous passez votre tour</span>}
      </div>
      <PollBanner count={openPolls} onOpen={onOpen} />
      <QuickActions event={event} unread={unread} onOpen={onOpen} onDiscuss={onDiscuss} onAddPhoto={onAddPhoto} onJoin={onJoin} going={going} />
    </div>
  );
}

/* Carte pleine : activité en cours */
function CurrentHero({ event, now, onOpen, onDiscuss, onAddPhoto, onVibe, vibeCount, unread, openPolls }) {
  const [showPresence, setShowPresence] = useState(false);
  const t = TYPES[event.type];
  const total = Math.max(1, endAbs(event) - startAbs(event));
  const progress = clamp((now - startAbs(event)) / total, 0, 1);
  const remain = endAbs(event) - now;
  return (
    <div onClick={onOpen} role="button" tabIndex={0} style={{
      width: "100%", textAlign: "left", cursor: "pointer",
      background: `linear-gradient(140deg, ${t.color}, ${t.deep})`,
      borderRadius: T.r.xl, padding: "13px 15px", color: "#fff", boxShadow: T.sh.soft,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 9, fontFamily: fB, fontWeight: 600, fontSize: 12, letterSpacing: 0.6, opacity: 0.96 }}>
          <span style={{ width: 8, height: 8, borderRadius: T.r.pill, background: "#fff", boxShadow: "0 0 0 4px #ffffff40" }} /> EN CE MOMENT
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <UnreadBadge n={unread} light />
          <span style={{ fontSize: 24 }}>{t.emoji}</span>
        </span>
      </div>
      <h2 style={{ fontFamily: fD, fontWeight: 700, fontSize: 22, lineHeight: 1.12, margin: "5px 0 7px" }}>{event.title}</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, fontFamily: fB, fontSize: 13.5, opacity: 1 }}>
        {(() => {
          const p = event.place || {};
          const t = (event.title || "").toLowerCase();
          const label = p.name && !t.includes(p.name.toLowerCase()) ? p.name + (p.area ? `  ${p.area}` : "") : (p.area || null);
          return label ? <span style={{ display: "flex", alignItems: "center", gap: 8 }}><MapPin size={16} color="#ffffffe6" /> {label}</span> : null;
        })()}
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Clock3 size={16} color="#ffffffe6" /> {hFr(event.start)} à {hFr(event.end)}</span>
      </div>
      <div style={{ marginTop: 11 }}>
        <div style={{ height: 7, borderRadius: T.r.pill, background: "#ffffff3d", overflow: "hidden" }}>
          <div style={{ width: `${progress * 100}%`, height: "100%", background: remain <= 30 ? T.c.coral : "#fff", borderRadius: T.r.pill, transition: "width .8s linear, background .6s ease" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
            <span style={{ fontFamily: fB, fontSize: 12.5, opacity: 1 }}>Se termine dans</span>
            <span style={{ fontFamily: fD, fontWeight: 700, fontSize: 20, fontVariantNumeric: "tabular-nums" }}>{remainingLabel(remain)}</span>
          </span>
          <span role="button" tabIndex={0} aria-label="Voir les participants" onClick={(e) => { e.stopPropagation(); setShowPresence(true); }} style={{ cursor: "pointer" }}><AvatarRow ids={attendeesOf(event)} size={26} /></span>
        </div>
      </div>
      <PollBanner count={openPolls} onOpen={onOpen} light />
      <QuickActions event={event} unread={unread} onOpen={onOpen} onDiscuss={onDiscuss} onAddPhoto={onAddPhoto} onVibe={onVibe} vibeCount={vibeCount} light />
      {showPresence && (
        <div onClick={(e) => { e.stopPropagation(); setShowPresence(false); }} style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(12,28,38,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 26 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: T.c.card, color: T.c.ink, borderRadius: T.r.lg, padding: 18, width: "100%", maxWidth: 320, maxHeight: "70%", overflowY: "auto", boxShadow: T.sh.lift }}>
            <div style={{ fontFamily: fD, fontWeight: 700, fontSize: 16, marginBottom: 12 }}>{event.title}</div>
            <div style={{ fontFamily: fD, fontWeight: 700, fontSize: 11.5, letterSpacing: 0.6, color: T.c.inkFaint, marginBottom: 9 }}>PRÉSENTS · {attendeesOf(event).length}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {attendeesOf(event).map((id) => (
                <div key={id} style={{ display: "flex", alignItems: "center", gap: 9 }}><Avatar id={id} size={26} /><span style={{ fontFamily: fB, fontSize: 14, color: T.c.ink }}>{person(id).name}</span></div>
              ))}
              {attendeesOf(event).length === 0 && <span style={{ fontFamily: fB, fontSize: 13, color: T.c.inkFaint }}>Personne pour l'instant.</span>}
            </div>
            {skipOf(event).length > 0 && (
              <>
                <div style={{ fontFamily: fD, fontWeight: 700, fontSize: 11.5, letterSpacing: 0.6, color: T.c.inkFaint, margin: "15px 0 9px" }}>PASSENT LEUR TOUR · {skipOf(event).length}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {skipOf(event).map((id) => (
                    <div key={id} style={{ display: "flex", alignItems: "center", gap: 9, opacity: 0.55 }}><Avatar id={id} size={26} /><span style={{ fontFamily: fB, fontSize: 14, color: T.c.ink }}>{person(id).name}</span></div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ======================================================================= */
/* Écran : Maintenant                                                       */
/* ======================================================================= */
function NightCard({ nxt, dIdx, onOpen, unread }) {
  const later = nxt ? DAYS[nxt.day] : null;
  const sameDay = !!(nxt && nxt.day === dIdx);
  const tomorrow = !!(nxt && nxt.day === dIdx + 1);
  const title = !nxt ? "Le séjour touche à sa fin" : sameDay ? "La nuit est calme" : tomorrow ? "À demain pour de nouvelles aventures" : "À bientôt pour de nouvelles aventures";
  const sub = !nxt ? "Merci pour ces beaux moments ensemble." : sameDay ? "Reposez-vous, la journée commence bientôt." : "La journée est bouclée, reposez-vous bien.";
  const lead = sameDay ? "Ce qui vous attend aujourd'hui" : tomorrow ? "Ce qui vous attend demain" : "Ce qui vous attend ensuite";
  const when = sameDay ? "Aujourd'hui" : tomorrow ? "Demain" : (later ? later.long : "");
  return (
    <div style={{ position: "relative", background: "linear-gradient(155deg, #1B2A4A 0%, #2C3E63 100%)", borderRadius: T.r.xl, padding: 22, color: "#fff", boxShadow: T.sh.soft, overflow: "hidden" }}>
      <span aria-hidden="true" style={{ position: "absolute", top: 20, right: 26, fontSize: 11, opacity: 0.25, animation: "vtwinkle 3.4s ease-in-out infinite" }}>✦</span>
      <span aria-hidden="true" style={{ position: "absolute", top: 46, right: 64, fontSize: 8, opacity: 0.25, animation: "vtwinkle 4.6s ease-in-out 1.2s infinite" }}>✦</span>
      <div style={{ fontSize: 30, display: "inline-block", animation: "vfloat 6s ease-in-out infinite" }}>🌙</div>
      <div style={{ fontFamily: fD, fontWeight: 700, fontSize: 22, lineHeight: 1.15, margin: "8px 0 4px" }}>{title}</div>
      <div style={{ fontFamily: fB, fontSize: 14.5, opacity: 0.85 }}>{sub}</div>
      {nxt && (
        <>
          <div style={{ fontFamily: fD, fontWeight: 600, fontSize: 12.5, letterSpacing: 0.3, opacity: 0.75, margin: "16px 0 7px" }}>{lead}</div>
          <button onClick={() => onOpen && onOpen(nxt)} style={{ width: "100%", textAlign: "left", cursor: "pointer", border: "none", display: "flex", alignItems: "center", gap: 10, background: "#ffffff1f", borderRadius: T.r.md, padding: "11px 13px" }}>
            <span style={{ fontSize: 18, flex: "0 0 auto" }}>{TYPES[nxt.type].emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: fB, fontSize: 11.5, opacity: 0.82 }}>{when}, {nxt.start}</div>
              <div style={{ fontFamily: fD, fontWeight: 600, fontSize: 15, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nxt.title}</div>
            </div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, flex: "0 0 auto" }}>
              <UnreadBadge n={unread} light />
              <span style={{ fontFamily: fB, fontSize: 12, opacity: 0.7 }}>voir</span>
            </span>
          </button>
        </>
      )}
    </div>
  );
}

function ParallelList({ main, events, onOpen, ub }) {
  const alts = parallelsOf(events, main.id);
  if (!alts.length) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontFamily: fD, fontWeight: 600, fontSize: 11, color: T.c.inkFaint, letterSpacing: 0.5, margin: "0 0 6px 2px" }}>EN PARALLÈLE</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {alts.map((a) => (
          <button key={a.id} onClick={() => onOpen(a)} style={{ width: "100%", textAlign: "left", cursor: "pointer", border: `1px solid ${T.c.line}`, background: T.c.card, borderRadius: T.r.md, padding: "9px 11px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 16, flex: "0 0 auto" }}>{TYPES[a.type].emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: fD, fontWeight: 600, color: T.c.ink, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.title}</div>
              <div style={{ fontFamily: fB, color: T.c.inkFaint, fontSize: 12 }}>{a.place.name}</div>
            </div>
            <AvatarRow ids={attendeesOf(a)} size={20} />
            <UnreadBadge n={ub ? ub(a.id) : 0} />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---- Statut en direct --------------------------------------------------- */
const STATUS_CHOICES = [
  { emoji: "🏖️", label: "À la plage" },
  { emoji: "🍽️", label: "Au resto" },
  { emoji: "🍹", label: "Au bar" },
  { emoji: "🎉", label: "En fête" },
  { emoji: "😴", label: "Sieste" },
  { emoji: "🚗", label: "En route" },
  { emoji: "🏡", label: "À la villa" },
  { emoji: "🛍️", label: "Shopping" },
];
const STATUS_TTL_MIN = 180;
const statusOf = (p) => {
  const s = p && p.status;
  if (!s || !s.emoji) return null;
  if (!s.at || (Date.now() - s.at) > STATUS_TTL_MIN * 60000) return null;
  return s;
};
function StatusStrip({ onSetStatus }) {
  const [open, setOpen] = useState(false);
  const members = ROSTER.filter((p) => p.active);
  const meFirst = [...members.filter((p) => p.id === ME), ...members.filter((p) => p.id !== ME)];
  const mySt = statusOf(person(ME));
  return (
    <div>
      <div style={{ display: "flex", gap: 12, overflowX: "auto", padding: "2px 2px 4px", margin: "0 -2px" }}>
        {meFirst.map((p) => {
          const st = statusOf(p);
          const isMe = p.id === ME;
          return (
            <button key={p.id} onClick={isMe ? () => setOpen(!open) : undefined} style={{ flex: "0 0 auto", cursor: isMe ? "pointer" : "default", border: "none", background: "transparent", padding: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, width: 56 }}>
              <span style={{ position: "relative", display: "inline-flex" }}>
                <Avatar id={p.id} size={44} />
                {st
                  ? <span style={{ position: "absolute", right: -4, bottom: -4, width: 22, height: 22, borderRadius: T.r.pill, background: T.c.card, boxShadow: T.sh.card, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>{st.emoji}</span>
                  : isMe && <span style={{ position: "absolute", right: -4, bottom: -4, width: 22, height: 22, borderRadius: T.r.pill, background: T.c.sea, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={13} /></span>}
              </span>
              <span style={{ fontFamily: fB, fontSize: 10.5, color: st ? T.c.inkSoft : T.c.inkFaint, maxWidth: 56, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {st ? st.label : (isMe ? "Mon statut" : p.name)}
              </span>
            </button>
          );
        })}
      </div>
      {open && (
        <div style={{ background: T.c.lineSoft, borderRadius: T.r.md, padding: 10, marginTop: 6, display: "flex", flexWrap: "wrap", gap: 7 }}>
          {STATUS_CHOICES.map((c) => {
            const on = mySt && mySt.emoji === c.emoji;
            return (
              <button key={c.emoji} onClick={() => { onSetStatus(on ? null : c); setOpen(false); }} style={{ cursor: "pointer", border: on ? `2px solid ${T.c.sea}` : `1px solid ${T.c.line}`, background: on ? T.c.seaSoft : T.c.card, color: T.c.ink, borderRadius: T.r.pill, padding: "7px 12px", fontFamily: fD, fontWeight: 600, fontSize: 12.5, display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14 }}>{c.emoji}</span> {c.label}
              </button>
            );
          })}
          {mySt && (
            <button onClick={() => { onSetStatus(null); setOpen(false); }} style={{ cursor: "pointer", border: `1px solid ${T.c.line}`, background: T.c.card, color: T.c.coralDeep, borderRadius: T.r.pill, padding: "7px 12px", fontFamily: fD, fontWeight: 600, fontSize: 12.5 }}>Effacer mon statut</button>
          )}
        </div>
      )}
    </div>
  );
}

/* ---- Interactions : contenus quotidiens --------------------------------- */
/* Types de voyage et packs de contenu */
const TRIP_TYPES = [
  { id: "mer", emoji: "🌊", label: "Bord de mer" },
  { id: "ski", emoji: "⛷️", label: "Sports d'hiver" },
  { id: "rando", emoji: "🥾", label: "Randonnée" },
  { id: "ville", emoji: "🏙️", label: "City trip" },
  { id: "mariage", emoji: "💍", label: "Mariage" },
  { id: "detente", emoji: "🛋️", label: "Détente" },
  { id: "anniversaire", emoji: "🎂", label: "Anniversaire" },
];
const CONTENT_PACKS = {
  mer: {
    themes: ["Tout en bleu", "L'assiette du jour", "Le plus beau point de vue", "Portrait de groupe", "Golden hour", "Le détail insolite", "Reflets et transparences", "Les pieds dans l'eau", "Le plus beau bateau", "Une porte ou une fenêtre", "Sieste surprise", "Le zoom mystère", "Trois couleurs qui claquent", "L'ombre la plus graphique", "Le sourire du jour"],
    morning: [
      { q: "Plage ou piscine ?", a: "Plage 🏖️", b: "Piscine 🏊" },
      { q: "Cocktail ou bière ?", a: "Cocktail 🍹", b: "Bière 🍺", adult: true },
      { q: "Grasse mat ou lever de soleil ?", a: "Grasse mat 😴", b: "Lever de soleil 🌅" },
      { q: "Gyros ou salade grecque ?", a: "Gyros 🥙", b: "Salade 🥗" },
      { q: "Soirée club ou apéro tranquille ?", a: "Club 🪩", b: "Apéro 🌅", adult: true },
      { q: "Pêche ou pastèque ?", a: "Pêche 🍑", b: "Pastèque 🍉" },
      { q: "Serviette sur le sable ou transat ?", a: "Serviette 🏖️", b: "Transat ⛱️" },
      { q: "Crème solaire : indice 50 ou bronzage express ?", a: "Indice 50 🧴", b: "Express 🦞" },
      { q: "Snorkeling ou paddle ?", a: "Snorkeling 🤿", b: "Paddle 🏄" },
      { q: "Glace : deux boules ou milkshake ?", a: "Deux boules 🍨", b: "Milkshake 🥤" },
      { q: "Plage qui vit ou crique déserte ?", a: "Qui vit 🎶", b: "Déserte 🤫" },
      { q: "Poisson grillé ou pâtes du midi ?", a: "Poisson 🐟", b: "Pâtes 🍝" },
      { q: "Château de sable ou lecture à l'ombre ?", a: "Château 🏰", b: "Lecture 📖" },
      { q: "Pieds nus partout ou sandales vissées ?", a: "Pieds nus 🦶", b: "Sandales 👡" },
      { q: "Bateau : cap sur une île ou farniente à bord ?", a: "Cap sur l'île 🏝️", b: "Farniente ⚓" },
      { q: "Coucher de soleil : photo ou juste les yeux ?", a: "Photo 📸", b: "Les yeux 👀" },
    ],
    who: ["de se perdre aujourd'hui", "de s'endormir en premier ce soir", "de finir à l'eau tout habillé", "de tenir jusqu'au lever du soleil", "de prendre 200 photos aujourd'hui", "de négocier le prix au marché", "de se faire un nouvel ami ce soir", "d'attraper le coup de soleil le plus spectaculaire", "de crier en entrant dans l'eau", "de se resservir trois fois au petit-déjeuner", "de perdre ses lunettes de soleil", "de trouver le plus beau coquillage", "de faire la meilleure bombe dans l'eau", "de se tromper de serviette sur la plage", "de commander sans regarder les prix", "de vouloir rester une semaine de plus"],
    bingo: [
      { id: "mer1", emoji: "🌊", label: "Baignade" },
      { id: "mer2", emoji: "🌅", label: "Coucher de soleil admiré" },
      { id: "mer3", emoji: "🍹", label: "Cocktail au bord de l'eau", adult: true },
      { id: "mer4", emoji: "😴", label: "Sieste à l'ombre" },
      { id: "mer5", emoji: "📸", label: "Photo de groupe" },
      { id: "mer6", emoji: "🐙", label: "Poulpe au menu" },
      { id: "mer7", emoji: "🛵", label: "Virée en scooter ou quad" },
      { id: "mer8", emoji: "🪩", label: "Danse jusqu'à 2h", adult: true },
      { id: "mer9", emoji: "🐈", label: "Chat local caressé" },
      { id: "mer10", emoji: "🌬️", label: "Chapeau emporté par le vent" },
      { id: "mer11", emoji: "🥇", label: "Premier dans l'eau" },
      { id: "mer12", emoji: "🌙", label: "Baignade de nuit" },
    ],
  },
  ski: {
    themes: ["Tout en blanc", "Le sommet du jour", "L'assiette qui réchauffe", "Portrait bonnet", "La trace parfaite", "Le détail givré", "Coucher de soleil sur les cimes", "Vue du télésiège", "Le plus beau sapin", "Vapeur et buée", "Trois textures de neige", "L'ombre sur la neige", "Le matériel qui en a vu", "La pause qui fait du bien", "Le sourire du jour"],
    morning: [
      { q: "Première trace ou grasse mat ?", a: "Première trace 🎿", b: "Grasse mat 😴" },
      { q: "Fondue ou raclette ?", a: "Fondue 🫕", b: "Raclette 🧀" },
      { q: "Ski ou snowboard ?", a: "Ski ⛷️", b: "Snow 🏂" },
      { q: "Vin chaud ou chocolat chaud ?", a: "Vin chaud 🍷", b: "Chocolat 🍫", adult: true },
      { q: "Piste noire ou boulevard tranquille ?", a: "Noire 🖤", b: "Tranquille 🟦" },
      { q: "Après-ski ou jacuzzi ?", a: "Après-ski 🪩", b: "Jacuzzi 🛁", adult: true },
      { q: "Forfait à l'ouverture ou après le café ?", a: "À l'ouverture ⏰", b: "Après le café ☕" },
      { q: "Tartiflette ou crozets ?", a: "Tartiflette 🥔", b: "Crozets 🍲" },
      { q: "Poudreuse ou piste damée ?", a: "Poudreuse ❄️", b: "Damée 🛷" },
      { q: "Télésiège bavard ou télécabine au chaud ?", a: "Télésiège 💬", b: "Télécabine 🚡" },
      { q: "Photo au sommet ou descente sans pause ?", a: "Photo 📸", b: "Sans pause 💨" },
      { q: "Pause déj sur les pistes ou sandwich dans la poche ?", a: "Sur les pistes 🍽️", b: "Sandwich 🥪" },
      { q: "Luge ou patinoire ?", a: "Luge 🛷", b: "Patinoire ⛸️" },
      { q: "Chaussettes hautes ou chauffe-pieds ?", a: "Chaussettes 🧦", b: "Chauffe-pieds 🔥" },
      { q: "Dernière descente à 16h ou fermer la station ?", a: "16h 🕓", b: "Fermer la station 🌙" },
      { q: "Crêpe ou gaufre au goûter ?", a: "Crêpe 🥞", b: "Gaufre 🧇" },
    ],
    who: ["de finir la tête dans la poudreuse", "de perdre un ski au télésiège", "de s'endormir au coin du feu", "de fermer le dernier télésiège", "de reprendre trois fois du fromage", "de rater la première benne", "de danser en chaussures de ski", "de tomber à l'arrêt, skis aux pieds", "de râler contre ses chaussures", "de finir la journée en tee-shirt", "de prendre la verte pour s'échauffer", "de faire tomber son gant du télésiège", "de commander le chocolat viennois XXL", "de lancer la bataille de boules de neige", "de connaître le prénom du pisteur avant midi", "de vouloir prolonger d'une saison"],
    bingo: [
      { id: "ski1", emoji: "🚡", label: "Première benne prise" },
      { id: "ski2", emoji: "🤸", label: "Chute mémorable" },
      { id: "ski3", emoji: "🫕", label: "Fondue ou raclette" },
      { id: "ski4", emoji: "🍷", label: "Vin chaud en terrasse", adult: true },
      { id: "ski5", emoji: "📸", label: "Photo au sommet" },
      { id: "ski6", emoji: "❄️", label: "Bataille de boules de neige" },
      { id: "ski7", emoji: "⛄", label: "Bonhomme de neige" },
      { id: "ski8", emoji: "🛁", label: "Jacuzzi ou sauna" },
      { id: "ski9", emoji: "🖤", label: "Piste noire descendue" },
      { id: "ski10", emoji: "🌅", label: "Coucher de soleil sur les cimes" },
      { id: "ski11", emoji: "🪩", label: "Danse en après-ski", adult: true },
      { id: "ski12", emoji: "🌙", label: "Descente aux flambeaux ou nocturne" },
    ],
  },
  rando: {
    themes: ["Le panorama du jour", "Flore et petites bêtes", "Portrait au sommet", "Le sentier", "La pause pique-nique", "Le détail sauvage", "Ciel du soir", "L'eau sous toutes ses formes", "La plus belle pierre", "Vu d'en haut", "Racines et écorces", "Le panneau le plus improbable", "Trois verts différents", "Nuages du jour", "Le sourire du jour"],
    morning: [
      { q: "Départ à l'aube ou tranquille ?", a: "À l'aube 🌄", b: "Tranquille ☕" },
      { q: "Sandwich ou salade ?", a: "Sandwich 🥪", b: "Salade 🥗" },
      { q: "Lac ou sommet ?", a: "Lac 🏞️", b: "Sommet ⛰️" },
      { q: "Carte papier ou GPS ?", a: "Carte 🗺️", b: "GPS 📱" },
      { q: "Refuge ou bivouac ?", a: "Refuge 🏠", b: "Bivouac ⛺" },
      { q: "Montée cool ou gros dénivelé ?", a: "Cool 🚶", b: "Dénivelé 🧗" },
      { q: "Bâtons ou mains libres ?", a: "Bâtons 🥢", b: "Mains libres 🙌" },
      { q: "Fruits secs ou barre de céréales ?", a: "Fruits secs 🥜", b: "Barre 🍫" },
      { q: "Chemin balisé ou sentier sauvage ?", a: "Balisé 🪧", b: "Sauvage 🌿" },
      { q: "Pause photo toutes les 10 minutes ou rythme soutenu ?", a: "Pauses photo 📸", b: "Rythme 🥾" },
      { q: "Chaussettes de rechange : oui ou vivre dangereusement ?", a: "Oui 🧦", b: "Danger 😎" },
      { q: "Pique-nique au sommet ou à mi-chemin ?", a: "Au sommet ⛰️", b: "À mi-chemin 🌳" },
      { q: "Playlist ou bruits de la nature ?", a: "Playlist 🎶", b: "Nature 🐦" },
      { q: "Descente en courant ou en douceur ?", a: "En courant 🏃", b: "En douceur 🐢" },
      { q: "Boucle ou aller-retour ?", a: "Boucle 🔄", b: "Aller-retour ↔️" },
      { q: "Café avant de partir ou thermos au sommet ?", a: "Avant ☕", b: "Thermos ⛰️" },
    ],
    who: ["de prendre la mauvaise bifurcation", "de finir avec une ampoule", "de porter le sac le plus lourd", "de repérer un animal en premier", "de râler dans la montée", "de piquer un somme à la pause", "d'arriver premier au sommet", "de demander si c'est encore loin", "de sous-estimer la météo", "de vouloir adopter tous les chiens croisés", "de finir l'eau des autres", "de proposer un raccourci qui rallonge", "de glisser sur un caillou parfaitement stable", "de photographier chaque fleur", "de sortir du saucisson au sommet", "de planifier déjà la prochaine rando"],
    bingo: [
      { id: "rando1", emoji: "⛰️", label: "Sommet atteint" },
      { id: "rando2", emoji: "🧺", label: "Pique-nique panoramique" },
      { id: "rando3", emoji: "🦌", label: "Animal sauvage aperçu" },
      { id: "rando4", emoji: "🏊", label: "Baignade en lac ou rivière" },
      { id: "rando5", emoji: "🩹", label: "Ampoule au pied" },
      { id: "rando6", emoji: "📸", label: "Photo de groupe au sommet" },
      { id: "rando7", emoji: "🌸", label: "Fleur remarquable trouvée" },
      { id: "rando8", emoji: "👣", label: "20 000 pas dans la journée" },
      { id: "rando9", emoji: "🌄", label: "Lever de soleil en chemin" },
      { id: "rando10", emoji: "😴", label: "Sieste dans l'herbe" },
      { id: "rando11", emoji: "🏠", label: "Refuge ou cabane" },
      { id: "rando12", emoji: "🌧️", label: "Averse essuyée sans abri" },
    ],
  },
  ville: {
    themes: ["Architecture", "Street food", "Portrait urbain", "L'œuvre du jour", "Néons et lumières", "Le détail caché", "Vue sur les toits", "La plus belle porte", "Symétrie parfaite", "La vitrine du jour", "Passants et vélos", "Trois enseignes qui racontent la ville", "Reflets de vitrine", "Le contraste vieux et neuf", "Le sourire du jour"],
    morning: [
      { q: "Musée ou flânerie ?", a: "Musée 🖼️", b: "Flânerie 🚶" },
      { q: "Café en terrasse ou à emporter ?", a: "Terrasse ☕", b: "À emporter 🥤" },
      { q: "Métro ou à pied ?", a: "Métro 🚇", b: "À pied 👟" },
      { q: "Marché ou boutiques ?", a: "Marché 🧺", b: "Boutiques 🛍️" },
      { q: "Resto local ou street food ?", a: "Resto 🍽️", b: "Street food 🌮" },
      { q: "Rooftop ou bar caché ?", a: "Rooftop 🏙️", b: "Bar caché 🚪", adult: true },
      { q: "Guide papier ou instinct ?", a: "Guide 📕", b: "Instinct 🧭" },
      { q: "Incontournables ou quartiers secrets ?", a: "Incontournables 🗼", b: "Secrets 🗝️" },
      { q: "Petit-déj léger ou brunch XXL ?", a: "Léger 🥐", b: "Brunch 🍳" },
      { q: "Photo devant le monument : oui ou jamais ?", a: "Oui 📸", b: "Jamais 🙅" },
      { q: "Vélo en libre-service ou tramway ?", a: "Vélo 🚲", b: "Tram 🚋" },
      { q: "Librairie ou disquaire ?", a: "Librairie 📚", b: "Disquaire 🎵" },
      { q: "Croissant ou spécialité locale ?", a: "Croissant 🥐", b: "Locale 🧁" },
      { q: "Lever tôt pour éviter la foule ou tant pis ?", a: "Lever tôt ⏰", b: "Tant pis 😌" },
      { q: "Souvenir kitsch ou objet d'artisan ?", a: "Kitsch 🗿", b: "Artisan 🏺" },
      { q: "Dîner réservé ou table au hasard ?", a: "Réservé 📅", b: "Au hasard 🎲" },
    ],
    who: ["de se perdre dans le métro", "de vouloir encore un musée", "de craquer dans une boutique", "de dégoter le meilleur resto", "de photographier chaque façade", "de finir sur un rooftop", "de marcher 25 000 pas", "de se faire comprendre par gestes", "de commander le plat le plus mystérieux", "de vouloir emménager ici avant ce soir", "de rater l'arrêt de métro", "de raconter l'histoire de chaque statue", "de trouver le café le plus photogénique", "de négocier au marché aux puces", "de proposer encore un dernier quartier", "de rapporter le souvenir le plus improbable"],
    bingo: [
      { id: "ville1", emoji: "🏛️", label: "Monument visité" },
      { id: "ville2", emoji: "🌮", label: "Street food goûtée" },
      { id: "ville3", emoji: "🌇", label: "Coucher de soleil sur les toits" },
      { id: "ville4", emoji: "🚇", label: "Transport local pris" },
      { id: "ville5", emoji: "🧺", label: "Marché exploré" },
      { id: "ville6", emoji: "📸", label: "Photo devant le monument" },
      { id: "ville7", emoji: "🍷", label: "Apéro en terrasse", adult: true },
      { id: "ville8", emoji: "🗺️", label: "Quartier hors des sentiers" },
      { id: "ville9", emoji: "🖼️", label: "Musée ou galerie" },
      { id: "ville10", emoji: "🎁", label: "Souvenir acheté" },
      { id: "ville11", emoji: "👣", label: "20 000 pas dans la journée" },
      { id: "ville12", emoji: "🚪", label: "Bar caché trouvé", adult: true },
    ],
  },
  mariage: {
    themes: ["Les préparatifs", "Le dress code", "Portrait des invités", "Sur la piste", "Le détail de la déco", "Émotions", "Golden hour", "Les chaussures du jour", "Le plus beau bouquet", "Rires volés", "Les mains", "Générations réunies", "La table la plus animée", "Noir et blanc", "Le sourire du jour"],
    morning: [
      { q: "Cérémonie : mouchoir ou lunettes de soleil ?", a: "Mouchoir 🥲", b: "Lunettes 🕶️" },
      { q: "Champagne ou cocktail ?", a: "Champagne 🥂", b: "Cocktail 🍹", adult: true },
      { q: "Slow ou rock ?", a: "Slow 💃", b: "Rock 🎸" },
      { q: "Discours : rire ou larmes ?", a: "Rire 😂", b: "Larmes 😭" },
      { q: "Piste de danse ou buffet ?", a: "Piste 🪩", b: "Buffet 🍰" },
      { q: "Cravate ou nœud pap ?", a: "Cravate 👔", b: "Nœud pap 🎀" },
      { q: "Talons jusqu'au bout ou pieds nus dès 22h ?", a: "Jusqu'au bout 👠", b: "Pieds nus 🦶" },
      { q: "Photobooth ou photos volées ?", a: "Photobooth 🎞️", b: "Volées 🤳" },
      { q: "Plan de table respecté ou chaise nomade ?", a: "Respecté 🪑", b: "Nomade 🕺" },
      { q: "Pièce montée ou plateau de fromages ?", a: "Pièce montée 🍰", b: "Fromages 🧀" },
      { q: "Lancer de bouquet : stratégie ou hasard ?", a: "Stratégie 🎯", b: "Hasard 🍀" },
      { q: "Premier sur la piste ou observateur ?", a: "Premier 🕺", b: "Observateur 👀" },
      { q: "Dress code à la lettre ou interprétation libre ?", a: "À la lettre 📏", b: "Libre 🎨" },
      { q: "Larmes à la cérémonie ou au discours ?", a: "Cérémonie 💍", b: "Discours 🎤" },
      { q: "Brunch du lendemain : présent ou au lit ?", a: "Présent 🥞", b: "Au lit 😴" },
      { q: "Cadeau : liste ou enveloppe ?", a: "Liste 🎁", b: "Enveloppe ✉️" },
    ],
    who: ["de pleurer pendant la cérémonie", "d'attraper le bouquet", "de lancer le premier slow", "de faire le discours le plus long", "de finir la cravate sur la tête", "d'ouvrir la chenille", "de rester jusqu'au bout de la nuit", "de faire pleurer toute la salle", "de connaître toutes les paroles", "de demander une chanson refusée par le DJ", "de perdre une chaussure sur la piste", "de prendre la meilleure photo des mariés", "de faire danser la grand-mère", "de finir au photobooth avec des inconnus", "de resservir tout le monde en dessert", "de déjà parler du prochain mariage"],
    bingo: [
      { id: "mar1", emoji: "🥲", label: "Larme versée" },
      { id: "mar2", emoji: "💐", label: "Bouquet ou jarretière attrapé" },
      { id: "mar3", emoji: "📸", label: "Photo avec les mariés" },
      { id: "mar4", emoji: "🎤", label: "Discours applaudi" },
      { id: "mar5", emoji: "🪩", label: "Piste ouverte" },
      { id: "mar6", emoji: "🐛", label: "Chenille ou madison" },
      { id: "mar7", emoji: "🍰", label: "Pièce montée" },
      { id: "mar8", emoji: "🌾", label: "Lancer de riz ou confettis" },
      { id: "mar9", emoji: "🤝", label: "Retrouvailles surprises" },
      { id: "mar10", emoji: "💃", label: "Danse avec un inconnu" },
      { id: "mar11", emoji: "👔", label: "Cravate sur la tête" },
      { id: "mar12", emoji: "🌅", label: "Debout au lever du soleil" },
    ],
  },
  detente: {
    themes: ["La belle lumière", "L'assiette du jour", "Portrait de groupe", "Le détail insolite", "Le lieu du moment", "Ciel du soir", "Tout en couleurs", "Nature morte improvisée", "La partie en cours", "Mains à l'œuvre", "Par la fenêtre", "Le coin préféré", "Trois objets qui racontent le séjour", "L'heure dorée du matin", "Le sourire du jour"],
    morning: [
      { q: "Grasse matinée ou lever tôt ?", a: "Grasse mat 😴", b: "Lever tôt 🌅" },
      { q: "Sucré ou salé ?", a: "Sucré 🥐", b: "Salé 🧀" },
      { q: "Farniente ou activité ?", a: "Farniente 🛋️", b: "Activité 🚴" },
      { q: "Jeu de société ou film ?", a: "Jeu 🎲", b: "Film 🎬" },
      { q: "Thé ou café ?", a: "Thé 🍵", b: "Café ☕" },
      { q: "Apéro ou dessert ?", a: "Apéro 🍹", b: "Dessert 🍰", adult: true },
      { q: "Livre ou podcast ?", a: "Livre 📖", b: "Podcast 🎧" },
      { q: "Cuisiner ensemble ou se faire livrer ?", a: "Cuisiner 🧑‍🍳", b: "Livrer 🛵" },
      { q: "Balade digestive ou canapé ?", a: "Balade 🚶", b: "Canapé 🛋️" },
      { q: "Playlist douce ou tubes à fond ?", a: "Douce 🎻", b: "À fond 🔊" },
      { q: "Petit-déj au lit ou table dressée ?", a: "Au lit 🛏️", b: "Table 🍽️" },
      { q: "Pyjama jusqu'à midi ou prêt dès 9h ?", a: "Pyjama 🩳", b: "Prêt 👕" },
      { q: "Débat passionné ou paix absolue ?", a: "Débat 🔥", b: "Paix 🕊️" },
      { q: "Tout photographier ou vivre l'instant ?", a: "Photos 📸", b: "L'instant 🧘" },
      { q: "Marché du coin ou supermarché efficace ?", a: "Marché 🧺", b: "Supermarché 🛒" },
      { q: "Soirée jeux ou soirée histoires ?", a: "Jeux 🎲", b: "Histoires 🕯️" },
    ],
    who: ["de se resservir en premier", "de proposer un jeu", "de s'endormir devant le film", "de prendre 200 photos", "de cuisiner ce soir", "de lancer un grand débat", "de faire rire tout le monde", "de tricher aux cartes et de nier", "de squatter la meilleure place du canapé", "de finir les restes au petit-déjeuner", "de raconter la meilleure histoire", "de proposer une sieste collective", "de gagner presque tous les jeux", "de mettre la chanson que tout le monde chante", "de vouloir organiser le prochain séjour", "de dire le premier qu'on est bien là"],
    bingo: [
      { id: "det1", emoji: "🍽️", label: "Grand repas partagé" },
      { id: "det2", emoji: "📸", label: "Photo de groupe" },
      { id: "det3", emoji: "😂", label: "Fou rire général" },
      { id: "det4", emoji: "🎲", label: "Jeu de société" },
      { id: "det5", emoji: "😴", label: "Sieste" },
      { id: "det6", emoji: "🌅", label: "Coucher de soleil admiré" },
      { id: "det7", emoji: "🍹", label: "Apéro improvisé", adult: true },
      { id: "det8", emoji: "🧑‍🍳", label: "Spécialité locale goûtée" },
      { id: "det9", emoji: "🚶", label: "Balade digestive" },
      { id: "det10", emoji: "🎁", label: "Souvenir acheté" },
      { id: "det11", emoji: "🎶", label: "Playlist du groupe lancée" },
      { id: "det12", emoji: "🌙", label: "Veillée tardive" },
    ],
  },
};
const pack = () => CONTENT_PACKS[SETTINGS.tripType] || CONTENT_PACKS.mer;
/* Ambiance du groupe : famille (tout public), amis (défaut), minuit (piquant) */
const MOODS = [
  { id: "famille", emoji: "😇", label: "En famille" },
  { id: "amis", emoji: "😄", label: "Entre amis" },
  { id: "minuit", emoji: "😈", label: "Après minuit" },
];
const MIDNIGHT_EXTRAS = {
  morning: [
    { q: "Ce soir : sage ou jusqu'au bout de la nuit ?", a: "Sage 😇", b: "Jusqu'au bout 😈" },
    { q: "Shots ou cocktails ?", a: "Shots 🥃", b: "Cocktails 🍹" },
    { q: "Lendemain difficile : déni ou assumé ?", a: "Déni 🙃", b: "Assumé 💀" },
    { q: "Flirt en vacances : pour ou contre ?", a: "Pour 😏", b: "Contre 🙅" },
    { q: "Karaoké : micro en main ou spectateur moqueur ?", a: "Micro 🎤", b: "Spectateur 🍿" },
    { q: "Confession du soir : vérité ou joker ?", a: "Vérité 🫢", b: "Joker 🃏" },
  ],
  who: ["de finir par dormir tout habillé", "d'avoir un ticket ce soir", "de danser sur la table", "de perdre son téléphone en soirée", "d'envoyer un message qu'il va regretter", "de payer la tournée en dernier", "de finir la soirée pieds nus", "de lancer le cul sec de trop"],
  themes: ["Ambiance de nuit", "Le petit matin qui pique", "La pose de star"],
  bingo: [
    { id: "nuit1", emoji: "😈", label: "Couché après 4h" },
    { id: "nuit2", emoji: "🥃", label: "Tournée de shots" },
    { id: "nuit3", emoji: "💃", label: "Danse sur la table (ou presque)" },
    { id: "nuit4", emoji: "😏", label: "Numéro échangé" },
  ],
};
const FAMILY_FILL = [
  { id: "fam1", emoji: "🍦", label: "Glace dégustée" },
  { id: "fam2", emoji: "🃏", label: "Partie de cartes" },
  { id: "fam3", emoji: "📮", label: "Carte postale envoyée" },
  { id: "fam4", emoji: "🌅", label: "Tous debout avant 9h" },
];
const moodId = () => SETTINGS.mood || "amis";
const contentOf = (kind) => {
  const base = pack()[kind] || [];
  const m = moodId();
  if (m === "famille") return base.filter((x) => !(x && x.adult));
  if (m === "minuit") return [...base, ...(MIDNIGHT_EXTRAS[kind] || [])];
  return base;
};
const contentBingo = () => {
  const m = moodId();
  const base = pack().bingo;
  if (m === "famille") {
    const g = base.filter((c) => !c.adult);
    return [...g, ...FAMILY_FILL].slice(0, 12);
  }
  if (m === "minuit") {
    const ex = MIDNIGHT_EXTRAS.bingo;
    return [...base.slice(0, Math.max(0, 12 - ex.length)), ...ex];
  }
  return base;
};
const isSameLocalDay = (ts) => { try { return new RDate(ts).toDateString() === new RDate().toDateString(); } catch (e) { return false; } };
const RDate = Date;

const CARD = () => ({ background: T.c.card, borderRadius: T.r.lg, padding: "13px 15px", boxShadow: T.sh.card });
const CARD_TITLE = (icon, text, extra) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
    <span style={{ fontSize: 16 }}>{icon}</span>
    <span style={{ fontFamily: fD, fontWeight: 700, color: T.c.ink, fontSize: 14.5, flex: 1 }}>{text}</span>
    {extra}
  </div>
);

/* Défi photo du jour */
function DailyChallengeCard({ dIdx, photos, onAddPhoto, onOpenPhoto, bare }) {
  const th = contentOf("themes"); const theme = th[dIdx % th.length];
  const scope = "defi-d" + dIdx;
  const list = photos.filter((p) => p.event === scope);
  return (
    <div style={bare ? {} : CARD()}>
      {!bare && CARD_TITLE("📸", "Défi photo du jour", null)}
      <div style={{ fontFamily: fD, fontWeight: 700, color: T.c.seaDeep, fontSize: 17, marginBottom: 4 }}>{theme}</div>
      <div style={{ fontFamily: fB, color: T.c.inkFaint, fontSize: 12.5, marginBottom: 10 }}>{list.length > 0 ? `${list.length} participation${list.length > 1 ? "s" : ""}. À vous de jouer.` : "Personne n'a encore participé. Lancez le mouvement."}</div>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
        {list.map((ph) => (
          <div key={ph.id} style={{ flex: "0 0 auto", width: 74 }}>
            <PhotoTile photo={ph} onClick={() => onOpenPhoto(ph, list)} />
          </div>
        ))}
        <div style={{ flex: "0 0 auto", width: 74 }}>
          <AddPhotoTile onPick={(url) => onAddPhoto(scope, url)} />
        </div>
      </div>
    </div>
  );
}

/* Question du matin */
function MorningQuestionCard({ dIdx, onVote, bare }) {
  const mq = contentOf("morning"); const def = mq[dIdx % mq.length];
  const votes = ((SETTINGS.morning || {})[dIdx]) || {};
  const myVote = votes[ME] || null;
  const ids = Object.keys(votes);
  const nA = ids.filter((p) => votes[p] === "a"), nB = ids.filter((p) => votes[p] === "b");
  const opt = (key, label, voters) => {
    const on = myVote === key;
    const pct = ids.length ? Math.round((voters.length / ids.length) * 100) : 0;
    return (
      <button onClick={() => onVote(dIdx, key)} style={{ position: "relative", overflow: "hidden", flex: 1, cursor: "pointer", border: on ? `2px solid ${T.c.sea}` : `1px solid ${T.c.line}`, background: T.c.card, borderRadius: T.r.md, padding: "10px 8px", textAlign: "center" }}>
        {myVote && <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, background: `${T.c.sea}1c` }} />}
        <span style={{ position: "relative", display: "block", fontFamily: fD, fontWeight: 700, color: T.c.ink, fontSize: 14 }}>{label}</span>
        {myVote && (
          <span style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", gap: 4, marginTop: 5 }}>
            {voters.slice(0, 5).map((id, i) => <span key={id} style={{ marginLeft: i === 0 ? 0 : -7 }}><Avatar id={id} size={17} /></span>)}
            <span style={{ fontFamily: fD, fontWeight: 700, fontSize: 11.5, color: T.c.inkSoft }}>{pct}%</span>
          </span>
        )}
      </button>
    );
  };
  return (
    <div style={bare ? {} : CARD()}>
      {!bare && CARD_TITLE("☀️", "Question du matin", null)}
      <div style={{ fontFamily: fD, fontWeight: 700, color: T.c.ink, fontSize: 16, marginBottom: 9 }}>{def.q}</div>
      <div style={{ display: "flex", gap: 8 }}>
        {opt("a", def.a, nA)}
        {opt("b", def.b, nB)}
      </div>
    </div>
  );
}

/* Qui a le plus de chances de */
function WhoLikelyCard({ dIdx, onVote, bare }) {
  const wq = contentOf("who"); const question = wq[dIdx % wq.length];
  const votes = ((SETTINGS.wholikely || {})[dIdx]) || {};
  const myVote = votes[ME] || null;
  const members = ROSTER.filter((p) => p.active);
  const counts = {}; Object.values(votes).forEach((t) => { counts[t] = (counts[t] || 0) + 1; });
  const total = Object.keys(votes).length;
  return (
    <div style={bare ? {} : CARD()}>
      {!bare && CARD_TITLE("🎯", "Qui a le plus de chances", total > 0 ? <span style={{ fontFamily: fB, fontSize: 11.5, color: T.c.inkFaint }}>{total} vote{total > 1 ? "s" : ""}</span> : null)}
      <div style={{ fontFamily: fD, fontWeight: 700, color: T.c.ink, fontSize: 15.5, marginBottom: 10 }}>Qui a le plus de chances {question} ?</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {members.map((p) => {
          const on = myVote === p.id;
          const n = counts[p.id] || 0;
          return (
            <button key={p.id} onClick={() => onVote(dIdx, p.id)} style={{ cursor: "pointer", border: on ? `2px solid ${T.c.sea}` : `1px solid ${T.c.line}`, background: on ? T.c.seaSoft : T.c.card, borderRadius: T.r.pill, padding: "5px 12px 5px 5px", display: "inline-flex", alignItems: "center", gap: 7 }}>
              <Avatar id={p.id} size={24} />
              <span style={{ fontFamily: fD, fontWeight: 600, fontSize: 13, color: T.c.ink }}>{p.name}</span>
              {myVote && n > 0 && <span style={{ fontFamily: fD, fontWeight: 700, fontSize: 11.5, color: T.c.seaDeep, background: T.c.seaSoft, borderRadius: T.r.pill, padding: "1px 7px" }}>{n}</span>}
            </button>
          );
        })}
      </div>
      {!myVote && <div style={{ fontFamily: fB, color: T.c.inkFaint, fontSize: 11.5, marginTop: 8 }}>Votez pour voir les résultats.</div>}
    </div>
  );
}

/* Bingo de vacances */
const bingoDone = () => ((SETTINGS.bingo || {}).done) || {};
function BingoCard({ onOpen }) {
  const done = bingoDone();
  const n = contentBingo().filter((c) => done[c.id]).length;
  const pct = Math.round((n / contentBingo().length) * 100);
  return (
    <button onClick={onOpen} style={{ ...CARD(), width: "100%", textAlign: "left", cursor: "pointer", border: "none" }}>
      {CARD_TITLE("🎲", "Bingo de vacances", <span style={{ fontFamily: fD, fontWeight: 700, fontSize: 12.5, color: T.c.seaDeep }}>{n} / {contentBingo().length}</span>)}
      <div style={{ height: 8, borderRadius: T.r.pill, background: T.c.lineSoft, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: T.c.sea, transition: "width .5s ease" }} />
      </div>
      <div style={{ fontFamily: fB, color: T.c.inkFaint, fontSize: 12, marginTop: 7 }}>{n === contentBingo().length ? "Grille complète, bravo !" : "Touchez pour cocher les moments du séjour."}</div>
    </button>
  );
}
function BingoSheet({ onToggle, rev }) {
  void rev;
  const done = bingoDone();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontFamily: fB, fontStyle: "italic", color: T.c.inkFaint, fontSize: 13.5 }}>Une grille pour tout le groupe. Cochez quand c'est vécu.</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {contentBingo().map((c) => {
          const d = done[c.id];
          return (
            <button key={c.id} onClick={() => onToggle(c.id)} style={{ cursor: "pointer", textAlign: "left", border: d ? `2px solid ${T.c.sea}` : `1px solid ${T.c.line}`, background: d ? T.c.seaSoft : T.c.card, borderRadius: T.r.md, padding: "10px 11px", display: "flex", flexDirection: "column", gap: 6, minHeight: 74 }}>
              <span style={{ fontSize: 20 }}>{c.emoji}</span>
              <span style={{ fontFamily: fD, fontWeight: 600, fontSize: 12.5, color: T.c.ink, lineHeight: 1.25 }}>{c.label}</span>
              {d && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: "auto" }}>
                  <Avatar id={d.who} size={16} />
                  <Check size={13} color={T.c.sea} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* Récap du soir (avec hauts faits et lieux explorés) */
function topBy(map) { let best = null, bestN = 0; Object.keys(map).forEach((k) => { if (map[k] > bestN) { best = k; bestN = map[k]; } }); return best ? { id: best, n: bestN } : null; }
function RecapCard({ dIdx, events, messages, photos, now, bare }) {
  const dayEvents = mainList(events).filter((e) => e.day === dIdx);
  const doneEvents = dayEvents.filter((e) => endAbs(e) <= now);
  const todayPhotos = photos.filter((p) => p.at && isSameLocalDay(p.at));
  const todayMsgs = messages.filter((m) => m.at && isSameLocalDay(m.at));
  const phBy = {}; todayPhotos.forEach((p) => { if (p.who) phBy[p.who] = (phBy[p.who] || 0) + 1; });
  const msgBy = {}; todayMsgs.forEach((m) => { msgBy[m.who] = (msgBy[m.who] || 0) + 1; });
  const photographer = topBy(phBy);
  const talker = topBy(msgBy);
  const early = todayMsgs.length ? todayMsgs.reduce((a, b) => ((a.at || 1e18) <= (b.at || 1e18) ? a : b)) : null;
  const visited = []; const seenP = new Set();
  mainList(events).forEach((e) => { if (e.day === dIdx && endAbs(e) <= now && e.place && e.place.name && !seenP.has(e.place.name)) { seenP.add(e.place.name); visited.push(e.place.name); } });
  const vibesFor = (eid) => { const v = (messages || []).find((m) => m.id === "vibe-" + eid); return v ? vibeTotal(v) : 0; };
  let bestAct = null, bestVibes = 0;
  dayEvents.forEach((e) => { const n = vibesFor(e.id); if (n > bestVibes) { bestAct = e; bestVibes = n; } });
  const stat = (v, l) => (
    <div style={{ flex: 1, textAlign: "center" }}>
      <div style={{ fontFamily: fD, fontWeight: 700, fontSize: 20, color: T.c.ink }}>{v}</div>
      <div style={{ fontFamily: fB, fontSize: 11, color: T.c.inkFaint }}>{l}</div>
    </div>
  );
  const award = (emoji, label, pid) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.c.lineSoft, borderRadius: T.r.pill, padding: "5px 11px 5px 6px" }}>
      <Avatar id={pid} size={22} />
      <span style={{ fontFamily: fD, fontWeight: 600, fontSize: 12, color: T.c.ink }}>{emoji} {label} : {person(pid).name}</span>
    </div>
  );
  return (
    <div style={bare ? {} : CARD()}>
      {!bare && CARD_TITLE("🌙", "Votre journée en bref", null)}
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {stat(`${doneEvents.length}/${dayEvents.length}`, "activités")}
        {stat(todayPhotos.length, "photos")}
        {stat(todayMsgs.length, "messages")}
      </div>
      {featureOn("awards") && (photographer || talker || early) && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: visited.length ? 10 : 0 }}>
          {photographer && photographer.n > 0 && award("📸", "Photographe du jour", photographer.id)}
          {talker && talker.n > 1 && award("💬", "Bavard du jour", talker.id)}
          {early && award("🌅", "Premier message", early.who)}
        </div>
      )}
      {bestAct && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.c.lineSoft, borderRadius: T.r.md, padding: "8px 11px", marginBottom: visited.length ? 10 : 0 }}>
          <span style={{ fontSize: 17 }}>{(TYPES[bestAct.type] || {}).emoji || "🤩"}</span>
          <span style={{ flex: 1, minWidth: 0, fontFamily: fB, fontSize: 12.5, color: T.c.inkSoft }}>
            <span style={{ fontFamily: fD, fontWeight: 700, color: T.c.ink }}>Moment préféré : </span>{bestAct.title}
          </span>
          <span style={{ fontFamily: fD, fontWeight: 700, fontSize: 12.5, color: T.c.seaDeep, flex: "0 0 auto" }}>🤩 {bestVibes}</span>
        </div>
      )}
      {visited.length > 0 && (
        <div style={{ fontFamily: fB, fontSize: 12.5, color: T.c.inkSoft }}>
          <span style={{ fontFamily: fD, fontWeight: 700, color: T.c.ink }}>{visited.length} lieu{visited.length > 1 ? "x" : ""} exploré{visited.length > 1 ? "s" : ""} : </span>
          {visited.slice(0, 6).join(", ")}{visited.length > 6 ? ` et ${visited.length - 6} autres` : ""}
        </div>
      )}
    </div>
  );
}

/* Capsule temporelle : carnet secret du séjour */
const normCaps = (v) => Array.isArray(v) ? v.filter((e) => e && e.id && e.text) : (v && v.text ? [{ id: "c-legacy-" + (v.at || 0), text: v.text, at: v.at || 0 }] : []);
function CapsuleCard({ now, onSave, onDelete }) {
  const caps = SETTINGS.capsule || {};
  const revealAbs = (DAYS.length - 1) * 1440 + 1410;
  const reveal = now >= revealAbs;
  const left = Math.max(0, revealAbs - now);
  const cd = left >= 1440
    ? `${Math.floor(left / 1440)} j ${Math.floor((left % 1440) / 60)} h`
    : left >= 60
    ? `${Math.floor(left / 60)} h ${String(left % 60).padStart(2, "0")}`
    : `${left} min`;
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const paper = IS_DARK ? "#2B251C" : "#FDF8EC";
  const paperLine = IS_DARK ? "#443A28" : "#EBDFC4";
  const inkPaper = IS_DARK ? "#EAE0C8" : "#4A3E28";
  const inkFaintPaper = IS_DARK ? "#B3A88C" : "#8A7B5C";
  const mine = normCaps(caps[ME]);
  const writers = ROSTER.filter((p) => p.active && normCaps(caps[p.id]).length > 0).length;
  const totalWords = ROSTER.filter((p) => p.active).reduce((n, p) => n + normCaps(caps[p.id]).length, 0);
  const wrap = { position: "relative", background: paper, border: `1px solid ${paperLine}`, borderRadius: T.r.lg, boxShadow: T.sh.card, padding: "13px 15px 13px 30px", overflow: "hidden" };
  const seam = <div style={{ position: "absolute", left: 15, top: 12, bottom: 12, borderLeft: `2px dashed ${paperLine}` }} />;
  const linedArea = { fontFamily: fH, fontSize: 19, lineHeight: "28px", color: inkPaper, width: "100%", boxSizing: "border-box", padding: "0 2px", border: "none", outline: "none", resize: "none", background: `repeating-linear-gradient(transparent, transparent 27px, ${paperLine} 27px, ${paperLine} 28px)`, minHeight: 56 };
  const taRef = useRef(null);
  const [mq, setMq] = useState(null);
  const [armed, setArmed] = useState(null);
  const pressRef = useRef(null);
  const holdStart = (id) => { if (pressRef.current) clearTimeout(pressRef.current); pressRef.current = setTimeout(() => setArmed(id), 550); };
  const holdEnd = () => { if (pressRef.current) { clearTimeout(pressRef.current); pressRef.current = null; } };
  const askDelete = (id) => { if (typeof window !== "undefined" && window.confirm && !window.confirm("Retirer ce mot du livre d\u2019or ?")) return; setArmed(null); onDelete(id); };
  const normA = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const mentionables = ROSTER.filter((p) => p.active && p.id !== ME);
  const sugg = mq == null ? [] : mentionables.filter((p) => normA(person(p.id).name).startsWith(normA(mq))).slice(0, 5);
  const onType = (e) => {
    const v = e.target.value;
    setText(v);
    const caret = e.target.selectionStart != null ? e.target.selectionStart : v.length;
    const m = v.slice(0, caret).match(/(^|\s)@([\p{L}\p{M}'’-]*)$/u);
    setMq(m ? m[2] : null);
  };
  const putCaret = (v) => setTimeout(() => { const el = taRef.current; if (el) { el.focus(); el.setSelectionRange(v.length, v.length); } }, 0);
  const insertMention = (name) => {
    const el = taRef.current;
    const caret = el && el.selectionStart != null ? el.selectionStart : text.length;
    const up = text.slice(0, caret).replace(/@[\p{L}\p{M}'’-]*$/u, "@" + name + " ");
    setText(up + text.slice(caret));
    setMq(null);
    putCaret(up);
  };
  const startMention = () => {
    const v = text && !/\s$/.test(text) ? text + " @" : text + "@";
    setText(v); setMq(""); putCaret(v);
  };
  const renderMentions = (txt) => {
    const names = mentionables.concat(ROSTER.filter((p) => p.active && p.id === ME)).map((p) => person(p.id).name).filter(Boolean).sort((a, b) => b.length - a.length);
    if (!names.length || !txt) return txt;
    const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp("@(" + names.map(esc).join("|") + ")", "g");
    const out = []; let last = 0, m;
    while ((m = re.exec(txt))) {
      if (m.index > last) out.push(txt.slice(last, m.index));
      out.push(<span key={m.index} style={{ color: T.c.seaDeep, fontWeight: 600 }}>@{m[1]}</span>);
      last = m.index + m[0].length;
    }
    if (last < txt.length) out.push(txt.slice(last));
    return out;
  };
  const mentionBar = sugg.length > 0 ? (
    <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 8 }}>
      {sugg.map((p) => (
        <button key={p.id} onClick={() => insertMention(person(p.id).name)} style={{ cursor: "pointer", border: `1px solid ${paperLine}`, background: "transparent", borderRadius: T.r.pill, padding: "4px 11px 4px 4px", display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Avatar id={p.id} size={20} />
          <span style={{ fontFamily: fD, fontWeight: 600, fontSize: 12.5, color: inkPaper }}>{person(p.id).name}</span>
        </button>
      ))}
    </div>
  ) : null;
  const atBtn = (
    <button onClick={startMention} aria-label="Mentionner quelqu'un" style={{ cursor: "pointer", border: `1px solid ${paperLine}`, background: "transparent", color: inkFaintPaper, borderRadius: T.r.md, width: 44, height: 44, fontFamily: fD, fontWeight: 700, fontSize: 16, flex: "0 0 auto" }}>@</button>
  );
  const deposit = () => { const t = text.trim(); if (!t) return; onSave(t); setText(""); setMq(null); };
  if (reveal) {
    const all = [];
    ROSTER.filter((p) => p.active).forEach((p) => normCaps(caps[p.id]).forEach((e) => all.push({ pid: p.id, ...e })));
    all.sort((a, b) => (a.at || 0) - (b.at || 0));
    const tilt = (id) => { let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 997; return ((h % 5) - 2) * 0.4; };
    return (
      <div style={wrap}>
        {seam}
        <div style={{ textAlign: "center", marginBottom: 6 }}>
          <div style={{ fontFamily: fH, fontWeight: 600, fontSize: 27, color: inkPaper, lineHeight: 1.1 }}>Le livre d'or</div>
          <div style={{ fontFamily: fB, fontSize: 11, color: inkFaintPaper, marginTop: 3, letterSpacing: 0.5 }}>{SETTINGS.name || SETTINGS.place || ""}</div>
          <div style={{ width: 30, height: 1, background: paperLine, margin: "10px auto 0" }} />
        </div>
        {all.length === 0 && (
          <div style={{ fontFamily: fH, fontSize: 18, color: inkFaintPaper, textAlign: "center", margin: "8px 0 4px" }}>Le livre est ouvert. Écrivez le premier mot.</div>
        )}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {all.map((e, i) => (
            <div key={e.pid + e.id}>
              <div style={{ transform: `rotate(${tilt(e.id)}deg)` }}
                onTouchStart={e.pid === ME ? () => holdStart(e.id) : undefined} onTouchEnd={e.pid === ME ? holdEnd : undefined} onTouchMove={e.pid === ME ? holdEnd : undefined}
                onMouseDown={e.pid === ME ? () => holdStart(e.id) : undefined} onMouseUp={e.pid === ME ? holdEnd : undefined} onMouseLeave={e.pid === ME ? holdEnd : undefined}>
                <div style={{ fontFamily: fH, fontWeight: 500, fontSize: 20, lineHeight: 1.35, color: inkPaper }}>{renderMentions(e.text)}</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6, marginTop: 4 }}>
                  <Avatar id={e.pid} size={16} />
                  <span style={{ fontFamily: fH, fontWeight: 600, fontSize: 17, color: inkFaintPaper }}>{person(e.pid).name}</span>
                  {e.pid === ME && armed === e.id && <button onClick={() => askDelete(e.id)} aria-label="Retirer ce mot" style={{ cursor: "pointer", border: "none", background: "transparent", padding: "9px 0 9px 6px", minHeight: 44, display: "inline-flex", alignItems: "center", flex: "0 0 auto" }}>
                    <span style={{ border: `1px solid ${paperLine}`, color: inkFaintPaper, borderRadius: T.r.pill, minWidth: 44, height: 26, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4, fontFamily: fB, fontSize: 10.5, padding: "0 8px" }}><X size={11} /> Retirer</span>
                  </button>}
                </div>
              </div>
              {i < all.length - 1 && <div style={{ width: 26, height: 1, background: paperLine, margin: "14px auto" }} />}
            </div>
          ))}
        </div>
        <div style={{ marginTop: all.length > 0 ? 18 : 6 }}>
          <textarea ref={taRef} value={text} onChange={onType} rows={2} placeholder="Votre mot..." style={linedArea} />
          {mentionBar}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 8 }}>
            <span style={{ fontFamily: fB, fontSize: 10.5, color: inkFaintPaper, flex: 1, minWidth: 0 }}>Livre ouvert : visible immédiatement.</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, flex: "0 0 auto" }}>
              {atBtn}
              <button onClick={deposit} disabled={!text.trim()} style={{ cursor: text.trim() ? "pointer" : "default", border: "none", background: "transparent", color: text.trim() ? T.c.seaDeep : inkFaintPaper, fontFamily: fH, fontWeight: 600, fontSize: 19, padding: "9px 4px", minHeight: 44, display: "inline-flex", alignItems: "center" }}>Signer le livre ✎</button>
            </span>
          </div>
        </div>
      </div>
    );
  }
  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{ ...wrap, width: "100%", cursor: "pointer", textAlign: "left", padding: "11px 15px 11px 30px" }}>
        {seam}
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14 }}>💌</span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontFamily: fD, fontWeight: 700, color: inkPaper, fontSize: 13.5 }}>Capsule temporelle</span>
            <span style={{ display: "block", fontFamily: fB, color: inkFaintPaper, fontSize: 11.5 }}>
              {mine.length > 0 ? `${mine.length} mot${mine.length > 1 ? "s" : ""} de vous · ${totalWords} dans le carnet · révélation dans ${cd}` : `Un carnet secret. ${writers > 0 ? `${writers} y ${writers > 1 ? "ont" : "a"} déjà écrit. ` : ""}Révélation dans ${cd}.`}
            </span>
          </span>
          <span style={{ fontFamily: fH, fontWeight: 600, fontSize: 17, color: inkFaintPaper, flex: "0 0 auto" }}>Écrire ✎</span>
        </span>
      </button>
    );
  }
  return (
    <div style={wrap}>
      {seam}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 16 }}>💌</span>
        <span style={{ fontFamily: fD, fontWeight: 700, color: inkPaper, fontSize: 15, flex: 1 }}>Capsule temporelle</span>
        <button onClick={() => setOpen(false)} aria-label="Refermer le carnet" style={{ cursor: "pointer", border: "none", background: "transparent", color: inkFaintPaper, fontFamily: fD, fontWeight: 600, fontSize: 12, padding: 0 }}>Refermer</button>
      </div>
      <div style={{ fontFamily: fB, color: inkFaintPaper, fontSize: 12, margin: "3px 0 10px" }}>Vos mots restent secrets. Révélation dans {cd}, le dernier soir à 23h30.</div>
      {mine.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 11 }}>
          {mine.map((e) => (
            <div key={e.id} style={{ display: "flex", alignItems: "flex-start", gap: 8, borderBottom: `1px dashed ${paperLine}`, paddingBottom: 6 }}>
              <span style={{ flex: 1, minWidth: 0, fontFamily: fH, fontWeight: 500, fontSize: 19, lineHeight: 1.3, color: inkPaper }}>{renderMentions(e.text)}</span>
              <button onClick={() => onDelete(e.id)} aria-label="Retirer ce mot" style={{ cursor: "pointer", border: "none", background: "transparent", color: inkFaintPaper, padding: "3px 2px", flex: "0 0 auto" }}><X size={14} /></button>
            </div>
          ))}
        </div>
      )}
      <textarea ref={taRef} value={text} onChange={onType} rows={2} placeholder="Un souvenir, un merci, une prédiction..." style={linedArea} />
      {mentionBar}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
        {atBtn}
        <button onClick={deposit} disabled={!text.trim()} style={{ cursor: text.trim() ? "pointer" : "default", border: "none", background: text.trim() ? T.c.sea : paperLine, color: text.trim() ? "#fff" : inkFaintPaper, borderRadius: T.r.md, padding: "9px 16px", fontFamily: fD, fontWeight: 700, fontSize: 13 }}>Déposer dans le carnet</button>
      </div>
    </div>
  );
}

/* Diaporama de la galerie */
function Diaporama({ photos, onClose, onReact, onToggleTag }) {
  const list = useMemo(() => [...(photos || [])].filter((p) => p.url).sort((a, b) => (a.at || 0) - (b.at || 0)), [photos]);
  const [i, setI] = useState(0);
  const [play, setPlay] = useState(true);
  const [tagsOn, setTagsOn] = useState(false);
  const n = list.length;
  useEffect(() => {
    if (!play || tagsOn || n < 2) return undefined;
    const id = setTimeout(() => setI((x) => (x + 1) % n), 3600);
    return () => clearTimeout(id);
  }, [i, play, tagsOn, n]);
  if (!n) return null;
  const p = list[Math.min(i, n - 1)];
  const reactions = p.reactions || {};
  const counts = {}; const mine = new Set(reactions[ME] || []);
  Object.keys(reactions).forEach((pid) => (reactions[pid] || []).forEach((em) => { counts[em] = (counts[em] || 0) + 1; }));
  const tags = p.tags || [];
  const roster = ROSTER.filter((x) => x.active);
  const go = (dx) => { setI((x) => (x + dx + n) % n); };
  return (
    <div data-diapo="1" style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(6,14,18,0.96)", display: "flex", flexDirection: "column" }}>
      <style>{`@keyframes dpBar { from { width: 0%; } to { width: 100%; } } @keyframes dpFade { from { opacity: 0; } to { opacity: 1; } }`}</style>
      <div style={{ display: "flex", gap: 3, padding: "calc(10px + env(safe-area-inset-top)) 12px 0" }}>
        {list.map((x, k) => (
          <span key={x.id} style={{ flex: 1, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.3)", overflow: "hidden" }}>
            <span style={{ display: "block", height: "100%", background: "#fff", width: k < i ? "100%" : "0%", ...(k === i && play && !tagsOn ? { animation: "dpBar 3.6s linear both" } : k === i ? { width: "40%" } : {}) }} />
          </span>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 14px 4px" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          {p.who && <Avatar id={p.who} size={26} />}
          <span style={{ fontFamily: fD, fontWeight: 700, color: "#fff", fontSize: 15 }}>{p.who ? person(p.who).name : ""}</span>
          <span style={{ fontFamily: fB, color: "#ffffff88", fontSize: 12.5 }}>{i + 1} / {n}</span>
        </span>
        <span style={{ display: "inline-flex", gap: 8 }}>
          <button onClick={() => setPlay((v) => !v)} aria-label={play ? "Mettre en pause" : "Reprendre"} style={{ cursor: "pointer", border: "none", background: "#ffffff22", color: "#fff", width: 44, height: 44, borderRadius: T.r.pill, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {play ? <Pause size={19} /> : <Play size={19} />}
          </button>
          <button onClick={onClose} aria-label="Fermer le diaporama" style={{ cursor: "pointer", border: "none", background: "#ffffff22", color: "#fff", width: 44, height: 44, borderRadius: T.r.pill, display: "flex", alignItems: "center", justifyContent: "center" }}><X size={20} /></button>
        </span>
      </div>
      <div style={{ flex: 1, minHeight: 0, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: "6px 12px" }}>
        <img key={p.id} src={p.url} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: T.r.lg, animation: "dpFade .5s ease" }} />
        <button onClick={() => go(-1)} aria-label="Photo précédente" style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: "26%", background: "transparent", border: "none", cursor: "pointer" }} />
        <button onClick={() => go(1)} aria-label="Photo suivante" style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: "26%", background: "transparent", border: "none", cursor: "pointer" }} />
      </div>
      <div style={{ padding: "10px 14px calc(16px + env(safe-area-inset-bottom))", display: "flex", flexDirection: "column", gap: 9 }}>
        {tags.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontFamily: fB, fontSize: 12, color: "#ffffff88" }}>Sur la photo</span>
            {tags.map((pid) => (
              <span key={pid} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#ffffff1a", borderRadius: T.r.pill, padding: "3px 9px 3px 3px" }}>
                <Avatar id={pid} size={18} />
                <span style={{ fontFamily: fB, fontSize: 12, color: "#fff" }}>{person(pid).name}</span>
              </span>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center" }}>
          {REACTIONS.map((em) => {
            const on = mine.has(em); const c = counts[em] || 0;
            return (
              <button key={em} onClick={() => { setPlay(false); onReact(p.id, em); }} style={{ cursor: "pointer", minHeight: 40, border: on ? "1px solid #ffffffcc" : "1px solid #ffffff33", background: on ? "#ffffff26" : "#ffffff0d", color: "#fff", borderRadius: T.r.pill, padding: "6px 11px", fontFamily: fD, fontWeight: 600, fontSize: 14, display: "inline-flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 16 }}>{em}</span>{c > 0 ? " " + c : ""}
              </button>
            );
          })}
          <button onClick={() => { setTagsOn((v) => !v); setPlay(false); }} aria-label="Identifier des personnes" style={{ cursor: "pointer", minHeight: 40, marginLeft: "auto", border: "1px solid #ffffff33", background: tagsOn ? "#ffffff26" : "#ffffff0d", color: "#fff", borderRadius: T.r.pill, padding: "6px 12px", fontFamily: fD, fontWeight: 700, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Users size={16} /> Identifier
          </button>
        </div>
        {tagsOn && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {roster.map((x) => {
              const on = tags.includes(x.id);
              return (
                <button key={x.id} onClick={() => onToggleTag(p.id, x.id)} style={{ cursor: "pointer", minHeight: 40, border: on ? `2px solid ${(META[x.id] && META[x.id].color) || T.c.sea}` : "1px solid #ffffff33", background: on ? "#ffffff1f" : "#ffffff0d", color: "#fff", borderRadius: T.r.pill, padding: "5px 12px 5px 5px", display: "inline-flex", alignItems: "center", gap: 7 }}>
                  <Avatar id={x.id} size={22} />
                  <span style={{ fontFamily: fB, fontSize: 13 }}>{person(x.id).name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* Film du séjour */
function detectVehicule(events) {
  const txt = mainList(events).map((e) => `${e.title || ""} ${e.place && e.place.name || ""}`).join(" ").toLowerCase();
  if (/ferry|bateau|boat|croisi|voilier|travers[ée]e/.test(txt)) return "bateau";
  if (/v[ée]lo|bike|cyclo/.test(txt)) return "velo";
  if (/\bvol\b|avion|a[ée]roport|airport|aeroporto|aeropuerto|flughafen|αερολιμ|terminal/.test(txt)) return "avion";
  return "voiture";
}
const THEMES = {
  mer: {
    fam: "ile", ciel: ["#FFF6E4", "#FFD9B4", "#FFC9A0"], astre: "#F3AF42", astreHalo: "rgba(247,196,96,0.35)", etoile: "#E2A244",
    fond: ["#8FC6CF", "#5FA3B4"], sol: "#EFE3C2", solL: "#C9B189", relief: "#DCCBA0", trait: "#D4553F", point: "#F0604A", encre: "#28414C",
    bandes: ["#FFECD6", "#FDE8CC", "#E9F3EE", "#F6EFDF", "#FBE9E3", "#EEF0F9"], papier: ["#F7EEDD", "#EFDFC4"], papierTxt: "#54463A",
    fete: "bulle", feteFond: ["#FFF8E9", "#FFE9CE"], feteTxt: "#4A3B23", feteLabel: "#A5822F",
    fin: ["#FFEBD4", "#FFC9A6", "#F7B08C"], scrim: "rgba(255,222,190,0.72)", finTxt: "#4A2E18", finTxt2: "#6E4A2E", finPied: "#8A5E3C",
  },
  ville: {
    fam: "ville", ciel: ["#243545", "#3D566B", "#5C7386"], astre: "#FFD98A", astreHalo: "rgba(255,217,138,0.28)", etoile: "#FFE3A8",
    fond: ["#EDF1F4", "#D6DEE5"], sol: "#C6D0D8", solL: "#9AA9B6", relief: "#AEBAC5", trait: "#E0645A", point: "#E0645A", encre: "#22323E",
    bandes: ["#E9EEF2", "#F1ECE6", "#E6EAF3", "#F2EDF0", "#E8F0EF", "#EFEFEA"], papier: ["#EEF1F4", "#DFE5EA"], papierTxt: "#3A4650",
    fete: "lumiere", feteFond: ["#1C2C38", "#33485A"], feteTxt: "#FFFFFF", feteLabel: "#FFD98A",
    fin: ["#2B3E4E", "#43596B", "#5E7688"], scrim: "rgba(30,44,56,0.7)", finTxt: "#FFF3DE", finTxt2: "#FFD98A", finPied: "#C8D6E0",
  },
  ski: {
    fam: "montagne", ciel: ["#EAF4FB", "#CBE3F4", "#A9CFE8"], astre: "#FFF3D0", astreHalo: "rgba(255,255,255,0.4)", etoile: "#FFFFFF",
    fond: ["#DCEEFA", "#B4D5EC"], sol: "#FBFDFF", solL: "#9FC0D6", relief: "#CFE3F0", trait: "#2E6B80", point: "#2E6B80", encre: "#254554",
    bandes: ["#EDF6FC", "#E4F0FA", "#F0F5F9", "#E9F2F8", "#F3F8FC", "#E6EFF7"], papier: ["#F4FAFE", "#E3EFF8"], papierTxt: "#2D4757",
    fete: "flocon", feteFond: ["#E9F4FB", "#CFE4F2"], feteTxt: "#254554", feteLabel: "#4E7C96",
    fin: ["#EAF4FB", "#C3DEF1", "#9FC8E4"], scrim: "rgba(226,240,250,0.76)", finTxt: "#20404F", finTxt2: "#42708A", finPied: "#6D95AC",
  },
  rando: {
    fam: "montagne", ciel: ["#FBF3DF", "#E8DCB8", "#CFC392"], astre: "#EBA845", astreHalo: "rgba(235,168,69,0.3)", etoile: "#C79A4A",
    fond: ["#E6EEDD", "#C3D6AF"], sol: "#D9C79A", solL: "#A98F5F", relief: "#C2AC79", trait: "#B4553A", point: "#C25A38", encre: "#40402A",
    bandes: ["#F3EEDC", "#EBF0E0", "#F6EFDF", "#E9F0E6", "#F4EADC", "#EDF1E4"], papier: ["#F6F0DD", "#E9E0C4"], papierTxt: "#4A4530",
    fete: "feuille", feteFond: ["#FBF4E2", "#EFE4C4"], feteTxt: "#40402A", feteLabel: "#8A7A3F",
    fin: ["#F7EFD9", "#E3D5A8", "#C9B67F"], scrim: "rgba(246,238,214,0.74)", finTxt: "#3F3B22", finTxt2: "#6E6438", finPied: "#8E834F",
  },
  mariage: {
    fam: "campagne", ciel: ["#FFF6F2", "#FBE2DC", "#F4CFC8"], astre: "#F6C9C0", astreHalo: "rgba(246,201,192,0.35)", etoile: "#E8A8A0",
    fond: ["#F6EFE9", "#E7DCD2"], sol: "#E8DCC8", solL: "#C4AE95", relief: "#DACBB2", trait: "#C4626E", point: "#D0707C", encre: "#4A3138",
    bandes: ["#FBEFEC", "#F7F0E8", "#F3EEF6", "#FAF0EE", "#F2F0E9", "#F6EDF2"], papier: ["#FDF4F1", "#F2E4DE"], papierTxt: "#4E3A3C",
    fete: "petale", feteFond: ["#FFF7F4", "#FBE6E0"], feteTxt: "#4A3138", feteLabel: "#B07A80",
    fin: ["#FEF2EE", "#F7DCD5", "#EDC3BA"], scrim: "rgba(253,238,233,0.76)", finTxt: "#4A2E2E", finTxt2: "#8A5A5C", finPied: "#A87C7C",
  },
  detente: {
    fam: "campagne", ciel: ["#FFF8E8", "#F7E7C2", "#EDD5A0"], astre: "#F0BF5E", astreHalo: "rgba(240,191,94,0.32)", etoile: "#D9AE58",
    fond: ["#F2F0DF", "#DCDCB8"], sol: "#E6DAB2", solL: "#B9A579", relief: "#D5C593", trait: "#C08A3C", point: "#CE9243", encre: "#4A4331",
    bandes: ["#FAF3E1", "#F4F1E2", "#EFF3E8", "#F8EFDF", "#F2EFE3", "#F6F2E6"], papier: ["#FCF6E6", "#F0E6CC"], papierTxt: "#4C452F",
    fete: "petale", feteFond: ["#FDF7E7", "#F5E7C6"], feteTxt: "#4A4331", feteLabel: "#9C8342",
    fin: ["#FDF6E4", "#F1E0B4", "#E2CB8E"], scrim: "rgba(252,244,224,0.74)", finTxt: "#453F28", finTxt2: "#7A6E42", finPied: "#9A8B58",
  },
  anniversaire: {
    fam: "campagne", ciel: ["#FBF2FF", "#EEDCF8", "#DCC4EE"], astre: "#C79ED6", astreHalo: "rgba(199,158,214,0.32)", etoile: "#B98ACB",
    fond: ["#F4EFF8", "#E0D4EC"], sol: "#E9DEC6", solL: "#B9A88E", relief: "#DBCDB0", trait: "#7E5DA8", point: "#8A66B4", encre: "#3E3050",
    bandes: ["#F6EEFA", "#FBEFEA", "#EFF2FA", "#F9EFF4", "#F0F4EE", "#F4EFF8"], papier: ["#FBF5FC", "#EFE4F2"], papierTxt: "#453556",
    fete: "confetti", feteFond: ["#FDF7FF", "#F0E4FA"], feteTxt: "#3E3050", feteLabel: "#7E5DA8",
    fin: ["#FBF1FF", "#EBD9F6", "#D8BFEC"], scrim: "rgba(250,240,252,0.74)", finTxt: "#3C2C4E", finTxt2: "#6E5088", finPied: "#8C6EA6",
  },
};
const themeDe = () => THEMES[SETTINGS.tripType] || THEMES.mer;
const FETE_COLS = {
  bulle: ["rgba(255,255,255,0.9)", "rgba(174,224,240,0.95)", "rgba(255,255,255,0.65)"],
  lumiere: ["#FFD98A", "#FFF0C4", "#FFB86B"],
  flocon: ["#FFFFFF", "#E8F3FB"],
  feuille: ["#C9873F", "#A8B25A", "#D8A24A"],
  petale: ["#F7C9C0", "#FFE3DC", "#FFFFFF"],
  confetti: ["#F0604A", "#2E6B80", "#E2A244", "#7E5DA8", "#3E8E6C"],
};
function Celebration({ kind, n }) {
  const cols = FETE_COLS[kind] || FETE_COLS.bulle;
  const nb = n || (kind === "flocon" ? 24 : kind === "confetti" ? 18 : 16);
  const monte = kind === "bulle" || kind === "lumiere";
  const nom = monte ? "fmRise" : kind === "flocon" ? "fmSnow" : kind === "confetti" ? "fmConf" : "fmLeaf";
  return (
    <>
      {Array.from({ length: nb }, (_, k) => {
        const col = cols[k % cols.length];
        const sz = kind === "flocon" ? 4 + (k % 3) * 2 : kind === "bulle" ? 6 + (k % 4) * 4 : kind === "lumiere" ? 5 + (k % 3) * 3 : 9;
        const st = {
          position: "absolute", left: `${(k * 37 + 5) % 93}%`,
          width: kind === "confetti" ? 8 : kind === "feuille" || kind === "petale" ? sz + 4 : sz,
          height: kind === "confetti" ? 13 : sz, background: col, animationName: nom,
          animationDelay: `${((k * 13) % 32) / 10}s`, animationDuration: `${(monte ? 3.4 : 3) + ((k * 7) % 24) / 10}s`,
          animationTimingFunction: monte ? "ease-out" : "linear", animationIterationCount: "infinite", pointerEvents: "none",
          ...(monte ? { bottom: -24 } : { top: -24 }),
          ...(kind === "bulle" ? { borderRadius: "50%", border: "1px solid rgba(255,255,255,0.75)" } : {}),
          ...(kind === "lumiere" ? { borderRadius: "50%", filter: "blur(1.6px)" } : {}),
          ...(kind === "flocon" ? { borderRadius: "50%", boxShadow: "0 0 6px rgba(255,255,255,0.9)" } : {}),
          ...(kind === "feuille" || kind === "petale" ? { borderRadius: "60% 0 60% 0" } : {}),
          ...(kind === "confetti" ? { borderRadius: 2 } : {}),
        };
        return <span key={k} style={st} />;
      })}
    </>
  );
}
function hullDe(pts) {
  if (pts.length < 3) return null;
  const P2 = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [];
  for (const p of P2) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  const up = [];
  for (let i = P2.length - 1; i >= 0; i--) { const p = P2[i]; while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
function pathDe(el) {
  if (!el || el.length < 3) return "";
  let d = "";
  for (let i = 0; i < el.length; i++) {
    const a = el[i], b = el[(i + 1) % el.length];
    if (i === 0) d += `M ${(a[0] + b[0]) / 2} ${(a[1] + b[1]) / 2} `;
    const c = el[(i + 1) % el.length], nn = el[(i + 2) % el.length];
    d += `Q ${c[0]} ${c[1]} ${(c[0] + nn[0]) / 2} ${(c[1] + nn[1]) / 2} `;
  }
  return d + "Z";
}
function CarteStylisee({ lieux, sequence, th }) {
  const uid = useMemo(() => "cs" + Math.random().toString(36).slice(2, 8), []);
  const pts = (lieux || []).filter((p) => p.coord);
  if (!pts.length) return null;
  const seq = (sequence || []).filter((s) => s.coord);
  const tous = pts.map((p) => p.coord).concat(seq.map((s) => s.coord));
  const lats = tous.map((c) => c.lat), lngs = tous.map((c) => c.lng);
  const la0 = Math.min(...lats), la1 = Math.max(...lats), lo0 = Math.min(...lngs), lo1 = Math.max(...lngs);
  const nx = (lng) => 14 + ((lng - lo0) / Math.max(0.0004, lo1 - lo0)) * 72;
  const ny = (lat) => 46 - ((lat - la0) / Math.max(0.0004, la1 - la0)) * 34;
  const xy = pts.map((p) => [nx(p.coord.lng), ny(p.coord.lat)]);
  const cx0 = xy.reduce((s, p) => s + p[0], 0) / Math.max(1, xy.length);
  const cy0 = xy.reduce((s, p) => s + p[1], 0) / Math.max(1, xy.length);
  const h = hullDe(xy);
  const gonfle = (f) => (h || []).map(([x, y]) => [clamp(cx0 + (x - cx0) * f * 1.55, 4, 96), clamp(cy0 + (y - cy0) * f * 1.7, 4, 56)]);
  const masse = h ? pathDe(gonfle(1)) : "";
  const contours = h ? [0.74, 0.5, 0.28].map((f) => pathDe(gonfle(f))) : [];
  const alea = (k, s) => { const x = Math.sin((k + 1) * 12.9898 + s * 78.233) * 43758.5453; return x - Math.floor(x); };
  return (
    <svg viewBox="0 0 100 62" style={{ width: "100%", height: "100%", display: "block" }} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={uid + "f"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={th.fond[0]} /><stop offset="1" stopColor={th.fond[1]} />
        </linearGradient>
        {masse && <clipPath id={uid + "c"}><path d={masse} /></clipPath>}
      </defs>
      <rect x="0" y="0" width="100" height="62" fill={`url(#${uid}f)`} />
      {th.fam === "ile" && [[10, 12], [70, 8], [26, 54], [82, 50]].map(([wx, wy], i) => (
        <path key={i} d={`M ${wx} ${wy} q 2.5 -1.6 5 0 t 5 0`} fill="none" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="0.7" strokeLinecap="round" style={{ animation: `vdrift ${5 + i}s ease-in-out infinite alternate` }} />
      ))}
      {th.fam === "ville" && Array.from({ length: 9 }, (_, i) => (
        <line key={i} x1={i * 12 + 2} y1="0" x2={i * 12 - 6} y2="62" stroke={th.solL} strokeOpacity="0.18" strokeWidth="0.5" />
      ))}
      {th.fam === "montagne" && Array.from({ length: 5 }, (_, i) => (
        <path key={i} d={`M ${i * 24 - 6} 62 L ${i * 24 + 8} ${34 - (i % 2) * 7} L ${i * 24 + 22} 62 Z`} fill={th.relief} opacity="0.35" />
      ))}
      {th.fam === "campagne" && Array.from({ length: 3 }, (_, i) => (
        <path key={i} d={`M -6 ${52 + i * 4} Q ${28 + i * 12} ${40 + i * 5} ${106} ${50 + i * 4} L 106 62 L -6 62 Z`} fill={th.relief} opacity="0.3" />
      ))}
      {masse && th.fam === "ile" && <path d={masse} fill="none" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="2.6" />}
      {masse && <path d={masse} fill={th.sol} stroke={th.solL} strokeWidth="0.9" />}
      {masse && (
        <g clipPath={`url(#${uid}c)`}>
          {th.fam === "montagne" && contours.map((d, i) => <path key={i} d={d} fill="none" stroke={th.solL} strokeOpacity={0.45 - i * 0.08} strokeWidth="0.5" />)}
          {th.fam === "montagne" && Array.from({ length: 6 }, (_, i) => {
            const x = 10 + alea(i, 1) * 80, y = 8 + alea(i, 2) * 46, w = 5 + alea(i, 3) * 5;
            return <path key={"p" + i} d={`M ${x - w} ${y + w} L ${x} ${y - w * 0.9} L ${x + w} ${y + w} Z`} fill={th.relief} stroke={th.solL} strokeWidth="0.4" opacity="0.85" />;
          })}
          {th.fam === "ville" && Array.from({ length: 22 }, (_, i) => {
            const x = 8 + alea(i, 4) * 84, y = 8 + alea(i, 5) * 44, w = 2 + alea(i, 6) * 3.4, hh = 2 + alea(i, 7) * 5;
            return <rect key={"b" + i} x={x} y={y} width={w} height={hh} fill={th.relief} stroke={th.solL} strokeWidth="0.25" opacity="0.9" />;
          })}
          {th.fam === "ville" && Array.from({ length: 5 }, (_, i) => (
            <line key={"r" + i} x1="-6" y1={10 + i * 10} x2="106" y2={6 + i * 10} stroke="#ffffff" strokeOpacity="0.5" strokeWidth="0.9" />
          ))}
          {th.fam === "campagne" && Array.from({ length: 16 }, (_, i) => {
            const x = 8 + alea(i, 8) * 84, y = 8 + alea(i, 9) * 44;
            return <circle key={"t" + i} cx={x} cy={y} r={1 + alea(i, 10) * 1.4} fill={th.relief} opacity="0.75" />;
          })}
          {th.fam === "ile" && Array.from({ length: 10 }, (_, i) => {
            const x = 10 + alea(i, 11) * 80, y = 10 + alea(i, 12) * 40;
            return <circle key={"s" + i} cx={x} cy={y} r={0.9 + alea(i, 13) * 1.1} fill={th.relief} opacity="0.6" />;
          })}
        </g>
      )}
      {seq.length === 0 && xy.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="0" fill={th.point} stroke="#fff" strokeWidth="0.8">
          <animate attributeName="r" values="0;2.9;2.1" keyTimes="0;0.7;1" begin={`${0.5 + i * 0.16}s`} dur="0.5s" fill="freeze" />
        </circle>
      ))}
      {seq.length > 1 && (() => {
        const dTot = 1.5;
        const total = seq.reduce((acc, s, i) => (i === 0 ? 0 : acc + Math.hypot(nx(s.coord.lng) - nx(seq[i - 1].coord.lng), ny(s.coord.lat) - ny(seq[i - 1].coord.lat))), 0) || 1;
        let cum = 0;
        return seq.slice(1).map((s, i) => {
          const a = seq[i];
          const seg = Math.hypot(nx(s.coord.lng) - nx(a.coord.lng), ny(s.coord.lat) - ny(a.coord.lat));
          const t0 = 0.55 + (cum / total) * dTot;
          cum += seg;
          const dur = Math.max(0.18, (seg / total) * dTot);
          return (
            <path key={"s" + i} d={`M ${nx(a.coord.lng)} ${ny(a.coord.lat)} L ${nx(s.coord.lng)} ${ny(s.coord.lat)}`} pathLength="1" fill="none" stroke={th.trait} strokeWidth="1.3" strokeLinecap="round" strokeDasharray="1" strokeDashoffset="1">
              <animate attributeName="stroke-dashoffset" from="1" to="0" begin={`${t0}s`} dur={`${dur}s`} fill="freeze" />
              <animate attributeName="stroke-opacity" values="1;0.5;1" begin={`${0.55 + dTot}s`} dur="1.6s" repeatCount="indefinite" />
            </path>
          );
        });
      })()}
      {seq.map((s, i) => {
        const x = nx(s.coord.lng), y = ny(s.coord.lat);
        const t0 = 0.2 + i * 0.09;
        return (
          <g key={"p" + i}>
            <circle cx={x} cy={y} r="2" fill="none" stroke={th.trait} strokeWidth="0.6" opacity="0">
              <animate attributeName="r" from="2" to="8" begin={`${t0}s`} dur="0.9s" fill="freeze" />
              <animate attributeName="opacity" from="0.8" to="0" begin={`${t0}s`} dur="0.9s" fill="freeze" />
            </circle>
            <circle cx={x} cy={y} r="0" fill={th.point} stroke="#fff" strokeWidth="0.9">
              <animate attributeName="r" values="0;4.4;3.2" keyTimes="0;0.66;1" begin={`${t0}s`} dur="0.5s" fill="freeze" />
            </circle>
            <text x={x} y={y - 5.2} textAnchor="middle" fontSize="3.1" fontWeight="700" fill={th.encre} fontFamily="sans-serif" paintOrder="stroke" stroke="#ffffff" strokeWidth="1" opacity="0">
              <animate attributeName="opacity" from="0" to="1" begin={`${t0 + 0.2}s`} dur="0.4s" fill="freeze" />
              {String(s.nom || "").slice(0, 22)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
function VehiculeSVG({ kind }) {
  if (kind === "bateau") return (
    <g>
      <path d="M 0 0 L 0 -7 L -5 0 Z" fill="#2E4550" /><path d="M 1.4 0 L 1.4 -5.6 L 5.6 0 Z" fill="#2E4550" />
      <path d="M -6 0.8 L 7 0.8 L 5 3 L -4 3 Z" fill="#3A5560" />
    </g>
  );
  if (kind === "velo") return (
    <g stroke="#2E4550" strokeWidth="0.9" fill="none">
      <circle cx="-3.4" cy="1.6" r="2.6" /><circle cx="3.4" cy="1.6" r="2.6" />
      <path d="M -3.4 1.6 L -1 -2.4 L 2.2 -2.4 L 3.4 1.6 M -1 -2.4 L 0.6 1.6 L -3.4 1.6 M 2.2 -2.4 L 1.6 -3.6" />
    </g>
  );
  if (kind === "voiture") return (
    <g>
      <path d="M -6.5 1 L -5.5 -1.6 L -2.6 -3.4 L 2.8 -3.4 L 5.4 -1.4 L 6.5 1 L 6.2 2.2 L -6.2 2.2 Z" fill="#3A5560" />
      <path d="M -2.2 -2.6 L 2.2 -2.6 L 4 -1.4 L -3.6 -1.4 Z" fill="#BFE0EA" />
      <circle cx="-3.6" cy="2.4" r="1.5" fill="#22333B" /><circle cx="3.6" cy="2.4" r="1.5" fill="#22333B" />
    </g>
  );
  return (
    <g fill="#3A5560">
      <path d="M -6 0 L 6.5 -1.2 L 8.5 0.4 L -6 1.6 Z" />
      <path d="M -0.5 -0.6 L 2.5 -6 L 4.2 -5.6 L 2.6 -0.8 Z" />
      <path d="M -0.2 0.9 L 2 4.6 L 3.6 4.2 L 2.4 0.7 Z" />
      <path d="M -6 0 L -8.4 -2.6 L -7 -2.8 L -4.6 -0.4 Z" />
    </g>
  );
}
const MUS = {
  mer: { root: 261.63, bpm: 122, style: "deephouse", pad: "sine", pluck: "triangle", bass: "sine", vol: 0.25, swing: 0.06, prog: [[0, 3, 7, 10], [-2, 2, 5, 9], [-4, 0, 3, 7], [5, 8, 12, 15]] },
  ville: { root: 246.94, bpm: 120, pad: "sawtooth", pluck: "square", bass: "square", vol: 0.2, swing: 0.16, prog: [[0, 3, 7, 10], [5, 8, 12, 15], [8, 12, 15, 19], [3, 7, 10, 14]] },
  ski: { root: 293.66, bpm: 100, pad: "sine", pluck: "triangle", bass: "sine", vol: 0.22, swing: 0.08, prog: [[0, 4, 7, 11], [9, 12, 16, 19], [5, 9, 12, 16], [7, 11, 14, 17]] },
  rando: { root: 261.63, bpm: 108, pad: "triangle", pluck: "triangle", bass: "sawtooth", vol: 0.23, swing: 0.1, prog: [[0, 4, 7, 11], [5, 9, 12, 16], [7, 11, 14, 17], [2, 5, 9, 12]] },
  mariage: { root: 277.18, bpm: 104, pad: "sine", pluck: "triangle", bass: "sine", vol: 0.22, swing: 0.14, prog: [[0, 4, 7, 11], [9, 12, 16, 19], [2, 5, 9, 12], [7, 11, 14, 17]] },
  detente: { root: 261.63, bpm: 96, pad: "sine", pluck: "sine", bass: "sine", vol: 0.21, swing: 0.16, prog: [[0, 4, 7, 11], [5, 9, 12, 16], [-3, 0, 4, 9], [7, 11, 14, 17]] },
  anniversaire: { root: 293.66, bpm: 126, pad: "sawtooth", pluck: "square", bass: "sawtooth", vol: 0.2, swing: 0.12, prog: [[0, 4, 7, 12], [5, 9, 12, 17], [9, 12, 16, 21], [7, 11, 14, 19]] },
};
let AUDIO_CTX = null;
function ctxAudio() {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!AUDIO_CTX) { try { AUDIO_CTX = new AC(); } catch (e) { return null; } }
  return AUDIO_CTX;
}
function debloquerAudio() {
  const ctx = ctxAudio();
  if (!ctx) return;
  try {
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const b = ctx.createBuffer(1, 1, 22050);
    const s = ctx.createBufferSource();
    s.buffer = b; s.connect(ctx.destination); s.start(0);
  } catch (e) { /* rien */ }
}
if (typeof document !== "undefined") {
  const g = () => debloquerAudio();
  ["pointerdown", "touchstart", "touchend", "mousedown", "click", "keydown"].forEach((e) => document.addEventListener(e, g, { capture: true, passive: true }));
}
function useMusique(type, actif) {
  useEffect(() => {
    if (!actif || typeof window === "undefined") return undefined;
    const ctx = ctxAudio();
    if (!ctx) return undefined;
    debloquerAudio();
    const cfg = MUS[type] || MUS.mer;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, ctx.currentTime);
    const comp = ctx.createDynamicsCompressor();
    try { comp.threshold.value = -14; comp.knee.value = 26; comp.ratio.value = 3.2; comp.attack.value = 0.004; comp.release.value = 0.2; } catch (e) {}
    master.connect(comp); comp.connect(ctx.destination);
    const dly = ctx.createDelay(1);
    dly.delayTime.value = (60 / cfg.bpm) * 0.75;
    const fb = ctx.createGain(); fb.gain.value = 0.26;
    const wet = ctx.createGain(); wet.gain.value = 0.2;
    dly.connect(fb); fb.connect(dly); dly.connect(wet); wet.connect(master);
    const f = (semi) => cfg.root * Math.pow(2, semi / 12);
    // bruit blanc partagé pour la batterie
    const noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.4), ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    const bruit = (t, dur, g, hp, bp) => {
      const s = ctx.createBufferSource(); s.buffer = noiseBuf;
      const filt = ctx.createBiquadFilter();
      if (bp) { filt.type = "bandpass"; filt.frequency.value = bp; filt.Q.value = 0.8; }
      else { filt.type = "highpass"; filt.frequency.value = hp || 7000; }
      const gn = ctx.createGain();
      gn.gain.setValueAtTime(g, t);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(filt); filt.connect(gn); gn.connect(master);
      s.start(t); s.stop(t + dur + 0.02);
    };
    const voix = (freq, t, dur, wave, g, echo, gliss) => {
      const o = ctx.createOscillator(); o.type = wave;
      o.frequency.setValueAtTime(freq, t);
      if (gliss) o.frequency.exponentialRampToValueAtTime(gliss, t + dur);
      const gn = ctx.createGain();
      gn.gain.setValueAtTime(0.0001, t);
      gn.gain.linearRampToValueAtTime(g, t + Math.min(0.14, dur * 0.25));
      gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(gn); gn.connect(master);
      if (echo) gn.connect(dly);
      o.start(t); o.stop(t + dur + 0.06);
    };
    const kick = (t) => { voix(150, t, 0.16, "sine", 0.9, false, 46); };
    const charley = (t, ouvert) => bruit(t, ouvert ? 0.12 : 0.035, ouvert ? 0.12 : 0.16, 8500);
    const clap = (t) => bruit(t, 0.14, 0.4, null, 1700);
    const snare = (t) => bruit(t, 0.1, 0.32, null, 2100);
    const riser = (t, dur) => {
      const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
      const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 1.2;
      bp.frequency.setValueAtTime(600, t); bp.frequency.exponentialRampToValueAtTime(6000, t + dur);
      const gn = ctx.createGain(); gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(0.05, t + dur * 0.9); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(bp); bp.connect(gn); gn.connect(master); s.start(t); s.stop(t + dur + 0.05);
    };
    const spb = 60 / cfg.bpm;
    const croche2 = spb / 4;
    let step = 0, next = 0, lance = false;
    const tick = () => {
      if (!ctx || ctx.state === "closed") return;
      if (ctx.state !== "running") { ctx.resume().catch(() => {}); return; }
      if (!lance) {
        lance = true;
        next = ctx.currentTime + 0.12;
        try { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setValueAtTime(0.0001, ctx.currentTime); master.gain.linearRampToValueAtTime(cfg.vol, ctx.currentTime + 2.4); } catch (e) {}
      }
      const MOTIFS = [
        [0, 2, 4, 2, 1, 3, 5, 3],
        [4, 3, 2, 1, 0, 1, 2, 3],
        [0, 0, 2, 2, 1, 1, 4, 4],
        [0, 4, 1, 5, 2, 4, 3, 5],
        [0, null, 2, null, 4, null, 1, null],
        [5, 4, 3, 2, 1, 2, 3, 4],
      ];
      while (next < ctx.currentTime + 0.4) {
        const pos = step % 16;
        const bar = Math.floor(step / 16);
        const acc = cfg.prog[bar % cfg.prog.length];
        const phase = bar % 8;
        const intro = bar < 2;
        const brk = phase === 7;
        const fill = phase === 3 || phase === 7;
        const house = cfg.style === "deephouse";
        const sw = pos % 2 === 1 ? croche2 * (cfg.swing || 0) : 0;
        const t = next + sw;

        // NAPPE : accord tenu, voicing enrichi une mesure sur quatre
        if (pos === 0) {
          acc.forEach((s, j) => voix(f(s - 12), t, spb * 3.6, cfg.pad, j === 0 ? 0.045 : 0.028, false));
          if (bar % 4 === 2) voix(f(acc[acc.length - 1]), t, spb * 3.2, cfg.pad, 0.02, false);
        }

        // BASSE (silencieuse en intro sauf le premier temps)
        if (!intro || pos === 0) {
          if (house) {
            if (pos === 0 || pos === 3 || pos === 6 || pos === 8 || pos === 11 || pos === 14) voix(f(acc[0] - 24), t, spb * 0.42, cfg.bass, 0.17, false);
          } else {
            if (pos === 0 || pos === 6 || pos === 10) voix(f(acc[0] - 24), t, pos === 6 ? spb * 0.5 : spb * 0.9, cfg.bass, 0.13, false);
            if (pos === 14 && !brk) voix(f(acc[0] - 12), t, spb * 0.45, cfg.bass, 0.09, false);
          }
        }

        // BATTERIE : construite en intro, coupée pendant le break
        if (!intro) {
          const beat = pos % 4 === 0;
          if (beat && !(brk && pos >= 8)) kick(t);
          if ((pos === 4 || pos === 12) && !(brk && pos === 4)) clap(t);
          if (house) {
            if (pos === 2 || pos === 6 || pos === 10 || pos === 14) charley(t, true);
            else if (pos % 2 === 0) charley(t, false);
          } else if (pos % 2 === 0) {
            charley(t, pos % 8 === 6);
          }
          // fill : petit roulement en fin de mesure
          if (fill && pos >= 12) { snare(t); if (pos >= 14) charley(t, true); }
        } else if (pos % 4 === 2) {
          charley(t, false);
        }

        // LEAD : motif qui tourne toutes les deux mesures, muet pendant le break
        if (pos % 2 === 0 && !brk && !(intro && bar === 0)) {
          const motif = MOTIFS[Math.floor(bar / 2) % MOTIFS.length];
          const deg = motif[pos / 2];
          if (deg != null) {
            const semi = deg < acc.length ? acc[deg] : acc[deg - acc.length] + 12;
            voix(f(semi + (house ? 0 : 12)), t, house ? spb * 0.5 : croche2 * 1.5, cfg.pluck, house ? 0.03 : 0.055, true);
          }
        }
        // stabs house supplémentaires sur les levées
        if (house && (pos === 6 || pos === 14) && !brk) acc.forEach((s) => voix(f(s), t, spb * 0.45, cfg.pad, 0.022, true));

        // RISER : balaie pendant le break pour relancer la boucle
        if (brk && pos === 8) riser(t, spb * 4);

        next += croche2;
        step += 1;
      }
    };
    tick();
    const id = setInterval(tick, 60);
    let vivant = true;
    const relance = () => { if (vivant && ctx.state === "suspended") ctx.resume().catch(() => {}); };
    const surGeste = () => relance();
    if (typeof document !== "undefined") ["pointerdown", "touchstart", "click"].forEach((e) => document.addEventListener(e, surGeste, { passive: true }));
    return () => {
      vivant = false;
      clearInterval(id);
      if (typeof document !== "undefined") ["pointerdown", "touchstart", "click"].forEach((e) => document.removeEventListener(e, surGeste));
      try { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setValueAtTime(master.gain.value, ctx.currentTime); master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.4); } catch (e) {}
      try { master.disconnect(); dly.disconnect(); wet.disconnect(); fb.disconnect(); } catch (e) {}
    };
  }, [actif, type]);
}
const momentLabel = (hh) => {
  const h = Number(String(hh || "").slice(0, 2));
  if (!hh || Number.isNaN(h)) return "Ce jour-là";
  if (h < 11) return "Au matin";
  if (h < 14) return "À midi";
  if (h < 18) return "L'après-midi";
  if (h < 22) return "En soirée";
  return "Dans la nuit";
};
function legendePhoto(p, events) {
  const e = p && p.event && p.event !== "album" ? (events || []).find((x) => x.id === p.event) : null;
  if (e) {
    const t = titreDe(e);
    const lieu = e.place && e.place.name && e.place.name !== "À définir" ? e.place.name : "";
    return { l1: `${momentLabel(e.start)}, ${t}`, l2: placeKey(lieu) === placeKey(t) ? "" : lieu };
  }
  return { l1: "", l2: "" };
}
function buildFilm(events, photos, messages, faces) {
  const ph = (photos || []).filter((p) => p.url);
  const sc = [{ t: "titre", d: 4600 }];
  const lieuxU = buildPlaces(events);
  if (lieuxU.filter((p) => p.coord).length >= 1) sc.push({ t: "voyage", d: 4600, vehicule: detectVehicule(events) });
  /* seules les photos rattachées à une activité entrent dans le film ; regroupées par jour de leur activité */
  const evById = {};
  mainList(events).forEach((e) => { evById[e.id] = e; });
  const ordreEvt = (p) => { const e = evById[p.event]; return e && e.start ? e.start : ""; };
  const parJour = {};
  ph.forEach((p) => { const e = evById[p.event]; if (!e || typeof e.day !== "number") return; (parJour[e.day] = parJour[e.day] || []).push(p); });
  const nbVisages = (p) => { const f = (faces || {})[p.id]; return f && f.n ? f.n : 0; };
  for (let d = 0; d < DAYS.length; d++) {
    const evs = mainList(events).filter((e) => e.day === d).sort((a, b) => (a.start || "").localeCompare(b.start || ""));
    const pj = (parJour[d] || []).slice().sort((a, b) => ordreEvt(a).localeCompare(ordreEvt(b)) || ((a.at || 0) - (b.at || 0)));
    if (!evs.length && !pj.length) continue;
    sc.push({ t: "jour", d: 3800, day: d, evs, recit: recitDuJour(d, evs, messages, null, 0, { max: 2 }) });
    const ej = etapesJour(evs);
    if (ej.points.length >= 2) {
      const seq = [];
      evs.forEach((e) => {
        if (e.place && e.place.coord && e.place.name !== "À définir") {
          const k = placeKey(e.place.name);
          if (!seq.length || seq[seq.length - 1].k !== k) seq.push({ k, coord: e.place.coord, nom: e.place.name });
        }
      });
      sc.push({ t: "trajet", d: 3400, day: d, seq });
    }
    const MAXJ = 6;
    let choisies = pj;
    if (pj.length > MAXJ) { choisies = []; for (let s = 0; s < MAXJ; s++) choisies.push(pj[Math.floor((s * pj.length) / MAXJ)]); }
    // regrouper les photos consécutives d'une même activité
    const groupes = [];
    choisies.forEach((p) => {
      const g = groupes[groupes.length - 1];
      if (g && g.ev === p.event) g.photos.push(p); else groupes.push({ ev: p.event, photos: [p] });
    });
    let premiereDuJour = true;
    groupes.forEach((g) => {
      // paquets d'au plus 4 photos, en évitant de laisser une orpheline
      const paquets = [];
      let i = 0;
      while (i < g.photos.length) {
        const reste = g.photos.length - i;
        const t = reste === 1 ? 1 : reste === 5 ? 3 : reste <= 4 ? reste : 4;
        paquets.push(g.photos.slice(i, i + t));
        i += t;
      }
      paquets.forEach((paq, idx) => {
        const leg = idx === 0 ? legendePhoto(paq[0], events) : { l1: "", l2: "" };
        const premiere = premiereDuJour; premiereDuJour = false;
        if (paq.length === 1) sc.push({ t: "plein", d: 4800, day: d, ph: paq[0], leg, premiere });
        else sc.push({ t: "mosaique", d: 4200 + paq.length * 650, day: d, phs: paq, leg, premiere });
      });
    });
  }
  const caps = SETTINGS.capsule || {};
  const mots = [];
  ROSTER.filter((p) => p.active).forEach((p) => normCaps(caps[p.id]).forEach((e) => mots.push({ pid: p.id, ...e })));
  mots.sort((a, b) => (a.at || 0) - (b.at || 0));
  if (mots.length) {
    sc.push({ t: "livreIntro", d: 3200 });
    mots.forEach((mo) => {
      const w = String(mo.text || "").split(/\s+/).length;
      sc.push({ t: "livre", d: Math.min(12000, 3400 + w * 170), mo });
    });
  }
  const attachees = ph.filter((p) => evById[p.event] && typeof evById[p.event].day === "number");
  const baseFin = attachees.length ? attachees : ph;
  sc.push({ t: "fin", d: 9000, star: pickStar(baseFin, faces || loadFaces()), minis: baseFin });
  return sc;
}
function FilmOverlay({ events, photos, messages, onClose }) {
  const faces = useMemo(() => loadFaces(), []);
  const scenes = useMemo(() => buildFilm(events, photos, messages, faces), []);
  const [i, setI] = useState(0);
  const [son, setSon] = useState(true);
  const lieuxU = useMemo(() => buildPlaces(events), []);
  const th = themeDe();
  useMusique(SETTINGS.tripType || "mer", son);
  const sc = scenes[Math.min(i, scenes.length - 1)];
  useEffect(() => {
    if (i >= scenes.length - 1 && scenes[scenes.length - 1].t === "fin") return undefined;
    const id = setTimeout(() => setI((x) => Math.min(x + 1, scenes.length - 1)), sc.d);
    return () => clearTimeout(id);
  }, [i]);
  const next = () => setI((x) => Math.min(x + 1, scenes.length - 1));
  const prev = () => setI((x) => Math.max(x - 1, 0));
  const posOf = (p) => { const f = faces[p.id]; return f && f.cx != null ? `${Math.round(f.cx * 100)}% ${Math.round(clamp(f.cy, 0.2, 0.8) * 100)}%` : "50% 42%"; };
  const jourTitre = (d) => `Jour ${d + 1} · ${dayLabel(d)}`;
  const alea = (k, s) => { const x = Math.sin((k + 1) * 12.9898 + s * 78.233) * 43758.5453; return x - Math.floor(x); };
  const chipJour = (d) => (
    <div style={{ position: "absolute", top: "calc(30px + env(safe-area-inset-top))", left: 14, zIndex: 3 }}>
      <span style={{ display: "inline-flex", alignItems: "center", background: "rgba(8,18,24,0.5)", color: "#fff", fontFamily: fD, fontWeight: 700, fontSize: 12.5, borderRadius: T.r.pill, padding: "6px 12px", backdropFilter: "blur(4px)" }}>{jourTitre(d)}</span>
    </div>
  );
  const legende = (leg, sombre) => leg && (leg.l1 || leg.l2) ? (
    <div style={{ position: "absolute", left: 18, right: 18, bottom: "calc(24px + env(safe-area-inset-bottom))", zIndex: 3, animation: "vfade .9s ease both", animationDelay: ".5s" }}>
      <div style={{ fontFamily: fH, fontSize: "clamp(24px, 6.6vw, 36px)", color: sombre ? "#fff" : th.papierTxt, textShadow: sombre ? "0 2px 12px rgba(0,0,0,0.45)" : "none", lineHeight: 1.15 }}>{leg.l1}</div>
      {leg.l2 && <div style={{ fontFamily: fB, fontSize: 14, color: sombre ? "#ffffffcc" : th.encre, opacity: sombre ? 1 : 0.65, marginTop: 4 }}>{leg.l2}</div>}
    </div>
  ) : null;
  let inner = null;
  if (sc.t === "titre") {
    inner = (
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${th.ciel[0]} 0%, ${th.ciel[1]} 62%, ${th.ciel[2]} 100%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "12%", right: "14%", width: 92, height: 92, borderRadius: "50%", background: th.astre, boxShadow: `0 0 0 26px ${th.astreHalo}, 0 0 0 52px ${th.astreHalo}`, animation: "vbreath 5s ease-in-out infinite" }} />
        {[["16%", "10%"], ["26%", "78%"], ["8%", "42%"], ["34%", "30%"], ["18%", "58%"]].map(([tp, lf], k) => (
          <span key={k} style={{ position: "absolute", top: tp, left: lf, width: 5, height: 5, borderRadius: "50%", background: th.etoile, animation: `vtwinkle ${2 + k * 0.5}s ease-in-out infinite` }} />
        ))}
        <div style={{ fontFamily: fB, fontSize: 13, letterSpacing: 3, color: th.feteLabel, textTransform: "uppercase", animation: "vfade .8s ease both" }}>Le film du séjour</div>
        <div style={{ fontFamily: fH, fontWeight: 700, fontSize: "clamp(44px, 13vw, 78px)", color: th.fam === "ville" ? "#FFF3DE" : T.c.ink, transform: "rotate(-2deg)", margin: "10px 0 6px", animation: "fmZoomIn 1.1s cubic-bezier(.2,.8,.2,1) both", animationDelay: ".25s", textAlign: "center", lineHeight: 1.05 }}>{`C'était ${SETTINGS.place || SETTINGS.name || "nous"}`}</div>
        <div style={{ fontFamily: fB, fontSize: 15, color: th.fam === "ville" ? "#ffffffbb" : "#6E6046", animation: "vfade 1s ease both", animationDelay: ".9s" }}>{`${souvenirPeriode().split(" · ")[0]} ${new Date(SETTINGS.startISO + "T12:00:00").getFullYear()}`}</div>
      </div>
    );
  } else if (sc.t === "voyage") {
    inner = (
      <div style={{ position: "absolute", inset: 0, background: th.fond[1] }}>
        <CarteStylisee key="carte-voyage" lieux={lieuxU} th={th} />
        <svg viewBox="0 0 100 62" preserveAspectRatio="xMidYMid meet" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <path d="M -8 8 C 22 2, 34 18, 50 26" fill="none" stroke={th.fam === "ville" || th.fam === "campagne" ? th.encre : "#ffffff"} strokeOpacity="0.75" strokeWidth="0.9" strokeDasharray="2 2" strokeLinecap="round" pathLength="100" style={{ animation: "fmDash 3.6s ease-in-out both" }} />
          <g>
            <animateMotion dur="3.6s" fill="freeze" rotate="auto" path="M -8 8 C 22 2, 34 18, 50 26" />
            <VehiculeSVG kind={sc.vehicule} />
          </g>
        </svg>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: "calc(26px + env(safe-area-inset-bottom))", textAlign: "center" }}>
          <div style={{ fontFamily: fH, fontWeight: 700, fontSize: 34, color: "#fff", textShadow: "0 2px 10px rgba(10,30,40,0.45)", animation: "vfade 1s ease both", animationDelay: "1.6s" }}>{`Direction ${SETTINGS.place || "l'aventure"}`}</div>
        </div>
      </div>
    );
  } else if (sc.t === "jour") {
    const accent = [th.point, th.trait, th.feteLabel][sc.day % 3];
    inner = (
      <div style={{ position: "absolute", inset: 0, background: th.bandes[sc.day % th.bandes.length], overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", inset: 0, background: accent, transformOrigin: "left", animation: "fmWipe 0.7s cubic-bezier(.7,0,.2,1) both" }} />
        <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "0 26px", maxWidth: 640 }}>
          <div style={{ display: "inline-block", background: accent, color: "#fff", fontFamily: fB, fontWeight: 700, fontSize: 13, letterSpacing: 3, textTransform: "uppercase", borderRadius: T.r.pill, padding: "6px 16px", animation: "fmDrop .7s cubic-bezier(.2,.9,.3,1.2) both" }}>{`Étape ${sc.day + 1} sur ${DAYS.length}`}</div>
          <div style={{ fontFamily: fH, fontWeight: 700, fontSize: "clamp(66px, 23vw, 128px)", color: th.encre, transform: "rotate(-2deg)", animation: "fmZoomIn .9s cubic-bezier(.2,.8,.2,1) both", animationDelay: ".18s", lineHeight: 0.95, marginTop: 10 }}>{`Jour ${sc.day + 1}`}</div>
          <div style={{ fontFamily: fB, fontSize: 17, color: th.papierTxt, opacity: 0.8, marginTop: 6, animation: "vfade .8s ease both", animationDelay: ".55s" }}>{dayLabel(sc.day)}</div>
          {sc.recit && (
            <div style={{ fontFamily: fH, fontSize: "clamp(21px, 5.6vw, 29px)", color: th.papierTxt, marginTop: 20, lineHeight: 1.35, animation: "vfade 1s ease both", animationDelay: ".95s" }}>{sc.recit}</div>
          )}
        </div>
      </div>
    );
  } else if (sc.t === "trajet") {
    inner = (
      <div style={{ position: "absolute", inset: 0, background: th.fond[1] }}>
        <CarteStylisee key={`carte-${sc.day}`} lieux={lieuxU} sequence={sc.seq} th={th} />
        <div style={{ position: "absolute", top: "calc(34px + env(safe-area-inset-top))", left: 0, right: 0, textAlign: "center", fontFamily: fH, fontWeight: 700, fontSize: 30, color: "#fff", textShadow: "0 2px 8px rgba(10,30,40,0.45)" }}>{jourTitre(sc.day)}</div>
      </div>
    );
  } else if (sc.t === "plein") {
    inner = (
      <div style={{ position: "absolute", inset: 0, background: "#071018", animation: `${sc.day % 2 ? "fmIrisIn" : "fmFadeIn"} 1s ease both` }}>
        <img src={sc.ph.url} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: posOf(sc.ph), animation: `${sc.day % 2 ? "fmKenA" : "fmKenB"} 6.5s ease-out both` }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(7,16,24,0.4) 0%, rgba(7,16,24,0) 24%, rgba(7,16,24,0) 52%, rgba(7,16,24,0.62) 100%)" }} />
        {sc.premiere && chipJour(sc.day)}
        {legende(sc.leg, true)}
      </div>
    );
  } else if (sc.t === "mosaique") {
    const n = sc.phs.length;
    const grille = n === 2
      ? { gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr" }
      : n === 3
      ? { gridTemplateColumns: "1.4fr 1fr", gridTemplateRows: "1fr 1fr" }
      : { gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr" };
    inner = (
      <div style={{ position: "absolute", inset: 0, background: "#0B1620", display: "grid", gap: 3, ...grille, animation: `${sc.day % 2 ? "fmIrisIn" : "fmFadeIn"} .9s ease both` }}>
        {sc.phs.map((p, k) => (
          <div key={p.id} style={{ position: "relative", overflow: "hidden", ...(n === 3 && k === 0 ? { gridRow: "1 / 3" } : {}) }}>
            <img src={p.url} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: posOf(p), animation: `${k % 2 ? "fmKenA" : "fmKenB"} ${7 + n}s ease-out both, fmFadeIn .5s ease both`, animationDelay: `${k * 0.14}s, ${k * 0.14}s` }} />
          </div>
        ))}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(7,16,24,0.42) 0%, rgba(7,16,24,0) 22%, rgba(7,16,24,0) 56%, rgba(7,16,24,0.62) 100%)", pointerEvents: "none" }} />
        {sc.premiere && chipJour(sc.day)}
        {legende(sc.leg, true)}
      </div>
    );
  } else if (sc.t === "fort") {
    const lieu = sc.e.place && sc.e.place.name && sc.e.place.name !== "À définir" ? sc.e.place.name : "";
    inner = (
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${th.feteFond[0]}, ${th.feteFond[1]})`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <Celebration kind={th.fete} />
        <div style={{ textAlign: "center", padding: "0 26px", position: "relative", zIndex: 2, animation: "fmZoomIn .9s cubic-bezier(.2,.8,.2,1) both", animationDelay: ".15s" }}>
          <div style={{ fontFamily: fB, fontWeight: 800, fontSize: 12, letterSpacing: 3, color: th.feteLabel }}>LE TEMPS FORT DU JOUR</div>
          <div style={{ fontFamily: fH, fontWeight: 700, fontSize: "clamp(34px, 9.4vw, 56px)", color: th.feteTxt, margin: "14px 0 10px", lineHeight: 1.1 }}>{titreDe(sc.e)}</div>
          {lieu && <div style={{ fontFamily: fB, fontSize: 15, color: th.feteTxt, opacity: 0.65 }}>{lieu}</div>}
        </div>
      </div>
    );
  } else if (sc.t === "livre") {
    const mo = sc.mo;
    const txt = String(mo.text || "");
    const len = txt.length;
    const taille = len > 220 ? "clamp(18px, 4.6vw, 26px)" : len > 90 ? "clamp(21px, 5.4vw, 32px)" : "clamp(25px, 6.8vw, 40px)";
    const tilt = ((len % 5) - 2) * 0.7;
    inner = (
      <div style={{ position: "absolute", inset: 0, background: th.papier[0], display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, bottom: 0, left: 18, borderLeft: `2px dotted ${th.solL}` }} />
        <div style={{ maxWidth: 620, width: "100%", padding: "0 36px", transform: `rotate(${tilt}deg)`, animation: "vfade .9s ease both" }}>
          <div style={{ fontFamily: fH, fontSize: 42, color: th.solL, lineHeight: 0.5, marginBottom: 12 }}>“</div>
          <div style={{ fontFamily: fH, fontSize: taille, color: th.papierTxt, lineHeight: 1.34 }}>{txt}</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 9, marginTop: 22, animation: "vfade 1.1s ease both", animationDelay: ".55s" }}>
            <Avatar id={mo.pid} size={26} />
            <span style={{ fontFamily: fH, fontSize: 23, color: th.encre, opacity: 0.66 }}>{person(mo.pid).name}</span>
          </div>
        </div>
      </div>
    );
  } else if (sc.t === "livreIntro") {
    inner = (
      <div style={{ position: "absolute", inset: 0, background: th.papier[0], display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", top: 0, bottom: 0, left: 18, borderLeft: `2px dotted ${th.solL}` }} />
        <div style={{ fontFamily: fH, fontWeight: 700, fontSize: "clamp(40px, 11vw, 62px)", color: th.encre, animation: "fmZoomIn 1s cubic-bezier(.2,.8,.2,1) both" }}>Le livre d'or</div>
        <div style={{ width: 64, height: 1, background: th.solL, margin: "16px 0" }} />
        <div style={{ fontFamily: fB, fontSize: 14.5, color: th.papierTxt, opacity: 0.7, animation: "vfade 1s ease both", animationDelay: ".7s" }}>{SETTINGS.name || ""}</div>
      </div>
    );
  } else {
    const minis = (sc.minis || []).filter((p) => p.url && (!sc.star || p.id !== sc.star.photo.id)).sort((a, b) => heartsOf(b) - heartsOf(a)).slice(0, 12);
    const noms = ROSTER.filter((p) => p.active).map((p) => p.name).filter(Boolean);
    inner = (
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${th.fin[0]} 0%, ${th.fin[1]} 58%, ${th.fin[2]} 100%)`, overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {minis.map((p, k) => (
          <img key={p.id} src={p.url} alt="" style={{
            position: "absolute", top: `${(alea(k, 2) * 88 - 6).toFixed(1)}%`, left: `${(alea(k, 3) * 90 - 8).toFixed(1)}%`,
            width: Math.round(60 + alea(k, 1) * 42), aspectRatio: alea(k, 5) > 0.5 ? "4/3" : "3/4", objectFit: "cover",
            border: "4px solid #fff", borderBottomWidth: 12, borderRadius: 2, transform: `rotate(${(alea(k, 4) * 34 - 17).toFixed(1)}deg)`,
            boxShadow: "0 10px 22px rgba(30,20,10,0.28)", opacity: 0.72, animation: "fmDrop 1s cubic-bezier(.2,.9,.3,1.15) both", animationDelay: `${(alea(k, 6) * 1.6).toFixed(2)}s`,
          }} />
        ))}
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 50%, ${th.scrim} 0%, ${th.scrim} 34%, transparent 78%)`, pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 2, textAlign: "center", padding: "0 22px" }}>
          {sc.star && (
            <div style={{ display: "inline-block", background: "#fff", padding: "8px 8px 0", borderRadius: 4, boxShadow: "0 18px 44px rgba(30,20,10,0.4)", transform: "rotate(-2.5deg)", animation: "fmDrop 1s cubic-bezier(.2,.9,.3,1.15) both", animationDelay: "1.7s" }}>
              <img src={sc.star.photo.url} alt="" style={{ width: "min(56vw, 290px)", aspectRatio: "4/3", objectFit: "cover", objectPosition: posOf(sc.star.photo), borderRadius: 2, display: "block" }} />
              <div style={{ height: 34, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fH, fontSize: 17, color: "#4a5560" }}>{sc.star.label}</div>
            </div>
          )}
          <div style={{ fontFamily: fH, fontWeight: 700, fontSize: "clamp(30px, 9vw, 46px)", color: th.finTxt, marginTop: 20, transform: "rotate(-1.5deg)", animation: "vfade 1s ease both", animationDelay: "2.6s" }}>{`C'était ${SETTINGS.place || "nous"}, et c'était nous.`}</div>
          <div style={{ fontFamily: fH, fontSize: 20, color: th.finTxt2, marginTop: 10 }}>
            {noms.map((nm, k) => (
              <span key={k} style={{ display: "inline-block", margin: "0 7px", transform: `rotate(${(k % 2 ? 1 : -1) * 2}deg)`, animation: "vfade .7s ease both", animationDelay: `${3.2 + k * 0.35}s` }}>{nm}</span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 24, animation: "vfade .8s ease both", animationDelay: `${3.6 + noms.length * 0.35}s` }}>
            <button onClick={(e) => { e.stopPropagation(); setI(0); }} style={{ cursor: "pointer", minHeight: 44, padding: "10px 18px", borderRadius: T.r.pill, border: "none", background: "rgba(255,255,255,0.92)", color: th.finTxt, fontFamily: fD, fontWeight: 700, fontSize: 14.5 }}>Revoir</button>
            <button onClick={(e) => { e.stopPropagation(); onClose(); }} style={{ cursor: "pointer", minHeight: 44, padding: "10px 18px", borderRadius: T.r.pill, border: "none", background: th.finTxt, color: "#fff", fontFamily: fD, fontWeight: 700, fontSize: 14.5 }}>Fermer</button>
          </div>
          <div style={{ fontFamily: fB, fontSize: 11.5, color: th.finPied, marginTop: 16 }}>C où déjà ?</div>
        </div>
      </div>
    );
  }
  return (
    <div data-scene={sc.t} style={{ position: "fixed", inset: 0, zIndex: 70, background: "#071018", overflow: "hidden" }}>
      <style>{`
        @keyframes fmZoomIn { 0% { transform: scale(0.75); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes fmFadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
        @keyframes fmWipe { 0% { transform: scaleX(1); } 100% { transform: scaleX(0); } }
        @keyframes fmDash { 0% { stroke-dashoffset: 100; } 100% { stroke-dashoffset: 0; } }
        @keyframes fmKenA { 0% { transform: scale(1.02); } 100% { transform: scale(1.16) translate(-1.8%, -1.4%); } }
        @keyframes fmKenB { 0% { transform: scale(1.16) translate(1.6%, 1.2%); } 100% { transform: scale(1.02); } }
        @keyframes fmIrisIn { 0% { clip-path: circle(0% at 50% 46%); } 100% { clip-path: circle(150% at 50% 46%); } }
        @keyframes fmSlideL { 0% { transform: translateX(-102%); } 100% { transform: translateX(0); } }
        @keyframes fmSlideR { 0% { transform: translateX(102%); } 100% { transform: translateX(0); } }
        @keyframes fmDrop { 0% { transform: translateY(-46vh) rotate(0deg); opacity: 0; } 60% { opacity: 1; } 100% { transform: translateY(0) rotate(var(--fr, 0deg)); opacity: 1; } }
        @keyframes fmConf { 0% { transform: translateY(0) rotate(0deg); opacity: 0; } 10% { opacity: 1; } 100% { transform: translateY(105vh) rotate(540deg); opacity: 0.9; } }
        @keyframes fmRise { 0% { transform: translateY(0) translateX(0); opacity: 0; } 14% { opacity: 0.95; } 100% { transform: translateY(-106vh) translateX(16px); opacity: 0; } }
        @keyframes fmSnow { 0% { transform: translateY(0) translateX(0); opacity: 0; } 12% { opacity: 0.95; } 100% { transform: translateY(106vh) translateX(24px); opacity: 0.25; } }
        @keyframes fmLeaf { 0% { transform: translateY(0) rotate(0deg); opacity: 0; } 12% { opacity: 1; } 100% { transform: translateY(106vh) translateX(30px) rotate(320deg); opacity: 0.3; } }
        @keyframes fmWordIn { 0% { transform: translateY(9px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        @keyframes fmBar { from { width: 0%; } to { width: 100%; } }
      `}</style>
      {inner}
      <div style={{ position: "absolute", top: "calc(10px + env(safe-area-inset-top))", left: 12, right: 112, display: "flex", gap: 2, zIndex: 4 }}>
        {scenes.map((s, k) => (
          <span key={k} style={{ flex: 1, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.35)", overflow: "hidden" }}>
            <span style={{ display: "block", height: "100%", background: "#fff", width: k < i ? "100%" : "0%", ...(k === i ? { animation: `fmBar ${s.d}ms linear both` } : {}) }} />
          </span>
        ))}
      </div>
      <button onClick={() => { debloquerAudio(); setSon((v) => !v); }} aria-label={son ? "Couper la musique" : "Remettre la musique"} style={{ position: "absolute", top: "calc(18px + env(safe-area-inset-top))", right: 62, width: 44, height: 44, borderRadius: "50%", border: "none", background: "rgba(8,18,24,0.5)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 5 }}>{son ? <Volume2 size={19} /> : <VolumeX size={19} />}</button>
      <button onClick={onClose} aria-label="Fermer le film" style={{ position: "absolute", top: "calc(18px + env(safe-area-inset-top))", right: 12, width: 44, height: 44, borderRadius: "50%", border: "none", background: "rgba(8,18,24,0.5)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 5 }}><X size={20} /></button>
      <button onClick={prev} aria-label="Scène précédente" style={{ position: "absolute", top: 70, bottom: 90, left: 0, width: "26%", background: "transparent", border: "none", cursor: "pointer", zIndex: 4 }} />
      <button onClick={next} aria-label="Scène suivante" style={{ position: "absolute", top: 70, bottom: 90, right: 0, width: "34%", background: "transparent", border: "none", cursor: "pointer", zIndex: 4 }} />
    </div>
  );
}

/* ---- Quiz du séjour ------------------------------------------------------ */
function buildQuiz(events, messages, photos) {
  const qs = [];
  const members = ROSTER.filter((p) => p.active);
  const memberOpts = members.map((p) => ({ id: p.id, label: p.name }));
  const phBy = {}; photos.forEach((p) => { if (p.who) phBy[p.who] = (phBy[p.who] || 0) + 1; });
  const topPh = topBy(phBy);
  if (topPh && topPh.n >= 2) qs.push({ q: "Qui a partagé le plus de photos ?", options: memberOpts, answer: topPh.id });
  const msgBy = {}; messages.forEach((m) => { if (!isPoll(m) && !isGuess(m)) msgBy[m.who] = (msgBy[m.who] || 0) + 1; });
  const topMsg = topBy(msgBy);
  if (topMsg && topMsg.n >= 3) qs.push({ q: "Qui a envoyé le plus de messages ?", options: memberOpts, answer: topMsg.id });
  const acts = mainList(events);
  if (acts.length >= 3) {
    const n = acts.length;
    const nums = Array.from(new Set([n, Math.max(1, n - 2), n + 2, n + 4])).sort((a, b) => a - b);
    qs.push({ q: "Combien d'activités au programme du séjour ?", options: nums.map((x) => ({ id: "n" + x, label: String(x) })), answer: "n" + n });
  }
  const placed = acts.filter((e) => e.place && e.place.name);
  const placeNames = Array.from(new Set(placed.map((e) => e.place.name)));
  if (placed.length > 0 && placeNames.length >= 3) {
    const target = placed[0];
    const opts = placeNames.slice(0, 4).map((nm) => ({ id: nm, label: nm }));
    if (opts.some((o) => o.id === target.place.name)) qs.push({ q: `Où avait lieu « ${target.title} » ?`, options: opts, answer: target.place.name });
  }
  const byDay = {}; acts.forEach((e) => { byDay[e.day] = (byDay[e.day] || 0) + 1; });
  const topDay = topBy(byDay);
  if (topDay && Object.keys(byDay).length >= 3) {
    const days = Object.keys(byDay).sort((a, b) => Number(a) - Number(b)).slice(0, 4);
    qs.push({ q: "Quel jour avait le plus d'activités ?", options: days.map((d) => ({ id: d, label: DAYS[d] ? `${DAYS[d].short} ${DAYS[d].d}` : `Jour ${Number(d) + 1}` })), answer: topDay.id });
  }
  const actVibes = acts.map((e) => { const v = messages.find((m) => m.id === "vibe-" + e.id); return { e, n: v ? vibeTotal(v) : 0 }; }).filter((x) => x.n > 0);
  if (actVibes.length >= 2 && acts.length >= 4) {
    const top = [...actVibes].sort((a, b) => b.n - a.n)[0];
    const others = acts.filter((e) => e.id !== top.e.id).slice(0, 3);
    qs.push({ q: "Quelle activité a été la plus aimée (réactions 🤩) ?", options: [top.e, ...others].map((e) => ({ id: e.id, label: e.title })), answer: top.e.id });
  }
  const done = bingoDone(); const bBy = {};
  Object.values(done).forEach((d) => { if (d && d.who) bBy[d.who] = (bBy[d.who] || 0) + 1; });
  const topB = topBy(bBy);
  if (topB && topB.n >= 2) qs.push({ q: "Qui a coché le plus de cases du bingo ?", options: memberOpts, answer: topB.id });
  return qs;
}
function QuizSheet({ events, messages, photos, onFinish }) {
  const [quiz] = useState(() => buildQuiz(events, messages, photos));
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [ended, setEnded] = useState(false);
  const finishedRef = useRef(false);
  const scores = SETTINGS.quiz || {};
  if (quiz.length < 3) {
    return <div style={{ fontFamily: fB, color: T.c.inkFaint, fontSize: 14 }}>Pas encore assez de matière pour un quiz. Ajoutez des activités, des photos et des messages, puis revenez.</div>;
  }
  if (ended) {
    const others = Object.keys(scores).filter((pid) => scores[pid]);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40 }}>{score === quiz.length ? "🏆" : score >= quiz.length / 2 ? "🎉" : "😅"}</div>
          <div style={{ fontFamily: fD, fontWeight: 700, fontSize: 22, color: T.c.ink }}>{score} / {quiz.length}</div>
          <div style={{ fontFamily: fB, color: T.c.inkFaint, fontSize: 13 }}>{score === quiz.length ? "Sans faute, mémoire de champion." : score >= quiz.length / 2 ? "Beau score !" : "Le séjour est passé vite, on dirait."}</div>
        </div>
        {others.length > 0 && (
          <div>
            <div style={{ fontFamily: fD, fontWeight: 700, fontSize: 13.5, color: T.c.inkSoft, marginBottom: 7 }}>Scores du groupe</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {others.sort((a, b) => (scores[b].score || 0) - (scores[a].score || 0)).map((pid) => (
                <div key={pid} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <Avatar id={pid} size={24} />
                  <span style={{ flex: 1, fontFamily: fD, fontWeight: 600, fontSize: 14, color: T.c.ink }}>{person(pid).name}</span>
                  <span style={{ fontFamily: fD, fontWeight: 700, fontSize: 14, color: T.c.seaDeep }}>{scores[pid].score} / {scores[pid].total}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
  const cur = quiz[idx];
  const pick = (id) => { if (picked) return; setPicked(id); if (id === cur.answer) setScore((s) => s + 1); };
  const next = () => {
    if (idx + 1 < quiz.length) { setIdx(idx + 1); setPicked(null); }
    else {
      if (!finishedRef.current) { finishedRef.current = true; onFinish(score, quiz.length); }
      setEnded(true);
    }
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontFamily: fB, color: T.c.inkFaint, fontSize: 12.5 }}>Question {idx + 1} sur {quiz.length}</div>
      <div style={{ fontFamily: fD, fontWeight: 700, color: T.c.ink, fontSize: 17 }}>{cur.q}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {cur.options.map((o) => {
          const good = picked && o.id === cur.answer;
          const bad = picked === o.id && o.id !== cur.answer;
          return (
            <button key={o.id} onClick={() => pick(o.id)} style={{ cursor: picked ? "default" : "pointer", textAlign: "left", border: good ? `2px solid ${T.c.green}` : bad ? `2px solid ${T.c.coral}` : `1px solid ${T.c.line}`, background: good ? T.c.greenSoft : bad ? T.c.coralSoft : T.c.card, color: T.c.ink, borderRadius: T.r.md, padding: "12px 13px", fontFamily: fD, fontWeight: 600, fontSize: 14.5 }}>
              {o.label}{good ? "  ✓" : ""}{bad ? "  ✗" : ""}
            </button>
          );
        })}
      </div>
      {picked && (
        <button onClick={next} style={{ cursor: "pointer", border: "none", background: T.c.sea, color: "#fff", borderRadius: T.r.md, padding: "12px", fontFamily: fD, fontWeight: 700, fontSize: 14.5 }}>
          {idx + 1 < quiz.length ? "Question suivante" : "Voir mon score"}
        </button>
      )}
    </div>
  );
}
function QuizCard({ onOpen }) {
  const scores = SETTINGS.quiz || {};
  const mine = scores[ME];
  const played = Object.keys(scores).filter((pid) => scores[pid]).length;
  return (
    <div style={CARD()}>
      {CARD_TITLE("🧠", "Quiz du séjour", played > 0 ? <span style={{ fontFamily: fB, fontSize: 11.5, color: T.c.inkFaint }}>{played} joueur{played > 1 ? "s" : ""}</span> : null)}
      <div style={{ fontFamily: fB, color: T.c.inkFaint, fontSize: 12.5, marginBottom: 9 }}>
        {mine ? `Votre score : ${mine.score} / ${mine.total}. Qui fera mieux ?` : "Qui connaît le mieux le séjour ? Les questions viennent de vos vraies journées."}
      </div>
      <button onClick={onOpen} style={{ width: "100%", cursor: "pointer", border: "none", background: T.c.sea, color: "#fff", borderRadius: T.r.md, padding: "11px", fontFamily: fD, fontWeight: 700, fontSize: 14 }}>{mine ? "Rejouer" : "Lancer le quiz"}</button>
    </div>
  );
}

/* ---- Rendez-vous du jour (rituel unique) -------------------------------- */
const RITUAL_SLOTS = [
  { id: "morning", feat: "morningQuestion", from: 0, to: 840, emoji: "☀️", label: "Question du matin" },
  { id: "photo", feat: "photoChallenge", from: 840, to: 1050, emoji: "📸", label: "Défi photo" },
  { id: "who", feat: "wholikely", from: 1050, to: 1230, emoji: "🎯", label: "Le vote du jour" },
  { id: "recap", feat: "recap", from: 1230, to: 1441, emoji: "🌙", label: "Votre journée en bref" },
];
const fmtMin = (m) => `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}`;
const hFr = (t) => String(t || "").replace(":", "h");
function DailyRitualCard({ dIdx, mid, now, events, photos, play, onAddPhoto, onOpenPhoto, todayDone }) {
  const [expanded, setExpanded] = useState(false);
  const [selId, setSelId] = useState(null);
  const geste = useRef(null);
  const swipeFlag = useRef(false);
  const active = RITUAL_SLOTS.filter((s) => featureOn(s.feat));
  if (active.length === 0 || !play || !featureOn("rituel")) return null;
  let cur = active.find((s) => mid < s.to) || active[active.length - 1];
  const recapSlot = active.find((s) => s.id === "recap");
  if (todayDone && recapSlot) cur = recapSlot;

  const doneOf = (s) => {
    if (s.id === "morning") return !!(((SETTINGS.morning || {})[dIdx] || {})[ME]);
    if (s.id === "photo") return photos.some((p) => p.event === "defi-d" + dIdx && p.who === ME);
    if (s.id === "who") return !!(((SETTINGS.wholikely || {})[dIdx] || {})[ME]);
    return false;
  };
  const accessible = (s) => mid >= s.from;
  const selSlot = selId ? active.find((s) => s.id === selId && accessible(s)) : null;
  const vu = selSlot || cur;
  const consultation = vu.id !== cur.id;

  const upcoming = !consultation && !todayDone && mid < cur.from;
  const nextSlot = active.find((s) => s.from > cur.from) || null;
  const curDone = !upcoming && doneOf(cur);
  const collapsed = !consultation && curDone && !expanded && cur.id !== "recap";
  const passesAccessibles = active.some((s) => accessible(s) && s.id !== cur.id);
  const navSlots = active.filter((s) => accessible(s) || s.id === cur.id);
  const idxVu = Math.max(0, navSlots.findIndex((s) => s.id === vu.id));
  const aller = (delta) => {
    const np = idxVu + delta;
    if (np < 0 || np >= navSlots.length) return;
    const t = navSlots[np];
    setExpanded(true);
    setSelId(t.id === cur.id ? null : t.id);
  };

  const contenu = (s) => (
    <>
      {s.id === "morning" && <MorningQuestionCard dIdx={dIdx} onVote={play.voteMorning} bare />}
      {s.id === "photo" && <DailyChallengeCard dIdx={dIdx} photos={photos} onAddPhoto={onAddPhoto} onOpenPhoto={onOpenPhoto} bare />}
      {s.id === "who" && <WhoLikelyCard dIdx={dIdx} onVote={play.voteWho} bare />}
      {s.id === "recap" && <RecapCard dIdx={dIdx} events={events} messages={play.messages} photos={photos} now={now} bare />}
    </>
  );

  const dot = (s) => {
    const isVu = s.id === vu.id;
    const passed = s.to <= mid && !isVu;
    const filled = doneOf(s);
    const clickable = accessible(s);
    return (
      <button key={s.id} onClick={clickable ? () => setSelId(s.id === cur.id ? null : s.id) : undefined} aria-label={clickable ? "Voir : " + s.label.toLowerCase() : undefined} style={{ width: 15, height: 15, padding: 0, border: "none", background: "transparent", flex: "0 0 auto", cursor: clickable ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ width: 8, height: 8, borderRadius: 8, background: filled ? T.c.sea : passed ? T.c.line : "transparent", border: isVu && !filled ? `2px solid ${T.c.sea}` : filled ? "none" : `2px solid ${T.c.line}`, boxSizing: "border-box", boxShadow: isVu ? `0 0 0 3px ${T.c.seaSoft}` : "none" }} />
      </button>
    );
  };

  const wrap = { background: `linear-gradient(150deg, ${T.c.seaSoft}, ${T.c.card} 72%)`, border: `1px solid ${T.c.line}`, borderRadius: T.r.lg, padding: "12px 14px" };
  const onPD = (e) => { geste.current = { x: e.clientX, y: e.clientY, axe: null, gesting: false }; };
  const onPM = (e) => {
    const g = geste.current; if (!g) return;
    const dx = e.clientX - g.x, dy = e.clientY - g.y;
    if (!g.axe) { if (Math.abs(dx) + Math.abs(dy) < 8) return; g.axe = Math.abs(dx) > Math.abs(dy) * 1.2 ? "h" : "v"; if (g.axe === "h") g.gesting = true; }
  };
  const onPU = (e) => {
    const g = geste.current; geste.current = null;
    if (!g || !g.gesting) return;
    const dx = e.clientX - g.x;
    if (Math.abs(dx) > 40) { swipeFlag.current = true; aller(dx > 0 ? -1 : 1); }
  };
  const onCC = (e) => { if (swipeFlag.current) { e.stopPropagation(); e.preventDefault(); swipeFlag.current = false; } };
  const wrapProps = { onPointerDown: onPD, onPointerMove: onPM, onPointerUp: onPU, onPointerCancel: () => { geste.current = null; }, onClickCapture: onCC, style: { ...wrap, touchAction: "pan-y" } };
  const header = (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: (collapsed || upcoming) ? 0 : 10 }}>
      <span style={{ fontFamily: fD, fontWeight: 700, fontSize: 11, letterSpacing: 1.1, color: T.c.inkFaint }}>RENDEZ-VOUS DU JOUR</span>
      <span style={{ flex: 1 }} />
      <span style={{ display: "inline-flex", gap: 2, alignItems: "center" }}>{active.map(dot)}</span>
    </div>
  );

  const retour = (
    <button onClick={() => setSelId(null)} style={{ marginTop: 10, cursor: "pointer", border: "none", background: "transparent", color: T.c.seaDeep, fontFamily: fD, fontWeight: 600, fontSize: 12.5, padding: 0, display: "flex", alignItems: "center", gap: 3 }}>
      <span style={{ fontSize: 15, lineHeight: 1 }}>&lsaquo;</span> Revenir à maintenant
    </button>
  );

  if (consultation) {
    const fait = doneOf(vu);
    return (
      <div {...wrapProps}>
        {header}
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9 }}>
          <span style={{ fontSize: 16 }}>{vu.emoji}</span>
          <span style={{ fontFamily: fD, fontWeight: 700, color: T.c.ink, fontSize: 14.5 }}>{vu.label}</span>
          <span style={{ fontFamily: fB, fontWeight: 600, color: fait ? T.c.sea : T.c.inkFaint, fontSize: 11.5, marginLeft: "auto" }}>{fait ? "déjà répondu" : "à compléter"}</span>
        </div>
        {contenu(vu)}
        {retour}
      </div>
    );
  }

  if (upcoming) {
    return (
      <div {...wrapProps}>
        {header}
        <div style={{ fontFamily: fB, color: T.c.inkSoft, fontSize: 13.5, marginTop: 8 }}>
          {cur.emoji} Prochain rendez-vous à <span style={{ fontFamily: fD, fontWeight: 700, color: T.c.ink }}>{fmtMin(cur.from)}</span> : {cur.label.toLowerCase()}.
        </div>
        {passesAccessibles && <div style={{ fontFamily: fB, color: T.c.inkFaint, fontSize: 11, marginTop: 8 }}>Touchez un point ci-dessus pour revoir un rendez-vous passé.</div>}
      </div>
    );
  }
  if (collapsed) {
    return (
      <div {...wrapProps}>
        {header}
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 8 }}>
          <Check size={15} color={T.c.sea} />
          <span style={{ fontFamily: fB, color: T.c.inkSoft, fontSize: 13.5, flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            C'est fait.{nextSlot ? ` Prochain à ${fmtMin(nextSlot.from)} : ${nextSlot.label.toLowerCase()}.` : " À demain pour la suite."}
          </span>
          <button onClick={() => setExpanded(true)} style={{ cursor: "pointer", border: "none", background: "transparent", color: T.c.seaDeep, fontFamily: fD, fontWeight: 600, fontSize: 12.5, padding: 0 }}>Revoir</button>
        </div>
      </div>
    );
  }
  return (
    <div {...wrapProps}>
      {header}
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9 }}>
        <span style={{ fontSize: 16 }}>{cur.emoji}</span>
        <span style={{ fontFamily: fD, fontWeight: 700, color: T.c.ink, fontSize: 14.5 }}>{cur.label}</span>
        {nextSlot && <span style={{ fontFamily: fB, color: T.c.inkFaint, fontSize: 11.5, marginLeft: "auto" }}>puis {fmtMin(nextSlot.from)}</span>}
      </div>
      {contenu(cur)}
      {passesAccessibles && <div style={{ fontFamily: fB, color: T.c.inkFaint, fontSize: 11, marginTop: 9 }}>Touchez un point ci-dessus pour revoir un rendez-vous passé.</div>}
    </div>
  );
}

/* ---- Coin Jeux ----------------------------------------------------------- */
function GamesSheet({ photos, messages, quizUnlocked, onOpenBingo, onOpenQuiz, onGoTalk, onCreateGuess }) {
  const [guessOpen, setGuessOpen] = useState(false);
  const tiles = [];
  const openGuesses = messages.filter((m) => isGuess(m) && !m.closed).length;
  const tile = (key, inner) => <div key={key} style={CARD()}>{inner}</div>;
  if (featureOn("bingo")) tiles.push(<BingoCard key="bingo" onOpen={onOpenBingo} />);
  if (featureOn("guess")) tiles.push(tile("guess", <>
    {CARD_TITLE("📍", "Devine le lieu", openGuesses > 0 ? <span style={{ fontFamily: fD, fontWeight: 700, fontSize: 12, color: T.c.coralDeep }}>{openGuesses} en cours</span> : null)}
    {guessOpen ? (
      <GuessComposer scope="general" onCreate={async (s, url, answer) => { await onCreateGuess(s, url, answer); setGuessOpen(false); onGoTalk(); }} onCancel={() => setGuessOpen(false)} />
    ) : (
      <>
        <div style={{ fontFamily: fB, color: T.c.inkFaint, fontSize: 12.5, marginBottom: 9 }}>{openGuesses > 0 ? "Une photo mystère attend vos propositions dans la discussion." : "Postez une photo mystère et faites deviner le lieu au groupe."}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setGuessOpen(true)} style={{ flex: 1, cursor: "pointer", border: "none", background: T.c.sea, color: "#fff", borderRadius: T.r.md, padding: "10px", fontFamily: fD, fontWeight: 700, fontSize: 13.5 }}>Créer une photo mystère</button>
          {openGuesses > 0 && <button onClick={onGoTalk} style={{ flex: 1, cursor: "pointer", border: `1px solid ${T.c.line}`, background: T.c.card, color: T.c.seaDeep, borderRadius: T.r.md, padding: "10px", fontFamily: fD, fontWeight: 700, fontSize: 13.5 }}>Voir la discussion</button>}
        </div>
      </>
    )}
  </>));
  if (featureOn("quiz")) tiles.push(quizUnlocked
    ? <QuizCard key="quiz" onOpen={onOpenQuiz} />
    : tile("quiz", <>
      {CARD_TITLE("🧠", "Quiz du séjour", <span style={{ fontSize: 14 }}>🔒</span>)}
      <div style={{ fontFamily: fB, color: T.c.inkFaint, fontSize: 12.5 }}>Se déverrouille le dernier soir. Les questions viendront de vos vraies journées.</div>
    </>));
  if (tiles.length === 0) return <div style={{ fontFamily: fB, color: T.c.inkFaint, fontSize: 14 }}>Tous les jeux sont désactivés. Réactivez-les dans les réglages, section Interactions du séjour.</div>;
  return <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{tiles}</div>;
}

function PhotoOfDay({ photo, onOpen, onLike, noLabel }) {
  if (!photo || !photo.url) return null;
  const poster = photo.who ? person(photo.who) : null;
  let isToday = false;
  try { isToday = new Date(photo.at).toDateString() === new Date().toDateString(); } catch (e) { isToday = false; }
  const label = isToday ? "Photo du jour" : "Dernier souvenir";
  const reactions = photo.reactions || {};
  const liked = (reactions[ME] || []).includes("❤️");
  let hearts = 0; Object.keys(reactions).forEach((pid) => { if ((reactions[pid] || []).includes("❤️")) hearts += 1; });
  return (
    <div style={{ position: "relative", width: "100%", borderRadius: T.r.lg, overflow: "hidden", boxShadow: T.sh.card, aspectRatio: "16 / 10", background: T.c.lineSoft, flex: "0 0 100%", scrollSnapAlign: "start" }}>
      <button onClick={() => onOpen(photo)} aria-label="Ouvrir la photo" style={{ position: "absolute", inset: 0, border: "none", padding: 0, background: "transparent", cursor: "pointer" }}>
        <img src={photo.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(6,14,18,0.62) 0%, rgba(6,14,18,0) 46%)" }} />
      </button>
      {!noLabel && <div style={{ position: "absolute", left: 12, top: 12, background: "rgba(6,14,18,0.5)", color: "#fff", borderRadius: T.r.pill, padding: "4px 10px", fontFamily: fD, fontWeight: 700, fontSize: 11.5, display: "inline-flex", alignItems: "center", gap: 6, pointerEvents: "none" }}><Images size={13} /> {label}</div>}
      {poster && (
        <div style={{ position: "absolute", left: 12, bottom: 11, display: "flex", alignItems: "center", gap: 8, pointerEvents: "none" }}>
          <Avatar id={photo.who} size={26} />
          <span style={{ fontFamily: fD, fontWeight: 700, color: "#fff", fontSize: 14 }}>{poster.name}</span>
        </div>
      )}
      {onLike && (
        <button onClick={(e) => { e.stopPropagation(); onLike(photo.id); }} aria-label={liked ? "Retirer mon j'aime" : "J'aime cette photo"} style={{ cursor: "pointer", position: "absolute", right: 10, bottom: 9, border: "none", background: "rgba(6,14,18,0.55)", color: "#fff", borderRadius: T.r.pill, padding: "7px 12px", display: "inline-flex", alignItems: "center", gap: 6, fontFamily: fD, fontWeight: 700, fontSize: 12.5 }}>
          <Heart size={15} color={liked ? T.c.coral : "#fff"} fill={liked ? T.c.coral : "none"} style={liked ? { animation: "vpop .25s ease" } : undefined} />
          {hearts > 0 ? hearts : ""}
        </button>
      )}
    </div>
  );
}
function PhotoStrip({ photos, onOpen, onLike, noLabel, variant, faces }) {
  const list = [...(photos || [])].filter((p) => p.url).sort((a, b) => (b.at || 0) - (a.at || 0)).slice(0, 12);
  const [idx, setIdx] = useState(0);
  if (list.length === 0) return null;
  if (variant === "polaroid") {
    const full = [...(photos || [])].filter((p) => p.url).sort((a, b) => (b.at || 0) - (a.at || 0));
    const tiltP = (id) => { let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 997; return (h % 2 === 0 ? -1 : 1) * (1 + (h % 3) * 0.6); };
    return (
      <div>
        <div onScroll={(e) => { const el = e.currentTarget; setIdx(clamp(Math.round(el.scrollLeft / Math.max(1, el.clientWidth * 0.74)), 0, full.length - 1)); }}
          style={{ display: "flex", gap: 14, overflowX: "auto", scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch", scrollbarWidth: "none", padding: "10px 4px 14px" }}>
          {full.map((p, i) => {
            const showWho = p.who && (i === 0 || full[i - 1].who !== p.who);
            const liked = ((p.reactions || {})[ME] || []).includes("❤️");
            let hearts = 0; Object.keys(p.reactions || {}).forEach((pid) => { if (((p.reactions || {})[pid] || []).includes("❤️")) hearts += 1; });
            return (
              <div key={p.id} style={{ flex: "0 0 74%", minWidth: 0, scrollSnapAlign: "center", transform: `rotate(${tiltP(p.id)}deg)` }}>
                <div style={{ background: "#ffffff", padding: "9px 9px 10px", borderRadius: 4, boxShadow: "0 8px 20px rgba(31,58,68,0.16)" }}>
                  <button onClick={() => onOpen(p)} aria-label="Ouvrir la photo" style={{ display: "block", width: "100%", border: "none", padding: 0, background: "transparent", cursor: "pointer" }}>
                    <img src={p.url} alt="" style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", objectPosition: faceCrop(faces, p), display: "block" }} />
                  </button>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 7, padding: "0 2px" }}>
                    <span style={{ fontFamily: fH, fontWeight: 600, fontSize: 17, color: "#40525B", display: "inline-flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                      {showWho ? <Avatar id={p.who} size={17} /> : null}{showWho ? " " + person(p.who).name : ""}
                    </span>
                    {onLike && (
                      <button onClick={() => onLike(p.id)} aria-label={liked ? "Retirer mon j'aime" : "J'aime cette photo"} style={{ cursor: "pointer", border: "none", background: "transparent", padding: "4px 2px 4px 12px", minWidth: 44, minHeight: 44, display: "inline-flex", alignItems: "center", justifyContent: "flex-end", gap: 4, fontFamily: fD, fontWeight: 700, fontSize: 12, color: "#8A97A0", flex: "0 0 auto" }}>
                        <Heart size={15} color={liked ? T.c.coral : "#8A97A0"} fill={liked ? T.c.coral : "none"} />{hearts > 0 ? hearts : ""}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {full.length > 1 && (
          <div style={{ textAlign: "center", marginTop: 2, fontFamily: fD, fontWeight: 700, fontSize: 12.5, color: T.c.inkFaint, fontVariantNumeric: "tabular-nums" }}>{Math.min(idx + 1, full.length)} / {full.length}</div>
        )}
      </div>
    );
  }
  if (list.length === 1) return <PhotoOfDay photo={list[0]} onOpen={onOpen} onLike={onLike} noLabel={noLabel} />;
  return (
    <div>
      <div onScroll={(e) => { const el = e.currentTarget; setIdx(clamp(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)), 0, list.length - 1)); }}
        style={{ display: "flex", gap: 12, overflowX: "auto", scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch", scrollbarWidth: "none", borderRadius: T.r.lg }}>
        {list.map((p) => <PhotoOfDay key={p.id} photo={p} onOpen={onOpen} onLike={onLike} noLabel={noLabel} />)}
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 7 }}>
        {list.map((p, i) => <span key={p.id} style={{ width: i === idx ? 14 : 5, height: 5, borderRadius: T.r.pill, background: i === idx ? T.c.sea : T.c.line, transition: "width .2s ease" }} />)}
      </div>
    </div>
  );
}
const FACES_KEY = "vacances_faces_v1";
const loadFaces = () => { try { return JSON.parse(localStorage.getItem(FACES_KEY) || "{}"); } catch (e) { return {}; } };
const saveFaces = (m) => { try { localStorage.setItem(FACES_KEY, JSON.stringify(m)); } catch (e) {} };
const loadScriptOnce = (src) => new Promise((res, rej) => {
  if (typeof document === "undefined") { rej(new Error("sans dom")); return; }
  const ex = document.querySelector(`script[data-lib="${src}"]`);
  if (ex) {
    if (ex.getAttribute("data-ok") === "1") { res(); return; }
    ex.addEventListener("load", () => res());
    ex.addEventListener("error", () => rej(new Error("chargement")));
    return;
  }
  const s = document.createElement("script");
  s.src = src; s.async = true; s.setAttribute("data-lib", src);
  s.onload = () => { s.setAttribute("data-ok", "1"); res(); };
  s.onerror = () => rej(new Error("chargement " + src));
  document.head.appendChild(s);
});
const imgOf = (url) => new Promise((res, rej) => {
  const im = new Image();
  im.crossOrigin = "anonymous";
  im.onload = () => res(im);
  im.onerror = () => rej(new Error("image"));
  im.src = url;
});
async function detectFacesFor(photos, onProgress) {
  const cache = loadFaces();
  const todo = (photos || []).filter((p) => p.url && !cache[p.id]);
  if (!todo.length) return cache;
  await loadScriptOnce("vendor/face-api.min.js");
  const fa = typeof window !== "undefined" ? window.faceapi : null;
  if (!fa) throw new Error("face-api indisponible");
  await fa.nets.tinyFaceDetector.loadFromUri("models");
  const opts = new fa.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 });
  let done = 0;
  for (const p of todo) {
    try {
      const im = await imgOf(p.url);
      const dets = await fa.detectAllFaces(im, opts);
      const w = im.naturalWidth || im.width || 0, h = im.naturalHeight || im.height || 0;
      if (!w || !h) throw new Error("dimensions inconnues");
      const area = w * h;
      let sum = 0, cx = 0, cy = 0;
      dets.forEach((d) => { const b = d.box; sum += b.width * b.height; cx += b.x + b.width / 2; cy += b.y + b.height / 2; });
      const n = dets.length;
      cache[p.id] = n ? { n, score: n * ((sum / n) / area), cx: (cx / n) / w, cy: (cy / n) / h } : { n: 0, score: 0 };
      saveFaces(cache);
    } catch (e) { /* photo illisible : pas de mise en cache, nouvelle tentative plus tard */ }
    done += 1;
    if (onProgress) onProgress(done, todo.length);
  }
  return cache;
}
const faceCrop = (faces, p) => {
  const f = faces && faces[p.id];
  return f && f.n > 0 && f.cx != null ? `${Math.round(clamp(f.cx, 0.1, 0.9) * 100)}% ${Math.round(clamp(f.cy, 0.1, 0.9) * 100)}%` : "50% 33%";
};
const placeKey = (n) => String(n || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
function souvenirPeriode() {
  const dEnd = new Date(isoPlusDays(SETTINGS.startISO, DAYS.length - 1) + "T12:00:00");
  const dStart = new Date(SETTINGS.startISO + "T12:00:00");
  const p = dStart.getMonth() === dEnd.getMonth()
    ? `Du ${dStart.getDate()} au ${dEnd.getDate()} ${MO[dEnd.getMonth()]}`
    : `Du ${dStart.getDate()} ${MO[dStart.getMonth()]} au ${dEnd.getDate()} ${MO[dEnd.getMonth()]}`;
  return `${p} · ${DAYS.length} jours à ${ROSTER.filter((x) => x.active).length}`;
}
function souvenirStats(events, photos, messages) {
  const past = mainList(events);
  const phs = (photos || []).filter((p) => p.url);
  const msgs = (messages || []).filter((m) => !isVibe(m) && !isLoc(m));
  const seen = new Set(); let lieux = 0;
  past.forEach((e) => { if (e.place && e.place.name && e.place.name !== "À définir" && !seen.has(placeKey(e.place.name))) { seen.add(placeKey(e.place.name)); lieux += 1; } });
  const nActifs = ROSTER.filter((p) => p.active).length;
  let dist = 0, prev = null;
  past.forEach((e) => { if (e.place && e.place.coord) { if (prev) dist += distM(prev, e.place.coord); prev = e.place.coord; } });
  const km = Math.round(dist / 1000);
  return [
    [past.length, past.length > 1 ? "activités" : "activité", null],
    phs.length >= 3 ? [phs.length, "photos", null] : [nActifs, "personnes", null],
    msgs.length >= 10 ? [msgs.length, "messages", null] : (km >= 1 ? [km, "km", null] : [DAYS.length, DAYS.length > 1 ? "jours" : "jour", null]),
    [lieux, lieux > 1 ? "lieux" : "lieu", "map"],
  ];
}
let DEJAVU_P = null, CAVEAT_P = null;
const bufB64 = (buf) => { const u = new Uint8Array(buf); let s = ""; const CH = 0x8000; for (let i = 0; i < u.length; i += CH) s += String.fromCharCode.apply(null, u.subarray(i, i + CH)); return btoa(s); };
const fetchFont = (f) => fetch("vendor/" + f).then((r) => { if (!r.ok) throw new Error("police"); return r.arrayBuffer(); }).then(bufB64);
const loadDejaVu = () => {
  if (!DEJAVU_P) { DEJAVU_P = Promise.all(["DejaVuSans.ttf", "DejaVuSans-Bold.ttf", "DejaVuSans-Oblique.ttf"].map(fetchFont)); DEJAVU_P.catch(() => { DEJAVU_P = null; }); }
  return DEJAVU_P;
};
const loadCaveat = () => {
  if (!CAVEAT_P) { CAVEAT_P = Promise.all(["Caveat-Regular.ttf", "Caveat-Bold.ttf"].map(fetchFont)); CAVEAT_P.catch(() => { CAVEAT_P = null; }); }
  return CAVEAT_P;
};
const dayOfTs = (at) => {
  const d0 = new Date(SETTINGS.startISO + "T00:00:00").getTime();
  return Math.floor((at - d0) / 86400000);
};
const dayDeScope = (scope, events) => {
  if (!scope || scope === "general") return null;
  const e = (events || []).find((x) => x.id === scope);
  return e && typeof e.day === "number" ? e.day : null;
};
const dayDansSejour = (at) => { const d = dayOfTs(at || 0); return d >= 0 && d < DAYS.length ? d : null; };
const dayOfPhoto = (p, events) => { const d = dayDeScope(p.event, events); return d != null ? d : dayDansSejour(p.at); };
const dayOfMsg = (m, events) => { const d = dayDeScope(m.scope, events); return d != null ? d : dayDansSejour(m.at); };
const dayLabel = (i) => {
  const dt = new Date(isoPlusDays(SETTINGS.startISO, i) + "T12:00:00");
  return dt.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
};
const fmtDur = (e) => {
  if (!e.start || !e.end || e.end === "23:59") return "";
  const [h1, m1] = e.start.split(":").map(Number), [h2, m2] = e.end.split(":").map(Number);
  let d = h2 * 60 + m2 - (h1 * 60 + m1); if (d <= 0) d += 1440;
  if (d >= 60) { const h = Math.floor(d / 60), m = d % 60; return m ? `${h} h ${String(m).padStart(2, "0")}` : `${h} h`; }
  return `${d} min`;
};
const titreDe = (e) => {
  const t = (e.title || "").trim();
  if (t && t.toLowerCase() !== "sans titre") return t;
  if (e.place && e.place.name && e.place.name !== "À définir") return e.place.name;
  return (TYPES[e.type || "activite"] || TYPES.activite).label;
};
const vibeOfEvent = (e, messages) => { const v = (messages || []).find((m) => m.id === "vibe-" + e.id); return v ? vibeTotal(v) : 0; };
const avisLabel = (n) => (n >= 5 ? "Adoré" : n >= 3 ? "Apprécié" : "");
const reactsOfMsg = (m) => Object.keys(m.reactions || {}).reduce((n, pid) => n + ((m.reactions || {})[pid] || []).length, 0);
function buildPlaces(events) {
  const seen = new Set(); const out = [];
  mainList(events).forEach((e) => {
    if (e.place && e.place.name && e.place.name !== "À définir" && !seen.has(placeKey(e.place.name))) { seen.add(placeKey(e.place.name)); out.push(e.place); }
  });
  return out;
}
let REVERSE_DOWN = false, REVERSE_LAST = 0;
async function reverseAddr(coord) {
  if (!coord) return "";
  const key = coord.lat.toFixed(5) + "," + coord.lng.toFixed(5);
  let cache = {};
  try { cache = JSON.parse(localStorage.getItem("vacances_addr_v1") || "{}"); } catch (e) {}
  if (cache[key] !== undefined) return cache[key];
  if (REVERSE_DOWN) return "";
  try {
    const attente = 260 - (Date.now() - REVERSE_LAST);
    if (attente > 0) await new Promise((r) => setTimeout(r, attente));
    REVERSE_LAST = Date.now();
    const ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
    const to = ctl ? setTimeout(() => ctl.abort(), 6000) : null;
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coord.lat}&lon=${coord.lng}&accept-language=fr&zoom=17`, { signal: ctl ? ctl.signal : undefined });
    if (to) clearTimeout(to);
    if (!r.ok) throw new Error("http");
    const j = await r.json();
    const a = j.address || {};
    const rue = [a.road || a.pedestrian || a.footway || a.beach || "", a.house_number || ""].filter(Boolean).join(" ");
    const ville = a.village || a.town || a.city || a.municipality || a.suburb || a.island || "";
    const out = [rue, ville].filter(Boolean).join(", ") || String(j.display_name || "").split(",").slice(0, 2).join(",").trim();
    try { cache[key] = out; localStorage.setItem("vacances_addr_v1", JSON.stringify(cache)); } catch (e) {}
    return out;
  } catch (e) { REVERSE_DOWN = true; return ""; }
}
async function mapImage(points, wPx, hPx, opts) {
  const o = opts || {};
  const pts = (points || []).filter((p) => p.coord);
  if (!pts.length) throw new Error("aucun point");
  const rad = Math.PI / 180;
  const prj = (co, z) => { const n = Math.pow(2, z) * 256; const lr = co.lat * rad; return { x: ((co.lng + 180) / 360) * n, y: ((1 - Math.log(Math.tan(lr) + 1 / Math.cos(lr)) / Math.PI) / 2) * n }; };
  const lats = pts.map((p) => p.coord.lat), lngs = pts.map((p) => p.coord.lng);
  let z = 4;
  for (let zz = 16; zz >= 3; zz--) {
    const a = prj({ lat: Math.max(...lats), lng: Math.min(...lngs) }, zz);
    const b = prj({ lat: Math.min(...lats), lng: Math.max(...lngs) }, zz);
    if (b.x - a.x < wPx - 110 && b.y - a.y < hPx - 90) { z = Math.min(zz, o.maxZoom || 15); break; }
  }
  const c = { lat: (Math.min(...lats) + Math.max(...lats)) / 2, lng: (Math.min(...lngs) + Math.max(...lngs)) / 2 };
  const n = Math.pow(2, z); const ctr = prj(c, z);
  const cv = document.createElement("canvas"); cv.width = wPx; cv.height = hPx;
  const ctx = cv.getContext("2d");
  ctx.fillStyle = o.sepia ? "#f2ead8" : "#eaf2ef"; ctx.fillRect(0, 0, wPx, hPx);
  const x0 = Math.floor((ctr.x - wPx / 2) / 256), x1 = Math.floor((ctr.x + wPx / 2) / 256);
  const ty0 = Math.floor((ctr.y - hPx / 2) / 256), ty1 = Math.floor((ctr.y + hPx / 2) / 256);
  if (o.sepia) { try { ctx.filter = "saturate(0.3) sepia(0.32) contrast(0.9) brightness(1.07)"; } catch (e) {} }
  const jobs = [];
  for (let tx = x0; tx <= x1; tx++) for (let ty = ty0; ty <= ty1; ty++) if (ty >= 0 && ty < n) {
    jobs.push(imgOf(`https://tile.openstreetmap.org/${z}/${((tx % n) + n) % n}/${ty}.png`).then((im) => {
      ctx.drawImage(im, Math.round(tx * 256 - (ctr.x - wPx / 2)), Math.round(ty * 256 - (ctr.y - hPx / 2)));
    }).catch(() => {}));
  }
  await Promise.all(jobs);
  try { ctx.filter = "none"; } catch (e) {}
  const px = (co) => { const q = prj(co, z); return [Math.round(q.x - (ctr.x - wPx / 2)), Math.round(q.y - (ctr.y - hPx / 2))]; };
  const R = o.markerR || Math.max(9, Math.round(Math.min(wPx, hPx) / 32));
  if (o.route && o.route.length > 1) {
    ctx.save();
    ctx.strokeStyle = o.sepia ? "rgba(112,78,50,0.8)" : "rgba(212,73,53,0.85)";
    ctx.lineWidth = Math.max(3, Math.round(R / 3.2));
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    try { ctx.setLineDash([R * 0.9, R * 0.8]); } catch (e) {}
    ctx.beginPath();
    o.route.forEach((co, i) => { const [qx, qy] = px(co); if (i === 0) ctx.moveTo(qx, qy); else ctx.lineTo(qx, qy); });
    ctx.stroke(); ctx.restore();
  }
  pts.forEach((p) => {
    const [qx, qy] = px(p.coord);
    ctx.beginPath(); ctx.fillStyle = o.sepia ? "#8a5a34" : "#F0604A"; ctx.arc(qx, qy, R, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = Math.max(2, Math.round(R / 4.5)); ctx.strokeStyle = "#ffffff"; ctx.stroke();
    ctx.fillStyle = "#ffffff"; ctx.font = `bold ${Math.round(R * 1.1)}px sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(String(p.label || ""), qx, qy + R * 0.05);
  });
  ctx.fillStyle = "rgba(255,255,255,0.75)"; ctx.fillRect(wPx - 128, hPx - 18, 128, 18);
  ctx.fillStyle = "#4a5a58"; ctx.font = "10px sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
  ctx.fillText("© OpenStreetMap", wPx - 120, hPx - 9);
  return cv.toDataURL("image/jpeg", 0.85);
}
const etapesJour = (evs) => {
  const seq = [];
  evs.forEach((e) => {
    if (e.place && e.place.coord && e.place.name !== "À définir") {
      const k = placeKey(e.place.name || "") + "|" + e.place.coord.lat.toFixed(4);
      if (!seq.length || seq[seq.length - 1].k !== k) seq.push({ k, coord: e.place.coord });
    }
  });
  const groupes = new Map();
  seq.forEach((s, i) => {
    const g = groupes.get(s.k);
    if (g) g.label += "·" + (i + 1); else groupes.set(s.k, { coord: s.coord, label: String(i + 1) });
  });
  return { points: Array.from(groupes.values()), route: seq.map((s) => s.coord) };
};
function recitDuJour(d, evs, messages, bestE, bestV, opts) {
  const o = opts || {};
  const list = evs.map((e) => ({ h: e.start ? e.start.replace(":", "h") : "", t: titreDe(e), lieu: e.place && e.place.name !== "À définir" ? e.place.name : "" }));
  if (!list.length) return "";
  const ouv = [
    (s) => `La journée s'ouvre à ${s.h} : ${s.t}.`,
    (s) => `Tout commence à ${s.h} : ${s.t}.`,
    (s) => `Mise en route à ${s.h} : ${s.t}.`,
    (s) => `Premier rendez-vous à ${s.h} : ${s.t}.`,
    (s) => `À ${s.h}, première étape : ${s.t}.`,
    (s) => `Le jour démarre à ${s.h} : ${s.t}.`,
  ];
  const mil = [
    (a) => `Suivront ${a}.`,
    (a) => `Au fil des heures viendront ${a}.`,
    (a) => `La suite : ${a}.`,
    (a) => `Puis le programme enchaîne ${a}.`,
  ];
  const finj = [
    (s) => `Dernière étape à ${s.h} : ${s.t}.`,
    (s) => `La soirée se conclut à ${s.h} : ${s.t}.`,
    (s) => `Et pour clore la journée, à ${s.h} : ${s.t}.`,
  ];
  const fort = [
    (t, nb) => `Le moment préféré du groupe : ${t} (${nb} réactions).`,
    (t, nb) => `${nb} réactions au compteur, le temps fort est net : ${t}.`,
    (t, nb) => `Ce que le groupe retiendra : ${t}.`,
  ];
  const ph = [];
  ph.push(ouv[d % ouv.length](list[0]));
  if (list.length > 2) {
    const milieu = list.slice(1, -1).map((s) => s.t).slice(0, 2);
    if (milieu.length) ph.push(mil[d % mil.length](milieu.join(", puis ")));
  }
  if (list.length > 1) ph.push(finj[d % finj.length](list[list.length - 1]));
  const fortSans = [
    (t) => `Le moment préféré du groupe : ${t}.`,
    (t) => `Ce que le groupe retiendra : ${t}.`,
    (t) => `Le temps fort, sans hésiter : ${t}.`,
  ];
  if (bestE && bestV >= 3) {
    const tf = titreDe(bestE);
    if (o.sansChiffres) ph.push(fortSans[d % fortSans.length](tf));
    else if (!ph.join(" ").includes(tf) || bestV >= 5) ph.push(fort[d % fort.length](tf, bestV));
  }
  const notes = SETTINGS.dayNotes && SETTINGS.dayNotes[d] ? SETTINGS.dayNotes[d] : null;
  if (notes) {
    Object.keys(notes).slice(0, 2).forEach((pid) => {
      const txt = String(notes[pid] || "").trim();
      if (txt) ph.push(`${person(pid).name} note dans le carnet : « ${txt.slice(0, 140)} »`);
    });
  }
  return (o.max ? ph.slice(0, o.max) : ph).join(" ");
}
async function pdfSetup(doc, JSP) {
  let F = { n: ["helvetica", "normal"], b: ["helvetica", "bold"], i: ["times", "italic"] };
  let FC = null;
  try {
    const [fn, fb, fo] = await loadDejaVu();
    doc.addFileToVFS("DejaVuSans.ttf", fn); doc.addFont("DejaVuSans.ttf", "DejaVu", "normal");
    doc.addFileToVFS("DejaVuSans-Bold.ttf", fb); doc.addFont("DejaVuSans-Bold.ttf", "DejaVu", "bold");
    doc.addFileToVFS("DejaVuSans-Oblique.ttf", fo); doc.addFont("DejaVuSans-Oblique.ttf", "DejaVu", "italic");
    F = { n: ["DejaVu", "normal"], b: ["DejaVu", "bold"], i: ["DejaVu", "italic"] };
  } catch (e) {}
  try {
    const [cr, cb] = await loadCaveat();
    doc.addFileToVFS("Caveat-Regular.ttf", cr); doc.addFont("Caveat-Regular.ttf", "Caveat", "normal");
    doc.addFileToVFS("Caveat-Bold.ttf", cb); doc.addFont("Caveat-Bold.ttf", "Caveat", "bold");
    FC = { n: ["Caveat", "normal"], b: ["Caveat", "bold"] };
  } catch (e) {}
  const exotic = (s) => /[\u0370-\u03FF\u1F00-\u1FFF\u0400-\u04FF\u0590-\u08FF\u4E00-\u9FFF\u3040-\u30FF]/.test(String(s || ""));
  const hand = (s, bold) => (FC && !exotic(s) ? (bold ? FC.b : FC.n) : (bold ? F.b : F.i));
  const clean = (s) => {
    let t = String(s == null ? "" : s).replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, "").replace(/\s+/g, " ").trim();
    if (F.n[0] === "helvetica") t = t.replace(/[^\x20-\xFF]/g, "").replace(/\s+/g, " ").trim();
    return t;
  };
  const setOpacity = (o) => { try { if (JSP.GState) doc.setGState(new JSP.GState({ opacity: o })); } catch (e) {} };
  const poly = (pts, fill) => {
    const segs = [];
    for (let i = 1; i < pts.length; i++) segs.push([pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]]);
    doc.lines(segs, pts[0][0], pts[0][1], [1, 1], fill ? "F" : "S", true);
  };
  const tape = (cx, cy, ang, col) => {
    const tw = 15, th = 5.2, ca = Math.cos(ang), sa = Math.sin(ang);
    const c = [[-tw / 2, -th / 2], [tw / 2, -th / 2], [tw / 2, th / 2], [-tw / 2, th / 2]].map(([x, y]) => [cx + x * ca - y * sa, cy + x * sa + y * ca]);
    const [tr, tg, tb] = col || [250, 230, 160];
    doc.setFillColor(tr, tg, tb);
    setOpacity(0.55); poly(c, true); setOpacity(1);
  };
  const toJpegCrop = async (url, cw, ch, center) => {
    const im = await imgOf(url);
    const iw = im.naturalWidth || im.width || 0, ih = im.naturalHeight || im.height || 0;
    if (!iw || !ih) throw new Error("dimensions");
    const ratio = cw / ch;
    let sw = iw, sh = Math.round(iw / ratio);
    if (sh > ih) { sh = ih; sw = Math.round(ih * ratio); }
    const ccx = clamp((center && center.cx != null ? center.cx : 0.5) * iw, sw / 2, iw - sw / 2);
    const ccy = clamp((center && center.cy != null ? center.cy : 0.42) * ih, sh / 2, ih - sh / 2);
    const cv = document.createElement("canvas"); cv.width = cw; cv.height = ch;
    cv.getContext("2d").drawImage(im, Math.round(ccx - sw / 2), Math.round(ccy - sh / 2), sw, sh, 0, 0, cw, ch);
    return cv.toDataURL("image/jpeg", 0.82);
  };
  const polaroidTilt = async (cx, cy, w, ihh, angle, photo, faces, legend, tapeCol) => {
    const fw = w + 8, fh = ihh + (legend ? 17 : 9);
    const rad = (angle * Math.PI) / 180, ca = Math.cos(rad), sa = Math.sin(rad);
    const rot = (dx, dy) => [cx + dx * ca - dy * sa, cy + dx * sa + dy * ca];
    let data = null;
    try { data = await toJpegCrop(photo.url, Math.round(w * 11), Math.round(ihh * 11), faces && faces[photo.id]); } catch (e) { return false; }
    doc.setFillColor(222, 217, 207);
    poly([rot(-fw / 2 + 1.4, -fh / 2 + 1.6), rot(fw / 2 + 1.4, -fh / 2 + 1.6), rot(fw / 2 + 1.4, fh / 2 + 1.6), rot(-fw / 2 + 1.4, fh / 2 + 1.6)], true);
    doc.setFillColor(255, 255, 255);
    poly([rot(-fw / 2, -fh / 2), rot(fw / 2, -fh / 2), rot(fw / 2, fh / 2), rot(-fw / 2, fh / 2)], true);
    const [ix, iy] = rot(-w / 2, -fh / 2 + 4);
    doc.addImage(data, "JPEG", ix, iy, w, ihh, undefined, undefined, -angle);
    if (legend) {
      const [lx, ly] = rot(0, fh / 2 - 5);
      doc.setFont(...hand(legend)); doc.setFontSize(12); doc.setTextColor(64, 82, 91);
      doc.text(clean(legend), lx, ly, { align: "center", angle: -angle });
    }
    tape(...rot(-fw / 2 + 5, -fh / 2 + 1), -0.6 + rad, tapeCol);
    tape(...rot(fw / 2 - 5, -fh / 2 + 1), 0.6 + rad, tapeCol);
    return true;
  };
  return { F, FC, hand, clean, setOpacity, poly, tape, toJpegCrop, polaroidTilt };
}
async function makeSouvenirPdf({ events, photos, messages }) {
  await loadScriptOnce("vendor/jspdf.umd.min.js");
  const JSP = typeof window !== "undefined" && window.jspdf ? window.jspdf : null;
  if (!JSP || !JSP.jsPDF) throw new Error("jsPDF indisponible");
  const doc = new JSP.jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const H = 297;
  const P = await pdfSetup(doc, JSP);
  const faces = loadFaces();
  const star = pickStar(photos, faces);
  const ph = (photos || []).filter((p) => p.url);
  const past = mainList(events);
  const fondCreme = () => { doc.setFillColor(255, 252, 244); doc.rect(0, 0, W, H, "F"); };
  const ENCRE = [150, 120, 88];
  const doodle = (kind, x, y) => {
    doc.setDrawColor(...ENCRE); doc.setFillColor(...ENCRE); doc.setLineWidth(0.5); doc.setLineDashPattern([], 0);
    if (kind === 0) { doc.circle(x, y, 2.4, "S"); for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4; doc.line(x + 3.2 * Math.cos(a), y + 3.2 * Math.sin(a), x + 4.6 * Math.cos(a), y + 4.6 * Math.sin(a)); } }
    else if (kind === 1) { P.poly([[x - 3.4, y - 3], [x + 3.4, y - 3], [x, y + 0.6]], false); doc.line(x, y + 0.6, x, y + 3.4); doc.line(x - 2, y + 3.4, x + 2, y + 3.4); doc.circle(x + 1.2, y - 1.9, 0.8, "F"); }
    else if (kind === 2) { doc.lines([[2.5, -2.2, 5, 0, 5, 0]], x - 4.5, y - 1, [1, 1], "S", false); doc.lines([[2.5, -2.2, 5, 0, 5, 0]], x - 3, y + 2, [1, 1], "S", false); }
    else if (kind === 3) { doc.circle(x, y, 3.8, "S"); P.poly([[x, y - 2.6], [x + 1, y], [x, y + 2.6], [x - 1, y]], true); doc.circle(x, y, 0.45, "F"); }
    else if (kind === 4) { const p5 = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5; const r = i % 2 ? 1.7 : 4; p5.push([x + r * Math.cos(a), y + r * Math.sin(a)]); } P.poly(p5, false); }
    else { P.poly([[x - 4, y - 2.6], [x + 4, y - 2.6], [x + 4, y + 2.6], [x - 4, y + 2.6]], false); doc.circle(x, y, 1.5, "S"); P.poly([[x + 1.6, y - 3.4], [x + 3.2, y - 3.4], [x + 3.2, y - 2.6], [x + 1.6, y - 2.6]], true); }
  };
  const voilier = (x, y, s) => {
    doc.setFillColor(64, 82, 91);
    P.poly([[x + 11 * s, y - 2 * s], [x + 11 * s, y - 16 * s], [x, y - 2 * s]], true);
    P.poly([[x + 14.5 * s, y - 2 * s], [x + 14.5 * s, y - 13 * s], [x + 24 * s, y - 2 * s]], true);
    P.poly([[x - 2 * s, y - 0.4 * s], [x + 26 * s, y - 0.4 * s], [x + 21.5 * s, y + 4 * s], [x + 2.5 * s, y + 4 * s]], true);
  };
  /* ==== couverture ==== */
  const c1 = [255, 247, 230], c2 = [255, 214, 182], NB = 60;
  for (let i = 0; i < NB; i++) {
    const t = i / (NB - 1);
    doc.setFillColor(Math.round(c1[0] + (c2[0] - c1[0]) * t), Math.round(c1[1] + (c2[1] - c1[1]) * t), Math.round(c1[2] + (c2[2] - c1[2]) * t));
    doc.rect(0, (H / NB) * i, W, H / NB + 0.4, "F");
  }
  P.setOpacity(0.35); doc.setFillColor(247, 196, 96); doc.circle(183, 24, 13, "F"); P.setOpacity(1);
  doc.setFillColor(243, 175, 66); doc.circle(183, 24, 7.2, "F");
  [[24, 20], [60, 15], [122, 13], [156, 30]].forEach(([sx, sy], i) => { doc.setFillColor(226, 162, 68); doc.circle(sx, sy, i % 2 ? 0.6 : 0.8, "F"); });
  doc.setDrawColor(140, 122, 96); doc.setLineWidth(0.5);
  doc.lines([[3, -2.6, 6, 0, 6, 0]], 48, 32, [1, 1], "S", false);
  doc.lines([[2.6, -2.2, 5.2, 0, 5.2, 0]], 86, 24, [1, 1], "S", false);
  const cadreTampon = (cx, cy, hw, hh, ang) => {
    const rd = (ang * Math.PI) / 180, ca = Math.cos(rd), sa = Math.sin(rd);
    const rot = (dx, dy) => [cx + dx * ca - dy * sa, cy + dx * sa + dy * ca];
    P.poly([rot(-hw, -hh), rot(hw, -hh), rot(hw, hh), rot(-hw, hh)], false);
  };
  doc.setDrawColor(152, 112, 72); doc.setLineWidth(0.5);
  cadreTampon(52, 21, 33, 6, -4);
  doc.setLineWidth(0.25); doc.setLineDashPattern([1, 1.1], 0);
  cadreTampon(52, 21, 30.6, 4.4, -4); doc.setLineDashPattern([], 0);
  doc.setFont(...P.F.b); doc.setFontSize(7.5); doc.setTextColor(152, 112, 72);
  doc.text("CARNET DE VOYAGE", 52, 22.6, { align: "center", angle: 4, charSpace: 1.3 });
  const titre = `C'était ${SETTINGS.place || SETTINGS.name || "le séjour"}`;
  doc.setFont(...P.hand(titre, true)); doc.setFontSize(48); doc.setTextColor(35, 59, 69);
  doc.text(P.clean(titre), W / 2, 48, { align: "center", angle: -1.5 });
  doc.setDrawColor(240, 96, 74); doc.setLineWidth(1.15);
  try { doc.setLineCap(1); } catch (e) {}
  doc.lines([[34, -2.6, 70, 2.4, 106, -0.8]], 52, 55, [1, 1], "S", false);
  try { doc.setLineCap(0); } catch (e) {}
  const kraft = (cx, cy, hw, hh, ang) => {
    const rd = (ang * Math.PI) / 180, ca = Math.cos(rd), sa = Math.sin(rd);
    const rot = (dx, dy) => [cx + dx * ca - dy * sa, cy + dx * sa + dy * ca];
    doc.setFillColor(226, 208, 176); P.poly([rot(-hw + 1, -hh + 1.2), rot(hw + 1, -hh + 1.2), rot(hw + 1, hh + 1.2), rot(-hw + 1, hh + 1.2)], true);
    doc.setFillColor(246, 232, 202); P.poly([rot(-hw, -hh), rot(hw, -hh), rot(hw, hh), rot(-hw, hh)], true);
  };
  const perTxt = P.clean(`${souvenirPeriode().split(" · ")[0]} ${new Date(SETTINGS.startISO + "T12:00:00").getFullYear()}`);
  kraft(105, 66, 37, 7, 2);
  doc.setFont(...P.hand(perTxt, true)); doc.setFontSize(16); doc.setTextColor(92, 70, 44);
  doc.text(perTxt, 105, 68.4, { align: "center", angle: -2 });
  P.tape(105, 59.6, 0.12, [247, 208, 190]);
  const noms = ROSTER.filter((p) => p.active).map((p) => p.name).filter(Boolean);
  const nomsTxt = P.clean(noms.join("  ·  "));
  doc.setFont(...P.hand(nomsTxt)); doc.setFontSize(15); doc.setTextColor(84, 74, 56);
  doc.text(nomsTxt, W / 2, 82, { align: "center", angle: -1 });
  voilier(24, 95, 0.55);
  doc.setDrawColor(140, 122, 96); doc.setLineWidth(0.45); doc.setLineDashPattern([0.2, 1.6], 0);
  doc.lines([[6, -2.4, 12, 1.8, 18, 0]], 20, 97.6, [1, 1], "S", false); doc.setLineDashPattern([], 0);
  /* carte du séjour, papier ancien, circuit chronologique */
  const placesU = buildPlaces(events);
  const MC = { x: 105, y: 152, w: 156, h: 92, a: -1.2 };
  const rd2 = (MC.a * Math.PI) / 180, ca2 = Math.cos(rd2), sa2 = Math.sin(rd2);
  const rotC = (dx, dy) => [MC.x + dx * ca2 - dy * sa2, MC.y + dx * sa2 + dy * ca2];
  try {
    const ptsC = placesU.filter((p) => p.coord).map((p, i) => ({ coord: p.coord, label: String(i + 1) }));
    const data = await mapImage(ptsC, 1240, 730, { sepia: true, route: ptsC.map((p) => p.coord), markerR: 16 });
    doc.setFillColor(222, 214, 198);
    P.poly([rotC(-81, -49), rotC(83, -49), rotC(83, 49.4), rotC(-81, 49.4)], true);
    doc.setFillColor(255, 253, 246);
    P.poly([rotC(-81, -49 - 1.6), rotC(81, -49 - 1.6), rotC(81, 49 - 1.6), rotC(-81, 49 - 1.6)], true);
    const [ix, iy] = rotC(-78, -46 - 1.6);
    doc.addImage(data, "JPEG", ix, iy, 156, 92, undefined, undefined, -MC.a);
    const [rx, ry] = rotC(66, -34);
    doc.setDrawColor(138, 100, 64); doc.setLineWidth(0.5); doc.circle(rx, ry, 6, "S");
    doc.setFillColor(138, 100, 64);
    P.poly([[rx, ry - 4.6], [rx + 1.4, ry], [rx, ry + 4.6], [rx - 1.4, ry]], true);
    doc.setFont(...P.F.b); doc.setFontSize(6); doc.setTextColor(138, 100, 64);
    doc.text("N", rx, ry - 7.2, { align: "center" });
    P.tape(...rotC(-70, -50.6), -0.55, [250, 230, 160]);
    P.tape(...rotC(70, -50.6), 0.55, [250, 230, 160]);
    P.tape(...rotC(0, 50), 0.08, [196, 224, 214]);
  } catch (e) {}
  if (star) await P.polaroidTilt(154, 210, 62, 46, 3.5, star.photo, faces, star.label, [247, 208, 190]);
  /* tampons de formes variées */
  let dist = 0, prev = null;
  past.forEach((e) => { if (e.place && e.place.coord) { if (prev) dist += distM(prev, e.place.coord); prev = e.place.coord; } });
  const km = Math.round(dist / 1000);
  const encres = [[46, 107, 128], [222, 90, 70], [165, 130, 47], [126, 93, 184]];
  const t1 = (cx, cy, n, l, enc, rot) => {
    const [r, g, b] = enc;
    doc.setDrawColor(r, g, b); doc.setLineWidth(0.75); doc.setLineDashPattern([], 0); doc.circle(cx, cy, 11.4, "S");
    doc.setLineWidth(0.32); doc.setLineDashPattern([1.1, 1.2], 0); doc.circle(cx, cy, 9.2, "S"); doc.setLineDashPattern([], 0);
    doc.setTextColor(r, g, b); doc.setFont(...P.F.b); doc.setFontSize(13);
    doc.text(String(n), cx, cy + 1.1, { align: "center", angle: rot });
    doc.setFontSize(5.6); doc.text(P.clean(l).toUpperCase(), cx, cy + 5.8, { align: "center", angle: rot, charSpace: 0.3 });
  };
  const t2 = (cx, cy, n, l, enc, rot) => {
    const [r, g, b] = enc;
    doc.setDrawColor(r, g, b); doc.setLineWidth(0.7);
    const rd = (rot * Math.PI) / 180, cb = Math.cos(rd), sb = Math.sin(rd);
    const ro = (dx, dy) => [cx + dx * cb - dy * sb, cy + dx * sb + dy * cb];
    P.poly([ro(-14, -8.6), ro(14, -8.6), ro(14, 8.6), ro(-14, 8.6)], false);
    doc.setLineWidth(0.3); doc.setLineDashPattern([1, 1.1], 0);
    P.poly([ro(-12.2, -6.8), ro(12.2, -6.8), ro(12.2, 6.8), ro(-12.2, 6.8)], false);
    doc.setLineDashPattern([], 0);
    doc.setTextColor(r, g, b); doc.setFont(...P.F.b); doc.setFontSize(12.5);
    doc.text(String(n), cx, cy + 1, { align: "center", angle: -rot });
    doc.setFontSize(5.4); doc.text(P.clean(l).toUpperCase(), cx, cy + 5.6, { align: "center", angle: -rot, charSpace: 0.3 });
  };
  const t3 = (cx, cy, n, l, enc, rot) => {
    const [r, g, b] = enc;
    doc.setDrawColor(r, g, b); doc.setLineWidth(0.7);
    try { doc.ellipse(cx, cy, 13.4, 8.8, "S"); doc.setLineWidth(0.3); doc.setLineDashPattern([1, 1.1], 0); doc.ellipse(cx, cy, 11.4, 7, "S"); doc.setLineDashPattern([], 0); } catch (e) { doc.circle(cx, cy, 10.8, "S"); }
    doc.setTextColor(r, g, b); doc.setFont(...P.F.b); doc.setFontSize(12.5);
    doc.text(String(n), cx, cy + 1, { align: "center", angle: rot });
    doc.setFontSize(5.4); doc.text(P.clean(l).toUpperCase(), cx, cy + 5.4, { align: "center", angle: rot, charSpace: 0.3 });
  };
  const t4 = (cx, cy, n, l, enc, rot) => {
    const [r, g, b] = enc;
    doc.setDrawColor(r, g, b); doc.setLineWidth(0.45); doc.setLineDashPattern([1.4, 1.3], 0); doc.circle(cx, cy, 11.2, "S"); doc.setLineDashPattern([], 0);
    doc.setLineWidth(0.7); doc.circle(cx, cy, 8.8, "S");
    doc.setTextColor(r, g, b); doc.setFont(...P.F.b); doc.setFontSize(12.5);
    doc.text(String(n), cx, cy + 1, { align: "center", angle: rot });
    doc.setFontSize(5.4); doc.text(P.clean(l).toUpperCase(), cx, cy + 5.5, { align: "center", angle: rot, charSpace: 0.3 });
  };
  const vals = [[DAYS.length, DAYS.length > 1 ? "jours" : "jour"], [ph.length, ph.length > 1 ? "photos" : "photo"], [placesU.length, "lieux"], km >= 1 ? [km, "km"] : [past.length, "activités"]];
  t1(34, 261, vals[0][0], vals[0][1], encres[0], -7);
  t2(88, 257, vals[1][0], vals[1][1], encres[1], 5);
  t3(140, 262, vals[2][0], vals[2][1], encres[2], -4);
  t4(188, 256, vals[3][0], vals[3][1], encres[3], 6);
  doc.setFont(...P.F.n); doc.setFontSize(8); doc.setTextColor(150, 132, 106);
  doc.text("C où déjà ?", W / 2, 290, { align: "center" });
  /* ==== journées en flux ==== */
  const bandes = ["#FFECD6", "#FDE8CC", "#E9F3EE", "#F6EFDF", "#FBE9E3", "#EEF0F9"];
  const scotchs = [[250, 230, 160], [247, 208, 190], [196, 224, 214], [233, 220, 180], [244, 206, 198], [205, 210, 238]];
  const anglesJ = [[-2.2, 1.8, -1.4], [1.6, -2.4, 1.8], [-1.4, 2.2, -2.2], [2.4, -1.8, 1.2], [-2.6, 1.4, -1.6], [1.8, -2.2, 2.0]];
  let y = 300;
  const newPage = () => { doc.addPage(); fondCreme(); y = 12; };
  const ensureS = (h) => { if (y + h > 283) newPage(); };
  for (let d = 0; d < DAYS.length; d++) {
    const evs = past.filter((e) => e.day === d).sort((a, b) => (a.start || "").localeCompare(b.start || ""));
    const pj = ph.filter((p) => dayOfPhoto(p, events) === d).sort((a, b) => (heartsOf(b) - heartsOf(a)) || ((a.at || 0) - (b.at || 0)));
    if (!evs.length && !pj.length) continue;
    const sc = scotchs[d % scotchs.length];
    const ang = anglesJ[d % anglesJ.length];
    ensureS(21 + (evs.length ? 30 : 4) + 24);
    doc.setFillColor(bandes[d % bandes.length]); doc.rect(0, y, W, 15, "F");
    const tj = `Jour ${d + 1} · ${dayLabel(d)}`;
    doc.setFont(...P.hand(tj, true)); doc.setFontSize(20); doc.setTextColor(35, 59, 69);
    doc.text(P.clean(tj), 16, y + 10.5, { angle: -1 });
    doodle(d % 6, 191, y + 7.5);
    y += 22;
    let bestE = null, bestV = 0;
    evs.forEach((e) => { const v = vibeOfEvent(e, messages); if (v > bestV) { bestV = v; bestE = e; } });
    if (evs.length) {
      const steps = evs.slice(0, 5).map((e) => ({ hh: e.start ? e.start.replace(":", "h") : "", nom: titreDe(e) }));
      const x0 = 32, x1 = 178, n = steps.length;
      const xs = n === 1 ? [(x0 + x1) / 2] : steps.map((_, i) => x0 + ((x1 - x0) * i) / (n - 1));
      const ys = xs.map((_, i) => y + 6 + (i % 2 ? 5 : -2));
      doc.setDrawColor(240, 96, 74); doc.setLineWidth(0.5); doc.setLineDashPattern([0.1, 2.2], 0);
      try { doc.setLineCap(1); } catch (e2) {}
      for (let i = 0; i < n - 1; i++) {
        const span = xs[i + 1] - xs[i], dy = ys[i + 1] - ys[i];
        doc.lines([[span * 0.4, -8, span * 0.6, dy + 8, span, dy]], xs[i], ys[i], [1, 1], "S", false);
      }
      doc.setLineDashPattern([], 0);
      try { doc.setLineCap(0); } catch (e2) {}
      const colW = (x1 - x0) / Math.max(1, n - 1) + 4;
      steps.forEach((s, i) => {
        doc.setFillColor(255, 252, 244); doc.circle(xs[i], ys[i], 4.4, "F");
        doc.setDrawColor(240, 96, 74); doc.setLineWidth(0.4); doc.circle(xs[i], ys[i], 3.5, "S");
        doc.setTextColor(240, 96, 74); doc.setFont(...P.F.b); doc.setFontSize(8.6);
        doc.text(String(i + 1), xs[i], ys[i] + 1, { align: "center" });
        doc.setTextColor(35, 59, 69); doc.setFont(...P.F.b); doc.setFontSize(7.4);
        doc.text(doc.splitTextToSize(P.clean(s.nom), colW)[0] || "", xs[i], ys[i] + 7.8, { align: "center" });
        doc.setTextColor(148, 136, 112); doc.setFont(...P.F.n); doc.setFontSize(6.8);
        doc.text(s.hh, xs[i], ys[i] + 11, { align: "center" });
      });
      y += 27;
    }
    const recit = recitDuJour(d, evs, messages, bestE, bestV);
    if (recit) {
      doc.setFont(...P.hand(recit)); doc.setFontSize(13.5);
      const lr = doc.splitTextToSize(P.clean(recit), 176).slice(0, 6);
      ensureS(lr.length * 6.2 + 6);
      doc.setTextColor(58, 55, 48);
      doc.text(lr, 17, y + 4);
      y += lr.length * 6.2 + 7;
    }
    if (pj.length >= 2) {
      ensureS(72);
      await P.polaroidTilt(60, y + 32, 76, 57, ang[0], pj[0], faces, "", sc);
      await P.polaroidTilt(150, y + 35, 72, 54, ang[1], pj[1], faces, "", sc);
      y += 74;
    } else if (pj.length === 1) {
      ensureS(76);
      await P.polaroidTilt(105, y + 34, 100, 62, ang[0], pj[0], faces, "", sc);
      y += 78;
    }
    if (bestE && bestV >= 3) {
      ensureS(30);
      doc.setFillColor(255, 248, 233); doc.roundedRect(43, y, 124, 22, 2, 2, "F");
      doc.setDrawColor(227, 211, 174); doc.setLineWidth(0.35); doc.setLineDashPattern([1.2, 1.2], 0);
      doc.line(54, y + 3, 54, y + 19); doc.setLineDashPattern([], 0);
      doc.setFont(...P.F.b); doc.setFontSize(6); doc.setTextColor(165, 130, 47);
      doc.text("LE TEMPS FORT DU JOUR", 58, y + 6.5, { charSpace: 0.5 });
      doc.setFont(...P.hand(titreDe(bestE))); doc.setFontSize(15); doc.setTextColor(74, 59, 35);
      doc.text(doc.splitTextToSize(P.clean(titreDe(bestE)), 102)[0] || "", 58, y + 14);
      doc.setFont(...P.F.n); doc.setFontSize(8); doc.setTextColor(138, 122, 85);
      doc.text(`${bestV} réactions du groupe`, 58, y + 19);
      y += 28;
    }
    const mj = (messages || []).filter((m) => dayOfMsg(m, events) === d && m.text && !isPoll(m) && !isGuess(m) && !isVibe(m) && !isLoc(m))
      .map((m) => ({ m, n: reactsOfMsg(m) })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n)[0];
    if (mj) {
      const mtxt = `« ${mj.m.text} »`;
      doc.setFont(...P.hand(mtxt)); doc.setFontSize(15);
      const lg = doc.splitTextToSize(P.clean(mtxt), 152);
      ensureS(14 + lg.slice(0, 2).length * 7);
      doc.setTextColor(58, 55, 48);
      doc.text(lg.slice(0, 2), 29, y + 6, { angle: -1 });
      doc.setFont(...P.hand(person(mj.m.who).name)); doc.setFontSize(11.5); doc.setTextColor(148, 136, 112);
      doc.text(P.clean(person(mj.m.who).name), 181, y + 6 + lg.slice(0, 2).length * 7, { align: "right" });
      y += 13 + lg.slice(0, 2).length * 7;
    }
    if (pj.length >= 3) {
      ensureS(74);
      await P.polaroidTilt(105, y + 32, 88, 54, ang[2], pj[2], faces, "", sc);
      y += 74;
    }
    y += 8;
  }
  /* ==== livre d'or ==== */
  const caps = SETTINGS.capsule || {};
  const mots = [];
  ROSTER.filter((p) => p.active).forEach((p) => normCaps(caps[p.id]).forEach((e) => mots.push({ pid: p.id, ...e })));
  mots.sort((a, b) => (a.at || 0) - (b.at || 0));
  const pageLivre = (avecTitre) => {
    doc.addPage();
    doc.setFillColor(255, 251, 240); doc.rect(0, 0, W, H, "F");
    doc.setDrawColor(224, 208, 176); doc.setLineWidth(0.2); doc.setLineDashPattern([0.2, 2], 0);
    doc.line(12, 10, 12, 287); doc.setLineDashPattern([], 0);
    if (avecTitre) {
      doc.setFont(...P.hand("Le livre d'or", true)); doc.setFontSize(30); doc.setTextColor(35, 59, 69);
      doc.text("Le livre d'or", W / 2, 30, { align: "center" });
      doc.setFont(...P.F.n); doc.setFontSize(9); doc.setTextColor(148, 136, 112);
      doc.text(P.clean(SETTINGS.name || ""), W / 2, 37, { align: "center" });
      doc.setDrawColor(224, 208, 176); doc.setLineWidth(0.2); doc.line(W / 2 - 14, 41, W / 2 + 14, 41);
      return 58;
    }
    return 26;
  };
  let yv = pageLivre(true);
  const tiltOf = (id) => { let h = 0; for (let i = 0; i < String(id).length; i++) h = (h * 31 + String(id).charCodeAt(i)) % 997; return ((h % 5) - 2) * 0.6; };
  mots.forEach((mo, mi) => {
    const mt = P.clean(mo.text);
    doc.setFont(...P.hand(mt)); doc.setFontSize(17);
    const lg = doc.splitTextToSize(mt, 150);
    if (yv + lg.length * 8 + 16 > 252) yv = pageLivre(false);
    doc.setTextColor(58, 55, 48);
    doc.text(lg, 26, yv, { angle: tiltOf(mo.id) });
    doc.setFont(...P.hand(person(mo.pid).name)); doc.setFontSize(12); doc.setTextColor(148, 136, 112);
    doc.text(P.clean(person(mo.pid).name), 184, yv + lg.length * 8, { align: "right" });
    yv += lg.length * 8 + 9;
    if (mi < mots.length - 1) {
      doc.setDrawColor(224, 208, 176); doc.setLineWidth(0.15); doc.line(W / 2 - 12, yv - 3, W / 2 + 12, yv - 3);
      yv += 6;
    }
  });
  if (ph.length >= 2 && yv < 244) {
    const minis = ph.filter((p) => !star || p.id !== star.photo.id).sort((a, b) => heartsOf(b) - heartsOf(a)).slice(0, 4);
    const ym = Math.min(252, yv + 26);
    for (let i = 0; i < minis.length; i++) {
      await P.polaroidTilt(38 + i * 45, ym, 34, 27, [-2.5, 1.6, -1.2, 2.2][i], minis[i], faces, "", scotchs[i % scotchs.length]);
    }
  }
  doc.setFont(...P.F.n); doc.setFontSize(8); doc.setTextColor(172, 160, 140);
  doc.text(P.clean(`C où déjà ? · ${SETTINGS.name || ""}`), W / 2, 289, { align: "center" });
  const total = doc.getNumberOfPages ? doc.getNumberOfPages() : 0;
  for (let i = 2; i <= (total || 0); i++) {
    doc.setPage(i);
    doc.setFont(...P.F.n); doc.setFontSize(8); doc.setTextColor(172, 160, 140);
    doc.text(String(i), 194, 291, { align: "right" });
  }
  return doc.output("blob");
}
async function makeProgramPdf({ events, messages }) {
  await loadScriptOnce("vendor/jspdf.umd.min.js");
  const JSP = typeof window !== "undefined" && window.jspdf ? window.jspdf : null;
  if (!JSP || !JSP.jsPDF) throw new Error("jsPDF indisponible");
  const doc = new JSP.jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const P = await pdfSetup(doc, JSP);
  const past = mainList(events);
  const places = buildPlaces(events);
  const fond = () => { doc.setFillColor(255, 252, 244); doc.rect(0, 0, W, 297, "F"); };
  fond();
  doc.setFillColor(35, 59, 69); doc.rect(0, 0, W, 40, "F");
  doc.setFillColor(255, 255, 255);
  P.poly([[184, 24], [184, 13.4], [176.8, 24]], true);
  P.poly([[186.3, 24], [186.3, 15.5], [192.6, 24]], true);
  P.poly([[175.4, 25.1], [193.8, 25.1], [190.8, 28], [178.4, 28]], true);
  doc.setFont(...P.F.b); doc.setFontSize(23); doc.setTextColor(255, 255, 255);
  doc.text(P.clean(`${SETTINGS.place || SETTINGS.name || "Le séjour"} en ${DAYS.length} jours`), 16, 20);
  const mEnd = new Date(isoPlusDays(SETTINGS.startISO, DAYS.length - 1) + "T12:00:00");
  doc.setFont(...P.F.n); doc.setFontSize(10.5); doc.setTextColor(190, 210, 218);
  doc.text(P.clean(`Le programme complet d'un séjour de ${MO[mEnd.getMonth()]}`), 16, 29);
  doc.setFont(...P.F.b); doc.setFontSize(13); doc.setTextColor(35, 59, 69);
  doc.text("L'essentiel", 16, 54);
  const rythme = (past.length / Math.max(1, DAYS.length)).toFixed(1).replace(".", ",");
  const cartes = [[String(DAYS.length), DAYS.length > 1 ? "jours" : "jour"], [String(past.length), "activités"], [String(places.length), "lieux"], [rythme, "activités par jour"]];
  cartes.forEach(([a, b], i) => {
    const x = 16 + i * 46;
    doc.setFillColor(244, 247, 248); doc.roundedRect(x, 60, 42, 16, 2, 2, "F");
    doc.setFont(...P.F.b); doc.setFontSize(14); doc.setTextColor(46, 107, 128);
    doc.text(a, x + 5, 68);
    doc.setFont(...P.F.n); doc.setFontSize(8); doc.setTextColor(96, 88, 72);
    doc.text(P.clean(b), x + 5, 73);
  });
  let y = 88;
  const tops = past.map((e) => ({ e, v: vibeOfEvent(e, messages) })).filter((x) => x.v >= 3).sort((a, b) => b.v - a.v).slice(0, 3);
  if (tops.length) {
    doc.setFont(...P.F.b); doc.setFontSize(13); doc.setTextColor(35, 59, 69);
    doc.text("Les incontournables", 16, y); y += 5;
    tops.forEach(({ e, v }, i) => {
      doc.setFillColor(255, 248, 233); doc.roundedRect(16, y, 178, 10, 1.6, 1.6, "F");
      doc.setFont(...P.F.b); doc.setFontSize(9.5); doc.setTextColor(74, 59, 35);
      doc.text(P.clean(`${i + 1}. ${titreDe(e)}`), 21, y + 6.4);
      doc.setFont(...P.F.n); doc.setFontSize(8.6); doc.setTextColor(96, 88, 72);
      doc.text(P.clean(e.place && e.place.name !== "À définir" ? e.place.name : `Jour ${e.day + 1}`).slice(0, 34), 92, y + 6.4);
      doc.setFont(...P.F.b); doc.setFontSize(8); doc.setTextColor(222, 90, 70);
      doc.text(`${avisLabel(v)} · ${v} réactions`, 189, y + 6.4, { align: "right" });
      y += 12;
    });
    y += 5;
  }
  const premiers = [];
  for (let d = 0; d < DAYS.length; d++) {
    const evs = past.filter((e) => e.day === d && e.start).sort((a, b) => a.start.localeCompare(b.start));
    if (evs.length) premiers.push(evs[0].start);
  }
  if (premiers.length) {
    premiers.sort();
    const med = premiers[Math.floor(premiers.length / 2)];
    const parType = TYPE_ORDER.map((t) => {
      const nT = past.filter((e) => (e.type || "activite") === t).length;
      return nT ? `${nT} ${TYPES[t].label.toLowerCase()}${nT > 1 && !/s$/.test(TYPES[t].label) ? "s" : ""}` : null;
    }).filter(Boolean).slice(0, 4).join(", ");
    doc.setFont(...P.F.b); doc.setFontSize(13); doc.setTextColor(35, 59, 69);
    doc.text("Le rythme", 16, y); y += 6;
    doc.setFont(...P.F.n); doc.setFontSize(9.5); doc.setTextColor(96, 88, 72);
    doc.text(P.clean(`${rythme} activités par jour en moyenne, premières sorties vers ${med.replace(":", "h")}.`), 16, y); y += 5.4;
    if (parType) { doc.text(P.clean(`Au programme : ${parType}.`), 16, y); y += 5.4; }
    y += 4;
  }
  try {
    const data = await mapImage(places.filter((p) => p.coord).map((p, i) => ({ coord: p.coord, label: String(i + 1) })), 1070, 555);
    doc.setFont(...P.F.b); doc.setFontSize(13); doc.setTextColor(35, 59, 69);
    doc.text("La carte du séjour", 16, y); y += 4;
    doc.addImage(data, "JPEG", 16, y, 178, 92.3);
    y += 99;
  } catch (e) {}
  /* jours en tableau */
  let yT = 300;
  const ensure = (h) => { if (yT + h > 282) { doc.addPage(); fond(); yT = 14; } };
  for (let d = 0; d < DAYS.length; d++) {
    const evs = past.filter((e) => e.day === d).sort((a, b) => (a.start || "").localeCompare(b.start || ""));
    if (!evs.length) continue;
    ensure(24 + evs.length * 15);
    doc.setFillColor(46, 107, 128); doc.rect(0, yT, W, 17, "F");
    doc.setFont(...P.F.b); doc.setFontSize(12.5); doc.setTextColor(255, 255, 255);
    doc.text(P.clean(`Jour ${d + 1} · ${dayLabel(d)}`), 16, yT + 8);
    const der = evs[evs.length - 1];
    doc.setFont(...P.F.n); doc.setFontSize(8.6); doc.setTextColor(198, 220, 228);
    doc.text(P.clean(`${evs.length} étape${evs.length > 1 ? "s" : ""}${evs[0].start ? ` · ${evs[0].start.replace(":", "h")} à ${(der.end || der.start || "").replace(":", "h")}` : ""}`), 16, yT + 13.6);
    yT += 22;
    evs.forEach((e, i) => {
      if (i % 2 === 0) { doc.setFillColor(248, 250, 251); doc.rect(16, yT - 4.6, 178, 14.4, "F"); }
      doc.setFont(...P.F.b); doc.setFontSize(9.8); doc.setTextColor(35, 59, 69);
      doc.text((e.start || "").replace(":", "h"), 16, yT);
      doc.setFont(...P.F.n); doc.setFontSize(8.8); doc.setTextColor(96, 88, 72);
      doc.text(fmtDur(e), 38, yT);
      const ty = TYPES[e.type || "activite"] || TYPES.activite;
      doc.setFillColor(ty.color); doc.circle(61.6, yT - 1.1, 1.5, "F");
      doc.setFont(...P.F.b); doc.setFontSize(9.8); doc.setTextColor(45, 52, 58);
      doc.text(doc.splitTextToSize(P.clean(titreDe(e)), 88)[0] || "", 65.4, yT);
      const sous = [ty.label, e.place && e.place.name !== "À définir" ? e.place.name : "", e.note || ""].filter(Boolean).join(" · ");
      doc.setFont(...P.F.n); doc.setFontSize(8.2); doc.setTextColor(120, 112, 96);
      doc.text(doc.splitTextToSize(P.clean(sous), 92)[0] || "", 65.4, yT + 4.6);
      const v = vibeOfEvent(e, messages);
      const av = avisLabel(v);
      if (av) {
        doc.setFillColor(av === "Adoré" ? 228 : 234, av === "Adoré" ? 243 : 244, av === "Adoré" ? 234 : 239);
        doc.roundedRect(165, yT - 4, 29, 7, 3.5, 3.5, "F");
        doc.setFont(...P.F.b); doc.setFontSize(8); doc.setTextColor(31, 122, 80);
        doc.text(av, 179.5, yT + 0.6, { align: "center" });
      }
      yT += 15;
    });
    const ej = etapesJour(evs);
    if (ej.points.length >= 2) {
      if (yT + 46 > 282) { doc.addPage(); fond(); yT = 14; }
      try {
        const dj = await mapImage(ej.points, 1070, 240, { route: ej.route, markerR: 12, maxZoom: 14 });
        doc.addImage(dj, "JPEG", 16, yT - 2, 178, 39.9);
        yT += 44;
      } catch (e) {}
    }
    yT += 5;
  }
  /* par envie + adresses */
  doc.addPage(); fond(); yT = 18;
  doc.setFont(...P.F.b); doc.setFontSize(14); doc.setTextColor(35, 59, 69);
  doc.text("Par envie", 16, yT); yT += 8;
  const groupes = [];
  TYPE_ORDER.forEach((t) => {
    const seenT = new Set(); const items = [];
    past.filter((e) => (e.type || "activite") === t).forEach((e) => {
      const k = placeKey(titreDe(e));
      if (seenT.has(k)) return; seenT.add(k);
      items.push({ titre: titreDe(e), v: vibeOfEvent(e, messages) });
    });
    if (items.length) groupes.push({ t, items: items.sort((a, b) => b.v - a.v).slice(0, 6) });
  });
  groupes.slice(0, 6).forEach((g, i) => {
    const x = 16 + (i % 2) * 92, gy = yT + Math.floor(i / 2) * 46;
    const col = TYPES[g.t].color;
    doc.setFillColor(col); doc.circle(x + 2.2, gy - 1.2, 1.6, "F");
    doc.setFont(...P.F.b); doc.setFontSize(11); doc.setTextColor(35, 59, 69);
    doc.text(P.clean(TYPES[g.t].label), x + 6.5, gy);
    doc.setFont(...P.F.n); doc.setFontSize(8.8); doc.setTextColor(96, 88, 72);
    g.items.forEach((it, j) => {
      doc.text(doc.splitTextToSize(P.clean(it.titre) + (avisLabel(it.v) ? ` · ${avisLabel(it.v)}` : ""), 82)[0] || "", x + 6.5, gy + 5.6 + j * 5);
    });
  });
  yT += Math.ceil(Math.min(groupes.length, 6) / 2) * 46 + 6;
  if (places.length) {
    if (yT > 180) { doc.addPage(); fond(); yT = 18; }
    doc.setFont(...P.F.b); doc.setFontSize(14); doc.setTextColor(35, 59, 69);
    doc.text("Les adresses", 16, yT); yT += 9;
    for (let i = 0; i < places.length; i++) {
      const p = places[i];
      if (yT > 274) { doc.addPage(); fond(); yT = 18; }
      if (i % 2 === 0) { doc.setFillColor(248, 250, 251); doc.rect(16, yT - 4.8, 178, 11.2, "F"); }
      doc.setFont(...P.F.b); doc.setFontSize(9.6); doc.setTextColor(45, 52, 58);
      doc.text(doc.splitTextToSize(P.clean(`${i + 1} · ${p.name}`), 128)[0] || "", 16, yT);
      let addr = "";
      try { addr = p.coord ? await reverseAddr(p.coord) : ""; } catch (e) {}
      if (!addr && p.coord) addr = `${p.coord.lat.toFixed(4)}, ${p.coord.lng.toFixed(4)}`;
      if (addr) {
        doc.setFont(...P.F.n); doc.setFontSize(8.2); doc.setTextColor(120, 112, 96);
        doc.text(doc.splitTextToSize(P.clean(addr), 128)[0] || "", 16, yT + 4.6);
      }
      const url = p.coord
        ? `https://www.google.com/maps/search/?api=1&query=${p.coord.lat},${p.coord.lng}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.name} ${SETTINGS.place || ""}`.trim())}`;
      doc.setFont(...P.F.n); doc.setFontSize(8.8); doc.setTextColor(46, 107, 128);
      try { doc.textWithLink("ouvrir dans Maps", 152, yT, { url }); } catch (e) { doc.text("ouvrir dans Maps", 152, yT); }
      doc.setDrawColor(46, 107, 128); doc.setLineWidth(0.2); doc.line(152, yT + 1.1, 179, yT + 1.1);
      yT += 11.2;
    }
  }
  const total = doc.getNumberOfPages ? doc.getNumberOfPages() : 0;
  for (let i = 1; i <= (total || 0); i++) {
    doc.setPage(i);
    doc.setFont(...P.F.n); doc.setFontSize(8); doc.setTextColor(172, 160, 140);
    doc.text(`Programme partagé avec C où déjà ? · page ${i}/${total}`, W / 2, 291, { align: "center" });
  }
  return doc.output("blob");
}
const heartsOf = (p) => Object.keys(p.reactions || {}).filter((pid) => ((p.reactions || {})[pid] || []).includes("❤️")).length;
const reactsOf = (p) => Object.keys(p.reactions || {}).reduce((n, pid) => n + ((p.reactions || {})[pid] || []).length, 0);
function pickStar(photos, faces) {
  const list = (photos || []).filter((p) => p.url);
  if (!list.length) return null;
  const seuil = Math.max(1, Math.ceil(ROSTER.filter((p) => p.active).length / 2));
  let elu = null;
  list.forEach((p) => { const h = heartsOf(p); if (h >= seuil && (!elu || h > heartsOf(elu))) elu = p; });
  if (elu) return { photo: elu, label: "Votre photo élue", n: heartsOf(elu) };
  if (faces) {
    let bf = null, bs = 0;
    list.forEach((p) => { const f = faces[p.id]; if (f && f.n >= 2) { const sc = f.n * f.score; if (sc > bs) { bs = sc; bf = p; } } });
    if (bf) return { photo: bf, label: "La photo de groupe", n: heartsOf(bf) };
  }
  let br = null, brn = -1;
  list.forEach((p) => { const r = reactsOf(p); if (r > brn) { brn = r; br = p; } });
  return br ? { photo: br, label: "La photo du séjour", n: heartsOf(br) } : null;
}
function ShareSheet({ events, photos, messages, onDone }) {
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const url = typeof window !== "undefined" ? window.location.href : "";
  const partagerFilm = async () => {
    const data = { title: SETTINGS.name || "Notre séjour", text: `Le film de ${SETTINGS.place || "notre séjour"} et tous nos souvenirs.`, url };
    try {
      if (typeof navigator !== "undefined" && navigator.share) { await navigator.share(data); onDone(); return; }
      if (typeof navigator !== "undefined" && navigator.clipboard) { await navigator.clipboard.writeText(url); setMsg("Lien copié."); return; }
      setMsg("Copiez le lien depuis la barre d'adresse.");
    } catch (e) { if (e && e.name !== "AbortError") setMsg("Partage impossible."); }
  };
  const sendPdf = async (maker, nom) => {
    if (busy) return;
    setBusy(true); setMsg("Préparation...");
    try {
      const blob = await maker();
      const file = typeof File !== "undefined" ? new File([blob], nom, { type: "application/pdf" }) : null;
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: nom });
        setMsg(null); setBusy(false); onDone(); return;
      }
      const u = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = u; a.download = nom; a.rel = "noopener";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(u), 60000);
      setMsg("Document enregistré.");
    } catch (e) {
      setMsg(e && e.name === "AbortError" ? null : "Génération impossible hors connexion.");
    }
    setBusy(false);
  };
  const base = `${SETTINGS.place || SETTINGS.name || "sejour"}`.trim();
  const row = { display: "flex", alignItems: "center", gap: 12, width: "100%", cursor: "pointer", border: `1px solid ${T.c.line}`, background: T.c.card, borderRadius: T.r.lg, padding: "13px 14px", textAlign: "left", minHeight: 44 };
  const ic = (bg, col, Icon) => (
    <span style={{ width: 38, height: 38, borderRadius: T.r.pill, background: bg, color: col, display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}><Icon size={17} /></span>
  );
  const lignes = [
    [() => partagerFilm(), ic(T.c.seaSoft, T.c.seaDeep, Play), "Partager le film", "Envoie le lien du séjour, le film s'ouvre dans l'app."],
    [() => sendPdf(() => makeSouvenirPdf({ events, photos, messages }), `Carnet ${base}.pdf`), ic(T.c.coralSoft, T.c.coralDeep, Images), "Carnet souvenir", "Le séjour en pages : photos, temps forts et livre d'or."],
    [() => sendPdf(() => makeProgramPdf({ events, messages }), `Programme ${base}.pdf`), ic(T.c.sunSoft, "#A5822F", CalendarDays), "Programme", "L'itinéraire détaillé, prêt à transmettre."],
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {lignes.map(([fn, icone, titre, dsc]) => (
        <button key={titre} onClick={fn} disabled={busy} style={{ ...row, opacity: busy ? 0.6 : 1 }}>
          {icone}
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontFamily: fD, fontWeight: 700, fontSize: 15, color: T.c.ink }}>{titre}</span>
            <span style={{ display: "block", fontFamily: fB, fontSize: 12, color: T.c.inkFaint }}>{dsc}</span>
          </span>
        </button>
      ))}
      {msg && <div style={{ fontFamily: fB, fontSize: 12.5, color: T.c.seaDeep, textAlign: "center" }}>{msg}</div>}
    </div>
  );
}
function PlacesMap({ places, onClose }) {
  const pts = (places || []).filter((p) => p.coord);
  const boxRef = useRef(null);
  const dragRef = useRef(null);
  const [box, setBox] = useState({ w: 320, h: 420 });
  const [z, setZ] = useState(12);
  const [c, setC] = useState(pts.length ? pts[0].coord : V);
  const rad = Math.PI / 180;
  const prj = (co, zz) => { const n = Math.pow(2, zz) * 256; const lr = co.lat * rad; return { x: ((co.lng + 180) / 360) * n, y: ((1 - Math.log(Math.tan(lr) + 1 / Math.cos(lr)) / Math.PI) / 2) * n }; };
  useEffect(() => {
    const el = boxRef.current; if (!el || !pts.length) return;
    const w = el.clientWidth || 320, h = el.clientHeight || 420;
    setBox({ w, h });
    const lats = pts.map((p) => p.coord.lat), lngs = pts.map((p) => p.coord.lng);
    setC({ lat: (Math.min(...lats) + Math.max(...lats)) / 2, lng: (Math.min(...lngs) + Math.max(...lngs)) / 2 });
    let best = 4;
    for (let zz = 17; zz >= 3; zz--) {
      const a = prj({ lat: Math.max(...lats), lng: Math.min(...lngs) }, zz);
      const b = prj({ lat: Math.min(...lats), lng: Math.max(...lngs) }, zz);
      if (b.x - a.x < w - 80 && b.y - a.y < h - 120) { best = zz; break; }
    }
    setZ(best);
  }, []);
  const n = Math.pow(2, z);
  const ctr = prj(c, z);
  const px2ll = (px, py) => { const lng = (px / (n * 256)) * 360 - 180; const yn = Math.PI * (1 - 2 * (py / (n * 256))); return { lat: Math.atan(Math.sinh(yn)) / rad, lng }; };
  const onDown = (e) => { const t = e.touches ? e.touches[0] : e; dragRef.current = { x: t.clientX, y: t.clientY, cx: ctr.x, cy: ctr.y }; };
  const onMove = (e) => { const d = dragRef.current; if (!d) return; if (e.cancelable) e.preventDefault(); const t = e.touches ? e.touches[0] : e; setC(px2ll(d.cx - (t.clientX - d.x), d.cy - (t.clientY - d.y))); };
  const onUp = () => { dragRef.current = null; };
  const x0 = Math.floor((ctr.x - box.w / 2) / 256), x1 = Math.floor((ctr.x + box.w / 2) / 256);
  const y0 = Math.floor((ctr.y - box.h / 2) / 256), y1 = Math.floor((ctr.y + box.h / 2) / 256);
  const tiles = [];
  for (let tx = x0; tx <= x1; tx++) for (let ty = y0; ty <= y1; ty++) if (ty >= 0 && ty < n) tiles.push([tx, ty]);
  const btnZ = { cursor: "pointer", width: 44, height: 44, border: `1px solid ${T.c.line}`, background: T.c.card, color: T.c.ink, borderRadius: T.r.md, fontFamily: fD, fontWeight: 700, fontSize: 19, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: T.sh.card };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, background: T.c.bg, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "calc(10px + env(safe-area-inset-top)) 14px 8px" }}>
        <span style={{ fontFamily: fD, fontWeight: 700, color: T.c.ink, fontSize: 17 }}>{pts.length} lieu{pts.length > 1 ? "x" : ""} du séjour</span>
        <button onClick={onClose} aria-label="Fermer" style={{ cursor: "pointer", border: "none", background: T.c.lineSoft, color: T.c.ink, width: 44, height: 44, borderRadius: T.r.pill, display: "flex", alignItems: "center", justifyContent: "center" }}><X size={20} /></button>
      </div>
      <div ref={boxRef} onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp} onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
        style={{ flex: 1, minHeight: 0, position: "relative", overflow: "hidden", touchAction: "none", background: "#dcecf2" }}>
        {tiles.map(([tx, ty]) => (
          <img key={tx + "_" + ty + "_" + z} alt="" draggable={false} src={`https://tile.openstreetmap.org/${z}/${((tx % n) + n) % n}/${ty}.png`}
            style={{ position: "absolute", left: Math.round(tx * 256 - (ctr.x - box.w / 2)), top: Math.round(ty * 256 - (ctr.y - box.h / 2)), width: 256, height: 256, pointerEvents: "none", userSelect: "none" }} />
        ))}
        {pts.map((p, i) => {
          const q = prj(p.coord, z);
          return (
            <span key={i} style={{ position: "absolute", left: Math.round(q.x - (ctr.x - box.w / 2)), top: Math.round(q.y - (ctr.y - box.h / 2)), transform: "translate(-50%, -100%)", pointerEvents: "none", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontFamily: fD, fontWeight: 700, fontSize: 10.5, color: T.c.ink, background: "rgba(255,255,255,0.88)", borderRadius: T.r.pill, padding: "1px 6px", marginBottom: 1, whiteSpace: "nowrap", boxShadow: T.sh.card }}>{p.name}</span>
              <MapPin size={24} color={T.c.coral} fill={T.c.coral} strokeWidth={1.5} />
            </span>
          );
        })}
        <div style={{ position: "absolute", right: 10, top: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          <button onClick={() => setZ((v) => clamp(v + 1, 3, 18))} aria-label="Zoomer" style={btnZ}>+</button>
          <button onClick={() => setZ((v) => clamp(v - 1, 3, 18))} aria-label="Dézoomer" style={btnZ}>-</button>
        </div>
        <span style={{ position: "absolute", right: 6, bottom: 4, fontFamily: fB, fontSize: 9.5, color: "#00000099", background: "#ffffffb0", padding: "1px 5px", borderRadius: 3 }}>© OpenStreetMap</span>
      </div>
    </div>
  );
}
function SouvenirSky({ periode }) {
  const t = LAND_PALETTE[SETTINGS.tripType] ? SETTINGS.tripType : "mer";
  return (
    <div style={{ position: "relative", margin: "0 -18px" }}>
      <svg viewBox="0 0 320 128" aria-hidden="true" style={{ display: "block", width: "100%", height: "auto" }}>
        <defs>
          <linearGradient id="souvSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFF4DE" />
            <stop offset="0.7" stopColor="#FFE4C4" />
            <stop offset="1" stopColor="#FFD9BC" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="320" height="128" fill="url(#souvSky)" />
        <g transform="translate(0, 10)">
          <circle cx="250" cy="64" r="26" fill={T.c.sun} opacity="0.3" />
          <circle cx="250" cy="64" r="13" fill={T.c.sun} opacity="0.92" />
          {[[36, 16], [84, 30], [138, 12], [198, 26], [292, 18]].map(([sx, sy], i) => (
            <circle key={i} cx={sx} cy={sy} r="1.3" fill="#E2A244" style={{ animation: `vtwinkle ${2.6 + i * 0.7}s ease-in-out ${i * 0.5}s infinite` }} />
          ))}
          <Landscape type={t} night={false} />
          <line x1="0" y1="92" x2="320" y2="92" stroke="#B08A5A" strokeOpacity="0.3" strokeWidth="1.4" />
        </g>
      </svg>
      <div style={{ position: "absolute", left: 18, top: 13, right: 18, pointerEvents: "none" }}>
        <div style={{ fontFamily: fB, fontWeight: 700, fontSize: 10.5, letterSpacing: 1.2, color: "#8A6E4B", textTransform: "uppercase" }}>{(SETTINGS.place || SETTINGS.name || "")} · Souvenirs</div>
        <div style={{ fontFamily: fH, fontWeight: 600, fontSize: 37, color: "#233B45", lineHeight: 1.02, marginTop: 2 }}>C'était {SETTINGS.place || "le séjour"}</div>
        <div style={{ fontFamily: fB, fontSize: 12.5, color: "#6E6046", marginTop: 4 }}>{periode}</div>
      </div>
    </div>
  );
}
function SouvenirCard({ events, photos, messages, star, faces, onOpenEvent, onOpenPhoto, onFilm, onOpenQuiz, onMap, onShare }) {
  const past = mainList(events);
  const phs = (photos || []).filter((p) => p.url);
  const msgs = (messages || []).filter((m) => !isVibe(m) && !isLoc(m));
  const seen = new Set(); let lieux = 0;
  past.forEach((e) => { if (e.place && e.place.name && e.place.name !== "À définir" && !seen.has(placeKey(e.place.name))) { seen.add(placeKey(e.place.name)); lieux += 1; } });
  const tops = past.map((e) => { const v = (messages || []).find((m) => m.id === "vibe-" + e.id); return { e, n: v ? vibeTotal(v) : 0 }; }).filter((x) => x.n >= 1).sort((a, b) => b.n - a.n).slice(0, 3);
  const stats = souvenirStats(events, photos, messages).map(([n, l, a]) => [n, l, a === "map" && lieux > 0 ? onMap : null]);
  const encres = [T.c.seaDeep, T.c.coralDeep, "#A5822F", "#7E5DA8"];
  const rot = [-6, 3, -3, 5];
  const actions = [[HelpCircle, "Quiz", onOpenQuiz], [MapIcon, "Carte", lieux > 0 ? onMap : null], [Share2, "Partager", onShare]].filter((a) => a[2]);
  const th = themeDe();
  const nbVis = (p) => (faces && faces[p.id] && faces[p.id].n) || 0;
  const nbTags = (p) => (p.tags || []).length;
  const albumFaces = phs.filter((p) => nbVis(p) >= 2 || nbTags(p) > 3).sort((a, b) => (nbVis(b) - nbVis(a)) || (nbTags(b) - nbTags(a)) || (heartsOf(b) - heartsOf(a)));
  const album = albumFaces.length ? albumFaces : (star && (nbVis(star.photo) >= 2 || nbTags(star.photo) > 3) ? [star.photo] : albumFaces);
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6, padding: "0 4px" }}>
        {stats.map(([n, l, act], i) => {
          const inner = (
            <div style={{ width: 61, height: 61, borderRadius: "50%", border: `1px dashed ${encres[i]}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: fD, fontWeight: 700, fontSize: 19, color: encres[i], lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{n}</span>
              <span style={{ fontFamily: fB, fontWeight: 700, fontSize: 7.5, letterSpacing: 1.1, color: encres[i], textTransform: "uppercase", marginTop: 2 }}>{l}</span>
            </div>
          );
          const st = { width: 72, height: 72, borderRadius: "50%", border: `2.2px solid ${encres[i]}`, opacity: 0.82, transform: `rotate(${rot[i]}deg)`, display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto", background: "transparent", padding: 0 };
          return act
            ? <button key={l} onClick={act} aria-label={`Voir les ${l} sur la carte`} style={{ ...st, cursor: "pointer" }}>{inner}</button>
            : <div key={l} style={st}>{inner}</div>;
        })}
      </div>
      {actions.length > 0 && (
        <div style={{ display: "flex", justifyContent: "space-around", gap: 6, padding: "0 2px" }}>
          {actions.map(([Icon, label, fn]) => (
            <button key={label} onClick={fn} style={{ cursor: "pointer", border: "none", background: "transparent", padding: 0, minWidth: 56, minHeight: 44, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
              <span style={{ width: 46, height: 46, borderRadius: "50%", border: `1.4px dashed ${T.c.line}`, display: "flex", alignItems: "center", justifyContent: "center", color: T.c.seaDeep, background: T.c.card }}><Icon size={19} /></span>
              <span style={{ fontFamily: fD, fontWeight: 700, fontSize: 11, color: T.c.inkSoft }}>{label}</span>
            </button>
          ))}
        </div>
      )}
      {tops.length > 0 && (
        <div style={{ width: "96%", alignSelf: "center", background: "#FFF8E9", borderRadius: 12, boxShadow: T.sh.card, padding: "13px 14px 6px", transform: "rotate(-0.8deg)" }}>
          <div style={{ fontFamily: fB, fontWeight: 700, fontSize: 8.5, letterSpacing: 1.5, color: "#A5822F", textTransform: "uppercase", marginBottom: 9 }}>Les moments préférés du groupe</div>
          {tops.map(({ e, n }, r) => {
            const med = ["#E8B23A", "#B9C2CB", "#CB8A55"][r];
            return (
              <button key={e.id} onClick={() => onOpenEvent(e)} style={{ width: "100%", textAlign: "left", cursor: "pointer", border: "none", background: "transparent", padding: "7px 0", borderTop: r ? "1px dashed #EBDCBB" : "none", display: "flex", alignItems: "center", gap: 11 }}>
                <span style={{ flex: "0 0 auto", width: 26, height: 26, borderRadius: "50%", background: med, color: "#fff", fontFamily: fD, fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 5px rgba(0,0,0,0.12)" }}>{r + 1}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontFamily: fH, fontWeight: 600, fontSize: 20, color: "#4A3B23", lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{titreDe(e)}</span>
                </span>
                <span style={{ flex: "0 0 auto", fontFamily: fB, fontWeight: 700, fontSize: 12.5, color: "#8A7A55" }}>{n} 🤩</span>
              </button>
            );
          })}
        </div>
      )}
      {album.length > 0 && <AlbumVisages photos={album} faces={faces} onOpenPhoto={onOpenPhoto} />}
      <FilmEncart th={th} onFilm={onFilm} />
    </>
  );
}
function CartePhoto({ photo, faces, style, legende, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onTransitionEnd }) {
  return (
    <div onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerCancel} onTransitionEnd={onTransitionEnd}
      style={{ background: "#fff", padding: "11px 11px 12px", borderRadius: 4, boxShadow: "0 10px 26px rgba(31,58,68,0.18)", ...style }}>
      <span style={{ position: "absolute", left: -12, top: -8, width: 52, height: 17, background: "rgba(255,236,170,0.6)", transform: "rotate(-38deg)", borderRadius: 2, boxShadow: "0 1px 2px rgba(0,0,0,0.08)" }} />
      <span style={{ position: "absolute", right: -12, top: -8, width: 52, height: 17, background: "rgba(255,236,170,0.6)", transform: "rotate(38deg)", borderRadius: 2, boxShadow: "0 1px 2px rgba(0,0,0,0.08)" }} />
      <div style={{ position: "relative", overflow: "hidden", borderRadius: 2 }}>
        <img src={photo.url} alt="" draggable={false} style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", objectPosition: faceCrop(faces, photo), display: "block", pointerEvents: "none" }} />
      </div>
      {legende != null && <span style={{ display: "block", textAlign: "center", fontFamily: fH, fontWeight: 600, fontSize: 18, color: "#40525B", marginTop: 9 }}>{legende}</span>}
    </div>
  );
}
function AlbumVisages({ photos, faces, onOpenPhoto }) {
  const [i, setI] = useState(0);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [envol, setEnvol] = useState(0);
  const [sansTrans, setSansTrans] = useState(false);
  const startX = useRef(null);
  const startY = useRef(null);
  const lastY = useRef(0);
  const axe = useRef(null);
  const scroller = useRef(null);
  const n = photos.length;
  const idx = ((i % n) + n) % n;
  const cur = photos[idx];
  const suiv = photos[(idx + 1) % n];
  const labelDe = (k) => `Les photos du groupe${n > 1 ? ` · ${k + 1}/${n}` : ""}`;
  /* après l'envol, replacer la nouvelle carte du dessus sans transition pour qu'elle ne revienne pas en glissant */
  useEffect(() => {
    if (!sansTrans) return undefined;
    const raf = window.requestAnimationFrame || ((c) => setTimeout(c, 16));
    const id = raf(() => setSansTrans(false));
    return () => (window.cancelAnimationFrame ? window.cancelAnimationFrame(id) : clearTimeout(id));
  }, [sansTrans]);
  const finEnvol = (e) => {
    if (e && e.propertyName && e.propertyName !== "transform") return;
    if (envol === 0) return;
    setSansTrans(true);
    setI((x) => (x + 1) % n);
    setEnvol(0);
    setDrag(0);
  };
  const trouveScrollable = (el) => {
    let node = el ? el.parentElement : null;
    while (node && node !== document.body && node !== document.documentElement) {
      const st = window.getComputedStyle(node);
      if (/(auto|scroll)/.test(st.overflowY || "") && node.scrollHeight > node.clientHeight + 2) return node;
      node = node.parentElement;
    }
    return null;
  };
  const scrollDe = (d) => { const el = scroller.current; if (el) el.scrollTop += d; else window.scrollBy(0, d); };
  const down = (e) => {
    if (envol) return;
    startX.current = e.clientX; startY.current = e.clientY; lastY.current = e.clientY;
    axe.current = null; scroller.current = trouveScrollable(e.currentTarget);
    setDragging(true);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
  };
  const move = (e) => {
    if (startX.current == null) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;
    /* horizontal tant que l'inclinaison reste sous environ 63 degres (composante verticale jusqu'a deux fois l'horizontale) */
    if (axe.current == null && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
      axe.current = Math.abs(dx) * 2 >= Math.abs(dy) ? "h" : "v";
    }
    if (axe.current === "h") setDrag(dx);
    else if (axe.current === "v") scrollDe(lastY.current - e.clientY);
    lastY.current = e.clientY;
  };
  const up = (e) => {
    if (startX.current == null) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;
    const a = axe.current;
    startX.current = null; startY.current = null; axe.current = null;
    setDragging(false);
    if (a === "h" && n > 1 && Math.abs(dx) > 60) setEnvol(dx < 0 ? -1 : 1);
    else if (a == null && Math.abs(dx) < 10 && Math.abs(dy) < 10) { setDrag(0); onOpenPhoto(cur, photos); }
    else setDrag(0);
  };
  const cancel = () => { startX.current = null; startY.current = null; axe.current = null; setDragging(false); setDrag(0); };
  const transform = envol !== 0
    ? `translateX(${envol * 130}vw) rotate(${envol * 22}deg)`
    : `translateX(${drag}px) rotate(${drag * 0.05}deg)`;
  return (
    <div style={{ alignSelf: "center", width: "90%", marginTop: 2 }}>
      <div style={{ position: "relative" }}>
        {n > 1 && (
          <CartePhoto photo={suiv} faces={faces} legende={labelDe((idx + 1) % n)} style={{ position: "absolute", inset: 0, transform: "rotate(-1.4deg)" }} />
        )}
        <CartePhoto photo={cur} faces={faces} legende={labelDe(idx)}
          onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={cancel} onTransitionEnd={finEnvol}
          style={{ position: "relative", transform: `rotate(-1.4deg) ${transform}`, transition: (dragging || sansTrans) ? "none" : "transform .5s cubic-bezier(.2,.75,.3,1), opacity .5s ease", opacity: envol !== 0 ? 0 : 1, cursor: dragging ? "grabbing" : "grab", touchAction: "none" }} />
      </div>
      {n > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 11 }}>
          <button onClick={() => setI((x) => (x - 1 + n) % n)} aria-label="Photo précédente" style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: "rgba(6,14,18,0.32)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>‹</button>
          <div style={{ display: "flex", gap: 6 }}>
            {photos.slice(0, 12).map((ph, k) => (
              <button key={ph.id} onClick={() => setI(k)} aria-label={`Photo ${k + 1}`} style={{ width: 7, height: 7, borderRadius: "50%", border: "none", padding: 0, cursor: "pointer", background: k === idx ? T.c.seaDeep : T.c.line }} />
            ))}
          </div>
          <button onClick={() => setEnvol(-1)} aria-label="Photo suivante" style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: "rgba(6,14,18,0.32)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>›</button>
        </div>
      )}
    </div>
  );
}
function FilmEncart({ th, onFilm }) {
  return (
    <button onClick={onFilm} aria-label="Lancer le film du séjour" style={{ alignSelf: "center", width: "94%", marginTop: 6, cursor: "pointer", border: "none", padding: 0, borderRadius: T.r.lg, overflow: "hidden", position: "relative", boxShadow: "0 12px 30px rgba(31,58,68,0.22)", background: `linear-gradient(135deg, ${th.ciel[0]} 0%, ${th.ciel[1]} 55%, ${th.ciel[2]} 100%)`, display: "block", textAlign: "left" }}>
      <span style={{ position: "absolute", top: -18, right: -10, width: 82, height: 82, borderRadius: "50%", background: th.astre, opacity: 0.5, filter: "blur(2px)" }} />
      {[["16%", "12%"], ["30%", "84%"], ["66%", "22%"], ["78%", "70%"]].map(([tp, lf], k) => (
        <span key={k} style={{ position: "absolute", top: tp, left: lf, width: 4, height: 4, borderRadius: "50%", background: th.etoile, opacity: 0.7 }} />
      ))}
      <span style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", position: "relative" }}>
        <span style={{ flex: "0 0 auto", width: 54, height: 54, borderRadius: "50%", background: th.fam === "ville" ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.5)", border: `2px solid ${th.fam === "ville" ? "rgba(255,255,255,0.5)" : "#ffffff"}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.14)" }}>
          <Play size={24} fill={th.encre} color={th.encre} style={{ marginLeft: 3 }} />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontFamily: fB, fontWeight: 700, fontSize: 9.5, letterSpacing: 1.6, textTransform: "uppercase", color: th.feteLabel }}>Le film du séjour</span>
          <span style={{ display: "block", fontFamily: fH, fontWeight: 700, fontSize: 27, color: th.encre, lineHeight: 1.05, marginTop: 1 }}>Revivez tout le voyage</span>
          <span style={{ display: "block", fontFamily: fB, fontSize: 12, color: th.encre, opacity: 0.66, marginTop: 3 }}>Photos, étapes et livre d'or, en musique</span>
        </span>
      </span>
    </button>
  );
}
function ScreenNow({ events, now, onOpenEvent, onOpenThread, onAddPhoto, onOpenPhoto, onLikePhoto, photos, onAdd, onSetStatus, wx, wxCoord, play, unreadByEvent, openPollsByEvent, onFilm, onOpenQuiz, onMap, onShare, onToggleMine }) {
  const tripOver = dayOfNow(now) >= DAYS.length;
  const [faces, setFaces] = useState(() => loadFaces());
  const [scan, setScan] = useState(null);
  const scanRef = useRef(false);
  const nPhotos = (photos || []).filter((p) => p.url).length;
  useEffect(() => {
    if (!tripOver || scanRef.current || !nPhotos) return;
    const list = (photos || []).filter((p) => p.url);
    const cache = loadFaces();
    const reste = list.filter((p) => !cache[p.id]);
    if (!reste.length) { setFaces(cache); return; }
    if (typeof navigator !== "undefined" && navigator.onLine === false) return;
    scanRef.current = true;
    const relacher = () => { scanRef.current = false; };
    const lent = setTimeout(() => setScan({ done: 0, total: reste.length }), 2000);
    detectFacesFor(list, (done, total) => setScan((s) => (s ? { done, total } : s)))
      .then((m) => setFaces({ ...m }))
      .catch(() => {})
      .then(() => { clearTimeout(lent); setScan(null); relacher(); });
  }, [tripOver, nPhotos]);
  const ub = (id) => (unreadByEvent && unreadByEvent[id]) || 0;
  const op = (id) => (openPollsByEvent && openPollsByEvent[id]) || 0;
  const cur = currentEvent(events, now);
  const nxt = nextEvent(events, now);
  const dIdx = clamp(dayOfNow(now), 0, DAYS.length - 1);
  const day = DAYS[dIdx];
  const me = person(ME);
  const sameDayNext = nxt && nxt.day === dIdx ? nxt : null;
  const mid = minsInDay(now);
  const todayStarts = mainList(events).filter((e) => e.day === dIdx).map((e) => toAbs(0, e.start));
  const firstToday = todayStarts.length ? Math.min(...todayStarts) : null;
  const morningCutoff = firstToday != null ? Math.min(360, firstToday) : 360;
  const nightMorning = !cur && mid < morningCutoff;
  const todayDone = (!cur && !sameDayNext) || nightMorning;
  const after = (!todayDone && sameDayNext) ? upcomingSameDay(events, now, dIdx).filter((e) => e.id !== sameDayNext.id).slice(0, 3) : [];
  const star = tripOver ? pickStar(photos, faces) : null;

  if (tripOver) {
    const nActifs = ROSTER.filter((p) => p.active).length;
    const dEnd = new Date(isoPlusDays(SETTINGS.startISO, DAYS.length - 1) + "T12:00:00");
    const dStart = new Date(SETTINGS.startISO + "T12:00:00");
    const periode = dStart.getMonth() === dEnd.getMonth()
      ? `Du ${dStart.getDate()} au ${dEnd.getDate()} ${MO[dEnd.getMonth()]}`
      : `Du ${dStart.getDate()} ${MO[dStart.getMonth()]} au ${dEnd.getDate()} ${MO[dEnd.getMonth()]}`;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <SouvenirSky periode={`${periode} · ${DAYS.length} jours à ${nActifs}`} />
        <SouvenirCard events={events} photos={photos} messages={play ? play.messages : []} star={star} faces={faces} onOpenEvent={onOpenEvent} onOpenPhoto={onOpenPhoto} onFilm={onFilm} onOpenQuiz={onOpenQuiz} onMap={onMap} onShare={onShare} />
        {scan && <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: fB, fontSize: 11.5, color: T.c.inkFaint }}><RefreshCw size={12} style={{ animation: "vspin 1.1s linear infinite" }} /> Analyse des photos... {scan.done}/{scan.total}</div>}
        <PhotoStrip photos={(photos || []).filter((p) => !star || p.id !== star.photo.id)} onOpen={onOpenPhoto} onLike={onLikePhoto} noLabel variant="polaroid" faces={faces} />
        {featureOn("capsule") && play && <CapsuleCard now={now} onSave={play.saveCapsule} onDelete={play.deleteCapsule} />}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: fB, fontWeight: 600, color: T.c.inkFaint, fontSize: 12, letterSpacing: 0.8 }}>
            {(SETTINGS.place || SETTINGS.name || "").toUpperCase()}  ·  JOUR {dIdx + 1} SUR {DAYS.length}
          </div>
          <h1 style={{ fontFamily: fD, fontWeight: 700, color: T.c.ink, fontSize: 32, lineHeight: 1.08, margin: "4px 0 0" }}>{greeting(now)} {me.name}</h1>
        </div>
        {onAdd && (
          <button onClick={onAdd} aria-label="Ajouter une activité aujourd'hui" title="Ajouter une activité aujourd'hui" style={{ cursor: "pointer", flex: "0 0 auto", marginTop: 6, width: 42, height: 42, borderRadius: T.r.pill, border: `1px solid ${T.c.line}`, background: T.c.card, color: T.c.seaDeep, boxShadow: T.sh.card, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Plus size={21} />
          </button>
        )}
      </div>

      {featureOn("status") && onSetStatus && <StatusStrip onSetStatus={onSetStatus} />}

      {!todayDone && <SunArc now={now} wx={wx} coord={wxCoord} endMin={cur ? Number(cur.end.slice(0, 2)) * 60 + Number(cur.end.slice(3, 5)) : null} />}

      {cur ? (
        <>
          <div>
            <CurrentHero event={cur} now={now} onOpen={() => onOpenEvent(cur)} onDiscuss={() => onOpenThread(cur)} onAddPhoto={onAddPhoto} onVibe={play ? () => play.vibe(cur.id) : null} vibeCount={play ? vibeTotal((play.messages || []).find((m) => m.id === "vibe-" + cur.id)) : 0} unread={ub(cur.id)} openPolls={op(cur.id)} />
            <ParallelList main={cur} events={events} onOpen={onOpenEvent} ub={ub} />
          </div>
          {sameDayNext && (
            <div>
              <div onClick={() => onOpenEvent(sameDayNext)} role="button" tabIndex={0} style={{ width: "100%", textAlign: "left", cursor: "pointer", background: T.c.card, borderRadius: T.r.lg, padding: "13px 15px", boxShadow: T.sh.card }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ width: 40, height: 40, borderRadius: T.r.pill, background: TYPES[sameDayNext.type].soft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flex: "0 0 auto" }}>{TYPES[sameDayNext.type].emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <div style={{ fontFamily: fB, fontSize: 11, color: T.c.inkFaint, fontWeight: 600, letterSpacing: 0.4 }}>PUIS À {sameDayNext.start}</div>
                      <UnreadBadge n={ub(sameDayNext.id)} />
                    </div>
                    <div style={{ fontFamily: fD, fontWeight: 700, color: T.c.ink, fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sameDayNext.title}</div>
                    {lieuSecondaire(sameDayNext) && <div style={{ fontFamily: fB, color: T.c.inkFaint, fontSize: 12.5 }}>{lieuSecondaire(sameDayNext)}</div>}
                  </div>
                  <div style={{ textAlign: "right", flex: "0 0 auto" }}>
                    <div style={{ fontFamily: fB, fontSize: 11, color: T.c.inkSoft }}>dans</div>
                    <div style={{ fontFamily: fD, fontWeight: 700, color: T.c.ink, fontSize: 15, fontVariantNumeric: "tabular-nums" }}>{remainingLabel(startAbs(sameDayNext) - now)}</div>
                  </div>
                </div>
                <PollBanner count={op(sameDayNext.id)} onOpen={() => onOpenEvent(sameDayNext)} />
                <QuickActions event={sameDayNext} unread={ub(sameDayNext.id)} onOpen={() => onOpenEvent(sameDayNext)} onDiscuss={() => onOpenThread(sameDayNext)} onAddPhoto={onAddPhoto} onJoin={() => onToggleMine(sameDayNext.id)} going={iAmIn(sameDayNext)} />
              </div>
              <ParallelList main={sameDayNext} events={events} onOpen={onOpenEvent} ub={ub} />
            </div>
          )}
        </>
      ) : todayDone ? (
        <NightCard nxt={nxt} dIdx={dIdx} onOpen={onOpenEvent} unread={nxt ? ub(nxt.id) : 0} />
      ) : (
        <div>
          <NextCard event={sameDayNext} now={now} onOpen={() => onOpenEvent(sameDayNext)} onDiscuss={() => onOpenThread(sameDayNext)} onAddPhoto={onAddPhoto} onVibe={play ? () => play.vibe(sameDayNext.id) : null} vibeCount={play ? vibeTotal((play.messages || []).find((m) => m.id === "vibe-" + sameDayNext.id)) : 0} unread={ub(sameDayNext.id)} openPolls={op(sameDayNext.id)} onJoin={() => onToggleMine(sameDayNext.id)} going={iAmIn(sameDayNext)} />
          <ParallelList main={sameDayNext} events={events} onOpen={onOpenEvent} ub={ub} />
        </div>
      )}

      {after.length > 0 && (
        <div>
          <div style={{ fontFamily: fD, fontWeight: 600, color: T.c.inkSoft, fontSize: 14, marginBottom: 4 }}>Ensuite dans la journée</div>
          {after.map((e, i) => (
            <div key={e.id}>
              <button onClick={() => onOpenEvent(e)} style={{ width: "100%", textAlign: "left", cursor: "pointer", background: "transparent", border: "none", borderTop: i === 0 ? "none" : `1px solid ${T.c.lineSoft}`, padding: "12px 0", display: "flex", alignItems: "center", gap: 13 }}>
                <span style={{ fontFamily: fD, fontWeight: 700, color: T.c.ink, fontSize: 14, width: 42, flex: "0 0 auto", fontVariantNumeric: "tabular-nums" }}>{e.start}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: fD, fontWeight: 600, color: T.c.ink, fontSize: 15.5 }}>{e.title}</div>
                  {lieuSecondaire(e) && <div style={{ fontFamily: fB, color: T.c.inkFaint, fontSize: 13 }}>{lieuSecondaire(e)}</div>}
                </div>
                <UnreadBadge n={ub(e.id)} />
                <span style={{ fontSize: 18, flex: "0 0 auto" }}>{TYPES[e.type].emoji}</span>
              </button>
              <ParallelList main={e} events={events} onOpen={onOpenEvent} ub={ub} />
            </div>
          ))}
        </div>
      )}

      <DailyRitualCard dIdx={dIdx} mid={mid} now={now} events={events} photos={photos || []} play={play} onAddPhoto={onAddPhoto} onOpenPhoto={onOpenPhoto} todayDone={todayDone} />

      <PhotoStrip photos={photos} onOpen={onOpenPhoto} onLike={onLikePhoto} />

      {featureOn("capsule") && play && <CapsuleCard now={now} onSave={play.saveCapsule} onDelete={play.deleteCapsule} />}
    </div>
  );
}
/* ======================================================================= */
function ProgramCard({ e, now, onOpen, sub, unread, openPolls }) {
  const isNow = startAbs(e) <= now && now < endAbs(e);
  const isPast = endAbs(e) <= now;
  const t = TYPES[e.type];
  return (
    <button onClick={onOpen} style={{
      flex: 1, minWidth: 0, textAlign: "left", cursor: "pointer",
      background: isNow ? t.soft : sub ? T.c.lineSoft : "transparent", border: "none",
      borderRadius: T.r.md, padding: sub ? "10px 12px" : isNow ? "12px 13px" : "12px 4px",
      borderBottom: sub || isNow ? "none" : `1px solid ${T.c.lineSoft}`, opacity: isPast ? 0.55 : 1,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: fD, fontWeight: 700, color: T.c.ink, fontSize: sub ? 15 : 16.5, lineHeight: 1.2 }}>{e.title}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3, fontFamily: fB, color: T.c.inkSoft, fontSize: 13 }}>
            <MapPin size={14} color={T.c.inkFaint} />{e.place.name}{e.place.area ? `  ${e.place.area}` : ""}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, flex: "0 0 auto" }}>
          {openPolls > 0 && (
            <span title="Sondage à répondre" style={{ width: 20, height: 20, borderRadius: T.r.pill, background: T.c.sun, display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 0 2px ${T.c.ring}` }}>
              <BarChart3 size={12} color="#fff" />
            </span>
          )}
          <UnreadBadge n={unread} />
          <span style={{ fontSize: sub ? 17 : 19 }}>{t.emoji}</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8 }}>
        <AvatarRow ids={attendeesOf(e)} size={22} />
        {isNow && <span style={{ fontFamily: fD, fontWeight: 600, fontSize: 12, color: t.color }}>en cours</span>}
        {e.cost && <span style={{ fontFamily: fB, fontSize: 12, color: T.c.inkFaint }}>{e.cost}</span>}
      </div>
    </button>
  );
}

function SwipeActions({ children, onEdit, onDelete, enabled }) {
  const [dx, setDx] = useState(0);
  const [open, setOpen] = useState(false);
  const [armed, setArmed] = useState(false);
  const startRef = useRef(null);
  const baseRef = useRef(0);
  const movedRef = useRef(false);
  if (!enabled) return <>{children}</>;

  const W = 76;
  const total = (onEdit ? W : 0) + (onDelete ? W : 0);
  const begin = (x, y) => { startRef.current = { x, y }; baseRef.current = open ? -total : 0; movedRef.current = false; };
  const move = (x, y) => {
    if (!startRef.current) return;
    const ddx = x - startRef.current.x, ddy = y - startRef.current.y;
    if (!movedRef.current && Math.abs(ddx) > 8 && Math.abs(ddx) > Math.abs(ddy)) movedRef.current = true;
    if (!movedRef.current) return;
    setDx(Math.max(-(total + 16), Math.min(0, baseRef.current + ddx)));
  };
  const end = () => {
    if (dx < -(total / 2)) { setDx(-total); setOpen(true); } else { setDx(0); setOpen(false); setArmed(false); }
    startRef.current = null;
  };
  const closeIt = () => { setDx(0); setOpen(false); setArmed(false); };
  const actBtn = { cursor: "pointer", border: "none", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, fontFamily: fD, fontWeight: 700, fontSize: 12, width: W };

  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: T.r.md }}>
      {(open || dx < -2) && (
        <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: total, display: "flex" }}>
          {onEdit && <button onClick={() => { onEdit(); closeIt(); }} aria-label="Modifier l'activité" style={{ ...actBtn, background: T.c.sea }}><Pencil size={16} /> Modifier</button>}
          {onDelete && <button onClick={() => { if (armed) { onDelete(); closeIt(); } else setArmed(true); }} aria-label="Supprimer l'activité" style={{ ...actBtn, background: T.c.coralDeep }}><Trash2 size={16} /> {armed ? "Confirmer" : "Supprimer"}</button>}
        </div>
      )}
      <div
        onTouchStart={(e) => begin(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={(e) => move(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={end}
        onClickCapture={(e) => {
          if (movedRef.current) { e.preventDefault(); e.stopPropagation(); movedRef.current = false; return; }
          if (open) { e.preventDefault(); e.stopPropagation(); closeIt(); }
        }}
        style={{ transform: `translateX(${dx}px)`, transition: startRef.current ? "none" : "transform .18s ease", position: "relative" }}
      >
        {children}
      </div>
    </div>
  );
}

function ScreenProgram({ events, now, selectedDay, setSelectedDay, onOpenEvent, onEditEvent, onAdd, onDelete, canEdit, unreadByEvent, openPollsByEvent }) {
  const day = DAYS[selectedDay];
  const mains = sortByStart(mainList(events).filter((e) => e.day === selectedDay));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <h1 style={{ fontFamily: fD, fontWeight: 700, color: T.c.ink, fontSize: 28, margin: 0 }}>Programme</h1>
        {canEdit && (
          <button onClick={onAdd} aria-label="Ajouter une activité" title="Ajouter une activité" style={{ cursor: "pointer", flex: "0 0 auto", width: 42, height: 42, borderRadius: T.r.pill, border: `1px solid ${T.c.line}`, background: T.c.card, color: T.c.seaDeep, boxShadow: T.sh.card, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Plus size={21} />
          </button>
        )}
      </div>
      <div style={{ display: "flex", gap: 14, overflowX: "auto", margin: "0 -2px", paddingBottom: 2 }}>
        {DAYS.map((d) => {
          const on = d.i === selectedDay;
          const today = d.i === clamp(dayOfNow(now), 0, DAYS.length - 1);
          return (
            <button key={d.i} onClick={() => setSelectedDay(d.i)} aria-pressed={on} style={{ flex: "0 0 auto", cursor: "pointer", border: "none", background: "transparent", padding: "4px 2px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <span style={{ fontFamily: fD, fontWeight: 700, fontSize: 15, color: on ? T.c.ink : T.c.inkFaint, whiteSpace: "nowrap" }}>{d.short} {d.d}</span>
              <span style={{ height: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {on ? <span style={{ height: 3, width: "100%", minWidth: 22, borderRadius: 3, background: T.c.sea }} />
                  : today ? <span style={{ width: 5, height: 5, borderRadius: T.r.pill, background: T.c.coral }} /> : null}
              </span>
            </button>
          );
        })}
      </div>
      <div style={{ fontFamily: fB, fontStyle: "italic", color: T.c.inkFaint, fontSize: 13.5, marginTop: -6 }}>{day.long}{selectedDay === clamp(dayOfNow(now), 0, DAYS.length - 1) ? "  ·  aujourd'hui" : ""}</div>

      <div>
        {mains.map((e, idx) => {
          const isPast = endAbs(e) <= now;
          const isNow = startAbs(e) <= now && now < endAbs(e);
          const t = TYPES[e.type];
          const alts = parallelsOf(events, e.id);
          return (
            <div key={e.id} style={{ display: "flex", gap: 13 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 44, flex: "0 0 auto" }}>
                <div style={{ fontFamily: fD, fontWeight: 700, fontSize: 13, color: isPast ? T.c.inkFaint : T.c.ink, fontVariantNumeric: "tabular-nums", paddingTop: 14 }}>{e.start}</div>
                <div style={{ width: 11, height: 11, borderRadius: T.r.pill, marginTop: 6, background: isNow ? t.color : isPast ? T.c.line : T.c.card, border: `2px solid ${isPast ? T.c.line : t.color}`, boxShadow: isNow ? `0 0 0 4px ${t.color}33` : "none" }} />
                {idx < mains.length - 1 && <div style={{ flex: 1, width: 2, background: T.c.lineSoft, marginTop: 2, minHeight: 26 }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0, marginBottom: 12 }}>
                <SwipeActions onEdit={() => onEditEvent(e)} onDelete={() => onDelete(e.id)} enabled={canEdit}>
                  <ProgramCard e={e} now={now} onOpen={() => onOpenEvent(e)} unread={(unreadByEvent && unreadByEvent[e.id]) || 0} openPolls={(openPollsByEvent && openPollsByEvent[e.id]) || 0} />
                </SwipeActions>
                {alts.length > 0 && (
                  <div style={{ marginTop: 6, paddingLeft: 6, borderLeft: `2px solid ${T.c.line}`, display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: fB, color: T.c.inkFaint, fontSize: 12 }}>
                      <CornerDownRight size={13} /> en parallèle
                    </div>
                    {alts.map((a) => (
                      <SwipeActions key={a.id} onEdit={() => onEditEvent(a)} onDelete={() => onDelete(a.id)} enabled={canEdit}>
                        <ProgramCard e={a} now={now} onOpen={() => onOpenEvent(a)} sub unread={(unreadByEvent && unreadByEvent[a.id]) || 0} openPolls={(openPollsByEvent && openPollsByEvent[a.id]) || 0} />
                      </SwipeActions>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ======================================================================= */
/* Écran : Discussion (canal général)                                       */
/* ======================================================================= */
function ScreenTalk({ messages, onSend, pollHandlers }) {
  const list = messages.filter((m) => m.scope === "general");
  const scrollRef = useRef(null);
  const ph = pollHandlers || {};
  useEffect(() => { const el = scrollRef.current; if (el) el.scrollTop = el.scrollHeight; }, [list.length]);
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <h1 style={{ fontFamily: fD, fontWeight: 700, color: T.c.ink, fontSize: 28, margin: "0 0 2px" }}>Discussion</h1>
      <div style={{ fontFamily: fB, fontStyle: "italic", color: T.c.inkFaint, fontSize: 14, marginBottom: 10 }}>Le canal de tout le groupe. Les échanges d'une activité restent sur sa fiche.</div>
      <div ref={scrollRef} style={{ flex: 1, minHeight: 0, overflowY: "auto", WebkitOverflowScrolling: "touch", display: "flex", flexDirection: "column", gap: 10, paddingBottom: 8 }}>
        {list.length === 0 && <div style={{ fontFamily: fB, color: T.c.inkFaint, fontSize: 13.5, padding: "6px 0" }}>Lancez la conversation du séjour.</div>}
        {list.map((m) => isVibe(m)
          ? <VibeLine key={m.id} m={m} />
          : isLoc(m)
          ? <LocBubble key={m.id} m={m} />
          : isPoll(m)
          ? <PollBubble key={m.id} m={m} onVote={ph.onVote} onClosePoll={ph.onClosePoll} onPollToActivity={ph.onPollToActivity} onComment={ph.onComment} />
          : isGuess(m)
          ? <GuessBubble key={m.id} m={m} onGuess={ph.onGuess} onReveal={ph.onReveal} />
          : <MessageBubble key={m.id} m={m} onReact={ph.onReact} />)}
      </div>
      <div style={{ flex: "0 0 auto", paddingTop: 10, borderTop: `1px solid ${T.c.line}` }}>
        <MessageInput onSend={onSend} scope="general" onCreatePoll={ph.onCreatePoll} onShareLocation={ph.onShareLocation} />
      </div>
    </div>
  );
}

/* ======================================================================= */
/* Écran : Le groupe (avec album dérivé)                                    */
/* ======================================================================= */
function MemberRow({ p, i, canEdit, onUpdateContact }) {
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState(p.phone || "");
  const [email, setEmail] = useState(p.email || "");
  const digits = (p.phone || "").replace(/[^\d]/g, "");
  const canManage = canEdit || p.id === ME;
  const round = { width: 36, height: 36, borderRadius: T.r.pill, border: `1px solid ${T.c.line}`, background: T.c.card, display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none", cursor: "pointer", flex: "0 0 auto" };
  const field = { fontFamily: fB, fontSize: 14, color: T.c.ink, width: "100%", boxSizing: "border-box", padding: "9px 11px", border: `1px solid ${T.c.line}`, borderRadius: T.r.md, background: T.c.card, outline: "none" };
  const save = () => { onUpdateContact(p.id, { phone: phone.trim(), email: email.trim() }); setEditing(false); };
  const openEdit = () => { setPhone(p.phone || ""); setEmail(p.email || ""); setEditing(true); };
  return (
    <div style={{ padding: "9px 2px", borderTop: i === 0 ? "none" : `1px solid ${T.c.lineSoft}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Avatar id={p.id} size={38} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: fD, fontWeight: 700, color: T.c.ink, fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}{p.id === ME ? " (vous)" : ""}</div>
          <div style={{ fontFamily: fB, color: T.c.inkFaint, fontSize: 12.5 }}>{ROLE_LABEL[p.role] || p.role}</div>
        </div>
        <div style={{ display: "flex", gap: 6, flex: "0 0 auto" }}>
          {p.phone && <a href={`tel:${p.phone}`} aria-label={`Appeler ${p.name}`} style={{ ...round, color: T.c.seaDeep }}><Phone size={16} /></a>}
          {digits && <a href={`https://wa.me/${digits}`} target="_blank" rel="noreferrer" aria-label={`WhatsApp ${p.name}`} style={{ ...round, color: "#25936B", borderColor: "#25936B55" }}><MessageCircle size={16} /></a>}
          {p.email && <a href={`mailto:${p.email}`} aria-label={`E-mail ${p.name}`} style={{ ...round, color: T.c.inkSoft }}><Mail size={16} /></a>}
          {canManage && <button onClick={() => (editing ? setEditing(false) : openEdit())} aria-label={(p.phone || p.email) ? "Modifier les coordonnées" : "Ajouter des coordonnées"} style={{ ...round, color: T.c.inkSoft, border: "none", background: T.c.lineSoft }}><Pencil size={14} /></button>}
        </div>
      </div>
      {editing && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "10px 0 4px 50px" }}>
          <input type="tel" style={field} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Téléphone, par exemple +33 6 12 34 56 78" />
          <input type="email" style={field} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={save} style={{ cursor: "pointer", border: "none", background: T.c.sea, color: "#fff", borderRadius: T.r.md, padding: "8px 14px", fontFamily: fD, fontWeight: 700, fontSize: 13 }}>Enregistrer</button>
            <button onClick={() => setEditing(false)} style={{ cursor: "pointer", border: `1px solid ${T.c.line}`, background: T.c.card, color: T.c.inkSoft, borderRadius: T.r.md, padding: "8px 14px", fontFamily: fD, fontWeight: 600, fontSize: 13 }}>Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
}
function ScreenFriends({ canEdit, onUpdateContact }) {
  const members = ROSTER.filter((p) => p.active);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontFamily: fB, fontStyle: "italic", color: T.c.inkFaint, fontSize: 14, marginBottom: 6 }}>{members.length} participant{members.length > 1 ? "s" : ""}</div>
      {members.map((p, i) => <MemberRow key={p.id} p={p} i={i} canEdit={canEdit} onUpdateContact={onUpdateContact} />)}
      <div style={{ fontFamily: fB, color: T.c.inkFaint, fontSize: 12, marginTop: 10 }}>Ajout, retrait et droits des participants dans les réglages.</div>
    </div>
  );
}

function AddPhotoButton({ onPick }) {
  const ref = useRef(null);
  return (
    <>
      <input ref={ref} type="file" accept="image/*" multiple style={{ display: "none" }}
        onChange={(e) => lireLot(e, onPick)} />
      <button onClick={() => ref.current && ref.current.click()} aria-label="Ajouter des photos" title="Ajouter des photos" style={{ cursor: "pointer", flex: "0 0 auto", width: 42, height: 42, borderRadius: T.r.pill, border: `1px solid ${T.c.line}`, background: T.c.card, color: T.c.seaDeep, boxShadow: T.sh.card, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Plus size={21} />
      </button>
    </>
  );
}
function ScreenWall({ photos, events, onAddPhoto, onOpenPhoto, onDiapo }) {
  const [pending, setPending] = useState(null);
  const sorted = [...photos].sort((a, b) => (b.at || 0) - (a.at || 0));
  const acts = sortByStart(mainList(events || []));
  const canDiapo = onDiapo && featureOn("film") && sorted.filter((p) => p.url).length >= 2;
  const choose = (eventId) => { if (pending && pending.urls) { pending.urls.forEach((u) => onAddPhoto(eventId, u)); setPending(null); } };
  const rowBtn = { width: "100%", textAlign: "left", cursor: "pointer", border: `1px solid ${T.c.line}`, background: T.c.card, borderRadius: T.r.md, padding: "11px 13px", display: "flex", alignItems: "center", gap: 11 };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <h1 style={{ fontFamily: fD, fontWeight: 700, color: T.c.ink, fontSize: 28, margin: 0 }}>Photos</h1>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {canDiapo && (
            <button onClick={onDiapo} aria-label="Diaporama des photos" title="Diaporama" style={{ cursor: "pointer", flex: "0 0 auto", height: 42, padding: "0 14px", borderRadius: T.r.pill, border: `1px solid ${T.c.line}`, background: T.c.card, color: T.c.seaDeep, boxShadow: T.sh.card, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: fD, fontWeight: 700, fontSize: 13.5 }}>
              <Play size={16} /> Diaporama
            </button>
          )}
          <AddPhotoButton onPick={(url) => setPending((p) => ({ urls: [...((p && p.urls) || []), url] }))} />
        </div>
      </div>
      <div style={{ fontFamily: fB, fontStyle: "italic", color: T.c.inkFaint, fontSize: 14 }}>
        {sorted.length > 0 ? `${sorted.length} photo${sorted.length > 1 ? "s" : ""} du séjour, partagées avec le groupe.` : "Le mur du séjour. Ajoutez la première photo."}
      </div>
      {sorted.length > 0 && (() => {
        const groups = []; const gm = new Map();
        sorted.forEach((p) => {
          let key = "autres", label = "Plus tôt";
          const d = new Date(p.at);
          if (p.at && !isNaN(d)) { key = d.toDateString(); label = `${WL[d.getDay()]} ${d.getDate()} ${MO[d.getMonth()]}`; }
          if (!gm.has(key)) { const g = { key, label, items: [] }; gm.set(key, g); groups.push(g); }
          gm.get(key).items.push(p);
        });
        return groups.map((g) => (
          <div key={g.key}>
            <div style={{ fontFamily: fD, fontWeight: 700, fontSize: 13, color: T.c.inkSoft, margin: "4px 0 7px" }}>{g.label}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {g.items.map((ph) => <PhotoTile key={ph.id} photo={ph} onClick={() => onOpenPhoto(ph)} />)}
            </div>
          </div>
        ));
      })()}
      {sorted.length > 0 && sorted.length < 6 && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, border: `1px dashed ${T.c.line}`, borderRadius: T.r.lg, padding: "13px 14px", marginTop: 4 }}>
          <Images size={20} color={T.c.inkFaint} style={{ flex: "0 0 auto" }} />
          <div style={{ flex: 1, minWidth: 0, fontFamily: fB, color: T.c.inkSoft, fontSize: 13 }}>Ajoutez vos photos du jour, le mur se remplit à plusieurs.</div>
          <AddPhotoButton onPick={(url) => setPending((p) => ({ urls: [...((p && p.urls) || []), url] }))} />
        </div>
      )}
      {pending && (
        <div onClick={() => setPending(null)} style={{ position: "fixed", inset: 0, zIndex: 65, background: "rgba(6,14,18,0.5)", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: T.c.card, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: "16px 18px calc(20px + env(safe-area-inset-bottom))", maxHeight: "78vh", display: "flex", flexDirection: "column", boxShadow: T.sh.soft }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <span style={{ position: "relative", flex: "0 0 auto" }}>
                <img src={pending.urls[0]} alt="" style={{ width: 46, height: 46, borderRadius: T.r.md, objectFit: "cover", display: "block" }} />
                {pending.urls.length > 1 && (
                  <span style={{ position: "absolute", top: -5, right: -5, background: T.c.seaDeep, color: "#fff", borderRadius: T.r.pill, padding: "1px 6px", fontFamily: fD, fontWeight: 700, fontSize: 10.5, boxShadow: "0 0 0 2px #fff" }}>{pending.urls.length}</span>
                )}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: fD, fontWeight: 700, color: T.c.ink, fontSize: 16 }}>{pending.urls.length > 1 ? `Rattacher ces ${pending.urls.length} photos à une activité ?` : "Rattacher à une activité ?"}</div>
                <div style={{ fontFamily: fB, color: T.c.inkFaint, fontSize: 12.5 }}>{pending.urls.length > 1 ? "Elles restent aussi sur le mur du séjour." : "La photo reste aussi sur le mur du séjour."}</div>
              </div>
            </div>
            <button onClick={() => choose("album")} style={{ ...rowBtn, marginBottom: 8 }}>
              <span style={{ width: 34, height: 34, borderRadius: T.r.pill, background: T.c.lineSoft, display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}><Images size={17} color={T.c.inkSoft} /></span>
              <span style={{ fontFamily: fD, fontWeight: 600, color: T.c.ink, fontSize: 14.5 }}>Le mur seulement</span>
            </button>
            <div style={{ fontFamily: fB, color: T.c.inkFaint, fontSize: 12, margin: "2px 2px 7px" }}>Ou choisissez une activité :</div>
            <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 7, paddingBottom: 2 }}>
              {acts.length === 0 && <div style={{ fontFamily: fB, color: T.c.inkFaint, fontSize: 13 }}>Aucune activité au programme pour l'instant.</div>}
              {acts.map((e) => (
                <button key={e.id} onClick={() => choose(e.id)} style={rowBtn}>
                  <span style={{ width: 34, height: 34, borderRadius: T.r.pill, background: TYPES[e.type].soft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flex: "0 0 auto" }}>{TYPES[e.type].emoji}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontFamily: fD, fontWeight: 700, color: T.c.ink, fontSize: 14.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.title}</span>
                    <span style={{ display: "block", fontFamily: fB, color: T.c.inkFaint, fontSize: 12 }}>{DAYS[e.day] ? `${DAYS[e.day].short} ${DAYS[e.day].d}` : ""}  ·  {e.start}</span>
                  </span>
                </button>
              ))}
            </div>
            <button onClick={() => setPending(null)} style={{ marginTop: 12, cursor: "pointer", border: `1px solid ${T.c.line}`, background: T.c.card, color: T.c.inkSoft, borderRadius: T.r.md, padding: "11px", fontFamily: fD, fontWeight: 600, fontSize: 14 }}>Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ======================================================================= */
/* Feuille de bas d'écran                                                   */
/* ======================================================================= */
function Sheet({ open, onClose, children, title }) {
  return (
    <div aria-hidden={!open} style={{ position: "absolute", inset: 0, zIndex: 40, pointerEvents: open ? "auto" : "none" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(18,58,75,0.34)", opacity: open ? 1 : 0, transition: "opacity .22s ease" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, background: T.c.card, borderTopLeftRadius: 26, borderTopRightRadius: 26, boxShadow: T.sh.lift, maxHeight: "90%", overflow: "hidden", transform: open ? "translateY(0)" : "translateY(101%)", transition: "transform .28s cubic-bezier(.22,1,.36,1)", display: "flex", flexDirection: "column" }}>
        <div style={{ overflowY: "auto", WebkitOverflowScrolling: "touch", flex: "1 1 auto", minHeight: 0 }}>
        <div style={{ position: "sticky", top: 0, background: T.c.card, padding: "14px 18px 8px", zIndex: 1 }}>
          <div style={{ width: 40, height: 4, borderRadius: 4, background: T.c.line, margin: "0 auto 12px" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontFamily: fD, fontWeight: 700, color: T.c.ink, fontSize: 18 }}>{title}</div>
            <button onClick={onClose} aria-label="Fermer" style={{ cursor: "pointer", border: "none", background: T.c.line, borderRadius: T.r.pill, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={18} color={T.c.inkSoft} />
            </button>
          </div>
        </div>
        <div style={{ padding: "4px 18px 24px" }}>{children}</div>
        </div>
      </div>
    </div>
  );
}

/* Détail d'un événement */
function DetailSheet({ event, messages, photos, canEdit, onEdit, onPatch, onDelete, favorites, onAddFavorite, onToggleMine, onSend, onAddPhoto, onOpenPhoto, onOpenEvent, onAddParallel, allEvents, pollHandlers, focusThread }) {
  const threadRef = useRef(null);
  const [edit, setEdit] = useState(null);
  const [saved, setSaved] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const savedRef = useRef(null);
  useEffect(() => () => { if (savedRef.current) clearTimeout(savedRef.current); }, []);
  useEffect(() => { setEdit(null); setConfirmDel(false); }, [event && event.id]);
  useEffect(() => {
    if (focusThread && threadRef.current) {
      const id = setTimeout(() => { try { threadRef.current.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (e) { /* rien */ } }, 80);
      return () => clearTimeout(id);
    }
  }, [focusThread, event && event.id]);
  if (!event) return null;
  const patch = (p) => {
    if (!onPatch) return;
    onPatch(event.id, p);
    setSaved(true);
    if (savedRef.current) clearTimeout(savedRef.current);
    savedRef.current = setTimeout(() => setSaved(false), 1700);
  };
  const hmToMin = (v) => { const [h, m] = (v || "00:00").split(":").map(Number); return (h || 0) * 60 + (m || 0); };
  const minToHm = (min) => { const v = Math.max(0, Math.min(1439, min)); return pad(Math.floor(v / 60)) + ":" + pad(v % 60); };
  const majDebut = (v) => { const s = hmToMin(v); const p = { start: v }; if (hmToMin(event.end) <= s) p.end = minToHm(s + 60); patch(p); };
  const majFin = (v) => { const f = hmToMin(v); const p = { end: v }; if (f <= hmToMin(event.start)) p.start = minToHm(f - 60); patch(p); };
  const champ = { fontFamily: fB, fontSize: 15, color: T.c.ink, width: "100%", boxSizing: "border-box", padding: "11px 12px", border: `1px solid ${T.c.sea}`, borderRadius: T.r.md, background: T.c.card, outline: "none" };
  const zoneEdit = { background: T.c.seaSoft, borderRadius: T.r.md, padding: 11, display: "flex", flexDirection: "column", gap: 9 };
  const btnFini = (
    <button onClick={() => setEdit(null)} style={{ alignSelf: "flex-end", cursor: "pointer", border: "none", background: T.c.sea, color: "#fff", borderRadius: T.r.pill, padding: "7px 14px", minHeight: 36, fontFamily: fD, fontWeight: 700, fontSize: 13 }}>Terminé</button>
  );
  const ligne = (icone, label, valeur, cle, vide) => {
    if (!canEdit) return valeur ? <InfoLine icon={icone} label={label} value={valeur} /> : null;
    return (
      <button onClick={() => setEdit(cle)} style={{ width: "100%", textAlign: "left", cursor: "pointer", background: "transparent", border: "none", padding: "3px 0", minHeight: 44, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ flex: 1, minWidth: 0, opacity: valeur ? 1 : 0.62 }}><InfoLine icon={icone} label={label} value={valeur || vide} /></span>
        <Pencil size={14} color={T.c.inkFaint} style={{ flex: "0 0 auto" }} />
      </button>
    );
  };
  const t = TYPES[event.type];
  const going = iAmIn(event);
  const alt = isAlt(event);
  const main = alt ? allEvents.find((m) => m.id === event.parallelOf) : null;
  const alts = alt ? [] : parallelsOf(allEvents, event.id);
  const skippers = alt ? [] : skipOf(event);
  const evPhotos = photos.filter((ph) => ph.event === event.id);
  const msgCount = messages.filter((m) => m.scope === event.id).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {canEdit ? (
          <button onClick={() => setEdit(edit === "type" ? null : "type")} style={{ cursor: "pointer", border: "none", background: "transparent", padding: 0, display: "inline-flex", alignItems: "center", gap: 5, minHeight: 34 }}>
            <TypeChip type={event.type} /><Pencil size={12} color={T.c.inkFaint} />
          </button>
        ) : <TypeChip type={event.type} />}
        {saved && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginLeft: "auto", fontFamily: fD, fontWeight: 600, fontSize: 12, color: T.c.seaDeep, animation: "vfade .2s ease" }}>
            <Check size={13} /> Enregistré
          </span>
        )}
        {alt && main && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: fB, fontSize: 12.5, color: T.c.inkFaint }}>
            <CornerDownRight size={13} /> en parallèle de {main.title}
          </span>
        )}
      </div>
      {edit === "type" && (
        <div style={zoneEdit}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[...TYPE_ORDER, ...(SETTINGS.categories || []).map((c) => c.id)].map((k) => {
              const ty = TYPES[k]; if (!ty) return null; const on = event.type === k;
              return (
                <button key={k} onClick={() => { if (!on) patch({ type: k }); setEdit(null); }} style={{ cursor: "pointer", border: on ? `2px solid ${ty.color}` : `1px solid ${T.c.line}`, background: on ? ty.soft : T.c.card, color: on ? ty.color : T.c.inkSoft, borderRadius: T.r.pill, padding: "8px 13px", minHeight: 40, fontFamily: fD, fontWeight: 600, fontSize: 13.5, display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span>{ty.emoji}</span> {ty.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {edit === "titre" ? (
        <input autoFocus defaultValue={event.title} placeholder="Plage, dîner, boutiques..."
          onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
          onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== event.title) patch({ title: v }); setEdit(null); }}
          style={{ ...champ, fontFamily: fD, fontWeight: 700, fontSize: 22 }} />
      ) : canEdit ? (
        <button onClick={() => setEdit("titre")} style={{ width: "100%", textAlign: "left", cursor: "pointer", background: "transparent", border: "none", padding: 0, minHeight: 44, display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ flex: 1, fontFamily: fD, fontWeight: 700, color: T.c.ink, fontSize: 24, lineHeight: 1.15 }}>{event.title}</span>
          <Pencil size={15} color={T.c.inkFaint} style={{ flex: "0 0 auto" }} />
        </button>
      ) : (
        <div style={{ fontFamily: fD, fontWeight: 700, color: T.c.ink, fontSize: 24, lineHeight: 1.15 }}>{event.title}</div>
      )}

      {event.place && event.place.coord ? <MapPreview coord={event.place.coord} name={event.place.name} /> : null}
      {event.place && !event.place.coord && event.place.name && event.place.name !== "À définir" && (
        <a href={dirUrlFor(event.place)} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px", background: T.c.seaSoft, color: T.c.seaDeep, textDecoration: "none", borderRadius: T.r.md, fontFamily: fD, fontWeight: 600, fontSize: 14 }}>
          <Navigation size={16} /> Itinéraire vers « {event.place.name} »
        </a>
      )}
      {edit === "lieu" ? (
        <div style={zoneEdit}>
          <PlaceField
            draft={{ ...event, placeName: event.place.name === "À définir" ? "" : event.place.name, coord: event.place.coord }}
            setDraft={(d) => patch({ place: { name: (d.placeName || "").trim() || "À définir", coord: d.coord || null, area: event.place.area } })}
            favorites={favorites} onAddFavorite={onAddFavorite} />
          {btnFini}
        </div>
      ) : canEdit ? (
        <button onClick={() => setEdit("lieu")} style={{ width: "100%", textAlign: "left", cursor: "pointer", background: "transparent", border: "none", padding: "3px 0", minHeight: 44, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontFamily: fD, fontWeight: 700, color: T.c.ink, fontSize: 15 }}>{event.place.name}</span>
            {event.place.area && <span style={{ display: "block", fontFamily: fB, color: T.c.inkFaint, fontSize: 13 }}>{event.place.area}</span>}
          </span>
          <Pencil size={14} color={T.c.inkFaint} style={{ flex: "0 0 auto" }} />
        </button>
      ) : (
        <div>
          <div style={{ fontFamily: fD, fontWeight: 700, color: T.c.ink, fontSize: 15 }}>{event.place.name}</div>
          {event.place.area && <div style={{ fontFamily: fB, color: T.c.inkFaint, fontSize: 13 }}>{event.place.area}</div>}
        </div>
      )}

      {edit === "horaire" ? (
        <div style={zoneEdit}>
          <ScrollRow selKey={event.day}>
            {DAYS.map((d) => {
              const on = event.day === d.i;
              return (
                <button key={d.i} data-sel={on ? "1" : undefined} onClick={() => { if (!on) patch({ day: d.i }); }} style={{ flex: "0 0 auto", cursor: "pointer", border: on ? `2px solid ${T.c.sea}` : `1px solid ${T.c.line}`, background: on ? T.c.card : T.c.card, color: on ? T.c.seaDeep : T.c.inkSoft, borderRadius: T.r.md, padding: "9px 13px", minHeight: 40, fontFamily: fD, fontWeight: 600, fontSize: 13, whiteSpace: "nowrap" }}>{d.short} {d.d}</button>
              );
            })}
          </ScrollRow>
          <div style={{ display: "flex", gap: 10 }}>
            <span style={{ flex: 1 }}><span style={{ fontFamily: fB, color: T.c.inkSoft, fontSize: 12.5, display: "block", marginBottom: 4 }}>Début</span>
              <input type="time" value={event.start} onChange={(e) => majDebut(e.target.value)} style={champ} /></span>
            <span style={{ flex: 1 }}><span style={{ fontFamily: fB, color: T.c.inkSoft, fontSize: 12.5, display: "block", marginBottom: 4 }}>Fin</span>
              <input type="time" value={event.end} onChange={(e) => majFin(e.target.value)} style={champ} /></span>
          </div>
          {btnFini}
        </div>
      ) : ligne(<Clock3 size={18} color={t.color} />, "Horaire", `${DAYS[event.day].long}, ${event.start} à ${event.end}`, "horaire")}
      {edit === "budget" ? (
        <div style={zoneEdit}>
          <input autoFocus defaultValue={event.cost || ""} placeholder="25 à 35 EUR par personne"
            onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
            onBlur={(e) => { const v = e.target.value.trim(); if (v !== (event.cost || "")) patch({ cost: v }); setEdit(null); }} style={champ} />
        </div>
      ) : ligne(<Wallet size={18} color={t.color} />, "Budget", event.cost, "budget", "Ajouter un budget")}
      {edit === "note" ? (
        <div style={zoneEdit}>
          <textarea autoFocus defaultValue={event.note || ""} placeholder="Maillot, réservation, point de rendez-vous..."
            onBlur={(e) => { const v = e.target.value.trim(); if (v !== (event.note || "")) patch({ note: v }); setEdit(null); }}
            style={{ ...champ, minHeight: 74, resize: "vertical", lineHeight: 1.4 }} />
        </div>
      ) : ligne(<StickyNote size={18} color={t.color} />, "À prévoir", event.note, "note", "Ajouter une note")}

      {/* Présence */}
      <div>
        <div style={{ fontFamily: fB, color: T.c.inkSoft, fontSize: 13, marginBottom: 8 }}>Qui vient</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {attendeesOf(event).map((id) => (
            <div key={id} style={{ display: "flex", alignItems: "center", gap: 7, background: T.c.card, border: `1px solid ${T.c.line}`, borderRadius: T.r.pill, padding: "4px 11px 4px 4px" }}>
              <Avatar id={id} size={24} />
              <span style={{ fontFamily: fB, color: T.c.ink, fontSize: 13 }}>{person(id).name}</span>
            </div>
          ))}
          {attendeesOf(event).length === 0 && <span style={{ fontFamily: fB, color: T.c.inkFaint, fontSize: 13 }}>Personne pour l'instant.</span>}
        </div>
        {skippers.length > 0 && (
          <div style={{ fontFamily: fB, color: T.c.inkFaint, fontSize: 13, marginTop: 9 }}>
            {skippers.map((id) => person(id).name).join(", ")} passe{skippers.length > 1 ? "nt" : ""} leur tour.
          </div>
        )}
      </div>

      {/* Activités parallèles rattachées */}
      {alts.length > 0 && (
        <div>
          <div style={{ fontFamily: fB, color: T.c.inkSoft, fontSize: 13, marginBottom: 8 }}>En parallèle, sur le même créneau</div>
          {alts.map((a) => (
            <button key={a.id} onClick={() => onOpenEvent(a)} style={{ width: "100%", textAlign: "left", cursor: "pointer", background: T.c.lineSoft, border: "none", borderRadius: T.r.md, padding: "11px 13px", display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 18 }}>{TYPES[a.type].emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: fD, fontWeight: 600, color: T.c.ink, fontSize: 14.5 }}>{a.title}</div>
                <div style={{ fontFamily: fB, color: T.c.inkFaint, fontSize: 12.5 }}>{attendeesOf(a).length} personne(s)</div>
              </div>
              <CornerDownRight size={16} color={T.c.inkFaint} />
            </button>
          ))}
        </div>
      )}

      {/* Mon choix de présence */}
      <button onClick={() => onToggleMine(event.id)} style={{
        cursor: "pointer", borderRadius: T.r.lg, padding: "13px", fontFamily: fD, fontWeight: 600, fontSize: 15,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        border: going ? `1px solid ${T.c.line}` : "none",
        background: going ? T.c.card : (alt ? T.c.sea : T.c.green), color: going ? T.c.inkSoft : "#fff",
      }}>
        {alt
          ? (going ? <><LogOut size={17} /> Quitter cette activité</> : <><LogIn size={17} /> Rejoindre cette activité</>)
          : (going ? <><UserMinus size={17} /> Je passe mon tour</> : <><UserPlus size={17} /> Je reviens</>)}
      </button>
      {alt && (
        <div style={{ fontFamily: fB, color: T.c.inkFaint, fontSize: 12.5, marginTop: -8, textAlign: "center" }}>
          {going && main ? `En quittant, vous revenez à ${main.title}.` : main ? `Vous rejoignez ceci et quittez ${main.title}.` : ""}
        </div>
      )}

      {/* Créer une activité parallèle */}
      {canEdit && !alt && (
        <button onClick={() => onAddParallel(event)} style={{ cursor: "pointer", border: `1px dashed ${T.c.line}`, background: "transparent", color: T.c.seaDeep, borderRadius: T.r.lg, padding: "11px", fontFamily: fD, fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <CornerDownRight size={16} /> Créer une activité en parallèle
        </button>
      )}

      {/* Fil de discussion de l'activité */}
      <div ref={threadRef} style={{ background: T.c.seaSoft, borderRadius: T.r.lg, padding: "14px 14px 16px", scrollMarginTop: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <MessageCircle size={18} color={T.c.seaDeep} />
          <span style={{ fontFamily: fD, fontWeight: 700, color: T.c.ink, fontSize: 16 }}>Discussion de l'activité</span>
          {msgCount > 0 && <span style={{ fontFamily: fD, fontWeight: 600, fontSize: 12, color: T.c.seaDeep, background: T.c.card, borderRadius: T.r.pill, padding: "2px 8px" }}>{msgCount}</span>}
        </div>
        <Thread scope={event.id} messages={messages} onSend={onSend} emptyLabel="Lancez la discussion de cette activité." pollHandlers={pollHandlers} />
      </div>

      {/* Photos */}
      <div>
        <SectionTitle>Photos</SectionTitle>
        <PhotoGrid photos={evPhotos} onAdd={(url) => onAddPhoto(event.id, url)} onOpen={onOpenPhoto} cols={4} />
        <div style={{ fontFamily: fB, color: T.c.inkFaint, fontSize: 11.5, marginTop: 7 }}>Partagées avec le groupe.</div>
      </div>

      {canEdit && onDelete && (confirmDel ? (
        <div style={{ marginTop: 4, marginBottom: 10, background: T.c.coralSoft, borderRadius: T.r.md, padding: 12 }}>
          <div style={{ fontFamily: fB, fontSize: 14, color: T.c.ink, marginBottom: 10 }}>Supprimer cette activité ? Cette action est définitive.</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setConfirmDel(false)} style={{ flex: 1, minHeight: 44, cursor: "pointer", border: `1px solid ${T.c.line}`, background: T.c.card, color: T.c.inkSoft, borderRadius: T.r.md, padding: "11px", fontFamily: fD, fontWeight: 600, fontSize: 14 }}>Annuler</button>
            <button onClick={() => onDelete(event.id)} style={{ flex: 1, minHeight: 44, cursor: "pointer", border: "none", background: T.c.coralDeep, color: "#fff", borderRadius: T.r.md, padding: "11px", fontFamily: fD, fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}><Trash2 size={16} /> Supprimer</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setConfirmDel(true)} style={{ marginTop: 4, marginBottom: 10, cursor: "pointer", border: `1px solid ${T.c.coralDeep}55`, background: "transparent", color: T.c.coralDeep, width: "100%", borderRadius: T.r.md, padding: "13px", minHeight: 44, fontFamily: fD, fontWeight: 600, fontSize: 14.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Trash2 size={17} /> Supprimer l'activité
        </button>
      ))}
    </div>
  );
}

function InfoLine({ icon, label, value }) {
  return (
    <div style={{ display: "flex", gap: 11 }}>
      <span style={{ flex: "0 0 auto", marginTop: 1 }}>{icon}</span>
      <div>
        <div style={{ fontFamily: fB, color: T.c.inkFaint, fontSize: 12 }}>{label}</div>
        <div style={{ fontFamily: fB, color: T.c.ink, fontSize: 14.5, fontWeight: 500 }}>{value}</div>
      </div>
    </div>
  );
}

/* Création ou modification */
function distM(a, b) {
  const R = 6371000, toR = Math.PI / 180;
  const dLat = (b.lat - a.lat) * toR, dLng = (b.lng - a.lng) * toR;
  const la1 = a.lat * toR, la2 = b.lat * toR;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function fmtDist(m) {
  if (m == null) return "";
  if (m < 950) return "à " + (Math.round(m / 10) * 10) + " m";
  if (m < 9500) return "à " + (m / 1000).toFixed(1).replace(".", ",") + " km";
  return "à " + Math.round(m / 1000) + " km";
}

function ScrollRow({ children, selKey }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const btn = el.querySelector('[data-sel="1"]');
    if (!btn) return;
    const left = Math.max(0, btn.offsetLeft - (el.clientWidth - btn.clientWidth) / 2);
    if (el.scrollTo) el.scrollTo({ left, behavior: "smooth" }); else el.scrollLeft = left;
  }, [selKey]);
  return (
    <div style={{ position: "relative" }}>
      <div ref={ref} style={{ display: "flex", gap: 8, overflowX: "auto", margin: "0 -2px", paddingBottom: 2 }}>{children}</div>
      <span style={{ position: "absolute", right: -2, top: 0, bottom: 2, width: 26, background: `linear-gradient(to right, transparent, ${T.c.card})`, pointerEvents: "none" }} />
    </div>
  );
}
function PointPicker({ initial, onPick, onCancel }) {
  const [c, setC] = useState(initial || V);
  const [z, setZ] = useState(15);
  const [w, setW] = useState(320);
  const H = 240;
  const boxRef = useRef(null);
  const dragRef = useRef(null);
  useEffect(() => { if (boxRef.current) setW(boxRef.current.clientWidth); }, []);
  const rad = Math.PI / 180;
  const n = Math.pow(2, z);
  const cx = ((c.lng + 180) / 360) * n * 256;
  const latR = c.lat * rad;
  const cy = ((1 - Math.log(Math.tan(latR) + 1 / Math.cos(latR)) / Math.PI) / 2) * n * 256;
  const px2ll = (px, py) => {
    const lng = (px / (n * 256)) * 360 - 180;
    const yn = Math.PI * (1 - 2 * (py / (n * 256)));
    return { lat: Math.atan(Math.sinh(yn)) / rad, lng };
  };
  const onDown = (e) => { const t = e.touches ? e.touches[0] : e; dragRef.current = { x: t.clientX, y: t.clientY, cx, cy }; };
  const onMove = (e) => {
    const d = dragRef.current; if (!d) return;
    if (e.cancelable) e.preventDefault();
    const t = e.touches ? e.touches[0] : e;
    setC(px2ll(d.cx - (t.clientX - d.x), d.cy - (t.clientY - d.y)));
  };
  const onUp = () => { dragRef.current = null; };
  const x0 = Math.floor((cx - w / 2) / 256), x1 = Math.floor((cx + w / 2) / 256);
  const y0 = Math.floor((cy - H / 2) / 256), y1 = Math.floor((cy + H / 2) / 256);
  const tiles = [];
  for (let tx = x0; tx <= x1; tx++) for (let ty = y0; ty <= y1; ty++) if (ty >= 0 && ty < n) tiles.push([tx, ty]);
  const btnZ = { cursor: "pointer", width: 34, height: 34, border: `1px solid ${T.c.line}`, background: T.c.card, color: T.c.ink, borderRadius: T.r.md, fontFamily: fD, fontWeight: 700, fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: T.sh.card };
  return (
    <div style={{ border: `1px solid ${T.c.line}`, borderRadius: T.r.lg, overflow: "hidden", background: T.c.card }}>
      <div ref={boxRef}
        onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
        onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
        style={{ position: "relative", height: H, overflow: "hidden", touchAction: "none", cursor: "grab", background: "#dcecf2" }}>
        {tiles.map(([tx, ty]) => (
          <img key={tx + "_" + ty + "_" + z} alt="" draggable={false}
            src={`https://tile.openstreetmap.org/${z}/${((tx % n) + n) % n}/${ty}.png`}
            style={{ position: "absolute", left: Math.round(tx * 256 - (cx - w / 2)), top: Math.round(ty * 256 - (cy - H / 2)), width: 256, height: 256, pointerEvents: "none", userSelect: "none" }} />
        ))}
        <span style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -100%)", pointerEvents: "none" }}><MapPin size={30} color={T.c.coral} fill={T.c.coral} strokeWidth={1.5} /></span>
        <div style={{ position: "absolute", right: 8, top: 8, display: "flex", flexDirection: "column", gap: 6 }}>
          <button onClick={() => setZ((v) => clamp(v + 1, 3, 18))} aria-label="Zoomer" style={btnZ}>+</button>
          <button onClick={() => setZ((v) => clamp(v - 1, 3, 18))} aria-label="Dézoomer" style={btnZ}>-</button>
        </div>
        <span style={{ position: "absolute", right: 6, bottom: 4, fontFamily: fB, fontSize: 9, color: "#00000099", pointerEvents: "none", background: "#ffffffb0", padding: "1px 4px", borderRadius: 3 }}>© OpenStreetMap</span>
      </div>
      <div style={{ display: "flex", gap: 8, padding: 10 }}>
        <button onClick={onCancel} style={{ flex: 1, cursor: "pointer", border: `1px solid ${T.c.line}`, background: T.c.card, color: T.c.inkSoft, borderRadius: T.r.md, padding: "10px", fontFamily: fD, fontWeight: 600, fontSize: 13.5 }}>Annuler</button>
        <button onClick={() => onPick(c)} style={{ flex: 1, cursor: "pointer", border: "none", background: T.c.sea, color: "#fff", borderRadius: T.r.md, padding: "10px", fontFamily: fD, fontWeight: 700, fontSize: 13.5 }}>Choisir ce point</button>
      </div>
    </div>
  );
}
function PlaceField({ draft, setDraft, favorites, onAddFavorite }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [q, setQ] = useState(draft.placeName || "");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [geo, setGeo] = useState(null);
  const geoRef = useRef(null);
  const geoAsked = useRef(false);
  const timer = useRef(null);
  const ctrl = useRef(null);
  const field = { fontFamily: fB, fontSize: 15, color: T.c.ink, width: "100%", boxSizing: "border-box", padding: "12px 13px", border: `1px solid ${T.c.line}`, borderRadius: T.r.md, background: T.c.card, outline: "none" };
  const favs = favorites || [];
  const near = (a, b) => a && b && Math.abs(a.lat - b.lat) < 1e-4 && Math.abs(a.lng - b.lng) < 1e-4;
  const alreadyFav = draft.coord && favs.some((f) => near(f.coord, draft.coord));

  const askGeo = () => {
    if (geoAsked.current || typeof navigator === "undefined" || !navigator.geolocation) return;
    geoAsked.current = true;
    navigator.geolocation.getCurrentPosition(
      (p) => { const g = { lat: p.coords.latitude, lng: p.coords.longitude }; geoRef.current = g; setGeo(g); },
      () => { /* refus ou indisponible : recherche mondiale sans distance */ },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  };

  const runSearch = async (v) => {
    try {
      if (ctrl.current) ctrl.current.abort();
      ctrl.current = new AbortController();
      setLoading(true); setOpen(true);
      const g = geoRef.current;
      const sig = ctrl.current.signal;
      const fromPhoton = async () => {
        const bias = g ? `&lat=${g.lat}&lon=${g.lng}&location_bias_scale=0.6` : "";
        const r = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(v)}&limit=7&lang=fr${bias}`, { signal: sig });
        const j = await r.json();
        return (j.features || []).map((f) => {
          const p = f.properties || {}; const c = (f.geometry && f.geometry.coordinates) || [];
          const primary = p.name || [p.housenumber, p.street].filter(Boolean).join(" ") || p.city || v;
          const ctx = [p.name && p.street ? p.street : null, p.postcode, p.city, p.state, p.country].filter(Boolean).join(", ");
          const lat = c[1], lng = c[0];
          const dist = (g && typeof lat === "number" && typeof lng === "number") ? distM(g, { lat, lng }) : null;
          return { primary, ctx, lat, lng, dist };
        }).filter((x) => typeof x.lat === "number" && typeof x.lng === "number");
      };
      const fromNominatim = async (query, bounded) => {
        const vb = g && bounded ? `&viewbox=${g.lng - 0.4},${g.lat + 0.4},${g.lng + 0.4},${g.lat - 0.4}&bounded=1` : "";
        const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=jsonv2&limit=7&accept-language=fr${vb}`, { signal: sig });
        const j = await r.json();
        return (Array.isArray(j) ? j : []).map((it) => {
          const primary = it.name || String(it.display_name || "").split(",")[0] || v;
          const parts = String(it.display_name || "").split(",").map((s) => s.trim());
          const ctx = parts.slice(1, 4).join(", ");
          const lat = parseFloat(it.lat), lng = parseFloat(it.lon);
          const dist = g && isFinite(lat) ? distM(g, { lat, lng }) : null;
          return { primary, ctx, lat, lng, dist };
        }).filter((x) => isFinite(x.lat) && isFinite(x.lng));
      };
      const settled = await Promise.allSettled([fromPhoton(), fromNominatim(v, true)]);
      let list = settled.flatMap((s) => (s.status === "fulfilled" ? s.value : []));
      if (list.length < 3 && (SETTINGS.place || g)) {
        const enriched = SETTINGS.place && !v.toLowerCase().includes(String(SETTINGS.place).toLowerCase()) ? `${v} ${SETTINGS.place}` : v;
        const more = await Promise.allSettled([fromNominatim(enriched, false)]);
        list = list.concat(more.flatMap((s) => (s.status === "fulfilled" ? s.value : [])));
      }
      const seen = new Set(); const dedup = [];
      list.forEach((x) => { const k = x.primary.toLowerCase().trim() + "|" + x.lat.toFixed(3) + "," + x.lng.toFixed(3); if (!seen.has(k)) { seen.add(k); dedup.push(x); } });
      if (g) dedup.sort((a, b) => (a.dist == null ? 1e12 : a.dist) - (b.dist == null ? 1e12 : b.dist));
      setItems(dedup.slice(0, 8));
    } catch (e) { /* recherche interrompue ou indisponible */ } finally { setLoading(false); }
  };

  const onType = (v) => {
    askGeo();
    setQ(v);
    setDraft({ ...draft, placeName: v });
    if (timer.current) clearTimeout(timer.current);
    if (v.trim().length < 3) { setItems([]); setOpen(false); return; }
    timer.current = setTimeout(() => runSearch(v.trim()), 350);
  };
  useEffect(() => { if (geo && q.trim().length >= 3) runSearch(q.trim()); }, [geo]);
  const pick = (it) => {
    setQ(it.primary);
    setDraft({ ...draft, placeName: it.primary, coord: { lat: it.lat, lng: it.lng } });
    setItems([]); setOpen(false);
  };
  const pickFav = (f) => {
    setQ(f.name);
    setDraft({ ...draft, placeName: f.name, coord: f.coord });
    setItems([]); setOpen(false);
  };

  return (
    <div style={{ position: "relative" }}>
      {favs.length > 0 && (
        <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 8, margin: "0 -2px 2px" }}>
          {favs.map((f) => (
            <button key={f.id} onClick={() => pickFav(f)} style={{ flex: "0 0 auto", cursor: "pointer", border: `1px solid ${T.c.line}`, background: T.c.lineSoft, color: T.c.ink, borderRadius: T.r.pill, padding: "7px 12px", fontFamily: fD, fontWeight: 600, fontSize: 12.5, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Star size={13} color={T.c.sun} /> {f.label}
            </button>
          ))}
        </div>
      )}
      <input style={field} value={q} onFocus={askGeo} onChange={(e) => onType(e.target.value)} placeholder="Rechercher un lieu ou une adresse" autoComplete="off" />

      {open && (
        <div style={{ position: "absolute", left: 0, right: 0, top: "100%", marginTop: 6, background: T.c.card, border: `1px solid ${T.c.line}`, borderRadius: T.r.md, boxShadow: T.sh.soft, zIndex: 5, overflow: "hidden" }}>
          {loading && <div style={{ padding: "10px 13px", fontFamily: fB, color: T.c.inkFaint, fontSize: 13 }}>Recherche...</div>}
          {!loading && items.length === 0 && (
            <div style={{ padding: "10px 13px" }}>
              <div style={{ fontFamily: fB, color: T.c.inkFaint, fontSize: 13 }}>Aucun lieu trouvé. Le nom sera gardé en texte, ou placez le point sur la carte.</div>
              <button onClick={() => { setOpen(false); setPickerOpen(true); }} style={{ marginTop: 8, cursor: "pointer", border: `1px solid ${T.c.line}`, background: T.c.card, color: T.c.seaDeep, borderRadius: T.r.md, padding: "9px 12px", fontFamily: fD, fontWeight: 700, fontSize: 13 }}>Placer le point sur la carte</button>
            </div>
          )}
          {items.map((it, i) => (
            <button key={i} onClick={() => pick(it)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", cursor: "pointer", border: "none", borderTop: i ? `1px solid ${T.c.lineSoft}` : "none", background: T.c.card, padding: "10px 13px" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: fD, fontWeight: 600, color: T.c.ink, fontSize: 14 }}>{it.primary}</div>
                {it.ctx && <div style={{ fontFamily: fB, color: T.c.inkFaint, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.ctx}</div>}
              </div>
              {it.dist != null && <span style={{ flex: "0 0 auto", fontFamily: fD, fontWeight: 600, fontSize: 11.5, color: T.c.seaDeep, background: T.c.seaSoft, borderRadius: T.r.pill, padding: "3px 8px" }}>{fmtDist(it.dist)}</span>}
            </button>
          ))}
        </div>
      )}
      {pickerOpen && (
        <div style={{ marginTop: 10 }}>
          <PointPicker initial={draft.coord || geoRef.current || V} onPick={(pt) => { const nm = draft.placeName || "Point sur la carte"; setDraft({ ...draft, coord: pt, placeName: nm }); setQ(nm); setPickerOpen(false); }} onCancel={() => setPickerOpen(false)} />
        </div>
      )}
      {!pickerOpen && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 8 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 9, minWidth: 0 }}>
            {draft.coord && <span style={{ fontFamily: fB, fontSize: 12, color: T.c.sea, display: "inline-flex", alignItems: "center", gap: 4, flex: "0 0 auto" }}><MapPin size={13} /> Position définie</span>}
            <button onClick={() => { setOpen(false); setPickerOpen(true); }} style={{ cursor: "pointer", border: "none", background: "transparent", color: T.c.seaDeep, padding: 0, fontFamily: fD, fontWeight: 600, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}>
              {!draft.coord && <MapPin size={14} />}{draft.coord ? "Modifier sur la carte" : "Placer sur la carte"}
            </button>
          </span>
          {draft.coord && onAddFavorite && (alreadyFav
            ? <span style={{ fontFamily: fB, color: T.c.inkFaint, fontSize: 12, display: "inline-flex", alignItems: "center", gap: 4, flex: "0 0 auto" }}><Star size={13} color={T.c.sun} /> Favori</span>
            : <button onClick={() => onAddFavorite({ label: (draft.placeName || "Lieu").trim(), name: (draft.placeName || "Lieu").trim(), coord: draft.coord })} style={{ cursor: "pointer", border: "none", background: "transparent", color: T.c.seaDeep, fontFamily: fD, fontWeight: 600, fontSize: 12.5, display: "inline-flex", alignItems: "center", gap: 4, padding: 0, flex: "0 0 auto" }}><Star size={14} /> Ajouter</button>
          )}
        </div>
      )}
    </div>
  );
}

function EditSheet({ draft, setDraft, onSave, onDelete, editing, favorites, onAddFavorite }) {
  const [confirmDel, setConfirmDel] = useState(false);
  if (!draft) return null;
  const set = (k, v) => setDraft({ ...draft, [k]: v });
  const hmToMin = (t) => { const [h, m] = (t || "00:00").split(":").map(Number); return (h || 0) * 60 + (m || 0); };
  const minToHm = (min) => { const v = Math.max(0, Math.min(1439, min)); return pad(Math.floor(v / 60)) + ":" + pad(v % 60); };
  const onStart = (v) => { const s = hmToMin(v); const patch = { start: v }; if (hmToMin(draft.end) <= s) patch.end = minToHm(s + 60); setDraft({ ...draft, ...patch }); };
  const onEnd = (v) => { const e = hmToMin(v); const patch = { end: v }; if (e <= hmToMin(draft.start)) patch.start = minToHm(e - 60); setDraft({ ...draft, ...patch }); };
  const field = { fontFamily: fB, fontSize: 15, color: T.c.ink, width: "100%", boxSizing: "border-box", padding: "12px 13px", border: `1px solid ${T.c.line}`, borderRadius: T.r.md, background: T.c.card, outline: "none" };
  const lbl = { fontFamily: fB, color: T.c.inkSoft, fontSize: 13, marginBottom: 6, display: "block" };
  const parallel = !!draft.parallelOf;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {parallel && (
        <div style={{ display: "flex", gap: 9, alignItems: "center", background: T.c.seaSoft, borderRadius: T.r.md, padding: "10px 13px", fontFamily: fB, color: T.c.ink, fontSize: 13.5 }}>
          <CornerDownRight size={16} color={T.c.sea} /> Activité en parallèle. Vous la rejoignez et quittez l'activité principale.
        </div>
      )}
      <div>
        <label style={lbl}>Titre</label>
        <input style={field} value={draft.title} onChange={(e) => set("title", e.target.value)} placeholder="Plage, dîner, boutiques..." />
      </div>
      <div>
        <label style={lbl}>Type</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {[...TYPE_ORDER, ...(SETTINGS.categories || []).map((c) => c.id)].map((k) => {
            const t = TYPES[k]; if (!t) return null; const on = draft.type === k;
            return (
              <button key={k} onClick={() => set("type", k)} style={{ cursor: "pointer", border: on ? `2px solid ${t.color}` : `1px solid ${T.c.line}`, background: on ? t.soft : T.c.card, color: on ? t.color : T.c.inkSoft, borderRadius: T.r.pill, padding: "8px 13px", fontFamily: fD, fontWeight: 600, fontSize: 13.5, display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span>{t.emoji}</span> {t.label}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <label style={lbl}>Jour</label>
        <ScrollRow selKey={draft.day}>
          {DAYS.map((d) => {
            const on = draft.day === d.i;
            return (
              <button key={d.i} data-sel={on ? "1" : undefined} onClick={() => set("day", d.i)} style={{ flex: "0 0 auto", cursor: "pointer", border: on ? `2px solid ${T.c.sea}` : `1px solid ${T.c.line}`, background: on ? T.c.seaSoft : T.c.card, color: on ? T.c.seaDeep : T.c.inkSoft, borderRadius: T.r.md, padding: "9px 13px", fontFamily: fD, fontWeight: 600, fontSize: 13, whiteSpace: "nowrap" }}>{d.short} {d.d}</button>
            );
          })}
        </ScrollRow>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <label style={lbl}>Début</label>
          <input type="time" style={field} value={draft.start} onChange={(e) => onStart(e.target.value)} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <label style={lbl}>Fin</label>
          <input type="time" style={field} value={draft.end} onChange={(e) => onEnd(e.target.value)} />
        </div>
      </div>
      <div>
        <label style={lbl}>Lieu</label>
        <PlaceField draft={draft} setDraft={setDraft} favorites={favorites} onAddFavorite={onAddFavorite} />
      </div>
      <div>
        <label style={lbl}>À prévoir</label>
        <textarea style={{ ...field, minHeight: 62, resize: "vertical", lineHeight: 1.4 }} value={draft.note || ""} onChange={(e) => set("note", e.target.value)} placeholder="Maillot, réservation, budget, point de rendez-vous..." />
      </div>
      {!parallel && (
        <div style={{ display: "flex", gap: 9, alignItems: "flex-start", background: T.c.seaSoft, borderRadius: T.r.md, padding: "11px 13px" }}>
          <Users size={17} color={T.c.sea} style={{ flex: "0 0 auto", marginTop: 1 }} />
          <span style={{ fontFamily: fB, color: T.c.inkFaint, fontSize: 12 }}>Tout le monde est invité. Chacun peut se désister depuis l'activité.</span>
        </div>
      )}
      <button onClick={onSave} style={{ marginTop: 2, cursor: "pointer", border: "none", background: T.c.sea, color: "#fff", borderRadius: T.r.lg, padding: "14px", fontFamily: fD, fontWeight: 700, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <Check size={19} /> {editing ? "Enregistrer les changements" : parallel ? "Créer et rejoindre" : "Ajouter au programme"}
      </button>

      {editing && onDelete && (confirmDel ? (
        <div style={{ marginTop: 8, background: T.c.coralSoft, borderRadius: T.r.md, padding: 12 }}>
          <div style={{ fontFamily: fB, fontSize: 14, color: T.c.ink, marginBottom: 10 }}>Supprimer cette activité ? Cette action est définitive.</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setConfirmDel(false)} style={{ flex: 1, cursor: "pointer", border: `1px solid ${T.c.line}`, background: T.c.card, color: T.c.inkSoft, borderRadius: T.r.md, padding: "11px", fontFamily: fD, fontWeight: 600, fontSize: 14 }}>Annuler</button>
            <button onClick={() => onDelete(draft.id)} style={{ flex: 1, cursor: "pointer", border: "none", background: T.c.coralDeep, color: "#fff", borderRadius: T.r.md, padding: "11px", fontFamily: fD, fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}><Trash2 size={16} /> Supprimer</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setConfirmDel(true)} style={{ marginTop: 2, cursor: "pointer", border: `1px solid ${T.c.coralDeep}55`, background: "transparent", color: T.c.coralDeep, borderRadius: T.r.md, padding: "12px", fontFamily: fD, fontWeight: 600, fontSize: 14.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Trash2 size={17} /> Supprimer l'activité
        </button>
      ))}
    </div>
  );
}

/* ======================================================================= */
/* Navigation basse                                                         */
/* ======================================================================= */
function BottomNav({ tab, setTab, unreadTalk, unreadNow }) {
  const items = [
    { key: "now", label: "Maintenant", Icon: Sailboat, badge: unreadNow > 0 },
    { key: "program", label: "Programme", Icon: CalendarDays, badge: false },
    { key: "talk", label: "Discussion", Icon: MessageCircle, badge: unreadTalk > 0 },
    { key: "wall", label: "Photos", Icon: Images, badge: false },
  ];
  return (
    <div style={{ flex: "0 0 auto", background: T.c.glassNav, backdropFilter: "blur(10px)", borderTop: `1px solid ${T.c.line}`, padding: "8px 6px calc(10px + env(safe-area-inset-bottom))", display: "flex", justifyContent: "space-around" }}>
      {items.map(({ key, label, Icon, badge }) => {
        const on = tab === key;
        return (
          <button key={key} onClick={() => setTab(key)} aria-label={label} aria-current={on} style={{ cursor: "pointer", border: "none", background: "transparent", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "4px 10px", color: on ? T.c.sea : T.c.inkFaint }}>
            <span style={{ position: "relative", display: "inline-flex" }}>
              <Icon size={22} />
              {badge && <span style={{ position: "absolute", top: -2, right: -5, width: 9, height: 9, borderRadius: T.r.pill, background: T.c.coral, boxShadow: `0 0 0 2px ${T.c.ring}` }} />}
            </span>
            <span style={{ fontFamily: fD, fontWeight: 600, fontSize: 11 }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ======================================================================= */
/* Aperçu du temps simulé (dispositif de démonstration)                     */
/* ======================================================================= */
function DemoTime({ now, setNow, open, setOpen, minAbs, maxAbs, realMode, onRealTime }) {
  const dIdx = clamp(dayOfNow(now), 0, DAYS.length - 1);
  const hh = pad(Math.floor(minsInDay(now) / 60)), mm = pad(minsInDay(now) % 60);
  const span = Math.max(1, maxAbs - minAbs);
  const pct = ((clamp(now, minAbs, maxAbs) - minAbs) / span) * 100;
  return (
    <>
      {open && (
        <div style={{ position: "absolute", right: 12, bottom: 150, width: 300, zIndex: 30, background: T.c.card, borderRadius: T.r.lg, boxShadow: T.sh.soft, padding: "14px 16px", border: `1px solid ${T.c.line}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
            <span style={{ fontFamily: fB, fontSize: 11, color: T.c.inkFaint }}>{realMode ? "Heure réelle" : "Aperçu"}</span>
            <span style={{ fontFamily: fD, fontWeight: 700, fontSize: 15, color: T.c.ink, fontVariantNumeric: "tabular-nums" }}>{DAYS[dIdx].short} {DAYS[dIdx].d}  ·  {hh}:{mm}</span>
          </div>
          <div style={{ position: "relative", height: 46 }}>
            <div style={{ position: "absolute", left: 0, right: 0, top: 18, height: 7, borderRadius: T.r.pill, background: T.c.lineSoft }} />
            <div style={{ position: "absolute", left: 0, width: `${pct}%`, top: 18, height: 7, borderRadius: T.r.pill, background: T.c.sea }} />
            {DAYS.map((d, i) => {
              const left = (i / DAYS.length) * 100;
              const noon = ((i + 0.5) / DAYS.length) * 100;
              return (
                <React.Fragment key={i}>
                  <div style={{ position: "absolute", left: `${left}%`, top: 11, width: 2, height: 21, background: T.c.line }} />
                  <div style={{ position: "absolute", left: `${left}%`, top: 34, transform: "translateX(-1px)", fontFamily: fB, fontSize: 9.5, color: T.c.inkFaint, whiteSpace: "nowrap" }}>{d.short}</div>
                  <div style={{ position: "absolute", left: `${noon}%`, top: 15, width: 1.5, height: 13, background: T.c.line, opacity: 0.5 }} />
                </React.Fragment>
              );
            })}
            <div style={{ position: "absolute", left: `calc(${pct}% - 9px)`, top: 12, width: 18, height: 18, borderRadius: T.r.pill, background: "#fff", border: `3px solid ${T.c.sea}`, boxShadow: T.sh.card, pointerEvents: "none" }} />
            <input type="range" min={minAbs} max={maxAbs} value={clamp(now, minAbs, maxAbs)} onChange={(e) => setNow(Number(e.target.value))} aria-label="Défiler dans le séjour" style={{ position: "absolute", left: -2, right: -2, top: 8, width: "calc(100% + 4px)", height: 28, margin: 0, opacity: 0, cursor: "pointer" }} />
          </div>
          <button onClick={onRealTime} style={{ marginTop: 8, width: "100%", cursor: "pointer", border: "none", background: realMode ? T.c.seaSoft : T.c.sea, color: realMode ? T.c.seaDeep : "#fff", borderRadius: T.r.md, padding: "10px", fontFamily: fD, fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
            <RefreshCw size={14} /> {realMode ? "Temps réel actif" : "Revenir au temps réel"}
          </button>
        </div>
      )}
      {(open || !realMode) && <button onClick={() => setOpen(!open)} aria-label="Aperçu du temps" style={{ position: "absolute", right: 12, bottom: 96, zIndex: 30, cursor: "pointer", border: `1px solid ${T.c.line}`, background: T.c.glass, backdropFilter: "blur(6px)", color: T.c.inkSoft, borderRadius: T.r.pill, padding: "7px 12px", boxShadow: T.sh.card, display: "inline-flex", alignItems: "center", gap: 7, fontFamily: fD, fontWeight: 600, fontSize: 12.5 }}>
        <Clock size={15} color={realMode ? T.c.sea : T.c.sun} /> {realMode ? "Heure" : "Aperçu"}
      </button>}
    </>
  );
}

/* ======================================================================= */
/* Application                                                              */
/* ======================================================================= */
/* Temps réel et persistance locale                                         */
/* ======================================================================= */
function realNow() {
  const d = new Date();
  const s = new Date(SETTINGS.startISO + "T00:00:00");
  const today = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const di = Math.round((today - s) / 86400000);
  return di * 1440 + d.getHours() * 60 + d.getMinutes();
}
const LS_KEY = "vacances_mykonos_v1";
function loadState() { try { return JSON.parse(localStorage.getItem(LS_KEY) || "null"); } catch (e) { return null; } }
function saveState(s) { try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch (e) { /* stockage indisponible */ } }
const SEEN_KEY = "vacances_seen_v1";
function loadSeen() { try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || "[]")); } catch (e) { return new Set(); } }
function saveSeen(set) { try { localStorage.setItem(SEEN_KEY, JSON.stringify([...set])); } catch (e) { /* rien */ } }

/* ---- Synchronisation partagée (Supabase), lue depuis config.js ---------- */
const CFG = (typeof window !== "undefined" && window.VAC_CONFIG) || {};
const SYNC_ON = !!(CFG.supabaseUrl && CFG.supabaseAnonKey);
const TRIP_CODE = CFG.tripCode || "mykonos-2026";
const supa = SYNC_ON ? createClient(CFG.supabaseUrl, CFG.supabaseAnonKey) : null;
const PHOTO_BUCKET = "photos";
async function uploadPhotoBlob(dataUrl) {
  if (!supa) throw new Error("sync indisponible");
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const rid = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const path = `${TRIP_CODE}/${rid}.jpg`;
  const up = await supa.storage.from(PHOTO_BUCKET).upload(path, blob, { contentType: "image/jpeg", upsert: false });
  if (up.error) throw up.error;
  const pub = supa.storage.from(PHOTO_BUCKET).getPublicUrl(path);
  return { path, url: pub.data.publicUrl };
}
function stableStringify(v) {
  if (Array.isArray(v)) return "[" + v.map(stableStringify).join(",") + "]";
  if (v && typeof v === "object") return "{" + Object.keys(v).sort().map((k) => JSON.stringify(k) + ":" + stableStringify(v[k])).join(",") + "}";
  return JSON.stringify(v);
}
const sigOf = (d) => stableStringify([d.events || [], d.messages || [], d.roster || [], d.settings || {}]);

/* ---- Notifications push ------------------------------------------------ */
const VAPID_PUB = CFG.vapidPublicKey || "";
const FUNCTIONS_URL = CFG.supabaseUrl ? CFG.supabaseUrl + "/functions/v1" : "";
const NOTIF_KEY = "vacances_notif_v1";
const DEFAULT_NOTIF = { enabled: false, messages: true, addActivity: true, editActivity: true, nextActivity: true };
const RAPPELS_KEY = "vacances_rappels_v1";
function loadNotif() { try { return JSON.parse(localStorage.getItem(NOTIF_KEY)) || null; } catch (e) { return null; } }
function saveNotif(p) { try { localStorage.setItem(NOTIF_KEY, JSON.stringify(p)); } catch (e) { /* rien */ } }
const PUSH_OK = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window && !!VAPID_PUB && SYNC_ON;
function urlB64ToUint8Array(base64) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}
async function currentSub() {
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}
async function upsertSub(sub, prefs) {
  if (!supa || !sub) return;
  const j = sub.toJSON();
  await supa.from("push_subs").upsert({ endpoint: j.endpoint, trip_code: TRIP_CODE, user_id: ME, sub: j, prefs, enabled: !!prefs.enabled, updated_at: Date.now() }, { onConflict: "endpoint" });
}
async function enablePush(prefs) {
  if (!PUSH_OK) throw new Error("indisponible");
  const perm = await Notification.requestPermission();
  if (perm !== "granted") throw new Error("refuse");
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8Array(VAPID_PUB) });
  await upsertSub(sub, prefs);
}
async function syncPrefs(prefs) {
  try { const sub = await currentSub(); if (sub) await upsertSub(sub, prefs); } catch (e) { /* rien */ }
}
function notify(payload) {
  if (!FUNCTIONS_URL || !SYNC_ON) return;
  try {
    fetch(FUNCTIONS_URL + "/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + CFG.supabaseAnonKey },
      body: JSON.stringify({ ...payload, tripCode: TRIP_CODE, exclude: ME }),
      keepalive: true,
    }).catch(() => {});
  } catch (e) { /* silencieux */ }
}

/* Hydratation des réglages, du roster et de la personne connectée */
const ME_KEY = "vacances_me_v1";
function loadMe() { try { return localStorage.getItem(ME_KEY) || null; } catch (e) { return null; } }
function saveMe(id) { try { localStorage.setItem(ME_KEY, id); } catch (e) { /* rien */ } }

(function hydrate() {
  const s = loadState();
  if (s) {
    if (Array.isArray(s.roster)) ROSTER = s.roster.map((p) => ({ ...META[p.id], ...p }));
    if (typeof s.me === "string") ME = s.me;
    if (s.settings) { SETTINGS = { ...SETTINGS, ...s.settings }; DAYS = buildDays(SETTINGS.startISO, SETTINGS.days); }
  }
  const chosen = loadMe();
  if (chosen) ME = chosen;
})();

/* ---- Écran de première connexion : qui êtes-vous ? --------------------- */
function IdentityGate({ onPick, onCreateSelf }) {
  const [sel, setSel] = useState(null);
  const [step, setStep] = useState(1);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [newColor, setNewColor] = useState(AVATAR_COLORS[0]);
  const [emoji, setEmoji] = useState(null);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pick, setPick] = useState(false);
  const roster = ROSTER.filter((p) => p.active);
  const chosen = sel ? person(sel) : null;
  const field = { fontFamily: fB, fontSize: 15, color: T.c.ink, width: "100%", boxSizing: "border-box", padding: "13px 14px", border: `1px solid ${T.c.line}`, borderRadius: T.r.md, background: T.c.card, outline: "none" };
  const lbl = { fontFamily: fB, color: T.c.inkSoft, fontSize: 13, marginBottom: 6, display: "block" };

  const goStep2 = () => { if (!sel) return; const p = person(sel); setCreating(false); setEmoji(p.emoji); setPhone(p.phone || ""); setEmail(p.email || ""); setPick(false); setStep(2); };
  const startCreate = () => { const i = roster.length; setSel(null); setCreating(true); setName(""); setNewColor(AVATAR_COLORS[i % AVATAR_COLORS.length]); setEmoji(AVATAR_EMOJIS[i % AVATAR_EMOJIS.length]); setPhone(""); setEmail(""); setPick(false); setStep(2); };
  const confirm = () => {
    if (creating) { if (name.trim()) onCreateSelf({ name: name.trim(), emoji, color: newColor, phone: phone.trim(), email: email.trim() }); }
    else onPick(sel, { emoji: emoji || (chosen && chosen.emoji), phone: phone.trim(), email: email.trim() });
  };
  const avatarColor = creating ? newColor : (chosen && chosen.color);
  const canConfirm = creating ? !!name.trim() : !!sel;

  const shell = (children) => (
    <div style={{ height: "100dvh", width: "100%", background: dayBg(realNow(), IS_DARK), display: "flex", justifyContent: "center", fontFamily: fB, color: T.c.ink }}>
      <div style={{ width: "100%", maxWidth: 430, padding: "calc(30px + env(safe-area-inset-top)) 24px calc(24px + env(safe-area-inset-bottom))", display: "flex", flexDirection: "column", overflowY: "auto" }}>
        {children}
      </div>
    </div>
  );

  if (step === 2 && (chosen || creating)) {
    return shell(
      <>
        <div style={{ textAlign: "center", marginTop: 6 }}>
          <h1 style={{ fontFamily: fD, fontWeight: 700, fontSize: 27, color: T.c.ink, margin: "6px 0 4px" }}>{creating ? "Votre profil" : "Votre profil"}</h1>
          <div style={{ fontFamily: fB, color: T.c.inkSoft, fontSize: 14.5 }}>{creating ? "Renseignez votre prénom, choisissez un avatar." : "Personnalisez, puis validez. Tout est modifiable plus tard."}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 22 }}>
          <div style={{ width: 84, height: 84, borderRadius: T.r.pill, background: avatarColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 42, boxShadow: T.sh.card }}>{emoji}</div>
          {!creating && <div style={{ fontFamily: fD, fontWeight: 700, fontSize: 20, color: T.c.ink, marginTop: 10 }}>{chosen.name}</div>}
          <button onClick={() => setPick(!pick)} style={{ marginTop: 8, cursor: "pointer", border: `1px solid ${T.c.line}`, background: T.c.card, color: T.c.seaDeep, borderRadius: T.r.pill, padding: "8px 14px", fontFamily: fD, fontWeight: 600, fontSize: 13.5 }}>Changer l'avatar</button>
        </div>
        {pick && (
          <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "center", background: T.c.lineSoft, borderRadius: T.r.md, padding: 12 }}>
            {AVATAR_EMOJIS.map((em) => (
              <button key={em} onClick={() => { setEmoji(em); setPick(false); }} style={{ cursor: "pointer", border: emoji === em ? `2px solid ${T.c.sea}` : `1px solid ${T.c.line}`, background: T.c.card, width: 42, height: 42, borderRadius: T.r.pill, fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>{em}</button>
            ))}
          </div>
        )}
        {creating && (
          <div style={{ marginTop: 22 }}>
            <label style={lbl}>Prénom</label>
            <input style={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Votre prénom" />
          </div>
        )}
        <div style={{ marginTop: creating ? 14 : 24 }}>
          <label style={lbl}>Téléphone (facultatif)</label>
          <input type="tel" style={field} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Par exemple +33 6 12 34 56 78" />
        </div>
        <div style={{ marginTop: 14 }}>
          <label style={lbl}>E-mail (facultatif)</label>
          <input type="email" style={field} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.fr" />
        </div>
        <div style={{ fontFamily: fB, color: T.c.inkFaint, fontSize: 12, marginTop: 8 }}>Ces coordonnées permettent au groupe de vous appeler ou vous écrire depuis Le groupe.</div>
        <div style={{ flex: 1, minHeight: 16 }} />
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <button onClick={() => { setCreating(false); setStep(1); }} style={{ flex: "0 0 auto", cursor: "pointer", border: `1px solid ${T.c.line}`, background: T.c.card, color: T.c.inkSoft, borderRadius: T.r.lg, padding: "16px 18px", fontFamily: fD, fontWeight: 600, fontSize: 15.5 }}>Retour</button>
          <button onClick={confirm} disabled={!canConfirm} style={{ flex: 1, cursor: canConfirm ? "pointer" : "default", border: "none", background: canConfirm ? T.c.sea : T.c.line, color: "#fff", borderRadius: T.r.lg, padding: "16px", fontFamily: fD, fontWeight: 700, fontSize: 16.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}>
            <Check size={20} /> {creating ? "Rejoindre" : "C'est moi"}
          </button>
        </div>
      </>
    );
  }

  return shell(
    <>
      <div style={{ textAlign: "center", marginTop: 18 }}>
        <div style={{ fontSize: 44 }}>⛵</div>
        <div style={{ fontFamily: fD, fontWeight: 700, fontSize: 22, color: T.c.ink, marginTop: 8 }}>{SETTINGS.name}</div>
        <h1 style={{ fontFamily: fD, fontWeight: 700, fontSize: 30, color: T.c.ink, margin: "22px 0 6px" }}>Qui êtes-vous ?</h1>
        <div style={{ fontFamily: fB, color: T.c.inkSoft, fontSize: 14.5 }}>Choisissez votre profil pour rejoindre le séjour. Chacun a le sien.</div>
      </div>
      <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {roster.map((p) => {
          const on = sel === p.id;
          return (
            <button key={p.id} onClick={() => setSel(p.id)} style={{ cursor: "pointer", border: on ? `2.5px solid ${T.c.sea}` : `1px solid ${T.c.line}`, background: on ? T.c.seaSoft : T.c.card, borderRadius: T.r.lg, padding: "16px 10px", display: "flex", flexDirection: "column", alignItems: "center", gap: 9, boxShadow: T.sh.card }}>
              <Avatar id={p.id} size={48} />
              <span style={{ fontFamily: fD, fontWeight: 700, fontSize: 16, color: T.c.ink }}>{p.name}</span>
            </button>
          );
        })}
      </div>
      <button onClick={startCreate} style={{ marginTop: 12, cursor: "pointer", border: `1px dashed ${T.c.line}`, background: "transparent", color: T.c.seaDeep, borderRadius: T.r.lg, padding: "14px", fontFamily: fD, fontWeight: 600, fontSize: 14.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <UserPlus size={18} /> Je ne suis pas dans la liste
      </button>
      <div style={{ flex: 1, minHeight: 16 }} />
      <button onClick={goStep2} disabled={!sel} style={{ cursor: sel ? "pointer" : "default", border: "none", background: sel ? T.c.sea : T.c.line, color: "#fff", borderRadius: T.r.lg, padding: "16px", fontFamily: fD, fontWeight: 700, fontSize: 16.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 9, marginTop: 16 }}>
        Continuer
      </button>
      <div style={{ fontFamily: fB, color: T.c.inkFaint, fontSize: 12, textAlign: "center", marginTop: 10 }}>Vous pourrez tout changer plus tard dans les réglages.</div>
    </>
  );
}

/* ======================================================================= */
/* Feuille : réglages du séjour                                             */
/* ======================================================================= */
function FavoriteRow({ fav, onRename, onRemove }) {
  const [label, setLabel] = useState(fav.label);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, background: T.c.lineSoft, borderRadius: T.r.md, padding: "8px 10px" }}>
      <Star size={16} color={T.c.sun} style={{ flex: "0 0 auto" }} />
      <input value={label} onChange={(e) => setLabel(e.target.value)} onBlur={() => { const v = label.trim(); if (v && v !== fav.label) onRename(fav.id, v); else setLabel(fav.label); }} style={{ flex: 1, minWidth: 0, fontFamily: fB, fontSize: 14.5, color: T.c.ink, background: T.c.card, border: `1px solid ${T.c.line}`, borderRadius: T.r.md, padding: "8px 10px", outline: "none" }} />
      <button onClick={() => onRemove(fav.id)} aria-label="Retirer le favori" style={{ cursor: "pointer", border: `1px solid ${T.c.line}`, background: T.c.card, color: T.c.coralDeep, width: 36, height: 36, borderRadius: T.r.pill, display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}><Trash2 size={15} /></button>
    </div>
  );
}
function FavoritesSection({ favorites, onRename, onRemove }) {
  const lbl = { fontFamily: fB, color: T.c.inkSoft, fontSize: 13, marginBottom: 6, display: "block" };
  return (
    <div>
      <label style={lbl}>Lieux favoris</label>
      {favorites.length === 0 ? (
        <div style={{ fontFamily: fB, color: T.c.inkFaint, fontSize: 13 }}>Enregistrez un lieu depuis le formulaire d'une activité (bouton étoile) pour le retrouver ici : villa, clubs, plages.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {favorites.map((f) => <FavoriteRow key={f.id} fav={f} onRename={onRename} onRemove={onRemove} />)}
        </div>
      )}
    </div>
  );
}

const CAT_SMALL_FIELD = () => ({ fontFamily: fB, fontSize: 14.5, color: T.c.ink, background: T.c.card, border: `1px solid ${T.c.line}`, borderRadius: T.r.md, padding: "9px 11px", outline: "none" });
function EmojiGrid({ current, onPick }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, background: T.c.card, borderRadius: T.r.md, padding: 10 }}>
      {AVATAR_EMOJIS.map((em) => (
        <button key={em} onClick={() => onPick(em)} style={{ cursor: "pointer", border: current === em ? `2px solid ${T.c.sea}` : `1px solid ${T.c.line}`, background: T.c.card, width: 36, height: 36, borderRadius: T.r.pill, fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center" }}>{em}</button>
      ))}
    </div>
  );
}
function ColorRow({ current, onPick }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {CATEGORY_COLORS.map((c) => (
        <button key={c} onClick={() => onPick(c)} aria-label="Couleur" style={{ cursor: "pointer", width: 26, height: 26, borderRadius: T.r.pill, background: c, border: current === c ? `2px solid ${T.c.ink}` : `2px solid transparent`, boxShadow: current === c ? `0 0 0 2px ${T.c.card}` : "none" }} />
      ))}
    </div>
  );
}
function CategoryRow({ cat, onUpdate, onRemove }) {
  const [label, setLabel] = useState(cat.label);
  const [pick, setPick] = useState(false);
  return (
    <div style={{ background: T.c.lineSoft, borderRadius: T.r.md, padding: 10, display: "flex", flexDirection: "column", gap: 9 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <button onClick={() => setPick(!pick)} aria-label="Changer l'emoji" style={{ width: 34, height: 34, borderRadius: T.r.pill, background: cat.color, border: "none", fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flex: "0 0 auto" }}>{cat.emoji}</button>
        <input value={label} onChange={(e) => setLabel(e.target.value)} onBlur={() => { const v = label.trim(); if (v && v !== cat.label) onUpdate(cat.id, { label: v }); else setLabel(cat.label); }} style={{ flex: 1, minWidth: 0, ...CAT_SMALL_FIELD() }} />
        <button onClick={() => onRemove(cat.id)} aria-label="Retirer la catégorie" style={{ cursor: "pointer", border: `1px solid ${T.c.line}`, background: T.c.card, color: T.c.coralDeep, width: 36, height: 36, borderRadius: T.r.pill, display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}><Trash2 size={15} /></button>
      </div>
      {pick && <EmojiGrid current={cat.emoji} onPick={(em) => { onUpdate(cat.id, { emoji: em }); setPick(false); }} />}
      <ColorRow current={cat.color} onPick={(c) => onUpdate(cat.id, { color: c })} />
    </div>
  );
}
function CategoriesSection({ categories, onAdd, onUpdate, onRemove }) {
  const [label, setLabel] = useState("");
  const [emoji, setEmoji] = useState("📍");
  const [color, setColor] = useState(CATEGORY_COLORS[0]);
  const [pick, setPick] = useState(false);
  const lbl = { fontFamily: fB, color: T.c.inkSoft, fontSize: 13, marginBottom: 6, display: "block" };
  const add = () => { const v = label.trim(); if (!v) return; onAdd({ label: v, emoji, color }); setLabel(""); setEmoji("📍"); setColor(CATEGORY_COLORS[0]); setPick(false); };
  return (
    <div>
      <label style={lbl}>Catégories</label>
      <div style={{ fontFamily: fB, color: T.c.inkFaint, fontSize: 12, marginBottom: 10 }}>Les cinq catégories de base restent disponibles. Ajoutez les vôtres avec leur emoji et leur couleur.</div>
      {categories.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
          {categories.map((c) => <CategoryRow key={c.id} cat={c} onUpdate={onUpdate} onRemove={onRemove} />)}
        </div>
      )}
      <div style={{ background: T.c.lineSoft, borderRadius: T.r.md, padding: 10, display: "flex", flexDirection: "column", gap: 9 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <button onClick={() => setPick(!pick)} aria-label="Choisir l'emoji" style={{ width: 34, height: 34, borderRadius: T.r.pill, background: color, border: "none", fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flex: "0 0 auto" }}>{emoji}</button>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Nom de la catégorie" style={{ flex: 1, minWidth: 0, ...CAT_SMALL_FIELD() }} />
          <button onClick={add} disabled={!label.trim()} style={{ cursor: label.trim() ? "pointer" : "default", border: "none", background: label.trim() ? T.c.sea : T.c.line, color: "#fff", borderRadius: T.r.md, padding: "9px 14px", fontFamily: fD, fontWeight: 700, fontSize: 13.5, flex: "0 0 auto" }}>Ajouter</button>
        </div>
        {pick && <EmojiGrid current={emoji} onPick={(em) => { setEmoji(em); setPick(false); }} />}
        <ColorRow current={color} onPick={setColor} />
      </div>
    </div>
  );
}

/* ---- Interactions du séjour (activables dans les réglages) ------------- */
const FEATURE_DEFS = [
  { id: "status", zone: "accueil", label: "Statut en direct", desc: "Chacun peut indiquer où il est (plage, resto, sieste), visible sur l'accueil." },
  { id: "morningQuestion", zone: "rituel", label: "Question du matin", desc: "Un mini duel d'options chaque jour (plage ou piscine)." },
  { id: "photoChallenge", zone: "rituel", label: "Défi photo du jour", desc: "Un thème de photo chaque jour, chacun poste sa participation." },
  { id: "wholikely", zone: "rituel", label: "Qui a le plus de chances", desc: "Chaque jour, on vote pour un membre du groupe." },
  { id: "bingo", zone: "jeux", label: "Bingo de vacances", desc: "Une grille partagée de moments à cocher pendant le séjour." },
  { id: "quickvibe", zone: "accueil", label: "Réaction rapide", desc: "Un bouton pour dire au groupe que le moment est bon." },
  { id: "recap", zone: "rituel", label: "Récap du soir", desc: "Le bilan de la journée : activités, photos, messages, lieux explorés." },
  { id: "awards", zone: "rituel", label: "Hauts faits du jour", desc: "Photographe du jour, bavard du jour, premier message (dans le récap)." },
  { id: "capsule", zone: "accueil", label: "Capsule temporelle", desc: "Chacun dépose un mot secret, révélé le dernier soir." },
  { id: "film", zone: "photos", label: "Diaporama photos", desc: "Un diaporama qui enchaîne les photos depuis la galerie, avec réactions et identification." },
  { id: "guess", zone: "jeux", label: "Devine le lieu", desc: "Une photo mystère dans la discussion, le groupe devine où c'est." },
  { id: "quiz", zone: "jeux", label: "Quiz du séjour", desc: "Le dernier soir, un quiz généré depuis vos journées, avec les scores du groupe." },
];
const featureOn = (k) => !SETTINGS.features || SETTINGS.features[k] !== false;
function TripTypeSection({ onPick, onMood, rev }) {
  void rev;
  const cur = SETTINGS.tripType || "mer";
  const lbl = { fontFamily: fB, color: T.c.inkSoft, fontSize: 13, marginBottom: 6, display: "block" };
  return (
    <div>
      <label style={lbl}>Type de voyage</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {TRIP_TYPES.map((t) => {
          const on = cur === t.id;
          return (
            <button key={t.id} onClick={() => onPick(t.id)} style={{ cursor: "pointer", border: on ? `2px solid ${T.c.sea}` : `1px solid ${T.c.line}`, background: on ? T.c.seaSoft : T.c.card, color: T.c.ink, borderRadius: T.r.pill, padding: "8px 13px", fontFamily: fD, fontWeight: 600, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 15 }}>{t.emoji}</span> {t.label}
            </button>
          );
        })}
      </div>
      <div style={{ fontFamily: fB, color: T.c.inkFaint, fontSize: 11.5, marginTop: 6 }}>Le type choisi adapte les questions, les défis photo et le bingo au séjour. Partagé avec le groupe.</div>
      <label style={{ ...lbl, marginTop: 14 }}>Ambiance du groupe</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {MOODS.map((m) => {
          const on = moodId() === m.id;
          return (
            <button key={m.id} onClick={() => onMood(m.id)} style={{ cursor: "pointer", border: on ? `2px solid ${T.c.sea}` : `1px solid ${T.c.line}`, background: on ? T.c.seaSoft : T.c.card, color: T.c.ink, borderRadius: T.r.pill, padding: "8px 13px", fontFamily: fD, fontWeight: 600, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 15 }}>{m.emoji}</span> {m.label}
            </button>
          );
        })}
      </div>
      <div style={{ fontFamily: fB, color: T.c.inkFaint, fontSize: 11.5, marginTop: 6 }}>En famille retire l'alcool et la fête. Après minuit ajoute des questions et des cases plus piquantes. Le quiz de fin reste factuel.</div>
    </div>
  );
}
function FeaturesZone({ zone, onToggle }) {
  const list = FEATURE_DEFS.filter((f) => f.zone === zone);
  if (!list.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {list.map((f) => (
        <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: fD, fontWeight: 600, color: T.c.ink, fontSize: 14.5 }}>{f.label}</div>
            <div style={{ fontFamily: fB, color: T.c.inkFaint, fontSize: 12 }}>{f.desc}</div>
          </div>
          <Toggle on={featureOn(f.id)} onClick={() => onToggle(f.id)} />
        </div>
      ))}
    </div>
  );
}
function Toggle({ on, onClick }) {
  return (
    <button onClick={onClick} aria-pressed={on} style={{ cursor: "pointer", border: "none", width: 46, height: 28, borderRadius: T.r.pill, background: on ? T.c.sea : T.c.line, position: "relative", flex: "0 0 auto" }}>
      <span style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 22, height: 22, borderRadius: T.r.pill, background: "#fff", transition: "left .15s ease", boxShadow: T.sh.card }} />
    </button>
  );
}
function NotifSettings() {
  const [prefs, setPrefs] = useState(() => loadNotif() || DEFAULT_NOTIF);
  const [status, setStatus] = useState("");
  const lbl = { fontFamily: fB, color: T.c.inkSoft, fontSize: 13, marginBottom: 6, display: "block" };
  const row = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "9px 0" };
  const rowLabel = { fontFamily: fB, fontSize: 14.5, color: T.c.ink };

  const toggleMaster = async () => {
    const next = { ...prefs, enabled: !prefs.enabled };
    if (next.enabled) {
      setStatus("...");
      try { await enablePush(next); setPrefs(next); saveNotif(next); setStatus("on"); }
      catch (e) { const off = { ...next, enabled: false }; setPrefs(off); saveNotif(off); setStatus(e && e.message === "refuse" ? "refused" : "error"); }
    } else {
      setPrefs(next); saveNotif(next); setStatus(""); syncPrefs(next);
    }
  };
  const toggleKind = (k) => { const next = { ...prefs, [k]: !prefs[k] }; setPrefs(next); saveNotif(next); syncPrefs(next); };

  return (
    <div>
      <label style={lbl}>Notifications</label>
      {!PUSH_OK ? (
        <div style={{ fontFamily: fB, color: T.c.inkFaint, fontSize: 13 }}>Indisponible ici. Sur iPhone, ajoutez l'app à l'écran d'accueil (iOS 16.4 ou plus) puis rouvrez-la depuis l'icône.</div>
      ) : (
        <div style={{ background: T.c.lineSoft, borderRadius: T.r.md, padding: "6px 12px" }}>
          <div style={row}>
            <span style={rowLabel}>Recevoir des notifications</span>
            <Toggle on={prefs.enabled} onClick={toggleMaster} />
          </div>
          {prefs.enabled && (
            <>
              <div style={{ ...row, borderTop: `1px solid ${T.c.line}` }}><span style={rowLabel}>Nouveaux messages</span><Toggle on={prefs.messages} onClick={() => toggleKind("messages")} /></div>
              <div style={{ ...row, borderTop: `1px solid ${T.c.line}` }}><span style={rowLabel}>Ajout d'activité</span><Toggle on={prefs.addActivity} onClick={() => toggleKind("addActivity")} /></div>
              <div style={{ ...row, borderTop: `1px solid ${T.c.line}` }}><span style={rowLabel}>Modification d'activité</span><Toggle on={prefs.editActivity} onClick={() => toggleKind("editActivity")} /></div>
              <div style={{ ...row, borderTop: `1px solid ${T.c.line}` }}><span style={rowLabel}>Rappel avant une activité<span style={{ display: "block", fontFamily: fB, color: T.c.inkFaint, fontSize: 11.5 }}>Une heure avant le début, sur cet appareil.</span></span><Toggle on={prefs.nextActivity !== false} onClick={() => toggleKind("nextActivity")} /></div>
            </>
          )}
        </div>
      )}
      {status === "refused" && <div style={{ fontFamily: fB, color: T.c.coralDeep, fontSize: 12.5, marginTop: 6 }}>Autorisation refusée. Activez les notifications de cette app dans les réglages du téléphone.</div>}
      {status === "error" && <div style={{ fontFamily: fB, color: T.c.coralDeep, fontSize: 12.5, marginTop: 6 }}>Activation impossible pour le moment.</div>}
      {status === "on" && <div style={{ fontFamily: fB, color: T.c.seaDeep, fontSize: 12.5, marginTop: 6 }}>Notifications activées sur cet appareil.</div>}
      <div style={{ fontFamily: fB, color: T.c.inkFaint, fontSize: 12, marginTop: 6 }}>Réglage propre à cet appareil, conservé.</div>
    </div>
  );
}

const FUSEAUX_COURANTS = ["Europe/Paris", "Europe/London", "Europe/Lisbon", "Europe/Madrid", "Europe/Rome", "Europe/Athens", "Europe/Istanbul", "Atlantic/Canary", "Africa/Casablanca", "America/New_York", "America/Los_Angeles", "America/Sao_Paulo", "Asia/Dubai", "Asia/Bangkok", "Asia/Tokyo", "Australia/Sydney"];
const heureFuseau = (tz) => { try { return new Intl.DateTimeFormat("fr-FR", { timeZone: tz, hour: "2-digit", minute: "2-digit" }).format(new Date()); } catch (e) { return ""; } };
function LigneRubrique({ emoji, titre, desc, onClick }) {
  return (
    <button onClick={onClick} style={{ width: "100%", textAlign: "left", cursor: "pointer", border: `1px solid ${T.c.line}`, background: T.c.card, borderRadius: T.r.md, padding: "13px 14px", display: "flex", alignItems: "center", gap: 13 }}>
      <span style={{ flex: "0 0 auto", width: 40, height: 40, borderRadius: T.r.pill, background: T.c.seaSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{emoji}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontFamily: fD, fontWeight: 700, color: T.c.ink, fontSize: 15 }}>{titre}</span>
        <span style={{ display: "block", fontFamily: fB, color: T.c.inkFaint, fontSize: 12, marginTop: 1 }}>{desc}</span>
      </span>
      <span style={{ flex: "0 0 auto", color: T.c.inkFaint, fontSize: 22, lineHeight: 1 }}>&rsaquo;</span>
    </button>
  );
}
function SettingsSheet({ onTrip, themeMode, onTheme, favorites, onRemoveFavorite, onRenameFavorite, categories, onAddCategory, onUpdateCategory, onRemoveCategory, onToggleFeature, onTripType, onMood, onOpenTime, featuresRev }) {
  const [vue, setVue] = useState(null);
  const [name, setName] = useState(SETTINGS.name);
  const [place, setPlace] = useState(SETTINGS.place);
  const [startISO, setStartISO] = useState(SETTINGS.startISO);
  const [endISO, setEndISO] = useState(isoPlusDays(SETTINGS.startISO, Math.max(1, SETTINGS.days) - 1));

  const field = { fontFamily: fB, fontSize: 15, color: T.c.ink, width: "100%", boxSizing: "border-box", padding: "12px 13px", border: `1px solid ${T.c.line}`, borderRadius: T.r.md, background: T.c.card, outline: "none" };
  const lbl = { fontFamily: fB, color: T.c.inkSoft, fontSize: 13, marginBottom: 6, display: "block" };
  const sousTitre = (t) => (<div style={{ fontFamily: fD, fontWeight: 700, fontSize: 12.5, letterSpacing: 0.4, color: T.c.seaDeep, textTransform: "uppercase", margin: "8px 0 2px" }}>{t}</div>);
  const majDates = (sISO, eISO) => onTrip({ startISO: sISO, days: clamp(daysBetweenISO(sISO, eISO), 1, 30) });
  const tzDevice = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { return "Europe/Paris"; } })();
  const tzActuel = SETTINGS.tz || tzDevice;
  const fuseaux = Array.from(new Set([...FUSEAUX_COURANTS, tzDevice, tzActuel]));

  if (vue === null) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <LigneRubrique emoji="🧳" titre="Le séjour" desc="Nom, lieu, dates, type de voyage, humeur" onClick={() => setVue("sejour")} />
        <LigneRubrique emoji="🎨" titre="Apparence" desc="Thème clair, sombre ou automatique" onClick={() => setVue("apparence")} />
        <LigneRubrique emoji="🔔" titre="Notifications" desc="Alertes reçues sur cet appareil" onClick={() => setVue("notifs")} />
        <LigneRubrique emoji="🎲" titre="Contenu et interactions" desc="Rangé par endroit : programme, accueil, photos, jeux" onClick={() => setVue("contenu")} />
        <LigneRubrique emoji="🕰️" titre="Outils" desc="Aperçu du temps" onClick={() => setVue("outils")} />
      </div>
    );
  }

  const retour = (
    <button onClick={() => setVue(null)} style={{ cursor: "pointer", border: "none", background: "transparent", color: T.c.seaDeep, fontFamily: fD, fontWeight: 700, fontSize: 14.5, display: "flex", alignItems: "center", gap: 5, padding: "0 0 2px" }}>
      <span style={{ fontSize: 20, lineHeight: 1 }}>&lsaquo;</span> Réglages
    </button>
  );

  if (vue === "sejour") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {retour}
        <div><label style={lbl}>Nom du séjour</label><input style={field} value={name} onChange={(e) => setName(e.target.value)} onBlur={() => onTrip({ name: name.trim() || "Nos vacances" })} placeholder="Nos vacances" /></div>
        <div><label style={lbl}>Lieu (affiché en accueil)</label><input style={field} value={place} onChange={(e) => setPlace(e.target.value)} onBlur={() => onTrip({ place })} placeholder="Cap Ferret" /></div>
        <div><label style={lbl}>Début du séjour</label><input type="date" style={field} value={startISO} onChange={(e) => { const v = e.target.value; const ne = endISO < v ? v : endISO; setStartISO(v); setEndISO(ne); majDates(v, ne); }} /></div>
        <div><label style={lbl}>Fin du séjour</label><input type="date" style={field} min={startISO} value={endISO} onChange={(e) => { const v = e.target.value; setEndISO(v); majDates(startISO, v); }} /></div>
        <div>
          <label style={lbl}>Fuseau horaire du séjour</label>
          <select style={field} value={tzActuel} onChange={(e) => onTrip({ tz: e.target.value })}>
            {fuseaux.map((tz) => (<option key={tz} value={tz}>{tz.replace(/_/g, " ")} ({heureFuseau(tz)})</option>))}
          </select>
          <div style={{ fontFamily: fB, color: T.c.inkFaint, fontSize: 12, marginTop: 6 }}>Sert aux rappels : l'heure des activités est celle de ce fuseau.</div>
        </div>
        <TripTypeSection onPick={onTripType} onMood={onMood} rev={featuresRev} />
        <div style={{ fontFamily: fB, color: T.c.inkFaint, fontSize: 11.5 }}>Les changements sont enregistrés au fur et à mesure.</div>
      </div>
    );
  }

  if (vue === "apparence") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {retour}
        <div>
          <label style={lbl}>Thème</label>
          <div style={{ display: "flex", gap: 8 }}>
            {[["auto", "Automatique"], ["light", "Clair"], ["dark", "Sombre"]].map(([k, label]) => {
              const on = themeMode === k;
              return (<button key={k} onClick={() => onTheme(k)} style={{ flex: 1, cursor: "pointer", border: on ? `2px solid ${T.c.sea}` : `1px solid ${T.c.line}`, background: on ? T.c.seaSoft : T.c.card, color: on ? T.c.seaDeep : T.c.inkSoft, borderRadius: T.r.md, padding: "10px 6px", fontFamily: fD, fontWeight: 600, fontSize: 13 }}>{label}</button>);
            })}
          </div>
          <div style={{ fontFamily: fB, color: T.c.inkFaint, fontSize: 12, marginTop: 6 }}>Automatique suit le réglage clair ou sombre de l'appareil.</div>
        </div>
      </div>
    );
  }

  if (vue === "notifs") {
    return (<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{retour}<NotifSettings /></div>);
  }

  if (vue === "contenu") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {retour}
        {sousTitre("Dans le programme")}
        <CategoriesSection categories={categories || []} onAdd={onAddCategory} onUpdate={onUpdateCategory} onRemove={onRemoveCategory} />
        <FavoritesSection favorites={favorites || []} onRename={onRenameFavorite} onRemove={onRemoveFavorite} />
        {sousTitre("Directement sur l'accueil")}
        <FeaturesZone zone="accueil" onToggle={onToggleFeature} />
        {sousTitre("Dans le Rendez-vous du jour")}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: fD, fontWeight: 700, color: T.c.ink, fontSize: 14.5 }}>Afficher le Rendez-vous du jour</div>
            <div style={{ fontFamily: fB, color: T.c.inkFaint, fontSize: 12 }}>Éteint d'un coup toute la boîte sur l'accueil.</div>
          </div>
          <Toggle on={featureOn("rituel")} onClick={() => onToggleFeature("rituel")} />
        </div>
        {featureOn("rituel") && <FeaturesZone zone="rituel" onToggle={onToggleFeature} />}
        {sousTitre("Dans les photos")}
        <FeaturesZone zone="photos" onToggle={onToggleFeature} />
        {sousTitre("Dans le coin jeux")}
        <FeaturesZone zone="jeux" onToggle={onToggleFeature} />
        <div style={{ fontFamily: fB, color: T.c.inkFaint, fontSize: 11.5 }}>Ces interactions sont partagées avec tout le groupe.</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {retour}
      <button onClick={onOpenTime} style={{ cursor: "pointer", width: "100%", border: `1px solid ${T.c.line}`, background: T.c.card, color: T.c.ink, borderRadius: T.r.md, padding: "11px 13px", fontFamily: fD, fontWeight: 600, fontSize: 13.5, display: "flex", alignItems: "center", gap: 9 }}>
        <Clock size={16} color={T.c.sea} /> Aperçu du temps (simulation)
      </button>
      <div style={{ fontFamily: fB, color: T.c.inkFaint, fontSize: 11.5 }}>Pour parcourir le séjour à une autre date et heure. La pilule Aperçu reste visible tant que la simulation est active.</div>
    </div>
  );
}

/* ======================================================================= */
/* Application                                                              */
/* ======================================================================= */
export default function App() {
  const saved = loadState();
  const [rev, setRev] = useState(0);
  const [tab, setTab] = useState("now");
  const [realMode, setRealMode] = useState(true);
  const [now, setNow] = useState(() => realNow());
  const [playing, setPlaying] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(() => clamp(dayOfNow(realNow()), 0, DAYS.length - 1));
  const normEvents = (l) => (l || []).map((e) => (e && e.place ? e : { ...e, place: { name: "À définir", coord: V } }));
  const [events, setEvents] = useState(() => normEvents(saved?.events ? saved.events : SEED));
  const [messages, setMessages] = useState(() => (saved?.messages ? saved.messages : SEED_MSG));
  const [photos, setPhotos] = useState(() => (saved?.photos ? saved.photos : SEED_PHOTO));
  const [sheet, setSheet] = useState(null);
  const [draft, setDraft] = useState(null);
  const [photoView, setPhotoView] = useState(null);
  const [needIdentity, setNeedIdentity] = useState(() => { try { return !loadMe(); } catch (e) { return false; } });
  const confirmIdentity = (id, patch) => {
    ME = id;
    if (patch) ROSTER = ROSTER.map((p) => (p.id === id ? { ...p, ...patch } : p));
    saveMe(id);
    setNeedIdentity(false);
    setRev((r) => r + 1);
  };
  const createIdentity = ({ name, emoji, color, phone, email }) => {
    const id = "m" + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
    ROSTER = [...ROSTER, { id, name, role: "participant", active: true, emoji, color, phone, email }];
    ME = id;
    saveMe(id);
    setNeedIdentity(false);
    setRev((r) => r + 1);
  };
  const [themeMode, setThemeMode] = useState(() => loadThemeMode());
  const canEdit = ["organisateur", "co-éditeur"].includes((person(ME) || {}).role);
  const tick = useRef(null);
  const seq = useRef(0);
  const uid = (p) => `${p}${Date.now().toString(36)}${seq.current++}`;

  const maxAbs = DAYS.length * 1440;

  const changeTheme = (mode) => { saveThemeMode(mode); applyTheme(mode); setThemeMode(mode); setRev((r) => r + 1); };
  useEffect(() => {
    if (themeMode !== "auto") return;
    let mq; try { mq = window.matchMedia("(prefers-color-scheme: dark)"); } catch (e) { return; }
    const on = () => { applyTheme("auto"); setRev((r) => r + 1); };
    if (mq.addEventListener) mq.addEventListener("change", on); else if (mq.addListener) mq.addListener(on);
    return () => { if (mq.removeEventListener) mq.removeEventListener("change", on); else if (mq.removeListener) mq.removeListener(on); };
  }, [themeMode]);

  const toggleTag = (photoId, personId) => setPhotos((l) => l.map((ph) => ph.id === photoId
    ? { ...ph, tags: (ph.tags || []).includes(personId) ? (ph.tags || []).filter((x) => x !== personId) : [...(ph.tags || []), personId] }
    : ph));

  // Sauvegarde locale
  useEffect(() => {
    saveState({ events, messages, photos, roster: ROSTER, me: ME, settings: SETTINGS, at: Date.now() });
  }, [events, messages, photos, rev]);

  // Fuseau du séjour, utilisé par le rappel serveur pour calculer l'heure des activités
  useEffect(() => {
    try { if (!SETTINGS.tz) { const tz = Intl.DateTimeFormat().resolvedOptions().timeZone; if (tz) applyTrip({ tz }); } } catch (e) { /* rien */ }
  }, []);

  // Rappel local, une heure avant chaque activité (par appareil, sans serveur)
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("Notification" in window)) return undefined;
    const check = async () => {
      const prefs = loadNotif();
      if (!prefs || !prefs.enabled || prefs.nextActivity === false) return;
      if (Notification.permission !== "granted") return;
      const nowMin = realNow();
      let done = {};
      try { done = JSON.parse(localStorage.getItem(RAPPELS_KEY) || "{}"); } catch (e) { done = {}; }
      let reg = null;
      for (const ev of mainList(events)) {
        if (typeof ev.day !== "number" || !ev.start) continue;
        const em = toAbs(ev.day, ev.start);
        if (nowMin >= em - 60 && nowMin < em && !done[ev.id]) {
          if (!reg) { try { reg = await navigator.serviceWorker.ready; } catch (er) { return; } }
          const lieu = ev.place && ev.place.name && ev.place.name !== "À définir" ? ev.place.name : "";
          try {
            reg.showNotification("Bientôt : " + titreDe(ev), { body: "À " + ev.start.replace(":", "h") + (lieu ? " · " + lieu : "") + ", dans moins d'une heure.", tag: "rappel-" + ev.id, icon: "./icon-192.png", badge: "./icon-192.png" });
            done[ev.id] = Date.now();
          } catch (er) { /* rien */ }
        }
      }
      try { localStorage.setItem(RAPPELS_KEY, JSON.stringify(done)); } catch (e) { /* rien */ }
    };
    check();
    const id = setInterval(check, 60000);
    const onVis = () => { if (typeof document !== "undefined" && !document.hidden) check(); };
    if (typeof document !== "undefined") document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(id); if (typeof document !== "undefined") document.removeEventListener("visibilitychange", onVis); };
  }, [events, rev]);

  // Fond du corps de page et couleur de la barre d'état selon l'heure
  useEffect(() => {
    if (typeof document === "undefined") return;
    const c = skyColorsAt(now, IS_DARK);
    const bg = dayBg(now, IS_DARK);
    if (document.documentElement) document.documentElement.style.background = bg;
    if (document.body) document.body.style.background = bg;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", rgbStr(c.sky));
  }, [now, rev, themeMode]);

  const clientId = useRef(Math.random().toString(36).slice(2));
  const lastSig = useRef("");
  const canSend = useRef(false);
  const [syncStatus, setSyncStatus] = useState(SYNC_ON ? "connexion" : "local");
  const [syncPeek, setSyncPeek] = useState(false);
  const lastOkRef = useRef(null);
  useEffect(() => { if (syncStatus === "connecté") lastOkRef.current = Date.now(); }, [syncStatus]);
  const seen = useRef(loadSeen());
  const [seenVer, setSeenVer] = useState(0);
  const markSeen = (predicate) => {
    let changed = false;
    messages.forEach((m) => { if (!seen.current.has(m.id) && predicate(m)) { seen.current.add(m.id); changed = true; } });
    if (changed) { saveSeen(seen.current); setSeenVer((v) => v + 1); }
  };
  useEffect(() => {
    if (tab === "talk") markSeen((m) => m.scope === "general");
  }, [tab, messages]);
  const unreadInfo = (() => {
    const byEvent = {}; let general = 0;
    for (const m of messages) {
      if (m.who === ME || m.kind === "vibe" || seen.current.has(m.id)) continue;
      if (m.scope === "general") general += 1;
      else byEvent[m.scope] = (byEvent[m.scope] || 0) + 1;
    }
    let activities = 0; for (const k in byEvent) activities += byEvent[k];
    return { general, byEvent, activities };
  })();
  void seenVer;

  const applyRemote = (data) => {
    if (!data) return;
    if (data.settings) {
      const prev = SETTINGS;
      SETTINGS = { ...SETTINGS, ...data.settings };
      const m2 = (a, b) => { const out = { ...(a || {}) }; Object.keys(b || {}).forEach((k) => { out[k] = { ...((a || {})[k] || {}), ...(b[k] || {}) }; }); return out; };
      SETTINGS.bingo = { done: { ...(((prev.bingo || {}).done) || {}), ...((((data.settings.bingo) || {}).done) || {}) } };
      SETTINGS.morning = m2(prev.morning, data.settings.morning);
      SETTINGS.wholikely = m2(prev.wholikely, data.settings.wholikely);
      {
        const capMerged = { ...(prev.capsule || {}) };
        Object.keys(data.settings.capsule || {}).forEach((pid) => {
          const seen = new Set(); const merged = [];
          [...normCaps(capMerged[pid]), ...normCaps((data.settings.capsule || {})[pid])].forEach((e) => { if (e && e.id && !seen.has(e.id)) { seen.add(e.id); merged.push(e); } });
          merged.sort((x, y) => (x.at || 0) - (y.at || 0));
          capMerged[pid] = merged;
        });
        SETTINGS.capsule = capMerged;
      }
      SETTINGS.quiz = { ...(prev.quiz || {}), ...(data.settings.quiz || {}) };
      DAYS = buildDays(SETTINGS.startISO, SETTINGS.days);
      applyCategories();
    }
    if (Array.isArray(data.roster)) ROSTER = data.roster.map((p) => ({ ...META[p.id], ...p }));
    const act = ROSTER.filter((p) => p.active).map((p) => p.id);
    if (!act.includes(ME)) ME = act[0] || ME;
    if (Array.isArray(data.events)) setEvents(normEvents(data.events));
    if (Array.isArray(data.messages)) setMessages((cur) => {
      const localById = {}; cur.forEach((m) => { localById[m.id] = m; });
      return data.messages.map((m) => {
        const loc = localById[m.id];
        if (m && m.kind === "poll" && loc && loc.kind === "poll") {
          const seen = new Set(); const comments = [];
          [...((loc && loc.comments) || []), ...(m.comments || [])].forEach((c) => { if (c && c.id && !seen.has(c.id)) { seen.add(c.id); comments.push(c); } });
          comments.sort((a, b) => (a.at || 0) - (b.at || 0));
          return { ...m, votes: { ...(loc.votes || {}), ...(m.votes || {}) }, closed: !!(m.closed || loc.closed), reactions: { ...((loc && loc.reactions) || {}), ...(m.reactions || {}) }, comments };
        }
        if (m && m.kind === "vibe" && loc && loc.kind === "vibe") {
          const hits = {}; new Set([...Object.keys(m.hits || {}), ...Object.keys(loc.hits || {})]).forEach((p) => { hits[p] = Math.max((m.hits || {})[p] || 0, (loc.hits || {})[p] || 0); });
          return { ...m, hits };
        }
        if (m && m.kind === "guess" && loc && loc.kind === "guess") {
          return { ...m, guesses: { ...(loc.guesses || {}), ...(m.guesses || {}) }, closed: !!(m.closed || loc.closed) };
        }
        if (loc && (loc.reactions || m.reactions)) {
          return { ...m, reactions: { ...(loc.reactions || {}), ...(m.reactions || {}) } };
        }
        return m;
      });
    });
    if (Array.isArray(data.photos)) setPhotos((cur) => {
      const byId = {}; cur.forEach((p) => { byId[p.id] = p; });
      const merged = data.photos.map((rp) => {
        const loc = byId[rp.id];
        const tags = Array.from(new Set([...((loc && loc.tags) || []), ...(rp.tags || [])]));
        const reactions = { ...((loc && loc.reactions) || {}), ...(rp.reactions || {}) };
        return { ...rp, tags, reactions, deleted: !!((loc && loc.deleted) || rp.deleted), remote: true };
      });
      const ids = new Set(merged.map((p) => p.id));
      return [...merged, ...cur.filter((p) => !ids.has(p.id))];
    });
    setSelectedDay((d) => clamp(d, 0, DAYS.length - 1));
    if (realMode) setNow(realNow());
    canSend.current = true;
    setRev((r) => r + 1);
  };

  // Chargement initial et abonnement temps réel
  useEffect(() => {
    if (!SYNC_ON) return;
    let chan = null;
    (async () => {
      try {
        const { data, error } = await supa.from("trips").select("data, updated_at").eq("code", TRIP_CODE).maybeSingle();
        if (error) setSyncStatus("erreur");
        const localAt = (saved && saved.at) || 0;
        if (data && data.data && Array.isArray(data.data.events) && (data.updated_at || 0) >= localAt) {
          lastSig.current = sigOf(data.data);
          applyRemote(data.data);
        } else {
          const init = { events, messages, roster: ROSTER, settings: SETTINGS, photos: photos.filter((p) => p.url && !String(p.url).startsWith("data:")).map((p) => ({ id: p.id, event: p.event, url: p.url, path: p.path, who: p.who, at: p.at, tags: p.tags || [], reactions: p.reactions || {} })) };
          lastSig.current = sigOf(init);
          await supa.from("trips").upsert({ code: TRIP_CODE, data: init, client_id: clientId.current, updated_at: Date.now() });
          canSend.current = true;
        }
      } catch (e) { setSyncStatus("erreur"); }
      chan = supa.channel("trip-" + TRIP_CODE)
        .on("postgres_changes", { event: "*", schema: "public", table: "trips", filter: "code=eq." + TRIP_CODE }, (payload) => {
          const row = payload.new;
          if (!row || !row.data || row.client_id === clientId.current) return;
          const sig = sigOf(row.data);
          if (sig === lastSig.current) return;
          lastSig.current = sig;
          applyRemote(row.data);
        })
        .subscribe((status) => { setSyncStatus(status === "SUBSCRIBED" ? "connecté" : String(status).toLowerCase()); });
    })();
    return () => { if (chan) supa.removeChannel(chan); };
  }, []);

  // Filet de sécurité : sondage périodique du séjour partagé
  useEffect(() => {
    if (!SYNC_ON) return;
    const poll = async () => {
      try {
        const { data } = await supa.from("trips").select("data, client_id").eq("code", TRIP_CODE).maybeSingle();
        if (data && data.data && Array.isArray(data.data.events) && data.client_id !== clientId.current) {
          const sig = sigOf(data.data);
          if (sig !== lastSig.current) { lastSig.current = sig; applyRemote(data.data); setSyncStatus("connecté"); }
        }
      } catch (e) { /* sondage silencieux */ }
    };
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, []);

  // Envoi des changements locaux
  useEffect(() => {
    if (!SYNC_ON) return;
    if (!canSend.current) return;
    const sharedPhotos = photos.filter((p) => p.url && !String(p.url).startsWith("data:")).map((p) => ({ id: p.id, event: p.event, url: p.url, path: p.path, who: p.who, at: p.at, tags: p.tags || [], reactions: p.reactions || {} }));
    const data = { events, messages, roster: ROSTER, settings: SETTINGS, photos: sharedPhotos };
    const sig = sigOf(data);
    if (sig === lastSig.current) return;
    const id = setTimeout(() => {
      lastSig.current = sig;
      supa.from("trips").upsert({ code: TRIP_CODE, data, client_id: clientId.current, updated_at: Date.now() })
        .then(({ error }) => { if (error) setSyncStatus("erreur"); });
    }, 450);
    return () => clearTimeout(id);
  }, [events, messages, photos, rev]);

  // Temps réel
  useEffect(() => {
    if (!realMode) return;
    setNow(realNow());
    const id = setInterval(() => setNow(realNow()), 10000);
    return () => clearInterval(id);
  }, [realMode, rev]);

  // Défilement de l'aperçu (temps simulé)
  useEffect(() => {
    if (!playing) return;
    tick.current = setInterval(() => {
      setNow((v) => { const nv = v + 3; if (nv >= maxAbs) { setPlaying(false); return maxAbs; } return nv; });
    }, 220);
    return () => clearInterval(tick.current);
  }, [playing, maxAbs]);

  const setNowManual = (v) => { setRealMode(false); setNow(v); };
  const setPlayingManual = (p) => { if (p) setRealMode(false); setPlaying(p); };
  const backToRealTime = () => { setRealMode(true); setPlaying(false); setNow(realNow()); };

  const openDetail = (event) => { markSeen((m) => m.scope === event.id); setSheet({ mode: "detail", event }); };
  const openDetailThread = (event) => { markSeen((m) => m.scope === event.id); setSheet({ mode: "detail", event, focusThread: true }); };
  const openPhoto = (photo, contexte) => setPhotoView({ id: photo.id, ids: contexte && contexte.length ? contexte.map((p) => p.id) : null });
  const openAdd = () => { setDraft({ id: null, title: "", type: "activite", day: selectedDay, start: "10:00", end: "11:00", placeName: "", coord: null, note: "", parallelOf: null }); setSheet({ mode: "edit" }); };
  const openAddToday = () => { setDraft({ id: null, title: "", type: "activite", day: clamp(dayOfNow(now), 0, DAYS.length - 1), start: "10:00", end: "11:00", placeName: "", coord: null, note: "", parallelOf: null }); setSheet({ mode: "edit" }); };
  const openEdit = (event) => { setDraft({ id: event.id, title: event.title, type: event.type, day: event.day, start: event.start, end: event.end, placeName: event.place.name, coord: event.place.coord || null, note: event.note || "", parallelOf: event.parallelOf || null }); setSheet({ mode: "edit" }); };
  const openAddParallel = (mainEvent) => { setDraft({ id: null, title: "", type: "libre", day: mainEvent.day, start: mainEvent.start, end: mainEvent.end, placeName: "", coord: null, note: "", parallelOf: mainEvent.id }); setSheet({ mode: "edit" }); };
  const openSettings = () => setSheet({ mode: "settings" });
  const openGroup = () => setSheet({ mode: "group" });
  const updateContact = (id, patch) => { ROSTER = ROSTER.map((p) => (p.id === id ? { ...p, ...patch } : p)); setRev((r) => r + 1); };
  const setMyStatus = (choice) => {
    ROSTER = ROSTER.map((p) => (p.id === ME ? { ...p, status: choice ? { emoji: choice.emoji, label: choice.label, at: Date.now() } : null } : p));
    setRev((r) => r + 1);
  };
  const setTripType = (id) => { SETTINGS = { ...SETTINGS, tripType: id }; setRev((r) => r + 1); };
  const setMood = (id) => { SETTINGS = { ...SETTINGS, mood: id }; setRev((r) => r + 1); };
  const toggleFeature = (id) => {
    SETTINGS = { ...SETTINGS, features: { ...(SETTINGS.features || {}), [id]: !featureOn(id) } };
    setRev((r) => r + 1);
  };
  const voteMorning = (dIdx, choice) => {
    const m = { ...(SETTINGS.morning || {}) };
    m[dIdx] = { ...(m[dIdx] || {}), [ME]: choice };
    SETTINGS = { ...SETTINGS, morning: m };
    setRev((r) => r + 1);
  };
  const voteWho = (dIdx, target) => {
    const w = { ...(SETTINGS.wholikely || {}) };
    w[dIdx] = { ...(w[dIdx] || {}), [ME]: target };
    SETTINGS = { ...SETTINGS, wholikely: w };
    setRev((r) => r + 1);
  };
  const toggleBingoCase = (caseId) => {
    const done = { ...(((SETTINGS.bingo || {}).done) || {}) };
    if (done[caseId]) delete done[caseId]; else done[caseId] = { who: ME, at: Date.now() };
    SETTINGS = { ...SETTINGS, bingo: { done } };
    setRev((r) => r + 1);
  };
  const saveCapsule = (text) => {
    const mine = normCaps((SETTINGS.capsule || {})[ME]);
    const entry = { id: uid("cap"), text, at: Date.now() };
    if (now >= (DAYS.length - 1) * 1440 + 1410) entry.open = true;
    SETTINGS = { ...SETTINGS, capsule: { ...(SETTINGS.capsule || {}), [ME]: [...mine, entry] } };
    setRev((r) => r + 1);
  };
  const deleteCapsule = (id) => {
    const mine = normCaps((SETTINGS.capsule || {})[ME]).filter((e) => e.id !== id);
    SETTINGS = { ...SETTINGS, capsule: { ...(SETTINGS.capsule || {}), [ME]: mine } };
    setRev((r) => r + 1);
  };
  const openBingo = () => setSheet({ mode: "bingo" });
  const openQuiz = () => setSheet({ mode: "quiz" });
  const openGames = () => setSheet({ mode: "games" });
  const gamesOn = ["bingo", "guess", "quiz"].some((k) => featureOn(k));
  const guessPending = messages.some((m) => isGuess(m) && !m.closed && m.who !== ME && !(((m.guesses || {})[ME]) || {}).text);
  const quizUnlocked = dayOfNow(now) >= DAYS.length || (clamp(dayOfNow(now), 0, DAYS.length - 1) >= DAYS.length - 1 && minsInDay(now) >= 1080);
  const saveQuizScore = (score, total) => {
    SETTINGS = { ...SETTINGS, quiz: { ...(SETTINGS.quiz || {}), [ME]: { score, total, at: Date.now() } } };
    setRev((r) => r + 1);
  };
  const [film, setFilm] = useState(false);
  const [diapo, setDiapo] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [wx, setWx] = useState(null);
  useEffect(() => {
    if (typeof fetch !== "function") return;
    const acts = mainList(events).filter((e) => e.place && e.place.coord);
    if (acts.length === 0) return;
    const dNow = clamp(dayOfNow(realNow()), 0, DAYS.length - 1);
    const today = acts.find((e) => e.day === dNow);
    const c = (today || acts[0]).place.coord;
    const KEY = "vacances_wx_v1";
    let stop = false;
    const load = async () => {
      try {
        const cached = JSON.parse(localStorage.getItem(KEY) || "null");
        if (cached && Math.abs(cached.lat - c.lat) < 0.05 && Math.abs(cached.lng - c.lng) < 0.05 && Date.now() - cached.at < 45 * 60000) { if (!stop) setWx(cached.cur); return; }
      } catch (e) {}
      try {
        const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lng}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&daily=precipitation_probability_max&forecast_days=1&timezone=auto`);
        const j = await r.json();
        if (!j || !j.current) return;
        const cur = { t: j.current.temperature_2m, app: j.current.apparent_temperature, code: j.current.weather_code, wind: j.current.wind_speed_10m, rain: ((j.daily || {}).precipitation_probability_max || [null])[0] };
        if (!stop) setWx(cur);
        try { localStorage.setItem(KEY, JSON.stringify({ lat: c.lat, lng: c.lng, at: Date.now(), cur })); } catch (e) {}
      } catch (e) {}
    };
    load();
    const id = setInterval(load, 30 * 60000);
    return () => { stop = true; clearInterval(id); };
  }, [events.length]);
  const wxCoord = (() => {
    const acts = mainList(events).filter((e) => e.place && e.place.coord);
    if (acts.length === 0) return null;
    const dNow = clamp(dayOfNow(now), 0, DAYS.length - 1);
    const today = acts.find((e) => e.day === dNow);
    return (today || acts[0]).place.coord;
  })();
  const closeSheet = () => setSheet(null);

  const sendMessage = (scope, text) => {
    setMessages((l) => [...l, { id: uid("m"), scope, who: ME, text, at: Date.now() }]);
    const meName = (person(ME) || {}).name || "Quelqu'un";
    const ev = scope !== "general" ? events.find((e) => e.id === scope) : null;
    notify({ type: "messages", title: ev ? `${meName} · ${ev.title}` : `${meName} a écrit`, body: text });
  };
  const createPoll = (scope, q, optLabels, multi, allowComments) => {
    const poll = { id: uid("m"), scope, who: ME, kind: "poll", q, multi: !!multi, allowComments: !!allowComments, closed: false, votes: {}, comments: [], opts: optLabels.map((label, i) => ({ id: "o" + (i + 1), label })) };
    setMessages((l) => [...l, poll]);
    const meName = (person(ME) || {}).name || "Quelqu'un";
    const ev = scope !== "general" ? events.find((e) => e.id === scope) : null;
    notify({ type: "messages", title: ev ? `Sondage · ${ev.title}` : `${meName} a lancé un sondage`, body: q });
  };
  const commentPoll = (pollId, text) => {
    const t = (text || "").trim(); if (!t) return;
    setMessages((l) => l.map((m) => (m.id === pollId && isPoll(m) ? { ...m, comments: [...(m.comments || []), { id: uid("pc"), who: ME, text: t, at: Date.now() }] } : m)));
  };
  const shareLocation = (scope) => new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) { reject(new Error("géolocalisation indisponible")); return; }
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude, lng = pos.coords.longitude;
      setMessages((l) => [...l, { id: uid("m"), scope, who: ME, kind: "loc", lat, lng, at: Date.now() }]);
      const meName = (person(ME) || {}).name || "Quelqu'un";
      notify({ type: "messages", title: `${meName} partage sa position`, body: "Je suis là." });
      resolve();
    }, (e) => reject(e), { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
  });
  const createGuess = async (scope, dataUrl, answer) => {
    const r = await uploadPhotoBlob(dataUrl);
    setMessages((l) => [...l, { id: uid("m"), scope, who: ME, kind: "guess", url: r.url, answer, guesses: {}, closed: false, at: Date.now() }]);
    const meName = (person(ME) || {}).name || "Quelqu'un";
    notify({ type: "messages", title: `${meName} lance un devine le lieu`, body: "Où est-ce ? Faites vos propositions." });
  };
  const vibeUp = (eventId) => {
    setMessages((l) => {
      const vid = "vibe-" + eventId;
      const ex = l.find((m) => m.id === vid);
      if (ex) return l.map((m) => (m.id === vid ? { ...m, hits: { ...(m.hits || {}), [ME]: ((m.hits || {})[ME] || 0) + 1 } } : m));
      return [...l, { id: vid, scope: eventId, who: ME, kind: "vibe", hits: { [ME]: 1 }, at: Date.now() }];
    });
  };
  const guessAnswer = (mid, text) => setMessages((l) => l.map((m) => (m.id === mid && isGuess(m) && !m.closed ? { ...m, guesses: { ...(m.guesses || {}), [ME]: { text, at: Date.now() } } } : m)));
  const revealGuess = (mid) => setMessages((l) => l.map((m) => (m.id === mid && isGuess(m) ? { ...m, closed: true } : m)));
  const votePoll = (pollId, optId) => setMessages((l) => l.map((m) => {
    if (m.id !== pollId || !isPoll(m) || m.closed) return m;
    const mine = (m.votes || {})[ME] || [];
    const next = m.multi
      ? (mine.includes(optId) ? mine.filter((x) => x !== optId) : [...mine, optId])
      : (mine.includes(optId) ? [] : [optId]);
    return { ...m, votes: { ...(m.votes || {}), [ME]: next } };
  }));
  const closePoll = (pollId) => setMessages((l) => l.map((m) => m.id === pollId ? { ...m, closed: true } : m));
  const pollToActivity = (poll) => {
    const lead = leadOptionOf(poll);
    setDraft({ id: null, title: (lead && lead.label) || poll.q, type: "activite", day: clamp(dayOfNow(now), 0, DAYS.length - 1), start: "10:00", end: "11:00", placeName: "", coord: null, note: `D'après le sondage : ${poll.q}`, parallelOf: null });
    setSheet({ mode: "edit" });
  };
  const toggleReaction = (mid, emoji) => setMessages((l) => l.map((m) => {
    if (m.id !== mid) return m;
    const r = { ...(m.reactions || {}) };
    const set = new Set(r[ME] || []);
    if (set.has(emoji)) set.delete(emoji); else set.add(emoji);
    const arr = [...set];
    if (arr.length) r[ME] = arr; else delete r[ME];
    return { ...m, reactions: r };
  }));
  const pollHandlers = { onCreatePoll: createPoll, onVote: votePoll, onClosePoll: closePoll, onPollToActivity: pollToActivity, onReact: toggleReaction, onComment: commentPoll, onCreateGuess: createGuess, onGuess: guessAnswer, onReveal: revealGuess, onShareLocation: shareLocation };
  const openPollsByEvent = (() => {
    const map = {};
    for (const m of messages) if (isPoll(m) && !m.closed && m.scope !== "general" && !hasVotedPoll(m, ME)) map[m.scope] = (map[m.scope] || 0) + 1;
    return map;
  })();
  const addPhoto = (scope, url) => {
    if (!url) return;
    const id = uid("p");
    setPhotos((l) => [...l, { id, event: scope, url, who: ME, at: Date.now(), tags: [], reactions: {}, uploading: true }]);
    (async () => {
      try {
        const r = await uploadPhotoBlob(url);
        setPhotos((l) => l.map((p) => (p.id === id ? { ...p, url: r.url, path: r.path, remote: true, uploading: false, failed: false } : p)));
        setRev((v) => v + 1);
      } catch (e) {
        setPhotos((l) => l.map((p) => (p.id === id ? { ...p, uploading: false, failed: true } : p)));
      }
    })();
  };
  const deletePhoto = (photoId) => {
    const ph = photos.find((p) => p.id === photoId);
    setPhotos((l) => l.map((p) => (p.id === photoId ? { ...p, deleted: true } : p)));
    if (ph && ph.path && SYNC_ON && supa) { try { supa.storage.from(PHOTO_BUCKET).remove([ph.path]).then(() => {}).catch(() => {}); } catch (e) {} }
  };
  const togglePhotoReaction = (photoId, emoji) => setPhotos((l) => l.map((ph) => {
    if (ph.id !== photoId) return ph;
    const r = { ...(ph.reactions || {}) };
    const set = new Set(r[ME] || []);
    if (set.has(emoji)) set.delete(emoji); else set.add(emoji);
    const arr = [...set];
    if (arr.length) r[ME] = arr; else delete r[ME];
    return { ...ph, reactions: r };
  }));

  const toggleMine = (id) => setEvents((list) => {
    const ev = list.find((e) => e.id === id);
    if (!ev) return list;
    if (isAlt(ev)) {
      const inAlt = (ev.who || []).includes(ME);
      return list.map((e) => {
        if (e.id === id) return { ...e, who: inAlt ? (e.who || []).filter((x) => x !== ME) : [...(e.who || []), ME] };
        if (e.id === ev.parallelOf) { const sk = skipOf(e); return { ...e, skip: inAlt ? sk.filter((x) => x !== ME) : [...sk, ME] }; }
        return e;
      });
    }
    const sk = skipOf(ev);
    return list.map((e) => e.id === id ? { ...e, skip: sk.includes(ME) ? sk.filter((x) => x !== ME) : [...sk, ME] } : e);
  });

  const patchEvent = (id, patch) => setEvents((list) => list.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const saveDraft = () => {
    const isPar = !!draft.parallelOf;
    const base = {
      id: draft.id || uid("e"),
      day: draft.day, start: draft.start || "12:00", end: draft.end || "13:00",
      type: draft.type, title: draft.title || "Sans titre", place: { name: draft.placeName || "À définir", coord: draft.coord || null },
      note: (draft.note || "").trim(),
    };
    if (isPar) base.parallelOf = draft.parallelOf;
    setEvents((list) => {
      const exists = list.some((e) => e.id === base.id);
      if (exists) return list.map((e) => e.id === base.id ? { ...e, ...base } : e);
      let next = [...list];
      if (isPar) {
        base.who = [ME];
        next = next.map((e) => e.id === draft.parallelOf ? { ...e, skip: [...skipOf(e).filter((x) => x !== ME), ME] } : e);
      }
      return [...next, base];
    });
    setSelectedDay(draft.day); setTab("program"); closeSheet();
    const meName = (person(ME) || {}).name || "Quelqu'un";
    if (draft.id) notify({ type: "editActivity", title: "Activité modifiée", body: `${meName} a modifié « ${base.title} »` });
    else notify({ type: "addActivity", title: "Nouvelle activité", body: `${meName} a ajouté « ${base.title} »` });
  };

  const deleteEvent = (id) => { setEvents((l) => l.filter((e) => e.id !== id && e.parallelOf !== id)); closeSheet(); };

  const favorites = SETTINGS.favorites || [];
  const addFavorite = (fav) => {
    const id = "f" + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
    if ((SETTINGS.favorites || []).some((f) => Math.abs(f.coord.lat - fav.coord.lat) < 1e-4 && Math.abs(f.coord.lng - fav.coord.lng) < 1e-4)) return;
    SETTINGS = { ...SETTINGS, favorites: [...(SETTINGS.favorites || []), { id, ...fav }] };
    setRev((r) => r + 1);
  };
  const removeFavorite = (id) => { SETTINGS = { ...SETTINGS, favorites: (SETTINGS.favorites || []).filter((f) => f.id !== id) }; setRev((r) => r + 1); };
  const renameFavorite = (id, label) => { SETTINGS = { ...SETTINGS, favorites: (SETTINGS.favorites || []).map((f) => (f.id === id ? { ...f, label } : f)) }; setRev((r) => r + 1); };

  const categories = SETTINGS.categories || [];
  const addCategory = ({ label, emoji, color }) => {
    const id = "c" + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
    SETTINGS = { ...SETTINGS, categories: [...(SETTINGS.categories || []), { id, label, emoji, color }] };
    applyCategories(); setRev((r) => r + 1);
  };
  const updateCategory = (id, patch) => {
    SETTINGS = { ...SETTINGS, categories: (SETTINGS.categories || []).map((c) => (c.id === id ? { ...c, ...patch } : c)) };
    applyCategories(); setRev((r) => r + 1);
  };
  const removeCategory = (id) => {
    setEvents((l) => l.map((e) => (e.type === id ? { ...e, type: "activite" } : e)));
    SETTINGS = { ...SETTINGS, categories: (SETTINGS.categories || []).filter((c) => c.id !== id) };
    applyCategories(); setRev((r) => r + 1);
  };

  const commitSettings = (s, roster, me) => {
    SETTINGS = { ...SETTINGS, ...s };
    ROSTER = roster.map((p) => ({ ...META[p.id], ...p }));
    const act = ROSTER.filter((p) => p.active).map((p) => p.id);
    ME = act.includes(me) ? me : (act[0] || ME);
    saveMe(ME);
    DAYS = buildDays(SETTINGS.startISO, SETTINGS.days);
    setSelectedDay((d) => clamp(d, 0, DAYS.length - 1));
    if (realMode) setNow(realNow());
    setRev((r) => r + 1);
    closeSheet();
  };

  const applyTrip = (s) => {
    SETTINGS = { ...SETTINGS, ...s };
    if (s.startISO != null || s.days != null) {
      DAYS = buildDays(SETTINGS.startISO, SETTINGS.days);
      setSelectedDay((d) => clamp(d, 0, DAYS.length - 1));
      if (realMode) setNow(realNow());
    }
    setRev((r) => r + 1);
  };

  const sheetEvent = sheet?.event ? events.find((e) => e.id === sheet.event.id) || sheet.event : null;
  const sheetTitle = sheet?.mode === "settings" ? "Réglages du séjour"
    : sheet?.mode === "group" ? "Le groupe"
    : sheet?.mode === "games" ? "Jeux"
    : sheet?.mode === "bingo" ? "Bingo de vacances"
    : sheet?.mode === "quiz" ? "Quiz du séjour"
    : sheet?.mode === "share" ? "Partager le souvenir"
    : sheet?.mode === "edit" ? (draft?.id ? "Modifier l'activité" : draft?.parallelOf ? "Activité en parallèle" : "Nouvelle activité")
      : "Détail";

  const visiblePhotos = photos.filter((p) => !p.deleted);
  const sm = ({
    "connecté": { c: T.c.green, t: "Synchro" },
    "connexion": { c: T.c.sun, t: "Connexion" },
    "local": { c: T.c.inkFaint, t: "Local" },
    "erreur": { c: T.c.coralDeep, t: "Hors ligne" },
  })[syncStatus] || { c: T.c.sun, t: "Connexion" };

  const pageBg = dayBg(now, IS_DARK);
  if (needIdentity) return <IdentityGate onPick={confirmIdentity} onCreateSelf={createIdentity} />;

  return (
    <PhotoCtx.Provider value={{ del: deletePhoto }}>
    <div style={{ height: "100dvh", width: "100%", background: pageBg, display: "flex", justifyContent: "center", fontFamily: fB, color: T.c.ink }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Caveat:wght@500;600&display=swap');
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        input[type="date"], input[type="time"] { -webkit-appearance: none; appearance: none; min-width: 0; max-width: 100%; }
        @keyframes vbreath { 0%, 100% { transform: scale(1); opacity: 0.20; } 50% { transform: scale(1.45); opacity: 0.34; } }
        @keyframes vfloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        @keyframes vspin { to { transform: rotate(360deg); } }
        @keyframes vtwinkle { 0%, 100% { opacity: 0.25; } 50% { opacity: 0.85; } }
        @keyframes vpop { 0% { transform: scale(0.6); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes vdrift { from { transform: translateX(-5px); } to { transform: translateX(5px); } }
        @keyframes vsway { from { transform: rotate(-2.5deg); } to { transform: rotate(2.5deg); } }
        @keyframes vshimmer { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }
        @keyframes vblink { 0%, 100% { opacity: 0.12; } 50% { opacity: 0.5; } }
        @keyframes vburst { 0% { transform: translate(-50%, 0) scale(0.5) rotate(0deg); opacity: 0; } 12% { opacity: 1; } 100% { transform: translate(calc(-50% + var(--dx)), -84px) scale(1.2) rotate(var(--rot)); opacity: 0; } }
        @keyframes vfade { 0% { transform: translateY(8px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        button:active, [role="button"]:active { transform: scale(0.97); }
        button, [role="button"] { transition: transform .12s ease; }
        button:focus-visible, input:focus-visible, a:focus-visible, [tabindex]:focus-visible { outline: 3px solid ${T.c.sea}66; outline-offset: 2px; border-radius: 10px; }
        ::-webkit-scrollbar { display: none; }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
      `}</style>

      <div style={{ position: "relative", width: "100%", maxWidth: 430, height: "100dvh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: "0 0 auto", zIndex: 20, background: T.c.glass, backdropFilter: "blur(8px)", borderBottom: `1px solid ${T.c.line}`, padding: "calc(10px + env(safe-area-inset-top)) 16px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <span style={{ fontSize: 18 }}>⛵</span>
            <span style={{ fontFamily: fD, fontWeight: 700, color: T.c.ink, fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{SETTINGS.name}</span>
            {!realMode && <span style={{ fontFamily: fB, fontSize: 11, color: T.c.sun, fontWeight: 600 }}>aperçu</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "0 0 auto" }}>
            <span onClick={() => { setSyncPeek(true); setTimeout(() => setSyncPeek(false), 3500); }} title={sm.t} style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, background: `${sm.c}1c`, color: sm.c, borderRadius: T.r.pill, padding: "5px 10px", fontFamily: fD, fontWeight: 600, fontSize: 11.5 }}>
              <span style={{ width: 7, height: 7, borderRadius: T.r.pill, background: sm.c }} /> {syncPeek && lastOkRef.current ? `${sm.t} · depuis ${fmtMin(new Date(lastOkRef.current).getHours() * 60 + new Date(lastOkRef.current).getMinutes())}` : sm.t}
            </span>
            {gamesOn && (
            <button onClick={openGames} aria-label="Jeux" style={{ position: "relative", cursor: "pointer", border: "none", background: T.c.lineSoft, width: 38, height: 38, borderRadius: T.r.pill, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Gamepad2 size={19} color={T.c.inkSoft} />
              {guessPending && <span style={{ position: "absolute", top: 5, right: 5, width: 9, height: 9, borderRadius: 9, background: T.c.coral, boxShadow: `0 0 0 2px ${T.c.card}` }} />}
            </button>
          )}
          <button onClick={openGroup} aria-label="Le groupe" style={{ cursor: "pointer", border: "none", background: T.c.lineSoft, width: 38, height: 38, borderRadius: T.r.pill, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={19} color={T.c.inkSoft} />
            </button>
            <button onClick={openSettings} aria-label="Réglages" style={{ cursor: "pointer", border: "none", background: T.c.lineSoft, width: 38, height: 38, borderRadius: T.r.pill, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Settings size={19} color={T.c.inkSoft} />
            </button>
          </div>
        </div>

        <div key={tab} style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", WebkitOverflowScrolling: "touch", overflowY: tab === "talk" ? "hidden" : "auto", padding: tab === "talk" ? "16px 16px 10px" : "18px 18px 24px", animation: "vfade .25s ease" }}>
          {tab === "now" && <ScreenNow events={events} now={now} onOpenEvent={openDetail} onOpenThread={openDetailThread} onAddPhoto={addPhoto} onOpenPhoto={openPhoto} photos={visiblePhotos} onAdd={canEdit ? openAddToday : null} onSetStatus={setMyStatus} onToggleMine={toggleMine} onLikePhoto={(id) => togglePhotoReaction(id, "❤️")} onFilm={() => setFilm(true)} onOpenQuiz={openQuiz} onMap={() => setMapOpen(true)} onShare={() => setSheet({ mode: "share" })} wx={wx} wxCoord={wxCoord} play={{ voteMorning, voteWho, openBingo, openQuiz, saveCapsule, deleteCapsule, vibe: vibeUp, messages }} unreadByEvent={unreadInfo.byEvent} openPollsByEvent={openPollsByEvent} />}
          {tab === "program" && <ScreenProgram events={events} now={now} selectedDay={selectedDay} setSelectedDay={setSelectedDay} onOpenEvent={openDetail} onEditEvent={openEdit} onAdd={openAdd} onDelete={deleteEvent} canEdit={canEdit} unreadByEvent={unreadInfo.byEvent} openPollsByEvent={openPollsByEvent} />}
          {tab === "talk" && <ScreenTalk messages={messages} onSend={sendMessage} pollHandlers={pollHandlers} />}
          {tab === "wall" && <ScreenWall photos={visiblePhotos} events={events} onAddPhoto={addPhoto} onOpenPhoto={openPhoto} onDiapo={() => setDiapo(true)} />}
        </div>

        <BottomNav tab={tab} setTab={setTab} unreadTalk={unreadInfo.general} unreadNow={unreadInfo.activities} />

        {tab !== "talk" && <DemoTime now={now} setNow={setNowManual} open={demoOpen} setOpen={setDemoOpen} minAbs={0} maxAbs={maxAbs} realMode={realMode} onRealTime={backToRealTime} />}

        <Sheet open={!!sheet} onClose={closeSheet} title={sheetTitle}>
          {sheet?.mode === "detail" && (
            <DetailSheet event={sheetEvent} messages={messages} photos={visiblePhotos} canEdit={canEdit}
              onPatch={patchEvent} onDelete={deleteEvent} favorites={favorites} onAddFavorite={addFavorite}
              onEdit={() => openEdit(sheetEvent)} onToggleMine={toggleMine} onSend={sendMessage}
              onAddPhoto={addPhoto} onOpenPhoto={openPhoto} onOpenEvent={openDetail} onAddParallel={openAddParallel} allEvents={events} pollHandlers={pollHandlers} focusThread={!!sheet?.focusThread} />
          )}
          {sheet?.mode === "edit" && <EditSheet draft={draft} setDraft={setDraft} onSave={saveDraft} onDelete={deleteEvent} editing={!!draft?.id} favorites={favorites} onAddFavorite={addFavorite} />}
          {sheet?.mode === "settings" && <SettingsSheet onTrip={applyTrip} themeMode={themeMode} onTheme={changeTheme} favorites={favorites} onRemoveFavorite={removeFavorite} onRenameFavorite={renameFavorite} categories={categories} onAddCategory={addCategory} onUpdateCategory={updateCategory} onRemoveCategory={removeCategory} onToggleFeature={toggleFeature} onTripType={setTripType} onMood={setMood} onOpenTime={() => { setSheet(null); setDemoOpen(true); }} featuresRev={rev} />}
          {sheet?.mode === "group" && <ScreenFriends canEdit={canEdit} onUpdateContact={updateContact} />}
          {sheet?.mode === "games" && <GamesSheet photos={visiblePhotos} messages={messages} quizUnlocked={quizUnlocked} onOpenBingo={openBingo} onOpenQuiz={openQuiz} onGoTalk={() => { setSheet(null); setTab("talk"); }} onCreateGuess={createGuess} />}
          {sheet?.mode === "bingo" && <BingoSheet onToggle={toggleBingoCase} rev={rev} />}
          {sheet?.mode === "quiz" && <QuizSheet events={events} messages={messages} photos={visiblePhotos} onFinish={saveQuizScore} />}
          {sheet?.mode === "share" && <ShareSheet events={events} photos={visiblePhotos} messages={messages} onDone={() => setSheet(null)} />}
        </Sheet>

        {photoView && <PhotoViewer photos={photoView.ids ? visiblePhotos.filter((p) => photoView.ids.indexOf(p.id) >= 0) : visiblePhotos} startId={photoView.id} onClose={() => setPhotoView(null)} onToggleTag={toggleTag} onReact={togglePhotoReaction} onDelete={deletePhoto} />}
        {film && <FilmOverlay events={events} photos={visiblePhotos} messages={messages} onClose={() => setFilm(false)} />}
        {diapo && <Diaporama photos={visiblePhotos} onClose={() => setDiapo(false)} onReact={togglePhotoReaction} onToggleTag={toggleTag} />}
        {mapOpen && (() => {
          const seenM = new Set(); const pl = [];
          mainList(events).forEach((e) => { if (e.place && e.place.coord && e.place.name && e.place.name !== "À définir" && !seenM.has(placeKey(e.place.name))) { seenM.add(placeKey(e.place.name)); pl.push(e.place); } });
          return <PlacesMap places={pl} onClose={() => setMapOpen(false)} />;
        })()}
      </div>
    </div>
  </PhotoCtx.Provider>
  );
}

applyTheme(loadThemeMode());
const rootEl = typeof document !== "undefined" ? document.getElementById("root") : null;
if (rootEl) createRoot(rootEl).render(<App />);
