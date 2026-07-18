# Mise à jour de la fonction notify (notifications de mention)

La fonction `notify` gère désormais deux paramètres supplémentaires :
- `only` : liste d'identifiants à notifier exclusivement (utilisée pour les mentions).
- `exclude` : accepte une chaîne ou une liste.

Les notifications de message existantes ne changent pas. Le nouveau type `mentions` envoie « X vous a mentionné » uniquement à la personne visée.

## Déploiement

Deux options.

### Option 1, depuis l'interface Supabase (sans outil en ligne de commande)
1. Ouvrir le tableau de bord Supabase, projet zvnlyggusqtaukuwxgel.
2. Menu Edge Functions, ouvrir la fonction `notify`.
3. Remplacer le contenu de `index.ts` par celui du fichier `supabase/functions/notify/index.ts` de ce dépôt.
4. Déployer. Les secrets VAPID_PUBLIC, VAPID_PRIVATE, VAPID_SUBJECT et la vérification du jeton restent inchangés.

### Option 2, avec la CLI Supabase
```
supabase functions deploy notify --project-ref zvnlyggusqtaukuwxgel
```

Tant que cette mise à jour n'est pas déployée, une mention envoie la notification à l'ensemble du groupe au lieu de la seule personne citée. La notification de message classique, elle, fonctionne comme avant.
