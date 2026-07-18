-- Rappels serveur : table anti-doublon et planification.
-- A executer une fois dans le SQL Editor de Supabase (projet zvnlyggusqtaukuwxgel).

-- 1) Table qui memorise les rappels deja envoyes (accessible seulement par la fonction, via service_role)
create table if not exists public.reminders_sent (
  trip_code text not null,
  event_id  text not null,
  sent_at   bigint not null,
  primary key (trip_code, event_id)
);
alter table public.reminders_sent enable row level security;
-- Aucune policy publique : seul le service_role (l'Edge Function remind) y accede.

-- 2) Extensions necessaires a la planification
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 3) Planifier l'appel de la fonction remind toutes les 5 minutes.
--    Remplacer <ANON_KEY> par la cle anon du projet (celle de config.js).
select cron.schedule(
  'remind-activities',
  '*/5 * * * *',
  $$
  select net.http_post(
    url     := 'https://zvnlyggusqtaukuwxgel.functions.supabase.co/remind',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <ANON_KEY>'
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- Pour retirer la planification plus tard :
--   select cron.unschedule('remind-activities');
-- Pour voir les taches planifiees :
--   select * from cron.job;
