# PrintLayout

Layer technique de mise en page pour impression. Fournit :

- `useUnits` : conversion cm/mm vers pixels CSS a 96 DPI.
- `usePrintPagination` : decoupe une grille de cellules (carre ou hexagone)
  en pages A4/A3 a l'echelle reelle, avec reperes de decoupe optionnels.

Ne connait rien du contenu des cellules (terrain, couleur...), uniquement
la geometrie et la pagination. Reutilisable pour n'importe quel contenu
imprime en grille a l'echelle reelle.
