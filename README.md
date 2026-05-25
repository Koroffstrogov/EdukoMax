# EdukoMax

EdukoMax est une application éducative en HTML, CSS et JavaScript vanilla pour
des sessions courtes de mathématiques. Elle vise une interface moderne,
enfantine et lisible pour des enfants de 7 à 8 ans.

## Lancer l'application

L'application utilise des modules ES et se lance uniquement depuis un serveur
local. L'ouverture directe en `file://` n'est pas un mode supporté.

### Serveur local

```bash
python -m http.server 8000
```

Puis ouvrir <http://127.0.0.1:8000/> dans un navigateur moderne.

### Si `index.html` est ouvert directement

L'application affiche un message indiquant de démarrer un serveur local, puis de
recharger la page via `http://127.0.0.1:8000/`.

## Lancer les tests

Les tests sont exécutés dans le navigateur, sans framework ni dépendance :

```bash
python -m http.server 8000
```

Puis ouvrir <http://127.0.0.1:8000/tests/index.html>.

Les résultats s'affichent à l'écran avec le nombre de tests réussis/échoués.

## Utilisation actuelle

L'application contient :

- un écran d'accueil ;
- un écran de réglages ;
- une gestion de profils sans mot de passe ;
- un écran Multiplications avec mondes de tables achetables ;
- un écran de session Multiplications de 8 questions ;
- tous les modes d'exercices de multiplication disponibles dès le début ;
- une boutique de thèmes ;
- un système de collectibles (cartes & badges) ;
- un écran Collection avec filtres et progression ;
- une sauvegarde locale avec `localStorage` ;
- un moteur de progression pour les multiplications ;
- un générateur de questions de multiplication ;
- un système de pièces gagnées avec les bonnes réponses, visible sur les écrans
  principaux.

## Profils utilisateurs

EdukoMax peut gérer plusieurs profils d'enfants sur le même navigateur, sans
mot de passe. L'icône en haut à droite ouvre le panneau des profils.

Chaque profil stocke ses propres données :

- pseudo ;
- icône ;
- thème favori ;
- progression des multiplications ;
- tables achetées ;
- pièces ;
- thèmes possédés ;
- sessions ;
- cartes et badges de collection ;
- statistiques.

Depuis le panneau des profils, il est possible de choisir un profil existant en
un clic, de modifier le profil actif et de supprimer un profil. Les choix
d'icône et de thème favori du profil actif s'appliquent immédiatement.

La création est séparée du reste du panneau : le formulaire apparaît depuis le
bouton `Nouveau profil`, puis permet de choisir pseudo, icône et thème favori.

Quand un profil est choisi, l'application recharge immédiatement la progression,
les pièces, les achats, la collection et le thème de ce profil. Une session en
cours est arrêtée pour éviter d'écrire une réponse dans le mauvais profil.

## Progression multiplication

Les tables disponibles vont de 2 à 10. Toutes les tables sont visibles dès le
début comme des mondes à collectionner.

Tables débloquées au départ :

- 2
- 5
- 10

Tables verrouillées au départ mais achetables immédiatement avec des pièces :

```txt
3, 4, 6, 8, 9, 7
```

Il n'y a pas de prérequis de maîtrise, de niveau ou de table précédente pour
acheter une table verrouillée. L'enfant économise ses pièces et choisit le monde
qu'il veut ouvrir.

Chaque multiplication est suivie individuellement avec un identifiant comme
`6x7`. La progression garde notamment :

- le nombre d'essais ;
- le nombre de réussites ;
- le nombre d'erreurs ;
- la série actuelle ;
- la meilleure série ;
- les derniers résultats ;
- la date de dernière réponse ;
- le temps moyen de réponse ;
- le score de maîtrise ;
- les points de table gagnés avec les bonnes réponses.

La progression sert à afficher un état pédagogique :

- Pas encore essayée ;
- En découverte ;
- En progrès ;
- Presque maîtrisée ;
- Maîtrisée.

## Boutique et pièces

Chaque bonne réponse donne :

- `+1 pièce` ;
- `+1 point` sur la table travaillée.

Les pièces se dépensent pour acheter des tables et des thèmes. Les points de
table restent comme trace de progression, mais ne bloquent aucun achat.

Prix des tables :

- table 3 : 40 pièces ;
- table 4 : 50 pièces ;
- table 6 : 60 pièces ;
- table 8 : 70 pièces ;
- table 9 : 80 pièces ;
- table 7 : 90 pièces.

Tous les modes de multiplication sont gratuits et disponibles dès le début. Les
thèmes restent des achats cosmétiques.

Le compteur de pièces est affiché dans l'en-tête, sur l'accueil, sur l'écran
Multiplications, en session et dans les réglages. Il pulse quand le montant
change, avec respect de `prefers-reduced-motion`.

## Modes d'exercices

Tous les modes de multiplication sont affichés en cartes et jouables dès le
début :

- `direct-answer` : réponse directe ;
- `multiple-choice` : choix parmi 4 réponses ;
- `visual-groups` : groupes visuels simples ;
- `missing-factor` : facteur manquant ;
- `mixed` : mélange des modes.

La sélection des questions privilégie les multiplications peu vues, ratées ou
anciennes, afin d'éviter un hasard pur.

## Session Multiplications

Depuis l'accueil, ouvrir `Multiplications`, puis choisir un mode ou un monde de
table avec le bouton `Jouer`.

Une session contient 8 questions courtes. Après chaque réponse :

- la progression de la multiplication concernée est mise à jour ;
- une bonne réponse affiche une petite animation de victoire, ajoute 1 pièce,
  pulse le compteur, puis passe automatiquement à la question suivante ;
- une mauvaise réponse affiche un feedback aidant avec une explication simple ;
- le bouton `Continuer` est utilisé uniquement après une erreur.

À la fin de la session, l'application affiche un résumé avec le nombre de
réussites et le pourcentage de réussite. Le compteur `Sessions terminées` est
ensuite sauvegardé localement.

## Sauvegarde locale

La sauvegarde utilise `localStorage` avec la clé :

```txt
edukomax.save.v1
```

La sauvegarde contient une liste `profiles` et un `activeProfileId`. Les
anciennes sauvegardes mono-profil sont migrées automatiquement vers un premier
profil.

Pour repartir de zéro depuis la console du navigateur :

```js
localStorage.removeItem("edukomax.save.v1");
location.reload();
```

## Structure du projet

```txt
index.html
css/
  tokens.css
  base.css
  layout.css
  components.css
  collection.css
  themes.css
js/
  app.js
  router.js
  state.js
  storage.js
  save-data.js
  theme-manager.js
  games/
    multiplication-session.js
  screens/
    home-screen.js
    multiplication-screen.js
    multiplication-session-screen.js
    profile-panel.js
    collection-screen.js
    settings-screen.js
  collectibles/
    collectible-data.js
    collectible-engine.js
    badge-engine.js
    collection-renderer.js
    reward-reveal.js
  multiplication-data.js
  multiplication-generator.js
  mastery-engine.js
  progress-engine.js
  reward-engine.js
  multiplication-feedback.js
tests/
  index.html
  test-runner.js
  test-utils.js
  storage.test.js
  multiplication-generator.test.js
  progress-engine.test.js
  mastery-engine.test.js
  reward-engine.test.js
  collectible-engine.test.js
  badge-engine.test.js
```

## Rôle des modules JavaScript

- `app.js` : démarrage de l'application, événements et rendu de la route active.
- `router.js` : navigation simple par hash.
- `state.js` : état en mémoire.
- `storage.js` : lecture et écriture `localStorage`.
- `save-data.js` : validation, migration et modèle de sauvegarde multi-profils.
- `theme-manager.js` : application des thèmes.
- `reward-engine.js` : gains, achats de tables/thèmes, prix et possessions.
- `collectibles/collectible-data.js` : définitions statiques de cartes et badges.
- `collectibles/collectible-engine.js` : logique de gain de cartes après session.
- `collectibles/badge-engine.js` : évaluation et attribution des badges.
- `collectibles/collection-renderer.js` : rendu grille de la collection.
- `collectibles/reward-reveal.js` : affichage des récompenses en fin de session.
- `multiplication-data.js` : tables, facts et métadonnées pédagogiques.
- `multiplication-generator.js` : génération des questions.
- `mastery-engine.js` : calculs de maîtrise et priorités.
- `progress-engine.js` : enregistrement des réponses.
- `multiplication-feedback.js` : messages positifs ou aidants après réponse.
- `screens/profile-panel.js` : création, choix, modification et suppression des profils.

## Limites actuelles

- **Fractions** : socle réservé, pas encore implémenté.
- **Équations** : socle réservé, pas encore implémenté.
- **Tests** : couverture des moteurs métier uniquement ; pas de tests d'intégration UI.

## Système de collectibles

### Cartes

76 cartes réparties en 10 univers thématiques (un par table + mode mix).
Chaque table possède 4 communes, 2 rares, 1 épique et 1 carte maîtrise.

Raretés : `common`, `rare`, `epic`, `mastery`.

### Attribution des cartes après session

- Toujours au moins une chance de carte commune ;
- Si accuracy ≥ 75 %, chance de carte rare ;
- Si accuracy ≥ 90 % ou session parfaite, chance d'épique ;
- Carte maîtrise attribuée automatiquement quand une table est maîtrisée ;
- Maximum 3 cartes par session ;
- Si aucune nouvelle carte disponible, bonus de 2 pièces.

### Badges

20 badges liés aux exploits : première session, séries, sessions parfaites,
cartes rares/épiques, sessions cumulées, tables maîtrisées.

### Écran Collection

Route `#/collection`. Affiche cartes et badges avec filtres par table et
rareté, barre de progression, et messages motivants.

## Règles de développement

- Garder JavaScript vanilla.
- Utiliser des modules ES.
- Ne pas ajouter de framework.
- Ne pas ajouter de build step sans demande explicite.
- Ne pas ajouter de dépendance externe sans validation.
- Garder chaque fichier JavaScript sous 400 lignes.
- Ne pas mélanger rendu UI, logique métier et persistance.
- Mettre à jour ce README quand le comportement change.

## Vérification avant livraison

Vérifier que :

- l'application charge sans erreur console ;
- les tests passent via `tests/index.html` ;
- la sauvegarde `localStorage` fonctionne ;
- l'interface reste lisible en largeur desktop et tablette ;
- la logique de jeu reste séparée du rendu ;
- aucun fichier JS ne dépasse 400 lignes.
