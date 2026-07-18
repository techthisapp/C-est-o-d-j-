Rappel serveur : une heure avant chaque activite, meme application fermee

Ce que ca fait
  Une fonction serveur (remind) verifie regulierement les activites du sejour et envoie
  une notification push a tout le groupe une heure avant le debut de chaque activite.
  Contrairement au rappel local (qui n'agit que si l'application tourne), celui-ci
  fonctionne meme quand l'application est fermee. Les deux partagent la meme etiquette
  de notification, il n'y a donc jamais de doublon a l'ecran.

Trois etapes de mise en place (a faire une seule fois)

1. Creer la table et la planification
   Ouvrir le projet Supabase, aller dans SQL Editor, coller le contenu de
   supabase/migrations/reminders.sql, remplacer <ANON_KEY> par la cle anon
   (la meme que dans config.js), puis executer.
   Si pg_cron ou pg_net ne sont pas disponibles, les activer d'abord dans
   Database, Extensions.

2. Verifier les trois secrets VAPID de la fonction
   Dans Edge Functions, Secrets (ou Project Settings, Functions), s'assurer que ces
   trois secrets existent (ils servent deja a la fonction notify) :
     VAPID_PUBLIC_KEY   la cle publique VAPID
     VAPID_PRIVATE_KEY  la cle privee VAPID
     VAPID_SUBJECT      une adresse de contact au format mailto:...
   SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont fournis automatiquement.

3. Deployer la fonction remind
   Avec la CLI Supabase, a la racine du depot :
     supabase functions deploy remind
   La fonction se trouve dans supabase/functions/remind/index.ts.

Fuseau horaire
  L'heure d'une activite est interpretee dans le fuseau du sejour. L'application
  renseigne ce fuseau automatiquement (celui du premier appareil qui l'ouvre), et la
  fonction retient Europe/Athens par defaut. Pour un sejour ailleurs, ouvrir
  l'application depuis un appareil regle sur le fuseau du lieu, ou ajuster la valeur
  par defaut dans remind/index.ts.

Reglages
  Le rappel respecte le reglage de chaque appareil (Reglages, Notifications, Rappel
  avant une activite). Un abonnement dont ce reglage est desactive ne recoit pas le
  rappel.

Verification
  Apres deploiement, on peut declencher la fonction manuellement pour verifier qu'elle
  repond (elle renvoie le nombre de rappels et d'envois) :
    curl -s -X POST 'https://zvnlyggusqtaukuwxgel.functions.supabase.co/remind' \
      -H 'Authorization: Bearer <ANON_KEY>' -H 'Content-Type: application/json' -d '{}'
