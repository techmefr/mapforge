# Maps

Layer fonctionnel d'edition de carte. Porte la geometrie de grille
(carre/hexagone), le zoom, l'outil peindre/gomme, la palette agregeant
les tuiles de tous les tilesets du jeu, le placement des cellules et
la vue d'impression (assemblee via le layer technique `PrintLayout`).

S'appuie sur le store du layer `Games` pour lire/modifier la carte du
jeu selectionne.
