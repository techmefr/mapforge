# AiImageProviders

Layer technique de connexion a des fournisseurs d'IA de generation d'images
(Gemini, OpenAI). Expose une interface commune `IAiImageProvider` et un
composable de selection de fournisseur + cle API. La cle reste en memoire
cote client, jamais persistee ni envoyee ailleurs qu'au fournisseur choisi.

Aucun appel reseau n'est branche par defaut : tant qu'aucun fournisseur n'est
configure, l'appelant doit retomber sur une generation locale (mode demo).

Reutilisable dans n'importe quel projet ayant besoin de generation d'images
par IA, aucun lien avec le metier des tuiles ou des cartes.
