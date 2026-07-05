# AiImageProviders

Layer technique de connexion a des fournisseurs d'IA de generation d'images
(Gemini "Nano Banana", OpenAI). Expose une interface commune `IAiImageProvider`
et un composable de selection de fournisseur + cle API. La cle reste en
memoire cote client, jamais persistee, et n'est envoyee qu'au fournisseur
choisi (header `x-goog-api-key` pour Gemini, jamais dans l'URL).

Gemini appelle reellement `generateContent` sur le modele
`gemini-2.5-flash-image` (Nano Banana) des qu'une cle est renseignee. OpenAI
reste un stub : sans cle valide ou en cas d'echec reseau, l'appelant doit
retomber sur une generation locale (mode demo).

Reutilisable dans n'importe quel projet ayant besoin de generation d'images
par IA, aucun lien avec le metier des tuiles ou des cartes.
