# Games

Layer fonctionnel racine du domaine metier. Porte le modele de donnees
agregat (`IGame`, ses tilesets et sa carte), le store Pinia de selection
et de navigation (jeu ouvert, tileset selectionne, carte selectionnee),
et la sidebar de navigation entre jeux.

Les layers `Tilesets` et `Maps` s'appuient sur ce store pour lire/modifier
les tilesets et la carte d'un jeu.
