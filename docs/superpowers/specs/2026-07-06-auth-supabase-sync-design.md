# Auth Supabase + sync cloud/local — design

## Contexte

MapForge est une SPA Nuxt (`ssr:false`) qui persiste aujourd'hui tout son état
(`IMapForgeData`: parties, tilesets, maps) dans `localStorage` via
`usePersistedState` (couche `technical/Storage`). Il n'y a aucune notion de
compte utilisateur. Le projet a des credentials Supabase déjà présents dans
`.env` mais aucune dépendance `@supabase/supabase-js` ni code d'auth.

Cette spec est la première d'une série de 3 :
1. **Auth Supabase + sync cloud/local** (ce document)
2. i18n infra + traduction complète de l'UI existante (FR/EN)
3. Panneau compte (thème clair/sombre, taille police, langue, clé API IA)

Le panneau compte complet (spec 3) construira sur les composables et le
schéma DB posés ici, mais cette spec livre déjà un login/logout fonctionnel
minimal (topbar + modale) pour être testable seule.

## Décisions validées avec l'utilisateur

- Compte connecté = sync cloud de **tout** : parties/tilesets/maps + (plus
  tard) préférences. Mode local reste le fallback complet si pas connecté.
- Clé API IA (Gemini/OpenAI) : **synchronisée cloud, chiffrée** (pas juste
  locale). Utilise Supabase Vault, jamais de clé en clair en DB.
- Méthodes de connexion : email/mot de passe, magic link, Google OAuth.
- Modèle de données cloud : **blob JSON unique par user** (pas de schéma
  relationnel par entité) — colle à l'architecture `usePersistedState`
  actuelle, aucune migration relationnelle nécessaire.
- Résolution de conflit au login : **le cloud gagne toujours** si une ligne
  cloud existe déjà pour la clé ; sinon le local est poussé vers le cloud.
  Pas de merge fin, pas d'UI de choix.

## Architecture

Deux nouvelles couches techniques, suivant le pattern DDD existant
(`technical/*`, réutilisables, sans lien avec le métier des tuiles/cartes) :

- **`technical/Auth`** : client `@supabase/supabase-js` en singleton
  (plugin Nuxt), composable `useAuth()` exposant `user`, `isAuthenticated`,
  `isLoading`, et les méthodes `signInWithPassword`, `signUpWithPassword`,
  `signInWithMagicLink`, `signInWithGoogle`, `signOut`. S'abonne à
  `onAuthStateChange` pour réagir aux évènements `SIGNED_IN`/`SIGNED_OUT`.
  Ne connaît rien du modèle de données MapForge.

- **`technical/CloudSync`** : composable générique
  `useSyncedState<T>(key, factory)`, même shape que `usePersistedState`
  (`{ state, persist }`) — remplacement direct. En interne :
  - localStorage toujours écrit instantanément (comportement actuel
    inchangé, marche 100% offline).
  - Si `isAuthenticated`, push débouncé (~1.5s) vers Supabase table
    `user_blobs`, en plus de l'écriture locale.
  - Sur événement `SIGNED_IN`, exécute la résolution cloud-gagne /
    push-si-vide décrite plus haut.
  - Sur `SIGNED_OUT`, arrête simplement le sync cloud ; la dernière copie
    locale reste en place (rien n'est effacé).

Pas de route serveur Nuxt nécessaire : RLS + `auth.uid()` suffisent pour
sécuriser l'accès aux données et au Vault. Le déploiement Vercel reste donc
une SPA statique simple (pas de Nitro server routes ajoutées par cette
spec).

`functional/Games/app/stores/games.store.ts` change uniquement l'import
`usePersistedState` → `useSyncedState` ; le reste du store est inchangé.

## Schéma Supabase

```sql
create table user_blobs (
  user_id uuid references auth.users(id) on delete cascade,
  key text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);
alter table user_blobs enable row level security;
create policy "own blobs" on user_blobs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

Une ligne par user pour `key = 'mapforge-data'` (le blob `IMapForgeData`).
La colonne `key` permet de réutiliser la table pour d'autres blobs plus tard
(ex: préférences de la spec 3) sans nouvelle migration.

```sql
create table user_secrets (
  user_id uuid references auth.users(id) on delete cascade,
  secret_name text not null,
  secret_id uuid not null references vault.secrets(id),
  primary key (user_id, secret_name)
);
alter table user_secrets enable row level security;
create policy "own secrets" on user_secrets
  for all using (auth.uid() = user_id);
```

RPC `SECURITY DEFINER` :
- `set_my_secret(name text, value text)` : crée/update le secret via
  `vault.create_secret`, upsert la ligne `user_secrets` liée à
  `auth.uid()` courant.
- `get_my_secret(name text)` : lit `vault.decrypted_secrets` uniquement si
  la ligne `user_secrets` correspondante appartient à `auth.uid()`.

Composable `useCloudSecret(name)` (couche Auth ou CloudSync) expose
`get()`/`set()` via ces RPC. Sera branché par la spec 3 sur
`useAiImageProvider` à la place du `useState` en mémoire actuel.

## Flux de données

**Chargement app (SPA mount)**
1. `useAuth` récupère la session existante (gérée par supabase-js dans son
   propre storage), s'abonne à `onAuthStateChange`.
2. `useSyncedState('mapforge-data', createDefault)` charge d'abord
   localStorage — synchrone, l'app démarre offline sans attendre le réseau.
3. Si une session est déjà active au mount, déclenche un pull cloud en
   arrière-plan et applique la résolution cloud-gagne si une ligne existe.

**Login (email/pass, magic link, Google)**
1. `useAuth.signIn*()` → succès → évènement `SIGNED_IN`.
2. `useSyncedState` réagit : `select` sur `user_blobs` pour la clé
   courante.
   - Ligne existe → remplace `state.value` local par les données cloud,
     réécrit localStorage.
   - Pas de ligne → `upsert` avec le `state.value` local courant (push
     initial).

**Édition en cours (ex: pose de tuile sur la map)**
1. `watch(data, ..., { deep: true })` déclenche l'écriture localStorage
   instantanée, comme aujourd'hui.
2. En parallèle, si `isAuthenticated`, debounce ~1.5s puis `upsert` sur
   `user_blobs`. Plusieurs éditions rapprochées ne produisent qu'un seul
   upsert.

**Logout**
1. `useAuth.signOut()` → évènement `SIGNED_OUT`.
2. `useSyncedState` arrête le sync cloud, conserve le localStorage tel
   quel — retour en mode local pur, aucune donnée effacée.

**Clé API** (câblage UI en spec 3, flux de données posé ici)
- `set` → RPC `set_my_secret`, débouncé.
- `get` → RPC `get_my_secret` au login / à l'ouverture du panneau compte,
  mis en cache mémoire uniquement (jamais en clair en localStorage).

## Gestion d'erreurs

- Pull/push cloud échoue (réseau, RLS...) → silencieux (try/catch, message
  `console` humain), l'app continue en local, retry au prochain cycle de
  debounce. Pas de blocage UI.
- Login échoue (mauvais mot de passe, email invalide, OAuth refusé) →
  toast via `useToast` existant, pas de crash.
- Magic link / OAuth callback → redirige vers l'app ; `localhost` et le
  domaine Vercel doivent être enregistrés dans Supabase Auth → URL
  Configuration → Redirect URLs.
- Résolution cloud-gagne : pas de merge fin donc pas d'état de conflit
  possible par construction — écrasement déterministe.
- RPC Vault échoue (secret introuvable, ligne pas à soi) → retourne
  null/erreur Postgres propre ; `useCloudSecret.get()` renvoie `null`,
  l'appelant retombe sur "pas de clé configurée" (comportement identique à
  aujourd'hui sans clé renseignée).
- Session expirée pendant l'usage → `onAuthStateChange` détecte
  `SIGNED_OUT` automatiquement (refresh token géré par supabase-js), le
  sync cloud s'arrête proprement, aucune perte de la copie locale.

## Tests

- Tests unitaires Vitest sur les composables, en mockant le client
  Supabase (même approche que les mocks Vuetify existants) :
  - `useAuth` : transitions d'état sur évènements mock (`SIGNED_IN` /
    `SIGNED_OUT`).
  - `useSyncedState` : logique cloud-gagne / push-si-vide / debounce
    (fake timers), fallback local si erreur réseau simulée.
- Pas de test d'intégration contre une vraie instance Supabase (pas
  d'instance de test dédiée prévue) — les mocks suffisent vu le scope
  indie/hobby du projet.
- Vérification manuelle post-implémentation : login/logout sur 2
  navigateurs différents, édition sur l'un, refresh l'autre → données
  cloud bien reçues.

## Déploiement Vercel

- Variables d'env `NUXT_PUBLIC_SUPABASE_URL` / `NUXT_PUBLIC_SUPABASE_KEY` à
  configurer sur Vercel (Production + Preview + Development).
- Supabase Auth → URL Configuration : ajouter le(s) domaine(s) Vercel aux
  Redirect URLs (en plus de `localhost` pour le dev).
- Google OAuth : configurer le client OAuth côté Google Cloud avec les
  origines/redirects Supabase (`<project>.supabase.co/auth/v1/callback`).
- Build reste `ssr:false` (SPA statique), aucune route serveur Nitro
  ajoutée par cette spec.

## Hors scope (renvoyé aux specs suivantes)

- Panneau compte complet, thème clair/sombre, taille de police, switch de
  langue (spec 3).
- i18n de l'UI existante (spec 2).
- UI de gestion fine de la clé API (spec 3) — seul le flux de données
  (RPC Vault) est posé ici.
