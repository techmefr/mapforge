# CloudSync

Layer technique de synchronisation. Fournit `useSyncedState`, un remplacant
direct de `usePersistedState` (meme forme `{ state, persist }`) qui, en plus
de l'ecriture localStorage instantanee, pousse l'etat vers une table
Supabase `user_blobs` (debounce ~1.5s) quand l'utilisateur est connecte, et
tire les donnees cloud (qui gagnent sur le local) a la connexion.

Depend de `technical/Auth` (useAuth) et `technical/Storage`
(usePersistedState). Aucun lien avec le modele de donnees MapForge : la cle
de stockage est un parametre generique.
