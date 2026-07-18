# Script de reprise : application de vacances de groupe

Document de reprise complet pour continuer le travail sur l'application, seul ou
avec une autre session. Il décrit le produit, l'état du code, l'hébergement, la
configuration, les procédures de build et de déploiement, le modèle de données,
les fonctionnalités livrées, ce qui reste à faire, et les pièges connus.

Version publique du journal, déposée dans le dépôt pour qu'une future session
puisse reprendre le projet. Les valeurs secrètes (jeton GitHub, clé privée VAPID)
en ont ete RETIREES : elles restent dans le fichier local REPRISE.md fourni dans
la conversation, hors dépôt. Ne jamais recoller un secret dans ce fichier public.

---

## 1. Résumé du produit

Application mobile pour organiser des vacances de groupe entre amis. Programme
par jour (activités, repas, hébergement, transport, temps libre), vue
"Maintenant" avec l'activité en cours et la suivante, discussion générale et par
activité, photos, gestion des membres et des droits, notifications, thème clair
ou sombre. Cas d'usage réel en cours : séjour "Mykonos entre amis", du 10 au 15
juillet 2026, cinq participants actifs.

Interface web installable (PWA) déployée en ligne, testée en conditions réelles
pendant le séjour. Cible d'abord le web, puis éventuellement le natif.

Nom produit affiché sur l'écran d'accueil : "C où déjà ?".
Nom du séjour affiché dans l'app : réglable (actuellement "Mykonos entre amis").

---

## 2. Accès et hébergement

Dépôt de code : GitHub, compte techthisapp, dépôt public "C-est-o-d-j-".
URL du dépôt : https://github.com/techthisapp/C-est-o-d-j-
Branche : main.

Site en ligne (GitHub Pages) : https://techthisapp.github.io/C-est-o-d-j-/
Publication : GitHub Pages, "Deploy from branch" main, dossier racine. Chaque push
sur main redéploie automatiquement en une à deux minutes.

Base de données et synchro : Supabase, projet ref zvnlyggusqtaukuwxgel.
URL Supabase : https://zvnlyggusqtaukuwxgel.supabase.co
Région recommandée : Union européenne (RGPD).

---

## 3. Secrets et configuration

Valeurs publiques (déjà dans le fichier déployé config.js, sans risque) :

- supabaseUrl : https://zvnlyggusqtaukuwxgel.supabase.co
- supabaseAnonKey (rôle anon, JWT public) : présente dans config.js.
- tripCode : mykonos-2026
- vapidPublicKey : BFkVTHhr4HI-ZofwaictIQUF2Cd6HI0KmuP-8N2cfz_MBH1b9dVIlqGlNTcmTV24mFm7BMPC4WRZME5ONXBnVe4

Valeurs SECRÈTES (à ne jamais mettre dans le code client ni dans un dépôt public) :

- Jeton GitHub (fine-grained PAT) utilisé pour pousser sur le dépôt :
  RETIRE DE CE FICHIER PUBLIC. La vraie valeur est conservée hors dépôt (fichier
  local fourni séparément dans la conversation). Ce jeton a permis de cloner et pousser. L'activation de GitHub Pages via l'API
  a échoué (jeton sans la permission Pages) ; Pages a donc été activé à la main
  dans les réglages du dépôt. Si le jeton expire ou fuite, en générer un nouveau
  dans GitHub (Settings, Developer settings, Fine-grained tokens) avec accès en
  écriture au contenu du dépôt techthisapp/C-est-o-d-j-.

- Clé privée VAPID (notifications push), à mettre en secret Supabase, jamais dans
  l'app : RETIRE DE CE FICHIER PUBLIC (valeur dans le fichier local hors dépôt).

- Sujet VAPID (secret Supabase) : mailto:enlacement.conifere1n@icloud.com

Secrets Supabase déjà enregistrés côté Edge Functions (à vérifier si besoin) :
VAPID_PUBLIC, VAPID_PRIVATE, VAPID_SUBJECT. SUPABASE_URL et
SUPABASE_SERVICE_ROLE_KEY sont fournis automatiquement à la fonction.

---

## 4. Environnement technique

Poste de travail : Node v22, dossier /home/claude/work.
Le système de fichiers se réinitialise entre les tâches. Le code source vit dans
/home/claude/work/app.jsx. À une reprise dans un nouvel environnement, il faut
récupérer app.jsx depuis le dépôt (le bundle app.js déployé est minifié ; le
source lisible est app.jsx, non déployé). Conserver app.jsx dans le dépôt ou
ailleurs est donc important pour la reprise.

Dépendances installées : esbuild, react, react-dom, lucide-react,
@supabase/supabase-js, jsdom (pour les tests), web-push (pour générer les clés
VAPID). Installation : npm install <paquet>.

Commande de build (bundle IIFE minifié) :

    cd /home/claude/work
    ./node_modules/.bin/esbuild app.jsx --bundle --format=iife --outfile=app.bundle.js --loader:.jsx=jsx --minify --define:process.env.NODE_ENV='"production"'

Le bundle fait environ 490 ko (React, lucide et supabase-js inclus).

Test de rendu sans navigateur (jsdom) : monter l'app dans un DOM simulé,
neutraliser WebSocket, AbortController, matchMedia, fetch, le canvas, puis
vérifier que le rendu contient les textes attendus et qu'aucune erreur console
n'a été émise. Astuce pour tester une heure précise : remplacer global.Date par
une classe qui renvoie une date fixe (l'app calcule le temps réel à partir de
new Date). Astuce pour simuler des données : préremplir localStorage avec la clé
"vacances_mykonos_v1". Astuce pour piloter des clics : dispatcher un MouseEvent
bubbles sur un bouton retrouvé par aria-label ou par texte. Toujours forcer
process.exit à la fin car un intervalle de temps réel garde Node vivant.

Réseau du bac à sable limité : npm, pypi et github seulement. On ne peut pas
joindre supabase.co ni photon.komoot.io depuis le bac à sable, mais tout
fonctionne au runtime dans le navigateur de l'utilisateur.

---

## 5. Architecture de l'application

Un seul fichier source : app.jsx (environ 1890 lignes), en React sans JSX runtime
externe (esbuild transforme le JSX). Styles en ligne via un objet de tokens T.
Icônes lucide-react. Polices Fredoka (titres, fD) et DM Sans (corps, fB).

Bundle : app.bundle.js copié en app.js dans le dossier déployé.

Le point d'entrée charge, dans index.html : un petit shim (process, global),
puis config.js (window.VAC_CONFIG), puis app.js avec un paramètre de version
(?v=N) pour casser le cache, puis enregistre sw.js.

Grandes zones du code, dans l'ordre : tokens et palettes de thème, fonctions
utilitaires de dates et de temps, données du séjour (SETTINGS, ROSTER, META,
SEED des activités), fonctions dérivées (activités en cours, à venir, présents),
config de synchro et module de notifications, composants d'affichage (avatars,
carte, hero, cartes de programme, fil de discussion, feuilles modales), écrans
(Maintenant, Programme, Discussion, Le groupe), réglages, puis le composant
racine App et le rendu.

Onglets : now (Maintenant), program (Programme), talk (Discussion), friends
(Le groupe). Mise en page en colonne pleine hauteur : en-tête fixe en haut,
contenu défilant au centre, barre de navigation fixe en bas. Feuilles modales en
bas (fiche d'activité, formulaire d'édition, réglages) et visualiseur de photo
plein écran.

---

## 6. Modèle de données

Valeurs dérivées calculées à la lecture, jamais stockées (présents, activité en
cours, album de photos).

SETTINGS : { name, place, startISO, days }. Les jours (DAYS) sont construits à
partir de startISO et days (libellés jour et date en français).

Membres : ROSTER est un tableau d'objets { id, name, role, active, emoji, color,
phone, email }. META fournit emoji et couleur par défaut pour les identifiants
d'origine (lea, tom, cam, hugo, sarah, max, g7, g8). La fusion se fait avec META
comme base et le roster qui prime : { ...META[id], ...p }. Donc un avatar changé
par l'utilisateur est conservé. Les nouveaux participants reçoivent un id généré
et un emoji et une couleur pris dans les palettes AVATAR_EMOJIS et AVATAR_COLORS.
ME est l'identifiant de l'utilisateur courant (choisi dans "Je suis").

Rôles : "organisateur", "co-éditeur", "participant" (affiché "Membre"). Droit
d'édition du programme : canEdit vaut vrai si le rôle de ME est organisateur ou
co-éditeur. Règles de changement de rôle : un organisateur peut tout ; on ne peut
pas rétrograder le dernier organisateur ; un co-éditeur peut basculer un membre
entre participant et co-éditeur mais ne touche pas aux organisateurs et n'en crée
pas.

Activités (events) : { id, day, start "HH:MM", end "HH:MM", type, title, place:{
name, area, coord:{lat,lng} }, note, cost, parallelOf, who, skip }. Types : activite,
repas, hebergement, transport, libre. Une activité parallèle porte parallelOf
(l'id de l'activité principale) et une liste who en opt-in. L'activité principale
porte skip (liste des personnes qui ont rejoint une alternative). Présents d'une
activité : pour une alternative, sa liste who ; pour une principale, tous les
actifs sauf ceux du skip. Rejoindre une alternative retire de la principale
(exclusivité).

Messages : { id, scope, who, text }. scope vaut "general" pour le canal général,
sinon l'id d'une activité pour son fil. Pas d'horodatage stocké.

Photos : { id, event, url (data URL de l'image), tags:[ids] } ou l'ancienne forme
emoji { id, event, tone, emoji }. Les photos sont locales à l'appareil (voir
Synchro). L'album du groupe agrège toutes les photos ; les photos d'activité sont
filtrées par event ; il existe un event fictif "album" pour les photos non liées
à une activité.

Persistance locale : localStorage clé "vacances_mykonos_v1", avec un champ at
(horodatage) pour départager local et distant. Messages vus : clé
"vacances_seen_v1" (ensemble d'ids). Thème : clé "vacances_theme_v1". Préférences
de notifications : clé "vacances_notif_v1".

---

## 7. Synchronisation Supabase (séjour partagé)

Table trips : colonnes code (texte, clé primaire), data (jsonb), client_id
(texte), updated_at (bigint, millisecondes). Le séjour partagé est sous le code
"mykonos-2026" (TRIP_CODE). RLS ouvertes en select, insert, update (using true).
Publication temps réel activée sur la table.

data contient events, messages, roster, settings. Les photos sont exclues de la
synchro (pour ne pas gonfler la ligne et rester sous la limite de taille). La
signature sigOf sert à éviter les échos.

Mécanique côté app : au chargement, on garde la version la plus récente entre le
local (saved.at) et le distant (updated_at) ; abonnement temps réel aux
changements ; en plus, un sondage périodique toutes les 5 secondes comme filet de
sécurité (le temps réel n'étant pas garanti) ; envoi des changements locaux en
différé (450 ms) avec garde par signature. Indicateur d'état en haut : Synchro,
Connexion, Local ou Hors ligne.

Point de vigilance : la pastille verte "Synchro" veut dire abonné, pas forcément
que les changements circulent. Le sondage périodique couvre ce cas.

---

## 8. Notifications push

But : notifier sur le téléphone à chaque nouveau message (général ou activité),
ajout d'activité, modification d'activité. Paramétrable par personne et par
appareil, réglages conservés. L'auteur n'est jamais notifié lui-même.

Côté app :
- config.js contient vapidPublicKey. L'URL des fonctions est déduite :
  supabaseUrl + "/functions/v1".
- Abonnement : à l'activation, demande d'autorisation, souscription via le service
  worker (applicationServerKey = clé publique VAPID), puis upsert dans la table
  push_subs (endpoint unique, trip_code, user_id, sub, prefs, enabled).
- Préférences locales dans "vacances_notif_v1" : { enabled, messages, addActivity,
  editActivity }.
- Envoi : après un message ou un ajout ou une modification d'activité, l'app
  appelle la fonction notify avec le type, un titre, un corps, le tripCode et
  l'auteur à exclure. Envoi silencieux, sans bloquer l'interface.
- Réception : sw.js gère l'événement push (affiche la notification) et le clic
  (focus ou ouverture de l'app).
- La section Notifications des réglages se désactive proprement là où le push
  n'est pas disponible (par exemple hors écran d'accueil sur iPhone).

Côté Supabase (installé) :
- Table push_subs (voir le fichier push_subs.sql). RLS ouvertes en phase de test.
- Fonction Edge notify (voir notify/index.ts) : lit les abonnements du séjour,
  filtre par préférence et exclut l'auteur, envoie via web-push (npm) avec les
  clés VAPID en secrets, supprime les abonnements expirés (404 ou 410).
- Secrets à définir : VAPID_PUBLIC, VAPID_PRIVATE, VAPID_SUBJECT.

Contraintes iPhone : le push web n'arrive que si l'app est ouverte depuis l'icône
de l'écran d'accueil, en iOS 16.4 ou plus. Un onglet Safari ne reçoit rien.
L'import des contacts du téléphone via le navigateur n'est pas possible sur iOS.

Les fichiers serveur sont dans le dossier notifications-serveur (INSTALLATION.md,
push_subs.sql, notify/index.ts).

Statut : code en ligne, installation Supabase faite ; test réel sur iPhone restant
à faire.

---

## 9. Thème clair et sombre

Deux palettes LIGHT et DARK. T.c est peint depuis la palette choisie par
applyTheme(mode), qui recalcule aussi les couleurs dérivées (TYPES, META,
PHOTO_TONE) et peint le fond de page et la teinte de barre d'état selon le thème.
Mode dans les réglages : Automatique, Clair, Sombre. Automatique suit le réglage
de l'appareil (prefers-color-scheme) et écoute ses changements.

Pièges corrigés à connaître : ne jamais utiliser T.c.ink comme fond (c'est la
couleur du texte) ; le texte blanc sur fond coloré reste blanc ; les fonds blancs
codés en dur ont été remplacés par T.c.card sauf ceux volontaires (points et
barres sur le hero coloré, pouce du curseur d'aperçu).

---

## 10. Fichiers du dossier déployé

Dossier source de déploiement : /mnt/user-data/outputs/vacances-app/
- index.html : métas PWA (viewport anti-zoom, apple-mobile-web-app-capable,
  apple-mobile-web-app-status-bar-style en black-translucent, theme-color),
  chargement de config.js puis app.js avec ?v=N, enregistrement de sw.js, styles
  html et body (fond sombre par défaut, hauteur du root en 100dvh), neutralisation
  du style natif des champs date et heure (appearance none) pour éviter le
  débordement.
- app.js : le bundle. Version actuelle référencée : app.js?v=16.
- config.js : valeurs publiques (supabaseUrl, supabaseAnonKey, tripCode,
  vapidPublicKey).
- sw.js : cache réseau d'abord plus hors ligne, plus gestion push et clic.
  Version de cache actuelle : vacances-v17.
- manifest.webmanifest : nom "C où déjà ?", couleurs, icônes.
- icon-512.png, icon-192.png, icon-180.png : icônes.
- LISEZ-MOI.txt : notes d'installation initiales.

Une archive téléchargeable est régénérée à chaque déploiement :
/mnt/user-data/outputs/vacances-app.zip

---

## 11. Fonctionnalités livrées (état actuel)

Programme et vue Maintenant : hero de l'activité en cours avec barre de progression
et temps restant ; carte de la prochaine activité ; liste "Ensuite dans la
journée" ; boîte de nuit avec lune quand le programme du jour est fini, conservée
jusqu'à 6h du matin ou la première activité si plus tôt, avec l'activité à venir
cliquable ; arc du soleil ; activités parallèles affichées sur l'accueil sous
chaque carte ; sélecteur de jour du programme avec jour actif souligné et repère
du jour courant ; aperçu du temps (curseur) épuré avec repères de jours, sans
lecteur ni retour arrière, bouton "Revenir au temps réel".

Édition : formulaire d'activité avec titre, type, jour (défilant), horaires en
sélecteur natif, recherche de lieu réelle avec suggestions (Photon, OpenStreetMap)
et coordonnées enregistrées, note éditable, participants par défaut. Ajout,
modification, activité en parallèle. Suppression en rouge avec confirmation dans
le formulaire. Depuis le Programme, glissement d'une activité vers la gauche pour
révéler Modifier et Supprimer (Supprimer en deux temps).

Discussion : canal général façon messagerie avec saisie fixée en bas ; fil par
activité mis en avant sur la fiche ; prénom affiché sur chaque message ;
indicateurs de messages non lus sur les onglets Maintenant (fils d'activité) et
Discussion (canal général), et compteur sur chaque carte d'activité concernée ;
suivi des vus par appareil.

Photos : import de vraies photos depuis l'appareil (réduites à 1280 px), affichage
en album et par activité, tag des personnes via un visualiseur plein écran, avatars
des personnes taguées sur la vignette. Local à l'appareil pour l'instant.

Le groupe : liste des membres avec avatar, prénom, rôle, et boutons d'accès rapide
Appeler, WhatsApp, E-mail quand les coordonnées existent.

Membres et droits : nombre de participants réglable (ajout, retrait), avatar
changeable (emoji), téléphone et e-mail par personne, niveaux de droits gérés
selon les règles décrites en section 6.

Carte : aperçu OpenStreetMap cliquable pour ouvrir en grand, bouton Itinéraire.

Synchro temps réel plus sondage, thème clair et sombre suivant l'appareil,
notifications push (voir sections dédiées), plein écran corrigé sur iPhone,
barre de navigation fixe en bas.

---

## 12. Backlog restant

1. Partage des vraies photos et de leurs tags entre tous les appareils. Aujourd'hui
   les photos restent sur l'appareil qui les ajoute. Nécessite un vrai stockage de
   fichiers (Supabase Storage), donc une étape côté Supabase.

2. Sécurité avant diffusion large : authentification des invités (Supabase Auth),
   verrouillage des règles d'accès (aujourd'hui ouvertes sur trips et push_subs),
   dépôt de code en privé, licence et mention de droits.

3. Sondages dans la discussion : lancer un sondage dans le fil d'une activité pour
   affiner ses modalités, ou dans la discussion générale pour proposer une activité
   à ajouter, avec vote et résultats, et transformation du résultat en activité ou
   en modification par l'organisateur. Entièrement dans l'app, sans étape Supabase.

4. Test réel des notifications sur iPhone (installation Supabase faite).

Formalisations internes en attente : système de design (R2) et schéma de données
versionné (R3), à faire après la phase de test.

---

## 13. Procédure de reprise pas à pas

1. Récupérer le source app.jsx (depuis le dépôt si le bac à sable est neuf ; le
   bundle app.js déployé n'est pas le source lisible).
2. Installer les dépendances : esbuild, react, react-dom, lucide-react,
   @supabase/supabase-js, jsdom (npm install).
3. Modifier app.jsx.
4. Construire le bundle (commande en section 4).
5. Tester le rendu en jsdom (aucune erreur console, textes attendus présents).
   Tester si utile une heure précise en fixant global.Date, et des scénarios en
   préremplissant localStorage.
6. Copier app.bundle.js vers /mnt/user-data/outputs/vacances-app/app.js.
7. Casser le cache : incrémenter le paramètre de version dans index.html
   (app.js?v=N vers N+1) et le nom de cache dans sw.js (vacances-vN vers vN+1).
8. Déployer sur GitHub : cloner le dépôt avec le jeton, copier le contenu du
   dossier déployé, commiter, pousser sur main. Modèle de commande :

    TOKEN=<jeton>
    git clone https://x-access-token:$TOKEN@github.com/techthisapp/C-est-o-d-j-.git /tmp/deploy
    cp -f /mnt/user-data/outputs/vacances-app/* /tmp/deploy/
    cd /tmp/deploy && git add -A && git commit -m "..." && git push origin HEAD

9. Régénérer l'archive zip si besoin.
10. Prévenir l'utilisateur de recharger (tirer pour rafraîchir, ou fermer et
    rouvrir l'app installée). Pour un changement de méta iOS (barre d'état, nom
    d'icône), l'utilisateur doit supprimer puis rajouter l'icône à l'écran
    d'accueil.

Numéro de version au moment de la rédaction : app.js?v=16, cache vacances-v17.
Prochain déploiement : passer à v17 et vacances-v18.

---

## 14. Points de vigilance connus

- Hauteur : utiliser height 100dvh sur l'enveloppe et le conteneur, sans
  minHeight 100vh (qui poussait la barre de navigation hors de l'écran sur iPhone).
- Champs date et heure iOS : appearance none dans le CSS global pour éviter le
  débordement ; le sélecteur natif s'ouvre quand même au toucher.
- Boutons côte à côte : mettre minWidth 0 sur les enfants flex ; les listes de
  boutons nombreux (jours) défilent horizontalement pour ne pas se chevaucher.
- Thème : voir section 9 (ne pas peindre un fond avec T.c.ink).
- Synchro : la pastille verte ne garantit pas la diffusion ; le sondage 5 s est le
  filet. La ligne trips exclut les photos.
- Notifications : sur iPhone, écran d'accueil et iOS 16.4 requis ; import contacts
  impossible via navigateur.
- Glissement pour supprimer et modifier : réservé aux éditeurs (canEdit) ; un appui
  simple ouvre la fiche, un appui pendant que les boutons sont visibles referme.

---

## 15. Préférences de style à respecter (dans les réponses et les fichiers)

- Français, unités métriques.
- Jamais de tiret cadratin ni demi-cadratin ; utiliser deux-points, virgules,
  parenthèses ou points.
- Jamais de flèches ni de symboles dans le texte courant ; écrire les enchaînements
  en énumération et les symboles en toutes lettres (environ, croisé avec).
- Pas de formulations au style typique d'une IA : pas d'aphorismes, pas
  d'antithèses du type "X, pas Y", pas de gloses parenthétiques superflues, pas de
  triades rhétoriques. Langage professionnel direct et factuel.
- Méthode de travail : avancer par lots validés, cadrer avant de coder, signaler
  les simulations, une information à un seul endroit, dérivation à la lecture,
  porte de contrôle build avant de livrer.

## Feuille de route des interactions du séjour (validée)
Socle livré : SETTINGS.features (interrupteurs partagés, section "Interactions du séjour" dans les réglages, helper featureOn, FEATURE_DEFS à étendre à chaque lot).
Phase 1 livrée : statut en direct (bande d'avatars sur l'accueil, choix prédéfinis, expiration 180 min, feature "status").
Phases 2 à 8 livrées en un lot : défi photo du jour (photos scope defi-dX), question du matin (SETTINGS.morning), qui a le plus de chances (SETTINGS.wholikely), bingo (SETTINGS.bingo.done, feuille mode "bingo"), réaction rapide (pilule 🤩 sur hero/next, poste un message), récap du soir (à partir de 20h30 ou journée bouclée, stats + hauts faits + lieux explorés, messages horodatés via at), capsule temporelle (SETTINGS.capsule, révélation dernier jour 18h), film du séjour (diaporama depuis le mur). Fusion synchro dédiée (m2) pour bingo/morning/wholikely/capsule dans applyRemote. Devine le lieu livré (kind guess, upload Storage, propositions masquées, fusion synchro) et quiz de fin livré (buildQuiz 6 questions générées, QuizSheet, scores SETTINGS.quiz fusionnés). Feuille de route interactions terminée : 12 interrupteurs.
Chaque lot doit ajouter son entrée dans FEATURE_DEFS pour être activable/désactivable.

## Backlog notifications e-mail / WhatsApp (en attente)
E-mail : faisable via la fonction Supabase "notify" + fournisseur (Resend recommandé, sinon Brevo) + clé API en secret. Case "Me prévenir par e-mail" cochée par défaut, décochable à la création du profil (visible si e-mail renseigné), préférence par personne. Par défaut, e-mail seulement pour ajouts/modifs d'activité, pas pour chaque message.
WhatsApp : pas d'envoi automatique (API Business lourde et payante), conserver les liens d'accès rapide.

## Refonte UX interactions (livrée)
Rendez-vous du jour : carte unique DailyRitualCard (RITUAL_SLOTS matin 0-14h question, 14h-17h30 défi photo, 17h30-20h30 vote, 20h30+ récap ; repli après participation avec heure du prochain créneau ; points de progression ; fond dégradé seaSoft pour distinguer du programme). Coin Jeux : bouton Gamepad2 dans l'en-tête (pastille si devine le lieu en attente), feuille mode "games" (bingo, devine le lieu, film, quiz verrouillé jusqu'au dernier soir 18h). Capsule en carnet secret : papier crème (variables locales IS_DARK), reliure pointillée, police manuscrite Caveat (fH, ajoutée au @import), plusieurs mots par personne (SETTINGS.capsule[pid] = tableau d'entrées {id,text,at}, normCaps pour compat ancien format objet, fusion synchro union par id), retrait de ses propres mots, ligne repliée avec compteurs, révélation en livre d'or signé chronologique. BingoCard/QuizCard retirés de l'accueil.
Types de voyage : SETTINGS.tripType (mer, ski, rando, ville, mariage, detente), sélecteur dans les réglages, CONTENT_PACKS par type (themes, morning, who, bingo avec ids préfixés par type), helper pack(). Quiz et devine le lieu restent génériques.

## Ambiance du groupe (livrée)
SETTINGS.mood = famille | amis (défaut) | minuit, sélecteur dans les réglages sous le type de voyage. Mécanique : items des packs marqués adult:true (alcool, fête) filtrés en famille ; MIDNIGHT_EXTRAS transversaux (4 morning, 7 who, 2 themes, 4 cases bingo) ajoutés en minuit ; FAMILY_FILL (4 cases neutres) complète le bingo famille à 12. Getters contentOf(kind) et contentBingo() remplacent les accès directs pack(). Le quiz reste factuel. Volume de contenu : 16 morning + 16 who + 15 thèmes par type (96 + 96 + 90) + 72 cases bingo + extras minuit (6 morning, 8 who, 3 thèmes, 4 bingo) + 4 fill famille, environ 375 items, zéro doublon. Tenue garantie 14 jours sans répétition dans toutes les ambiances (au moins 14 items non-adult par liste). 7 modèles de questions de quiz générées.

## Arc solaire v60 (livré)
SunArc({now, wx, coord}) unique (DayInfoBar supprimé) : viewBox 320x118 height 96, ellipse pieds x=42/278 centre (160,92) rx=118 ry=70, path pointillé pâle + path traînée stroke url(#arcTrail) pathLength=100 strokeDasharray p*100 (masquée la nuit), halo radialGradient sunGlow r=30, soleil r=9 + anneau vbreath, heure 22px, 5 étoiles vbreath la nuit, ligne d'infos sous l'horizon (y icônes 97, textes 107.5) : Sunrise 6h08, wmoIcon temp, Wind/Umbrella/Thermometer selon type, Sunset : icônes lucide imbriquées x/y/width/height, valeurs fD 600 12 inkSoft sans libellés. Déployé v60 / cache vacances-v61.

## Ensemble accueil v62 (livré)
Arc : radialGradient skyGlow (cx .5 cy 1) en ellipse clipée au-dessus de l'horizon (nappe dorée jour, bleutée nuit), pointillé restant strokeOpacity .48 jour / .26 nuit width 2.8, horizon inkFaint .55 width 2.4 en dégradé fondu. CurrentHero compacté : padding 15x16, titre 25, infos 13.5 gap 4, barre marginTop 11 height 7, avatars 26 sur la même ligne que « Se termine dans » + compte à rebours 20. DemoTime : bouton flottant rendu seulement si (open ou !realMode) ; SettingsSheet prop onOpenTime (ferme la feuille, setDemoOpen(true)), bouton « Aperçu du temps (simulation) » sous TripTypeSection. Déployé v62 / cache vacances-v63.

## Paysages thématiques v63 (livré)
Composant Landscape({type, night, sunX}) rendu dans SunArc juste après la nappe skyGlow (derrière arc/horizon/infos). mer : rect mer .05 + 2 vagues vdrift 9s/13s + reflet du soleil aligné sunX (vshimmer 4.5s, lune la nuit) + voilier 3 paths vsway 7s à x 250. ville : 10 buildings rx=1 sur les flancs + 4 fenêtres vblink la nuit. ski : 4 sommets + 3 calottes blanches. rando : 2 collines + 2 sapins + oiseau vdrift. mariage : 2 collines + guirlandes de fanions (2 paths + 10 triangles coral/sun/sea). detente : 2 collines + 2 oiseaux. Keyframes ajoutées : vdrift, vsway, vshimmer, vblink. v64 : svg SunArc en pleine largeur d'écran (style width calc(100% + 36px), margin 0 -18px, height auto, ratio natif du viewBox 320x118 ; le height=96 fixe letterboxait le dessin à 81%), opacités des paysages remontées d'un cran. Déployé v64 / cache vacances-v65.

## Lot retours UX v65 (livré)
Retenus et livrés : hero sans lieu redondant (IIFE placeLabel : si place.name contenu dans le titre, afficher area sinon rien), hFr(t) format français appliqué (hero, NextCard, horloge de l'arc 17h34), marqueur de fin d'activité sur l'arc (prop endMin de SunArc, cercle creux corail r 3.2 si fin à venir entre 2 et 98 pour cent de la course, masqué la nuit), barre hero corail si remain <= 30 min, ellipse sur la ligne repliée du rituel, pastille synchro cliquable (syncPeek 3,5 s : « Synchro · depuis 17h32 », lastOkRef via useEffect sur syncStatus, déclaré APRÈS syncStatus ligne 3745 pour éviter la TDZ), inkFaint clair #93A7AE vers #8496A0. Rejetés (backlog) : badge résa parsé du titre, présence confirmée par activité (RSVP), prévision horaire au toucher de l'arc, actions Prévenir/Prolonger, pile de cartes des rituels, déplacement du bouton +. Déployé v65 / cache vacances-v66.

## Photos accueil et lieux v66 (livré)
RecapCard : visited filtré e.day === dIdx (le <= cumulait tout le séjour, signalé par l'utilisateur). PhotoOfDay refondu : div wrapper (flex 0 0 100%, scrollSnapAlign start), bouton image plein cadre, bouton cœur bas droit (Heart lucide importé, rempli coral si (reactions[ME]||[]).includes("❤️"), compteur = nb de personnes avec ❤️, onLike(photo.id), anim vpop) ; ancien badge passif retiré. PhotoStrip : 12 dernières photos triées récentes d'abord, scroll-x snap mandatory, points de position (actif 14px sea) via onScroll, une seule photo = carte simple. Chaîne : App onLikePhoto={(id) => togglePhotoReaction(id, "❤️")} vers ScreenNow vers PhotoStrip. Déployé v66 / cache vacances-v67.

## Je suis là et jeu déplacé v67 (livré)
MessageInput : bouton MapPin devient « Je suis là » (aria-label « Je suis là : partager ma position », locBusy avec vbreath, bandeau d'erreur 3,5 s), GuessComposer retiré du composer. Nouveau kind "loc" : shareLocation(scope) dans App (Promise, geolocation.getCurrentPosition, timeout 10 s, notify type messages), pollHandlers.onShareLocation. LocBubble : avatar, « X est là », heure, MapPreview({coord,name}), lien « M'y rejoindre » vers dirUrl (Plans iOS / Google Maps). Branches isLoc dans Thread et ScreenTalk. GamesSheet : prop onCreateGuess, state guessOpen, GuessComposer intégré à la tuile (scope general, à la création : ferme + onGoTalk), bouton primaire « Créer une photo mystère », secondaire « Voir la discussion » si parties en cours. Déployé v67 / cache vacances-v68.

## Onglet Photos v68 (livré)
PhotoViewer refondu : props {photos, startId, onClose, onToggleTag, onReact, onDelete} ; liste triée desc, carrousel scroll-x snap plein écran (scrollLeft initial = idx0 x clientWidth), titre « Photo x/y », corbeille si photo.who === ME ou rôle organisateur/co-éditeur (confirmation deux temps 3,2 s), rangée « qui a réagi » (avatars 17 par emoji). Suppression : deletePhoto marque deleted:true (tombstone) + supa.storage.remove([path]) best effort ; fusion applyRemote : deleted = loc.deleted OU rp.deleted ; App : visiblePhotos = photos.filter(!deleted) passé à TOUS les rendus (ScreenNow, ScreenWall, DetailSheet, GamesSheet, QuizSheet, FilmOverlay, PhotoViewer), le state complet reste synchronisé (propagation des tombstones). ScreenWall : sections par jour (clé toDateString, titre WL/MO, « Plus tôt » si date invalide), bouton Film avec libellé, encart pointillé d'incitation si moins de 6 photos, avatar auteur (18, liseré blanc) en bas à gauche de chaque PhotoTile. Déployé v68 / cache vacances-v69.

## HOTFIX v69 (livré) : écran vide en production
Cause : le remplacement du PhotoViewer en v68 utilisait comme borne de fin la prochaine déclaration `function`, engloutissant trois const situées entre les deux : isPoll, leadOptionOf, pollVotersOf. Crash « isPoll is not defined » au premier rendu dès qu'un message existait ; les tests de v68 n'avaient aucun message, donc rien détecté. Restaurées avant PollComposer : pollVotersOf(m, oid) (pids ayant voté oid), isPoll (kind poll ou q+opts), leadOptionOf (option la plus votée, champ opts et non options). LEÇON DE MÉTHODE : (1) les remplacements par bornes doivent viser la fin exacte du composant, jamais « la prochaine function » ; (2) le smoke test de déploiement doit TOUJOURS inclure un jeu de données riche : messages (texte, poll avec opts/votes/comments, guess, vibe, loc), photos (reactions, tags, deleted), et parcourir les 4 onglets + fiche + jeux : script conservé à /tmp/testcrash.js et /tmp/testfull.js (à recréer au besoin, décrits ici). Le déploiement v69 inclut aussi la refonte du PollComposer (question bordure sea, options A/B/C en pastilles avec retrait, Toggle au lieu des cases, X d'annulation en tête, CTA pill plein avec Send). Déployé v69 / cache vacances-v70.

## Lieux v70 (livré)
Recherche : runSearch fusionne fromPhoton (bias geo) + fromNominatim (viewbox 0.4 degre bounded=1 autour de la position) en Promise.allSettled ; si moins de 3 resultats, repli fromNominatim(q + " " + SETTINGS.place, non borne) ; dedup par nom minuscule + coord 3 decimales, tri par distance, 8 max. Nominatim jsonv2 accept-language=fr, CORS ok, name/display_name. PointPicker({initial, onPick, onCancel}) : tuiles https://tile.openstreetmap.org/z/x/y.png en img absolues, conversions Web Mercator (lon2tile/lat2tile et inverses px2ll), drag touch+souris (dragRef avec cx/cy captures au down), zoom 3-18 boutons +/-, viseur MapPin coral au centre, attribution OSM, H=240, w mesure au mount. PlaceField : state pickerOpen, bouton « Placer sur la carte » permanent sous le champ + dans le message « aucun lieu trouve », etat « Position définie » si draft.coord, onPick garde placeName sinon « Point sur la carte ». saveDraft : coord: draft.coord || null (fini le repli villa V qui faussait l'itinéraire). dirUrlFor(place) : coord sinon daddr=nom encode (Plans/GMaps par texte) ; QuickActions rend Itineraire si coord OU nom valable ; DetailSheet : lien « Itinéraire vers "nom" » si texte seul (MapPreview rendu conditionnel coord). Déployé v70 / cache vacances-v71.

## Lot EditSheet v71 (livré)
ScrollRow({children, selKey}) : conteneur scroll-x avec recentrage du bouton [data-sel="1"] (scrollTo smooth, repli scrollLeft en jsdom) au montage et à chaque changement de selKey, fondu de bord droit 26px (linear-gradient vers T.c.card, pointerEvents none). Appliqué à la rangée des jours (selKey=draft.day, data-sel sur le bouton actif) ; les types restent en flexWrap wrap (pas concernés, constat corrigé en cours de route). Zone lieu en une ligne : « Position définie · Modifier sur la carte » si draft.coord, sinon « Placer sur la carte » avec MapPin ; favori compact à droite (« Favori » étoile pleine si déjà, bouton « Ajouter » sinon) ; ancien bloc « Position enregistrée » supprimé. Libellé « À prévoir ». Bandeau invités : texte inkFaint 12 (« Tout le monde est invité. Chacun peut se désister depuis l'activité. »). Test /tmp/testedit2.js : ouverture création via aria "Ajouter une activité aujourd'hui", modification via hero [role=button] puis bouton texte « Modifier l'activité » (PAS d'aria sur ce bouton de fiche). Déployé v71 / cache vacances-v72.

## Règle de sauvegarde (permanente)
À chaque lot : app.jsx est commité dans le dépôt (racine, main) en même temps que le bundle, ET présenté en fichier téléchargeable dans la réponse. Deux endroits hors bac à sable, systématiquement. Le dépôt contient app.jsx depuis le commit 35a764c (md5 24a5ea5c06df98a63f0d1b3b79a6bdb2 au moment de la vérification, identique au conteneur, 4560 lignes, 302466 octets). Scripts de test et package.json/package-lock.json copiés dans outputs/sauvegarde.

## Paysages sobres v72 (livré)
Landscape({type, night}) réécrit (borne exacte : de function Landscape à function SunArc) : aplat rect(0, 92.4, 320, 25.6) rempli d'un linearGradient vertical id ground-<type> (opacité 0.30, 0.26 pour ville/rando, x0.45 la nuit, fondu vers 0) ; palette : mer #4E9EBD, ville #8C9BA8, ski #9FC6DE, rando #B98F63, mariage #D8B4A8, detente #D9BC82. Silhouette grise #8A979E stroke 1.3 fill none (opacité 0.55 jour / 0.30 nuit), posée vers x 296 sur l'horizon : mer voilier (vsway 7s alternate, transformBox fill-box origin 50% 100%), ville vélo (vdrift 13s), ski skieur (vdrift 11s), rando randonneur à bâton (vdrift 14s), mariage couple mains jointes (vfloat 6s), detente deux oiseaux dans le ciel y 74-79 (vdrift 16s). Anciens décors colorés (vagues, buildings, sommets, sapins, guirlandes, reflet sunX) supprimés ; prop sunX retirée de l'appel. Règle de sauvegarde appliquée : app.jsx commité avec le bundle et présenté. Déployé v72 / cache vacances-v73.

## Correction paysages v73 (livré)
ERREUR v72 : la demande portait sur la zone SOUS l'horizon (dégradé, pas de vagues, petite silhouette grise), or les décors thématiques étaient presque tous AU-DESSUS de l'horizon (immeubles y 66-92, sommets 48-92, collines, sapins, oiseaux, guirlandes) ; seuls les vagues, le reflet et la bande de mer étaient dessous. Tout avait été supprimé. Récupération de l'ancien code via `git show 35a764c:app.jsx` (commit de sécurisation du source, état v71).
v73 : décors restaurés à l'identique (mêmes coordonnées, mêmes opacités 0.10 à 0.26, fenêtres vblink la nuit pour ville, oiseaux vdrift pour rando et detente, guirlandes de fanions pour mariage) ; dégradé sous l'horizon conservé (rect 92.4-118, linearGradient ground-<type>) ; vagues et reflet non restaurés (conformes à la demande). Silhouettes replacées dans la scène, en trait c.inkSoft 1.4, opacité 0.55 jour / 0.38 nuit, têtes remplies, animations vsway/vdrift 6 à 14 s : mer voilier x 250 entre deux îlots discrets ajoutés (0-70 et 262-320, seul thème sans décor au-dessus auparavant) ; ville cycliste x 112 après la skyline gauche (14-93) ; ski skieur x 117 au pied du massif (0-104), ski à spatule relevée pour rester visible au-dessus de la ligne d'horizon ; rando randonneur posé SUR la colline au point (63, 83) calculé sur la courbe (x(t)=84t, y(0.75)=83), sapins à sa droite ; mariage couple sur la butte au point (46, 84) sous les guirlandes ; detente transat et parasol x 102-122, oiseaux conservés dans le ciel.
GÉOMÉTRIE À RETENIR (viewBox 0 0 320 118) : horizon ligne y=92 (stroke 2.4, dessinée APRÈS Landscape donc elle recouvre ce qui touche y=92) ; heure 22px baseline y=86 occupe x 130-190 et y 70-86 ; date y=60 ; ligne d'infos sous l'horizon (icônes y=97, texte y=107.5, centres 160+(i-(n-1)/2)*72) ; pieds de l'arc (42,92) et (278,92) ; couloirs libres pour une silhouette : x 92-130 et x 190-226 environ selon le thème. L'arc n'est rendu que si !todayDone (donc pas de nuit visible si la journée est finie : tester le mode nuit avec une activité en soirée). Test /tmp/testland.js paramétré par THEME et EV_START/EV_END, settings.tripType dans localStorage. Déployé v73 / cache vacances-v74.

## Silhouettes v74 (livré)
Retours utilisateur sur v73 : randonneur à contresens, skieur pas sur une pente, mariés masqués par l'arc (vérifié : l'arc passe à y 74 à x 46, sur leurs têtes), détente illisible, et surtout PAS de dessins en bâtons (stick figures rejetées). v74 : silhouettes PLEINES fill c.inkSoft, style pictogramme (têtes circle, corps et jambes en rect rx pivotés, bâtons et mâts en trait 1.05-1.15), groupe englobant opacity 0.58 jour / 0.4 nuit. Positions : randonneur translate(238, 80.7) rotate(-8) sur la pente montante de la colline droite (point calculé sur la Bézier M 210 92 Q 258 64 320 92 à t 0.30), sac au dos, marche vers la droite en montée ; skieur translate(86, 70) rotate(30) en descente sur la pente droite du massif gauche (ligne 66,48 vers 104,92, y 71.2 à x 86), skis en rect plein ; mariés translate(252, 84.4) sur la butte droite (arc à y 48 à cet x : marge 27), robe triangle plein + costume capsule, vfloat 7 s ; détente : parasol demi-disque plein planté rotate(-7) + serviette, translate(110, 92), vsway 10 s ; ville : cycliste assis plein sur le vélo (roues restées en traits, nature filaire) ; mer : voilier plein v71 conservé. Thème anniversaire : TRIP_TYPES + palette #C79ED6, collines douces, 3 ballons ellipse coral/sun/sea opacité 0.55 avec ficelles vfloat décalées (30/39/290), silhouette gâteau (rect rx 1.2) bougie et flamme vtwinkle 2.4 s ; CONTENT_PACKS retombe sur mer pour anniversaire (pack dédié au backlog). Test /tmp/testland.js adapté (groupe opacity 0.58/0.4, fills comptés, ancrage translate). Déployé v74 / cache vacances-v75.

## Scènes affinées v75 (livré)
Retours captures v74 : silhouettes (vélo 112, parasol et gâteau 110) empilées visuellement PILE au-dessus de la colonne « 27° » de la ligne d'infos ; fanions du mariage flottant trop haut ; vélo trop filaire. COLONNES D'INFOS (4 items) : centres 52, 124, 196, 268 ; emprises réelles = centre ± (17 + longueur_texte x 6.6)/2 : 6h09 30-74, 27° 106-142, 25° 178-214, 20h39 243-293 ; CREUX UTILES : 74-105 et 215-243. Placements v75 : vélo wrapper translate(-13) : 84-98 ; parasol translate(86) : 79-93 ; mariés translate(79, 88.1) sur la butte gauche (Bézier M 0 92 Q 46 76 92 92, t 0.86) côté matin du soleil, l'arc passe à y 45 ; scène anniversaire 215-240 pile dans le creux droit. Mariage : fanions et guirlandes REMPLACÉS par 4 feux d'artifice (helper firework(bx,by,couleur,delai,echelle) : 8 rayons line à 45 degrés entre r 2.2 et 6.2, point central, opacité 0.5, vbreath 3.6 s décalé) positions (40,24) coral, (63,37) sun 0.68, (277,20) sea, (255,35) coral 0.62. Anniversaire : table (plateau rect 224-240 y 85.2 + 2 pieds obliques), gâteau posé sur le plateau (rect 228.9 y 81.6), bougie et flamme vtwinkle, personnage festif (tête, chapeau cône, corps capsule, 2 jambes, bras levés rotate(-40)/rotate(40)) qui sautille (vfloat 5.5 s), ballons conservés. Cycliste étoffé : roues stroke 1.7, cadre 1.55, selle, guidon, tête pleine, dos penché rotate(30) vers le guidon, jambe vers la pédale, bras vers le guidon. Ville : dégradé 0.26 vers 0.20 (bande d'infos moins terne). Déployé v75 / cache vacances-v76.

## Correction invisibilité v76 (livré)
CAUSE RACINE des silhouettes invisibles (mariés, parasol) : une animation CSS qui anime transform (vfloat, vsway, vdrift) ÉCRASE l'attribut transform SVG du MÊME élément : le groupe perd sa translation et se dessine aux coordonnées locales autour de (0,0), hors champ en haut à gauche. RÈGLE PERMANENTE : ne jamais poser un attribut transform (translate/rotate) et une animation CSS de transform sur le même élément SVG : toujours deux groupes imbriqués (externe = position statique OU animation, interne = l'autre). Les transform d'éléments ENFANTS d'un groupe animé ne posent aucun problème. Test anti-régression /tmp/testconflit.js : scanne tous les [transform] dont le style contient vfloat/vsway/vdrift/vbreath/vpop : doit rester à 0 sur les 7 thèmes.
v76 : vélo (animation externe, translate(-13) interne), mariés (translate(79, 88.1) externe, vfloat interne), parasol (translate(80,92) rotate(-7) externe, vsway interne, canopée r7). Détente complétée : table de pique-nique absolue (plateau rect 92.5-103.5 y 86.2, pieds obliques en A, deux bancs rect 90.6 et 101.7 y 88.9). Anniversaire : 6 ballons (grappes 26/33/41 et 281/290/298, ellipse rx 2.3), scène décalée (table 226.5-242.5, gâteau 231.4, bougie 234.7, flamme vtwinkle sans transformOrigin inutile), personnage 18px refait : tête r 1.9 (220, 79.4), chapeau triangle 218-222 sommet 73.6, buste trapèze path (218.5 81.5 vers 222.2 87.7), deux jambes rect 1.2x4.6, bras levés en V rect 1.2x4.8 rotate(-42)/rotate(42), vfloat 5.5 s sur coordonnées absolues. Emprises dans les creux 74-105 et 215-243 respectées. Déployé v76 / cache vacances-v77.

## Mode souvenir v77 (livré)
tripOver = dayOfNow(now) >= DAYS.length (bascule le lendemain 00:00 du dernier jour). ScreenNow : bifurcation avant le rendu normal : en-tête « PLACE · SOUVENIRS » + « C'était {place} » + période (gère les mois différents) + « N jours à X » ; SouvenirCard({events, photos, messages, onOpenEvent, onOpenPhoto, onFilm, onOpenQuiz}) : bandeau dégradé sunSoft/coralSoft avec 4 stats (activités mainList, photos avec url, messages hors vibe et loc, lieux uniques hors « À définir »), ligne « moment préféré du groupe » (max vibeTotal, ouvre la fiche), « La photo du séjour » (max de ❤ par personne, image 16/9, ouvre la visionneuse), boutons « Revoir le film » (sea plein) et « Rejouer le quiz » ; puis PhotoStrip et CapsuleCard reveal (retourne null si capsule vide : voulu). Props App : onFilm={() => setFilm(true)} et onOpenQuiz={openQuiz} sur ScreenNow ; messages via play.messages. quizUnlocked : dayOfNow >= DAYS.length OU (dernier jour et >= 18 h) : le quiz ne se reverrouille plus le lendemain matin. Bouton +, statut, arc, rituels et défis non rendus en mode souvenir ; Programme, Discussion et Photos restent consultables. Tests : /tmp/testsouv.js au 16 juillet (titre, période, stats, moment, photo star, + absent, film) et smoke riche aux 14 et 15 juillet (mode normal intact). Déployé v77 / cache vacances-v78.
Prochaines pistes du chantier souvenir (non faites) : partage/export du film en vidéo, page publique en lecture seule, export JSON du séjour (rejoint le chantier sauvegarde), stats avancées (podium par personne, carte des lieux).

## Dégradé prolongé v78 (livré)
Le dégradé d'ambiance ne s'éteint plus dans le SVG : stop final à op x 0.55 (au lieu de 0), puis SunArc retourne un wrapper position relative contenant le svg et une bande absolue (left/right -18, top 100 pour cent, height 58, zIndex -1, pointerEvents none) en linear-gradient CSS de la MÊME couleur à la MÊME opacité de jonction (hex 8 : couleur + alpha 2 chiffres) vers transparent : raccord sans couture au bas du SVG, la bande passe derrière le haut de la première carte (zIndex -1 la place sous les blocs non positionnés du flux). Palette factorisée au niveau module : LAND_PALETTE (7 ambiances) et LAND_BASEOP(t) partagées par Landscape et SunArc ; la nuit multiplie par 0.45 des deux côtés. Test /tmp/testgrad.js : wrapper relative, bande top 100 pour cent avec gradient, z-index -1 et height 58, stop-opacity finale > 0.1. Déployé v78 / cache vacances-v79.

## Livre d'or v79 (livré)
CapsuleCard({now, onSave, onDelete}) calcule tout : revealAbs = (DAYS.length - 1) x 1440 + 1410 (dernier jour 23h30), reveal = now >= revealAbs, décompte cd (« 3 j 8 h » / « 1 h 30 » / « 12 min »). Ligne repliée : « ... révélation dans {cd} » en permanence ; carnet ouvert : « Vos mots restent secrets. Révélation dans {cd}, le dernier soir à 23h30. ». Révélé : titre 📖 « Le livre d'or du séjour », plus de return null à vide (invitation « Écrivez le premier mot »), badge pilule « à découvert » sur les mots e.open, croix de retrait sur MES mots, zone d'écriture permanente avec mention « Le livre est ouvert : ce mot sera visible immédiatement ». saveCapsule (App) : entry.open = true si now >= revealAbs (persiste et se synchronise via la fusion capsule existante par id). Usages : now={now} (ScreenNow normal + mode souvenir). Tests /tmp/testlivre.js en 4 temps (MODE avant/veille/revele/videapres, WITHCAPS). NOTE : l'ancienne révélation à 18h00 était en prod le 15/07 : le livre se referme entre le déploiement et 23h30 le soir même (conforme à la demande). Déployé v79 / cache vacances-v80.

## Mentions du livre d'or v80 (livré)
Étiquette « à découvert » renommée « à livre ouvert » (« à découvert » a une connotation bancaire). Mentions dans CapsuleCard, machinerie partagée par les deux zones d'écriture (secrète et ouverte) : taRef, état mq (null hors saisie de mention), onType détecte /(^|\s)@([\p{L}\p{M}'’-]*)$/u sur le texte jusqu'au caret (e.target.selectionStart), sugg = participants actifs hors ME dont le nom normalisé (NFD sans diacritiques) commence par la requête, 5 max ; mentionBar en pastilles Avatar 20 + prénom sous la zone de saisie ; insertMention remplace @partiel par « @Prénom » et repositionne le caret (setTimeout + setSelectionRange) ; bouton @ (aria « Mentionner quelqu'un ») ajoute « @ » et ouvre la liste complète ; renderMentions stylise @Prénom (T.c.seaDeep, weight 600, police fH conservée) dans les mots du livre et dans mes mots. Test /tmp/testment.js : cibler les pastilles via ta.nextElementSibling (PIÈGE : le textContent des pastilles inclut l'emoji de l'avatar, et « Romain » apparaît aussi dans la barre des participants en haut d'écran). Déployé v80 / cache vacances-v81.
Piste non faite : notifier la personne mentionnée quand le livre est ouvert (notify existe mais diffuse au groupe, pas de ciblage individuel : demanderait une évolution de l'Edge Function).

## Livre d'or redessiné v81 (livré)
Bloc reveal de CapsuleCard réécrit, esprit livre manuscrit minimal : page de garde centrée (titre fH 27 « Le livre d'or », sous-titre SETTINGS.name fB 11 letterSpacing 0.5, filet 30x1 paperLine) sans emoji ; mots SANS guillemets, chacun dans un div incliné par hachage stable de l'id (tilt : h%5-2 x 0.4 degré, PAS d'animation sur ces transforms) ; signature fine à droite (Avatar 16 + prénom fH 17 inkFaintPaper) avec croix 12 opacité 0.5 sur MES mots ; « écrit à livre ouvert » en ligne fB 9.5 opacité 0.85 alignée droite (plus de pilule) ; filets 26x1 centrés entre les mots (plus de tirets pleine largeur) ; zone d'écriture : placeholder « Votre mot... », rangée basse : mention « Livre ouvert : visible immédiatement. » à gauche, bouton @ + « Signer le livre ✎ » (fH 19 seaDeep, transparent, inkFaintPaper désactivé) à droite. Tests adaptés : placeholder « Votre mot », titre « Le livre d'or », bouton « Signer le livre » (/tmp/testment.js, /tmp/testlivre.js, nouveau /tmp/testdesign.js : page de garde, sans guillemets, inclinaisons, filets, étiquette, boutons). Déployé v81 / cache vacances-v82.

## Étiquettes photos en mode souvenir v82 (livré)
Prop noLabel sur PhotoOfDay (masque le badge « Photo du jour » / « Dernier souvenir ») propagée par PhotoStrip (cas une photo et carrousel). Le mode souvenir de ScreenNow passe noLabel au PhotoStrip : plus d'étiquettes redondantes une fois le séjour terminé (la SouvenirCard nomme déjà « La photo du séjour ») ; pendant le séjour, rien ne change. Test /tmp/testnolabel.js aux deux dates. Déployé v82 / cache vacances-v83.

## Carnet de voyage v83 (livré)
Mode souvenir redessiné en carnet : SouvenirSky({periode}) : svg 320x128 pleine largeur (margin 0 -18px), dégradé souvSky (#FFF4DE, #FFE4C4, #FFD9BC), soleil bas (250, 74) halo + disque, 5 étoiles vtwinkle décalées, RÉUTILISATION de <Landscape type night={false}/> dans un g translate(0,10) + ligne d'horizon #B08A5A 0.3, titres en absolu (label uppercase CSS #8A6E4B, titre fH 37 #233B45, période fB #6E6046 ; couleurs FIXES car le ciel est un objet clair, lisible aussi en mode sombre). SouvenirCard v2 (fragment, le parent flex column gap 18 espace les objets, plus de carte englobante) : 4 tampons de passeport (cercle 72 border 2.2 solid + cercle interne dashed, encres seaDeep/coralDeep/#A5822F/#7E5DA8, rotations -6/3/-3/5, chiffres tabular, libellés uppercase CSS) ; ticket à talon (fond #FFF8E9, rotate 1.2, talon 🤩 séparé par border dashed #E3D3AE, libellés encre #A5822F/#4A3B23/#8A7A55, ouvre la fiche) ; polaroïd star (fond #ffffff, padding 11, rotate(-2), ombre 0 10 26, DEUX scotchs rgba(255,236,170,0.6) rotate ±38 en spans absolus, légende fH « La photo du séjour · ❤ N ») ; boutons film/quiz inchangés. PhotoStrip variant="polaroid" : slides 74 pour cent snap center, cadre blanc, rotation stable par hachage (±1 à ±2.2 degrés), signature Avatar 17 + prénom fH, cœur compteur, points conservés, padding vertical 10/14 pour les rotations ; le rendu normal (pendant séjour) intact. Aucune animation sur les éléments porteurs de transform (contrôlé). Tests : /tmp/testcarnet.js (ciel, silhouette, 5 étoiles, 4 tampons inclinés, ticket, polaroïd, 2 scotchs, carrousel, conflits=0) ; testsouv adapté (« Souvenirs » en casse réelle, textTransform CSS ne change pas textContent). Déployé v83 / cache vacances-v84.

## Écran souvenir lot A v84 (livré) : spec « Améliorations de l'écran souvenir »
PIÈGE MAJEUR RENCONTRÉ : importer l'icône lucide `Map` masque le constructeur global `Map` et casse `new Map()` (groupement des photos par jour dans ScreenWall) : « TypeError: ei is not a constructor » sur l'onglet Photos. TOUJOURS importer `Map as MapIcon`. Détecté par le smoke test riche.
Livré : 1.1 dédoublonnage (star calculé dans ScreenNow par pickStar et exclu du PhotoStrip) ; 1.2 partiel (cascade pickStar(photos, faces) : coeurs >= ceil(actifs/2) « Votre photo élue », sinon visages si cache présent « La photo de groupe » (lot B), sinon max réactions « La photo du séjour » ; compteur masqué si < 3) ; 1.3 (rangée film/quiz supprimée, bouton play 58px en overlay du polaroïd héros, photo cliquable dessous) ; 2 barre de 4 actions (pastilles 46 dashed, cible 56x44 mini : Film, Quiz, Carte, Partager ; tampon « lieux » tappable vers la carte) ; carte PlacesMap plein écran (tuiles OSM brutes comme PointPicker, PAS de Leaflet qui n'existe pas dans l'app, ajustement auto du zoom sur les bornes, marqueurs MapPin + étiquette de nom, drag, zoom, attribution) ; 3 partiel : ShareSheet (mode "share") avec Web Share API, repli presse-papiers, ligne « Récap PDF » désactivée et annoncée (lot B) ; 4.1 compteur « 3 / 17 » à la place des points ; 4.2 attribution seulement en tête de série d'auteur ; 5.1 croix masquée, appui long 550 ms (touch et souris) puis bouton « Retirer » 44px avec window.confirm ; 5.2 mention par entrée supprimée ; 5.3 séparateur après chaque mot sauf le dernier ; 6 seuils (photos < 3 remplacé par personnes, messages < 10 remplacé par km parcourus via distM sur les lieux consécutifs sinon jours, toujours 4 tampons) ; 7 moment préféré masqué sous 3 réactions.
RESTE (lot B) : 1.2 détection de visages face-api.js tiny_face_detector chargée à la demande depuis un CDN + poids hébergés, cache localStorage, indicateur au-delà de 2 s ; 4.3 recadrage sur barycentre des visages sinon tiers supérieur (objectPosition) ; 3.2 récap PDF (jsPDF chargé à la demande). Non testable en jsdom : validation sur appareil nécessaire.
Tests : /tmp/testlotA.js (MODE stats|hero|moment|actions|livre, variables NMSG NPH LIKES VIBE). Déployé v84 / cache vacances-v85.

## Écran souvenir lot B v85 (livré)
Bibliothèques AUTO-HÉBERGÉES dans le dépôt (pas de CDN, pas de précache : le service worker est network-first et les met en cache après le premier usage) : vendor/face-api.min.js (664 ko, npm face-api.js@0.22.2 dist), vendor/jspdf.umd.min.js (364 ko, jspdf@2.5.1), models/tiny_face_detector_model-weights_manifest.json + shard1 (193 ko, raw.githubusercontent justadudewhohacks/face-api.js master weights). Chargement à la demande par loadScriptOnce(src) (balise script data-lib, data-ok, promesse partagée).
detectFacesFor(photos, onProgress) : cache localStorage vacances_faces_v1 par id de photo {n, score, cx, cy} ; ne traite que les photos absentes du cache ; loadFromUri("models") ; TinyFaceDetectorOptions inputSize 320 scoreThreshold 0.5 ; score = n x (surface moyenne des boîtes / surface image) ; barycentre normalisé cx, cy ; garde « dimensions inconnues » si naturalWidth vaut 0 (sinon barycentre infini, révélé par le test) ; les échecs ne sont PAS mis en cache (nouvelle tentative à la session suivante) ; images en crossOrigin anonymous (Supabase envoie les en-têtes CORS).
ScreenNow : hooks EN TÊTE (tripOver calculé avant, faces/scan/scanRef puis useEffect sur [tripOver, nPhotos]) ; ne lance rien si navigator.onLine === false ; indicateur « Analyse des photos... 3/17 » (RefreshCw vspin) seulement au-delà de 2 s (setTimeout arme scan, onProgress ne le crée pas) ; star = pickStar(photos, faces). faceCrop(faces, p) : objectPosition barycentre clampé 10-90 pour cent, sinon « 50% 33% » (tiers supérieur), appliqué au carrousel ET au héros.
makeRecapPdf({events, photos, messages, periode}) : A4, fond crème, titre, période, filet, 4 chiffres (souvenirStats factorisée, partagée avec SouvenirCard), photo du séjour convertie en JPEG par canvas (toDataURL 0.82, largeur max 1400) avec cadre blanc et légende, livre d'or (mots en italique + prénom à droite, splitTextToSize, coupé à y 268), pied « C où déjà ? » ; sortie blob : Web Share avec fichier si navigator.canShare, sinon lien de téléchargement. souvenirPeriode() factorisée.
Tests /tmp/testlotB.js (MODE detect|cache|offline|pdf) : faux face-api et faux jsPDF injectés en interceptant document.head.appendChild ; Image simulée par un setter de src qui lit « #fN » dans l'URL pour produire N visages ; PIÈGE jsdom : naturalWidth est en lecture seule, utiliser Object.defineProperty sinon le test fausse le barycentre. Déployé v85 / cache vacances-v86.

## Zones tactiles v86 (livré) : audit de la contrainte transverse 44 points
Audit après coup de la spec souvenir : 4 boutons sous 44 points ont été élargis SANS changer leur apparence (zone de toucher étendue par padding, pilule visuelle conservée dans un span interne) : « Retirer » du livre d'or (26 vers 44 par padding 9px, pilule 26 en span), bouton « @ » (34 vers 44), « Signer le livre » (padding 9px 4px, minHeight 44), cœur des polaroïds du carrousel (padding gauche 12, minWidth/minHeight 44, justifyContent flex-end pour garder l'icône au bord). Test /tmp/testtouch.js : parcourt tous les boutons et signale ceux dont width/height/minWidth/minHeight est sous 44.
CONNU ET NON CORRIGÉ (hors spec, antérieur) : les boutons de l'en-tête (Jeux, Le groupe, Réglages) font 38 et la croix des feuilles 32 ; les élargir modifie la largeur de l'en-tête sur petit écran, à faire avec un contrôle visuel. Déployé v86 / cache vacances-v87.

## Récap PDF v2, carnet de voyage v87 (livré)
makeRecapPdf réécrit (jsPDF, une page A4) : fond crème ; bandeau ciel 46 mm en 26 bandes interpolées (#FFF5E0 vers #FFD8BA), soleil (cercle + halo GState opacité 0.45 si dispo), ligne d'horizon, voilier en 3 polygones (helper poly via doc.lines, points absolus convertis en segments relatifs, fermé) ; titre et période par-dessus. Tampons : 4 doubles cercles (externe plein 0.75, interne pointillé setLineDashPattern([1.1,1.3])), encres RVB (46 107 128 / 222 90 70 / 165 130 47 / 126 93 184), chiffre et libellé inclinés (option angle de doc.text) avec charSpace 0.5. Polaroïd héros : ombre grise décalée, cadre blanc, image RECADRÉE en 4/3 par canvas (toJpegCrop(url, w, h, center) : fenêtre source centrée sur le barycentre des visages du cache sinon 0.5/0.42, drawImage 9 args), scotchs jaunes semi-transparents pivotés (poly + GState 0.55), légende italique. Colonne droite x136 : « La bande » (prénoms), ticket « Le moment préféré » (roundedRect crème, séparation verticale pointillée, times italic) si bestN >= 3, « Nos lieux » (12 max, 6 lignes max). Livre d'or : titre + filet, mots en times italic 11 avec espaces insécables dans les guillemets, prénom à droite, coupure à y 250 avec « et N autres mots dans l'app ». Mosaïque : jusqu'à 4 mini polaroïds 41x33 (photos hors héros triées par coeurs puis date, recadrées 4/3, seulement si >= 2). Pied centré. GARDES : GState entouré de try/catch (opacité ignorée si absent), échec d'image du héros ou d'une vignette non bloquant.
Test /tmp/testlotB.js MODE=pdf : faux jsPDF en Proxy attrape-tout (compte addImage, circle, text) : 3 images, 10 cercles attendus avec 3 photos de test. Déployé v87 / cache vacances-v88.

## PDF v3, polices et finitions v88 (livré)
Retour d'export réel : le grec sortait en mojibake (polices jsPDF = WinAnsi seulement), la mosaïque chevauchait le pied, « Mykonos · Mýkonos » en doublon. Corrections : vendor/DejaVuSans.ttf + Bold + Oblique (npm dejavu-fonts-ttf 2.37.3, 2.1 Mo à trois) chargées à la GÉNÉRATION seulement (loadDejaVu : fetch, arrayBuffer, base64 par tranches de 32k avec String.fromCharCode.apply, promesse partagée réinitialisée en cas d'échec ; doc.addFileToVFS + addFont famille « DejaVu » normal/bold/italic) ; F = triplets de police utilisés partout (repli helvetica/times si échec) ; clean(s) : retire émojis (plages 1F000-1FAFF, 2600-27BF, FE0F, 200D) et, en repli latin seulement, tout caractère hors x20-xFF. Mosaïque yy 252 hauteur 31, pied à 291.5. placeKey(n) (minuscule, NFD sans diacritiques, espaces réduits) appliquée aux quatre dédups : souvenirStats, SouvenirCard, App (carte), PDF. Déployé v88 / cache vacances-v89.
Champs d'activité disponibles pour l'export programme : day, start, end, type, title, place{name, coord}, note, budget (12 usages de note:, budget présent).

## Deux exports PDF v89 (livré) : carnet souvenir et programme
Validés sur maquettes reportlab avant implémentation (règle mémorisée : AUCUNE note explicative ni titre-action dans les livrables). vendor/Caveat-Regular.ttf + Caveat-Bold.ttf (googlefonts/caveat main fonts/ttf, 298+303 ko) ; loadCaveat comme loadDejaVu ; pdfSetup(doc, JSP) charge DejaVu + Caveat et retourne {F, FC, hand(s, bold), clean, setOpacity, poly, tape, toJpegCrop, polaroidTilt} ; hand() bascule sur DejaVu si le texte contient grec/cyrillique/hébreu/arabe/CJK (Caveat ne les couvre pas) ; polaroidTilt(cx, cy, w, ih, angleCSS, photo, faces, legende) : cadre et ombre en polygones pivotés, addImage avec rotation = -angle (jsPDF tourne en antihoraire autour du coin), scotchs, légende inclinée : VALIDER LE SENS DE ROTATION SUR APPAREIL. Helpers module : dayOfTs (jour local depuis startISO), dayLabel (toLocaleDateString fr long), fmtDur, vibeOfEvent, avisLabel (Adoré >= 5, Apprécié >= 3), reactsOfMsg, buildPlaces (dédup placeKey ordre chronologique, numérotation partagée carte/adresses), mapImage(places, wPx, hPx) : tuiles OSM assemblées en canvas (même projection que PlacesMap, zoom englobant, marqueurs numérotés dessinés, attribution OpenStreetMap, échecs de tuiles tolérés).
makeSouvenirPdf : couverture (dégradé 60 bandes pleine page, soleil, étoiles, horizon, voilier, titre Caveat 46 incliné, période + prénoms, polaroïd star incliné, 4 tampons jours/photos/lieux/km) ; une page par jour : bandeau #FFECD6, titre Caveat 25, itinéraire stylisé (béziers pointillés corail via doc.lines segments 6 valeurs, alternance verticale, cercles numérotés, nom + heure), 2 polaroïds inclinés (ou 1 grand), ticket temps fort si vibe >= 3, mot du jour = message texte du jour au max de réactions (rendu Caveat 16 signé), 3e polaroïd si la place le permet, numéro de page ; livre d'or final : pages fond #FFFBF0 à couture pointillée, titre Caveat 30, mots Caveat 17 inclinés par hachage, signatures, filets courts, report sur page suivante si déborde, 4 mini polaroïds si yv < 214.
makeProgramPdf : P1 bandeau ink, « L'essentiel » 4 cartes (rythme à virgule française), « Les incontournables » top 3 par réactions, carte OSM 178x71.6 mm, « Le rythme » (moyenne + heure médiane de première sortie) ; tableaux par jour (bandeau sea pleine largeur, plage horaire, zébrage, heure + durée + titre + sous-ligne lieu · note + pastille d'avis, coupure de page ensure()) ; « Par envie » par TYPE_ORDER avec puce TYPES[t].color et dédup par titre ; « Les adresses » zébrées : nom numéroté, GPS 4 décimales, textWithLink « ouvrir dans Maps » (URL Google Maps universelle par coordonnées sinon par nom) ; pieds numérotés x/y en boucle finale setPage.
ShareSheet : 3 entrées (film, Carnet souvenir, Programme), sendPdf factorisé (File + canShare sinon téléchargement). Tests /tmp/testlotB.js MODE=pdf : stub Proxy compte addPage/addFont/addImage/textWithLink, ctx canvas en Proxy attrape-tout, fetch simule les ttf (FONTS=0 pour le repli) ; carnet : 7 addPage, 5 polices, 6 images ; programme : 2 addPage, carte, lien ; PIÈGE : cibler « itinéraire détaillé » car « Programme » est aussi l'onglet du bas. Déployé v89 / cache vacances-v90.
À valider sur appareil : rendu Caveat, sens des rotations, carte OSM réelle, liens cliquables, poids et temps de génération (8 pages + photos).

## Exports PDF v2 corrective v90 (livré)
Retour utilisateur sur les rendus réels : « très moyen », amélioration large demandée avant retours détaillés. Diagnostics et corrections :
- Pages jours 1 à 3 quasi vides (photos toutes datées de l'envoi, donc jours 4 à 6) : JOURNÉES EN FLUX CONTINU (ensureS(h), newPage) au lieu d'une page forcée par jour ; un jour sans photo occupe 50 mm au lieu d'une page. Jour vide d'events ET de photos sauté.
- Itinéraires répétant « Aiolos Villa » : étapes = titreDe(e) (titre d'activité ; repli lieu puis TYPES label ; filtre « sans titre »).
- Selfie promu « photo de groupe » : pickStar exige f.n >= 2 et score = n x f.score (poids quadratique du nombre de visages).
- Couverture : titre Caveat 50 centré angle -1.5, période sur 2 lignes max centrée, soleil réduit (178, 72, r 9 + halo 17) hors du texte, 5 étoiles + 2 oiseaux (béziers), horizon y 108, voilier à gauche, polaroïd star (107, 176) w 126 angle -3, tampons cy 252-258, KM charSpace 0.3.
- polaroidTilt : fh = ih + (legend ? 17 : 9) : plus de bande blanche sous les photos sans légende.
- Livre d'or : mosaïque à yv + 26 (dynamique) au lieu de position fixe ; numéros de page en bas à DROITE (194, 291) pour ne pas heurter la signature centrée.
- Programme : disque gris du bandeau remplacé par le voilier blanc ; P1 remplie : « Le rythme » enrichi (2e phrase « Au programme : x activités, y repas... » par types) AVANT la carte agrandie 178x92.3 (mapImage 1070x555) ; titreDe partout (tableaux, incontournables, par envie) ; fmtDur retourne vide si end === "23:59".
Tests : carnet 2 addPage avec le jeu de test (flux compact : normal), 6 images, 5 polices ; programme 2 addPage, carte, lien ; dégradé FONTS=0 ONLINE=0 ok ; detect, smoke, hero verts. Déployé v90 / cache vacances-v91.

## Exports v3 créative v91 (livré)
Demandes : programme avec vraies adresses, types visibles, circuit par jour ; carnet avec couverture scrapbooking créative, récit du jour, variations graphiques.
- mapImage(points, wPx, hPx, opts) REFACTORÉE : points = [{coord, label}], opts {route: [coords] polyligne pointillée chronologique (canvas setLineDash, corail ou sépia), sepia: filtre ctx.filter saturate/sepia (toléré si non supporté), markerR, maxZoom}. etapesJour(evs) : séquence chronologique dédupliquée des lieux consécutifs + groupement par lieu (labels « 1·4 ») : {points, route}.
- reverseAddr(coord) : Nominatim reverse (accept-language fr, zoom 17), cache localStorage vacances_addr_v1, espacement 260 ms entre requêtes, AbortController 6 s, FUSIBLE global REVERSE_DOWN au premier échec (les suivants passent en GPS sans délai). Adresse = rue + numéro, ville ; repli display_name 2 segments ; repli final GPS.
- recitDuJour(d, evs, messages, bestE, bestV) : petit récit en gabarits variés indexés par jour (ouvertures, milieux énumératifs, clôtures, temps fort avec garde anti-répétition) + intégration future de SETTINGS.dayNotes[d][pid] (« X note dans le carnet : ... », 2 max, 140 car.) : la saisie des retours de journée reste À CONSTRUIRE côté app.
- Carnet couverture : tampon incliné « CARNET DE VOYAGE » double cadre pointillé, titre Caveat 48 souligné d'un trait bezier corail à main levée, étiquette kraft ombrée scotchée (dates Caveat), prénoms manuscrits, carte du séjour SÉPIA collée inclinée (cadre blanc, ombre, 3 scotchs, rose des vents dessinée, circuit chronologique des lieux uniques), polaroïd star 62 mm chevauchant le coin de la carte, tampons variés t1 rond double / t2 visa rect / t3 ovale (doc.ellipse, repli cercle) / t4 cercle pointillé inversé.
- Pages jours : bandes 6 teintes, doodle(d%6) au trait (soleil, cocktail, vague, boussole, étoile, appareil photo) en bout de bandeau, scotchs 6 teintes, angles de polaroïds par jour, récit Caveat 13.5 max 6 lignes entre itinéraire et photos.
- Programme : puce TYPES[t].color + label du type en tête de sous-ligne (« Repas · Baboulas Ouzeri · résa 21h ») ; mini-carte 178x39.9 (1070x240, maxZoom 14) sous chaque jour à 2 points ou plus avec circuit ; adresses : boucle for-of async, nom (128 mm) + sous-ligne adresse réelle ou GPS, lien inchangé, lignes h 11.2 zébrées.
Tests : carnet 7 images (carte couverture incluse), programme carte P1 ; jeux de test sans mini-cartes jour (1 seul lieu/jour) ; dégradé FONTS=0 ONLINE=0 ok (couverture sans carte : bloc try). Déployé v91 / cache vacances-v92.
BACKLOG AJOUTÉ : espace de saisie « retour sur la journée » par participant (SETTINGS.dayNotes) consommé par le récit du carnet.

## Film narratif v92 (livré)
FilmOverlay ENTIÈREMENT réécrit (props events + photos + messages + onClose ; appel App adapté ; useMemo AJOUTÉ à l'import React, il n'y était pas). buildFilm construit les scènes : titre (4.2 s), voyage (5.4 s, véhicule détecté par detectVehicule : regex ferry/vélo/avion sur titres et lieux, défaut avion), puis par jour ayant events ou photos : intertitre (2.5 s), trajet si >= 2 lieux (3.3 s), photos (1 = plein cadre Ken Burns 3.6 s ; 2 = duo 4 s ; >= 3 = trio en éventail 4.4 s), temps fort si vibe >= 3 (3 s), mot du jour (3.8 s), et final (9 s, reste sur place).
IleStylisee : enveloppe convexe (monotone chain) des lieux élargie x1.55/1.7 et lissée en quadratiques = île sable sur mer dégradée SVG, 4 vagues en dérive, points corail avec noms (paintOrder stroke), route pointillée pathLength=100 animée fmDash, points éteints à 0.28 pour le trajet du jour (actifs allumés séquentiellement), numéros de séquence. VehiculeSVG : avion (4 polygones), voilier, vélo ; animateMotion SMIL rotate=auto le long d'un path bezier + traînée pointillée synchronisée.
Scènes DOM : keyframes fmZoomIn, fmWipe (volet), fmDash, fmKenA/B (Ken Burns alterné), fmIrisIn (clip-path circle), fmSlideIn, fmDrop (chute rebond cubic-bezier(.2,.9,.3,1.18)), fmConf (confettis 8 pièces), fmWordIn (mot à mot 90 ms), fmBar (barre). Chips jour + lieux sur les photos (fond sombre flouté), auteur avec Avatar en bas. Fin : pluie de 10 mini polaroïds positionnés par hachage, star centrée retardée 1.4 s, « C'était X, et c'était nous. », prénoms cadencés 0.35 s, boutons Revoir (setI(0)) et Fermer, la scène finale n'auto-avance pas. Barre stories segmentée (segment actif animé sur la durée de la scène), zones tactiles prev 28 % / next 38 %, croix 44 pt aria « Fermer le film ».
Test /tmp/testfilm.js (harnais dérivé de testlotB, SEED, WHEN 16/07) : ouvre via aria « Revoir le film du séjour », avance par « Scène suivante », relève data-scene : titre>voyage>jour>trio>fin, fermeture vérifiée, process.exit en fin (sinon les timers retiennent node). Déployé v92 / cache vacances-v93.
À VALIDER SUR APPAREIL : animateMotion et clip-path sur iOS Safari, fluidité des chutes, lisibilité des noms sur l'île, durée totale (60 à 90 s selon la matière).

## Adaptabilité du film v93 (livré) et audit
Question utilisateur : le film s'adapte-t-il au voyage ? Corrections immédiates : année dérivée de startISO (2026 était en dur dans le titre du film ET l'étiquette kraft du carnet) ; detectVehicule sans le fourre-tout /transport/ (les scooters livrés déclenchaient avion), aéroport multilingue (αερολιμ, airport, aeropuerto, flughafen, terminal), défaut VOITURE (SVG ajouté : carrosserie, vitre, deux roues) au lieu d'avion. Déployé v93 / cache vacances-v94.
AUDIT D'ADAPTABILITÉ (limites connues, lot proposé) : la mécanique narrative est entièrement pilotée par les données (jours réels, photos par jour, temps forts, mots, star, prénoms, période, durée totale) et dégrade proprement (sans coordonnées : pas de scènes carte ; sans photos : chapitres réduits). EN REVANCHE le DÉCOR reste estival et maritime : île entourée de mer, vagues, ciel chaud, confettis, voilier de couverture du carnet. Pour un séjour SETTINGS.tripType ville/ski/rando/mariage/detente/anniversaire (LAND_PALETTE, défaut mer), l'enveloppe des lieux dessinée en île entourée d'eau serait visuellement fausse (Paris entouré d'océan). LOT PROPOSÉ « décors thématiques » : décliner la scène carte du film (mer = île sable sur eau ; ville = pâté urbain gris sur fond clair avec skyline ; ski et rando = massif avec sommets ; campagne et détente = collines) et accorder ciel, palette et motifs (flocons au lieu de confettis en ski), en réutilisant les silhouettes des 7 paysages existants ; idem couverture du carnet (voilier conditionnel). NON ENGAGÉ, en attente de validation utilisateur.

## Film v2 et diaporama de galerie v94 (livré)
Retours : confettis inadaptés hors anniversaire, photos trop petites, trop rapides et superposées, sous-titres à rendre narratifs sans métriques, parcours à simplifier (pompage puis trait scintillant), livre d'or oublié, film à réserver au mode souvenir, galerie à remettre en diaporama classique.
- SÉPARATION : ScreenWall n'ouvre plus FilmOverlay mais Diaporama (nouveau composant, état App `diapo`, props onReact/onToggleTag) ; FilmOverlay reste accessible uniquement depuis SouvenirCard (rendue si tripOver). Réglage id "film" renommé « Diaporama photos » (il ne pilote que la galerie, seuil abaissé à 2 photos).
- Diaporama : enchaînement auto 3.6 s, barre segmentée dpBar, pause/lecture 44 pt, zones tactiles avant/arrière, avatar et compteur, rangée REACTIONS avec compteurs (pause auto au clic), bouton « Identifier » ouvrant le roster (pastilles avatar), pastilles « Sur la photo » si tags. data-diapo pour les tests.
- Film : scènes larges et lentes. buildFilm émet une scène PAR PHOTO (3 max par jour) avec style alterné par jour : plein (cover + Ken Burns 6.5 s + iris ou fondu), polaroid (min(86vw,520px), scotch, légende manuscrite), tirage (bordure blanche 11 px sur fond teinté), diptyque (2 photos moitié écran chacune, entrées fmSlideL/fmSlideR décalées). Durées 5 à 6.4 s.
- Sous-titres narratifs : legendesJour = momentLabel(start) (Au matin, À midi, L'après-midi, En soirée, Dans la nuit) + titreDe, sous-ligne lieu ; intertitre de jour = recitDuJour(..., { max: 2 }) (nouvel argument opts : max, sansChiffres avec gabarits fortSans) ; scène temps fort sans compte de réactions (titre + lieu).
- Celebration({ type }) selon SETTINGS.tripType via FETE : bulle (mer), lumiere (ville), flocon (ski), feuille (rando), petale (mariage, detente), confetti (anniversaire) ; keyframes fmRise, fmSnow, fmLeaf, fmConf ; fonds accordés (ski clair, ville sombre).
- IleStylisee refondue avec `sequence` : par lieu, anneau SMIL (r 2 vers 9, opacité 0.85 vers 0) + point (values 0;4.4;3.2) + nom, puis segment tracé (pathLength=1, stroke-dashoffset 1 vers 0) et scintillement continu (stroke-opacity et stroke-width alternées) ; pas de 1.15 s ; durée de scène = 1500 + n x 1150 + 700. SMIL choisi pour iOS. key par jour pour forcer le remontage.
- Livre d'or : scènes livreIntro (titre Caveat) puis une scène par mot (8 max), texte mot à mot (110 ms), avatar et signature, durée 2800 + mots x 190 (cap 7000), juste avant la carte finale.
Tests : /tmp/testfilm.js (MODE=film : titre>voyage>jour>plein>livreIntro>livre>fin ; MODE=diapo : bouton, ouverture, film absent de la galerie, réaction ❤️ vers ❤️ 1, identification 5 pastilles, fermeture). Déployé v94 / cache vacances-v95.

## Film thématisé et musique v95 (livré)
- BUG CORRIGÉ (visible en capture) : la pluie de photos finale s'alignait en deux rangées, car `top: (k * 37) % 74` a une période de 2 (37 x 2 = 74). Remplacé par un hachage `alea(k, s) = frac(sin((k+1)*12.9898 + s*78.233) * 43758.5453)` pour position, taille (60 à 102 px), format (4/3 ou 3/4), rotation (-17 à 17 degrés) et retard de chute ; 12 photos, opacité 0.72, voile radial `th.scrim` par-dessus pour la lisibilité du bloc central.
- THEMES : registre de 7 palettes complètes (ciel[3], astre, astreHalo, etoile, fond[2], sol, solL, relief, trait, point, encre, bandes[6], papier[2], papierTxt, fete, feteFond[2], feteTxt, feteLabel, fin[3], scrim, finTxt, finTxt2, finPied) plus `fam` (ile, ville, montagne, campagne). themeDe() lit SETTINGS.tripType. Tout le film s'y branche : générique, intertitres, fonds polaroid et tirage, papier des mots et du livre d'or, temps fort, carte, final.
- CarteStylisee (ex IleStylisee) : quatre familles rendues en SVG avec clipPath sur la masse (hull lissé via pathDe) : ile (mer dégradée, vagues, ourlet blanc, îlots), ville (fond clair, trame de rues obliques, 22 immeubles, avenues blanches), montagne (courbes de niveau à 0.74, 0.5, 0.28 vers le centroïde, 6 sommets, reliefs de fond), campagne (collines en bandes, 16 bosquets). Points et tracé prennent th.point et th.trait. Aléa déterministe par hachage.
- Musique : useMusique(type, actif) en Web Audio pur (aucun fichier, aucune licence) : registre MUS par thème (root, bpm 56 à 106, prog de 4 accords, timbres pad et pluck, volume), ordonnanceur lookahead 60 ms, nappe tous les 8 huitièmes, arpège continu, delay en croche avec réinjection 0.3, fondu d'entrée 3 s et fondu de sortie 0.35 s à la fermeture, ctx.close différé. Bouton 44 pt Volume2 et VolumeX à droite de la croix (aria « Couper la musique »). jsdom sans AudioContext : la hook sort proprement.
- Tests : /tmp/testfilm.js accepte TRIP=<type> (injecté dans settings.tripType) : les 7 thèmes rendent sans erreur ; MODE=diapo inchangé. Déployé v95 / cache vacances-v96.
- À VALIDER SUR APPAREIL : démarrage du son (iOS peut exiger un geste : le film s'ouvre par un tap, resume() est appelé ; si muet, toucher le bouton son), justesse musicale, lisibilité des cartes ville et montagne.

## Ajouts après la fin du séjour v96 (livré)
Question : comment les ajouts postérieurs (photos, livre d'or, activités) sont-ils pris en compte ? Audit :
- DÉJÀ EN PLACE : synchro Supabase (canal realtime + poll 5 s) ; CapsuleCard rendue AUSSI dans la branche souvenir de ScreenNow, et saveCapsule marque `open: true` dès que now >= révélation, donc un mot écrit après le séjour est publié aussitôt ; openAddToday clampe le jour à DAYS.length - 1, donc une activité ajoutée après la fin retombe sur le dernier jour et reste modifiable ; film et PDF sont recalculés à chaque ouverture (buildFilm en useMemo par montage, générateurs à la demande), rien n'est figé.
- BUG DE FOND CORRIGÉ : le rattachement à la journée reposait sur dayOfTs(at), c'est-à-dire la date d'ENVOI. Toute photo ou message ajouté après le séjour tombait au-delà du dernier jour et disparaissait des chapitres (film et carnet). Nouveaux helpers : dayDeScope(scope, events) (l'activité fait foi ; « general » exclu), dayDansSejour(at) (repli borné), dayOfPhoto(p, events) (p.event, toujours renseigné car l'ajout passe par le choix d'une activité), dayOfMsg(m, events) (m.scope = id d'activité ou « general »). Appliqués dans makeSouvenirPdf et buildFilm. EFFET RÉTROACTIF : les photos envoyées en bloc en fin de séjour rejoignent la journée de leur activité, ce qui corrige aussi le vieux défaut des jours 1 à 3 sans photo.
- Analyse des visages : scanRef restait à true après le premier passage, les photos ajoutées ensuite n'étaient jamais analysées dans la session. Le verrou est désormais relâché en fin de scan (relacher()), l'effet se relance sur nPhotos et ne traite que les photos absentes du cache.
- Test /tmp/testapres.js : séjour de 3 jours, photos et message déposés dans des activités des jours 1 et 2 mais horodatés 5 jours APRÈS la fin, plus un mot de livre d'or postérieur : le film raconte bien J1 et J2 avec leurs photos, le mot du jour et le livre d'or. Déployé v96 / cache vacances-v97.
- LIMITES CONNUES : un message de la discussion générale posté après la fin n'a aucune journée (exclu des chapitres, par choix) ; l'espace « retour sur la journée » (SETTINGS.dayNotes, consommé par recitDuJour) reste à construire.

## Photos : lot, suppression par appui long, ouverture ciblée v97 (livré)
- AJOUT PAR LOT : les trois entrées (AddPhotoTile, AddPhotoButton de la galerie, input « Photo » de la barre d'activité) passent en `multiple`. Nouveau lireLot(e, onEach, onDone) : au plus PHOTO_LOT_MAX = 20 fichiers, traités EN SÉRIE (setTimeout 0 entre chaque) pour ne pas saturer la mémoire d'un téléphone ; readAndDownscale gagne un troisième argument onFail (reader.onerror, img.onerror, catch) pour qu'un fichier illisible ne bloque pas la chaîne. ScreenWall : `pending` devient { urls: [...] } (accumulation par onPick successifs), la feuille montre la première vignette avec un compteur en pastille et le titre « Rattacher ces N photos à une activité ? », choose(eventId) dépose tout le lot.
- SUPPRESSION PAR APPUI LONG : PhotoTile enveloppé dans un div positionné (le bouton ne peut pas contenir d'autres boutons). Appui de 550 ms (onPointerDown, seuil de mouvement 10 px pour ne pas armer pendant un défilement, onPointerUp, onPointerLeave, onPointerCancel, onContextMenu bloqué, WebkitTouchCallout none) : voile rouge avec corbeille blanche, confirmation en deux temps, annulation par simple touche du voile ou automatiquement après 4 s. Droit : auteur, organisateur ou co-éditeur (monRole local, NE PAS utiliser myRole qui est local aux autres composants). Nouveau contexte React PhotoCtx (Provider autour du rendu de App, value { del: deletePhoto }) : PhotoTile appelle la suppression sans traverser quatre composants.
- OUVERTURE CIBLÉE : openPhoto(photo, contexte) stocke { id, ids } ; PhotoViewer ne reçoit que les photos du contexte (PhotoGrid passe sa propre liste, DailyChallengeCard la sienne), le mur reste sur toutes les photos. Une photo touchée dans une activité ne fait plus défiler tout le séjour.
- Test /tmp/testphotos.js : FileReader et Image simulés, files injecté par Object.defineProperty, vérifie inputs multiples, feuille « Rattacher ces 3 photos », 3 images ajoutées, armement par pointerdown + 750 ms, suppression effective, ouverture de la visionneuse. Déployé v97 / cache vacances-v98.

## Édition en place des activités v98 (livré)
Choix utilisateur : option 3 (édition en place, sans mode) face au double défilement Modifier puis Enregistrer.
- App : patchEvent(id, patch) = setEvents avec fusion ; DetailSheet reçoit onPatch, onDelete, favorites, onAddFavorite.
- DetailSheet : état `edit` (titre, type, horaire, lieu, budget, note) et `saved`. patch(p) applique et affiche « Enregistré » (Check, 1.7 s, timer nettoyé au démontage ; edit et confirmDel réinitialisés au changement d'activité).
  - Titre : bouton pleine largeur avec crayon, puis input autoFocus defaultValue, Entrée déclenche blur, enregistrement à la sortie si changé.
  - Type : TypeChip cliquable, rangée de pastilles (TYPE_ORDER + catégories personnalisées), sélection enregistre et referme.
  - Horaire : ScrollRow des jours + deux input type=time, cohérence début et fin conservée (majDebut, majFin reprennent la règle du formulaire), bouton Terminé.
  - Lieu : PlaceField réutilisé tel quel avec un draft synthétique ({...event, placeName, coord}) ; setDraft enregistre { place: { name, coord, area } }.
  - Budget (champ cost, jusque-là non éditable) et note : input et textarea, enregistrement au blur, invitations « Ajouter un budget » et « Ajouter une note » quand le champ est vide.
  - Helper ligne(icone, label, valeur, cle, vide) : InfoLine enveloppée dans un bouton 44 pt avec crayon si canEdit.
- Le bouton « Modifier l'activité » du bas est retiré ; « Supprimer l'activité » (confirmation en deux temps) prend sa place. EditSheet reste pour la création et le glissement Modifier.
- Test /tmp/testinline.js (WHEN=2026-07-10T11:00, le jour de l'activité doit être le jour courant sinon la carte n'est pas affichée) : titre, horaire, note enregistrés et persistés, indicateur présent, bouton Modifier absent, Supprimer présent.
- PIÈGE DE TEST : React mappe onBlur sur l'événement natif `focusout`. Dispatcher `blur` (qui ne remonte pas) ne déclenche rien : utiliser `new FocusEvent("focusout", { bubbles: true })`.
- testedit2.js adapté : il passait par « Modifier l'activité », il touche désormais la ligne du lieu ; à lancer avec WHEN=2026-07-14T12:00 (l'activité de test est au jour 4). Déployé v98 / cache vacances-v99.

## Film affiné v99 (livré)
Retours : photos mélangées et pas alignées aux activités, son muet, scotch trop systématique, carte trop longue, Jour N à mettre en avant.
- ALIGNEMENT (cause racine) : les photos ajoutées depuis le mur avec « Le mur seulement » portent event: "album" (aucune journée), et buildFilm les classait par dayOfPhoto qui retombe sur la date d'ENVOI, d'où le mélange. buildFilm(events, photos, messages, faces) : parJour = photos à event rattaché ; orphelines (event album ou sans jour) triées par date puis RÉPARTIES au prorata sur joursActifs (jours ayant au moins une activité). Chaque photo tombe donc dans une vraie journée avec sa légende narrative.
- STYLE PAR CONTENU (plus par jour) : nbVisages(p) via le cache faces. >= 3 visages → polaroïd scotché (5.2 s) ; sinon alternance plein cadre (5 s) et tirage à bordure fine (4.8 s). Le scotch cesse d'être systématique.
- CARTE CONDENSÉE : CarteStylisee, tous les points pompent quasi ensemble (t0 = 0.2 + i x 0.09, onde + pop + label) ; le circuit se dessine d'UN trait continu, chaque segment enchaîné, durée totale fixe 1.5 s répartie proportionnellement aux longueurs (plus de pas de 1.15 s par lieu). Scènes voyage 4.6 s (au lieu de 5.8) et trajet 3.4 s fixe (au lieu de croissant).
- JOUR EN AVANT : scène « jour » plein écran, volet coloré (accent = point/trait/feteLabel selon le jour), chiffre géant 38vw en filigrane opacité 0.1, pastille « Étape N sur X », titre Caveat jusqu'à 128 px, récit en dessous.
- SON iOS : useMusique relance ctx.resume() sur le premier pointerdown/touchstart/click/keydown tant que le contexte est suspendu (Safari bloque l'audio hors geste réel ; l'ouverture du film ne suffisait pas toujours). Écouteurs retirés au démontage.
- Test /tmp/testfilm2.js : pA (4 visages, jour 0) → polaroïd unique, pB et pMur → tirages, pMur (event album, envoyée jour 5) atterrit bien dans le film et non hors séjour, « Étape » présent, une seule scène trajet. Déployé v99 / cache vacances-v100.

## Film v100 : audio iOS, légendes fidèles, chip jour unique (livré)
Captures IMG_9836 (intertitre Jour 1) et IMG_9837 (photo du vol légendée « Arrivée à la villa »). Trois corrections.
- AUDIO (2e tentative, technique iOS éprouvée) : contexte audio UNIQUE et partagé au niveau module (AUDIO_CTX via ctxAudio(), créé paresseusement). debloquerAudio() joue un BUFFER SILENCIEUX (createBuffer 1,1,22050 + start) en plus du resume, appelé par des écouteurs document en PHASE DE CAPTURE (capture: true) sur pointerdown/touchstart/touchend/mousedown/click/keydown. C'est le déverrouillage standard iOS : un simple resume() d'un contexte créé hors geste restait muet. useMusique réutilise ce contexte (ne le crée ni ne le ferme plus ; nettoyage = fondu du master + disconnect des nœuds, le contexte partagé survit). jsdom sans AudioContext : ctxAudio() renvoie null, la hook sort proprement.
- LÉGENDES FIDÈLES : remplacé legendesJour(d, evs) (tableau apparié par index, d'où le vol légendé « Arrivée à la villa ») par legendePhoto(p, events) qui lit p.event et légende la photo avec SA propre activité (momentLabel + titre + lieu). Une photo du mur (event album ou introuvable) reçoit une légende VIDE plutôt qu'un titre d'activité voisin trompeur. buildFilm passe désormais chaque photo à legendePhoto.
- CHIP JOUR UNIQUE : chaque scène photo reçoit `premiere` (k === 0 dans la journée) ; le chip « Jour N · date » ne s'affiche que si sc.premiere, sur les scènes plein, polaroid et tirage. Supprime la répétition du rappel de jour sur chaque photo.
- Test /tmp/testfilm2.js enrichi : pA (rattachée à l'activité a0 « Arrivée », jour 0) affiche « Arrivée à la villa », pMur (album) n'affiche plus de titre d'activité ; scotch unique réservé au groupe, une seule scène trajet, bouton son présent. Déployé v100 / cache vacances-v101.
- À VALIDER SUR APPAREIL : le son sur iPhone réel (jsdom ne teste pas l'audio), en touchant l'écran une fois si besoin.
