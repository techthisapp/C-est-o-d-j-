Rappel serveur : une heure avant chaque activite, meme application fermee

Ce que ca fait
  Une fonction serveur (remind) verifie regulierement les activites du sejour et envoie
  une notification push a tout le groupe une heure avant le debut de chaque activite.
  Contrairement au rappel local (qui n'agit que si l'application tourne), celui-ci
  fonctionne meme quand l'application est fermee. Les deux partagent la meme etiquette
  de notification, il n'y a donc jamais de doublon a l'ecran.

Etat
  Le code de la fonction (supabase/functions/remind/index.ts) est pret et reutilise les
  memes secrets que la fonction notify deja en place. Il ne reste qu'a le mettre en
  service sur le projet Supabase, en trois etapes.

1. Creer la table et la planification
   Projet Supabase, SQL Editor, coller le contenu de supabase/migrations/reminders.sql,
   remplacer <ANON_KEY> par la cle anon (celle de config.js), executer.
   Si pg_cron ou pg_net manquent, les activer d'abord dans Database, Extensions.

2. Secrets (deja presents pour notify, rien a faire normalement)
   La fonction lit VAPID_PUBLIC, VAPID_PRIVATE et VAPID_SUBJECT, qui existent deja.
   SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont fournis automatiquement.

3. Deployer la fonction remind
   Avec la CLI Supabase, a la racine du depot :
     supabase functions deploy remind
   Ou, sans CLI, creer une fonction nommee remind dans Edge Functions et coller le
   contenu de supabase/functions/remind/index.ts.

Fuseau horaire
  L'heure d'une activite est celle du fuseau du sejour. Ce fuseau se regle desormais
  dans l'application (Reglages, Le sejour, Fuseau horaire du sejour). La fonction retient
  Europe/Athens par defaut si rien n'est defini.

Reglages
  Le rappel respecte le reglage de chaque appareil (Reglages, Notifications, Rappel
  avant une activite). Un abonnement dont ce reglage est desactive ne recoit pas le rappel.

Verification apres deploiement
    curl -s -X POST 'https://zvnlyggusqtaukuwxgel.functions.supabase.co/remind' \
      -H 'Authorization: Bearer <ANON_KEY>' -H 'Content-Type: application/json' -d '{}'
  La reponse indique le nombre de rappels traites et d'envois effectues.
