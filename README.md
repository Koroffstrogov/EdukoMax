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
- un écran Multiplications avec tables activables gratuitement ;
- un écran Modes spéciaux avec packs premium achetables en pièces ;
- un écran de session Multiplications de 8 questions ;
- tous les modes d'exercices de multiplication disponibles dès le début ;
- une boutique de thèmes ;
- un système de collectibles (cartes & badges) ;
- un écran Collection avec filtres et progression ;
- un écran Bilan professeur pour repérer les multiplications difficiles ;
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
- tables actives ;
- pièces ;
- thèmes possédés ;
- packs premium possédés ;
- meilleurs scores premium ;
- sessions ;
- cartes et badges de collection ;
- statistiques.

Depuis le panneau des profils, il est possible de choisir un profil existant en
un clic, de modifier le profil actif et de supprimer un profil. Les choix
d'icône et de thème favori du profil actif s'appliquent immédiatement. Le thème
favori proposé est gratuit ou déjà possédé par ce profil.

La création est séparée du reste du panneau : le formulaire apparaît depuis le
bouton `Nouveau profil`, puis permet de choisir pseudo, icône et thème favori.

Quand un profil est choisi, l'application recharge immédiatement la progression,
les pièces, les achats, la collection et le thème de ce profil. Une session en
cours est arrêtée pour éviter d'écrire une réponse dans le mauvais profil.

### Profil de test

Pour les essais rapides, créer un nouveau profil nommé exactement `TesT`.
Cette casse est volontaire et sensible à la casse.

Au moment de sa création, ce profil reçoit :

- toutes les tables de multiplication actives ;
- tous les packs premium débloqués ;
- toutes les cartes de collection acquises ;
- tous les badges acquis.

Renommer un profil existant en `TesT` ne déclenche pas ce remplissage. Il suffit
de supprimer puis recréer ce profil de test quand il faut repartir d'un état
plein.

## Progression multiplication

Les tables disponibles vont de 2 à 10. Toutes les tables sont visibles dès le
début comme des mondes à activer ou mettre en pause.

Tables actives au départ :

- 2
- 5
- 10

Toutes les autres tables sont gratuites aussi, mais désactivées au départ :

```txt
3, 4, 6, 8, 9, 7
```

L'enfant active ou désactive les cartes de tables. Une table active peut sortir
dans n'importe quel mode de multiplication ; une table désactivée reste visible,
mais ne sort pas dans les questions. Il faut garder au moins une table active.

Chaque multiplication est suivie individuellement avec un identifiant comme
`6x7`. Chaque profil possède sa propre mémoire complète des 81 multiplications
de `2x2` à `10x10`. La progression garde notamment :

- le nombre d'essais ;
- le nombre de réussites ;
- le nombre d'erreurs ;
- la série actuelle ;
- la meilleure série ;
- les derniers résultats ;
- la date de dernière réponse ;
- le temps moyen de réponse ;
- le score de maîtrise ;
- l'indicateur `needsPractice` quand la multiplication demande encore un
  entraînement ;
- la prochaine date de révision conseillée ;
- l'intervalle de révision ;
- la force de rappel estimée ;
- la dernière difficulté observée ;
- les points de table gagnés avec les bonnes réponses.

La progression sert à afficher un état pédagogique :

- Pas encore essayée ;
- En découverte ;
- En progrès ;
- Presque maîtrisée ;
- Maîtrisée.

Le moteur classe aussi les facts en mémoire interne :

- `new` : pas encore travaillée ;
- `easy` : réussie vite et régulièrement ;
- `hesitating` : réussie mais lente, récente ou fragile ;
- `struggling` : erreurs fréquentes ou récentes.

Le moteur prépare ensuite une file de session uniquement dans les tables actives
du profil actif. Cette file mélange facts à revoir, consolidation, réussites
faciles et découvertes pour garder un rythme doux. Les multiplications peu vues,
anciennes, lentes, marquées `needsPractice`, dues en révision espacée ou avec
des erreurs récentes remontent en priorité.

## Boutique et pièces

Chaque bonne réponse donne :

- `+1 pièce` ;
- `+1 point` sur la table travaillée.

Les tables ne s'achètent plus : elles servent de filtres gratuits pour choisir
les questions possibles. Les pièces se dépensent pour acheter des thèmes et des
packs de modes premium, sans argent réel. Les points de table restent comme
trace de progression.

L'écran Multiplications affiche le bonus avant de jouer. À la fin d'une
session, ce bonus de tables actives est ajouté :

```txt
(nombre de tables actives - 1) x 2 pièces
```

Exemples : 1 table active = +0 pièce, 3 tables actives = +4 pièces,
9 tables actives = +16 pièces.

Tous les modes de multiplication sont gratuits et disponibles dès le début. Les
thèmes restent des achats cosmétiques. Les packs premium sont des variantes
optionnelles pour jouer autrement.

Le compteur de pièces est affiché dans l'en-tête, sur l'accueil, sur l'écran
Multiplications, en session et dans les réglages. Il pulse quand le montant
change, avec respect de `prefers-reduced-motion`.

## Thèmes visuels

L'écran Réglages contient une boutique d'univers visuels. Les thèmes modifient
les couleurs globales, le fond de page, les cartes, les boutons, le compteur de
pièces et les cartes de mondes.

Thèmes gratuits possédés dès le début :

- 🌈 Kawaii Pop Club ;
- 🐱 Chats Cosmiques.

Thèmes achetables avec des pièces :

- 🎤 Studio K-Pop : 120 pièces ;
- 🦄 Licornes Néon Academy : 140 pièces ;
- 🩷 Squishy Planet : 160 pièces ;
- 💎 Bijoux & Charms Magiques : 180 pièces ;
- 🎨 Atelier Paillettes : 180 pièces ;
- 🧁 Pâtisserie Magique : 200 pièces.

Les anciens IDs de thèmes sont migrés automatiquement :

- `sunny` devient `kawaii-pop` ;
- `ocean` devient `cosmic-cats` ;
- `berry` devient `magic-bakery`.

La sauvegarde normalisée contient aussi :

```js
cosmetics: {
  ownedThemes: ["kawaii-pop", "cosmic-cats"],
  activeTheme: "kawaii-pop"
}
```

## Modes d'exercices

Tous les modes de multiplication sont affichés en cartes et jouables dès le
début :

- `direct-answer` : réponse directe ;
- `multiple-choice` : choix parmi 4 réponses ;
- `multiple-choice-8` : QCM 8 choix, plus difficile et plus rémunérateur ;
- `visual-groups` : groupes visuels simples ;
- `missing-factor` : facteur manquant ;
- `mixed` : mélange des modes.

La sélection prépare une file équilibrée de session, afin d'éviter un hasard pur
et d'éviter de répéter immédiatement une erreur. Le moteur applique aussi deux
gardes anti-répétition :

- la même multiplication ne doit pas être proposée 3 fois d'affilée si une
  alternative existe dans la session ;
- un QCM qui repropose la même multiplication juste après change ses
  propositions de réponses.

Les modes orientent aussi les facts choisies :

- `direct-answer` : rappel actif, facts dues ou à consolider ;
- `multiple-choice` : découverte et consolidation ;
- `multiple-choice-8` : consolidation avec 8 choix et bonus de pièces ;
- `visual-groups` : nouvelles facts et facts fragiles avec support visuel ;
- `missing-factor` : facts déjà un peu connues quand c'est possible ;
- `mixed` : rotation des formats avec une file équilibrée.

Le mode `multiple-choice-8` ajoute un bonus de fin de session égal à 50 % des
bonnes réponses du mode, arrondi à l'entier inférieur. Exemple : 8 bonnes
réponses donnent `+4 pièces` en plus des pièces déjà gagnées.

## Modes premium

Route principale : `#modes`.

Les modes gratuits restent accessibles sans achat. Les packs premium sont
visibles dès le début, verrouillés au départ, puis achetables avec les pièces du
profil actif :

- 🏆 `competitive-pack` — Défis Champions : 180 pièces ;
- 🌸 `chill-pack` — Mode Détente : 140 pièces ;
- 🧠 `science-pack` — Coach Mémoire : 220 pièces ;
- 💎 `magic-bracelets` — Bracelets Magiques : 160 pièces.

Routes disponibles :

- `#modes` : boutique des packs ;
- `#modes/competitive` : Défis Champions ;
- `#modes/chill` : Mode Détente ;
- `#modes/science` : Coach Mémoire ;
- `#modes/science/facts` : ouvre le bilan professeur avec le panneau Coach Mémoire ;
- `#modes/bracelets` : atelier Bracelets Magiques ;
- `#leaderboard` : classement local compétitif.

### Défis Champions

Modes inclus :

- `speed-60` : Sprint 60”, score basé sur les bonnes réponses ;
- `combo-max` : Combo Max, score basé sur la meilleure série.

Les scores sont enregistrés dans un top 10 local, partagé entre tous les profils
du navigateur. Le score garde le profil, l'icône, la précision, le mode et la
date.

### Mode Détente

Modes inclus :

- `garden` : Jardin des Multiplications, les bonnes réponses font pousser des
  fleurs ;
- `mascot-snack` : Goûter de la Mascotte, les bonnes réponses donnent des
  friandises.

Pas de chrono agressif ni de classement.

### Bracelets Magiques

Mode premium autonome : `magic-bracelets`.

Le mode se joue sans clavier : l'enfant clique ou touche de gros lots de perles
ou coffres. Une session contient 8 commandes et utilise la même file de
pratique que les autres modes, donc uniquement les tables actives du profil.

Variantes incluses :

- `groups` : choisir le bon lot de perles à ajouter sur chaque bracelet ;
- `total-mystery` : choisir le coffre contenant le total de perles ;
- `missing-lot` : retrouver combien de perles vont sur chaque bracelet.

Chaque commande met à jour la mémoire de la multiplication travaillée. Une
bonne réponse remplit les bracelets avec un effet scintillant, une réponse à
reprendre affiche une astuce douce et le bouton `Continuer`.

### Coach Mémoire

Modes inclus :

- `smart-review` : Révision Intelligente, priorité aux facts fragiles ;
- `anti-forget` : Mission Anti-Oubli, priorité aux facts anciennes ;
- `clever-mix` : Mix Malin, mélange de facts proches ou confusables.

Le coach utilise uniquement les tables actives du profil actif.
Il tient compte des facts fragiles, anciennes et dues en révision espacée.
Depuis l'écran Coach Mémoire, le bouton `Voir les multiplications` ouvre le
Bilan professeur. Le panneau Coach Mémoire y affiche les facts actuellement
ciblées par chaque mode : facts fragiles, anciennes ou proches à ne pas
confondre.

## Bilan professeur

Route : `#teacher`.

Le bouton icône `📊` de l'en-tête est disponible depuis tous les écrans. Il ouvre
un tableau d'analyse du profil actif uniquement.

Le bilan affiche les 81 multiplications de `2x2` à `10x10`, triées par priorité
de difficulté. Les données couvrent tous les modes de jeu confondus :

- essais ;
- réussites ;
- erreurs ;
- pourcentage de réussite ;
- erreurs récentes ;
- série actuelle ;
- temps moyen ;
- dernière révision ;
- modes joués depuis l'ajout du suivi par mode ;
- recommandation pédagogique.

Les filtres disponibles sont : Toutes, Fragiles, À revoir, Non essayées,
Maîtrisées.

Les anciennes données restent globales. À partir de cette version, les nouvelles
réponses alimentent aussi `modeStats` par mode de jeu, par exemple `mixed`,
`speed-60` ou `garden`.

## Session Multiplications

Depuis l'accueil, ouvrir `Multiplications`, activer les tables souhaitées, puis
choisir un mode avec le bouton `Jouer`.

Une session contient 8 questions courtes. Après chaque réponse :

- la progression de la multiplication concernée est mise à jour ;
- une bonne réponse affiche une petite animation de victoire, ajoute 1 pièce,
  pulse le compteur, puis passe automatiquement à la question suivante ;
- une mauvaise réponse affiche un feedback aidant avec une explication simple ;
- la multiplication ratée peut revenir plus tard dans la session, jamais
  immédiatement ;
- la même multiplication n'est pas servie 3 fois de suite quand le moteur a une
  autre multiplication disponible ;
- les QCM répétés sur une même multiplication changent leurs propositions ;
- le bouton `Continuer` est utilisé uniquement après une erreur.

À la fin de la session, l'application affiche un résumé avec le nombre de
réussites, le pourcentage de réussite, le bonus lié aux tables actives et les
bonus éventuels du mode. Les cartes et badges gagnés restent cachés derrière un
cadeau : l'enfant doit cliquer pour les dévoiler. Le compteur `Sessions
terminées` est ensuite sauvegardé localement.

## Sauvegarde locale

La sauvegarde utilise `localStorage` avec la clé :

```txt
edukomax.save.v1
```

La sauvegarde contient une liste `profiles` et un `activeProfileId`. Les
anciennes sauvegardes mono-profil sont migrées automatiquement vers un premier
profil.

Chaque profil possède aussi :

```js
premiumModes: {
  ownedPacks: [],
  highScores: {}
}
```

Chaque fact de multiplication peut aussi contenir un suivi par mode pour les
réponses enregistrées après l'ajout du bilan professeur :

```js
modeStats: {
  mixed: {
    attempts: 0,
    successes: 0,
    errors: 0,
    recentResults: []
  }
}
```

Chaque fact peut aussi contenir sa planification espacée :

```js
{
  nextReviewAt: null,
  reviewIntervalDays: 0,
  retrievalStrength: 0,
  lastDifficulty: "new"
}
```

Le classement compétitif global reste au niveau de la sauvegarde :

```js
leaderboards: {
  "speed-60": [],
  "combo-max": []
}
```

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
  theme-data.js
  theme-manager.js
  games/
    multiplication-session.js
  screens/
    app-shell.js
    home-screen.js
    multiplication-screen.js
    multiplication-session-screen.js
    premium-modes-screen.js
    leaderboard-screen.js
    teacher-screen.js
    profile-panel.js
    collection-screen.js
    settings-screen.js
  collectibles/
    collectible-data.js
    collectible-engine.js
    badge-engine.js
    collection-renderer.js
    reward-reveal.js
  premium-modes/
    mode-pack-data.js
    mode-pack-engine.js
    premium-session.js
    competitive-engine.js
    chill-engine.js
    science-review-engine.js
  story-modes/
    magic-bracelets-data.js
    magic-bracelets-engine.js
    magic-bracelets-renderer.js
  multiplication-data.js
  multiplication-generator.js
  practice-planner.js
  spaced-repetition-engine.js
  table-selection.js
  training-insights-engine.js
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
  spaced-repetition-engine.test.js
  practice-planner.test.js
  multiplication-session.test.js
  session-completion.test.js
  progress-engine.test.js
  mastery-engine.test.js
  reward-engine.test.js
  training-insights-engine.test.js
  mode-pack-engine.test.js
  competitive-engine.test.js
  science-review-engine.test.js
  premium-session.test.js
  magic-bracelets-engine.test.js
  magic-bracelets-renderer.test.js
  collectible-engine.test.js
  badge-engine.test.js
```

## Rôle des modules JavaScript

- `app.js` : démarrage de l'application, événements et rendu de la route active.
- `screens/app-shell.js` : en-tête, navigation et rendu de la route active.
- `router.js` : navigation simple par hash.
- `state.js` : état en mémoire.
- `storage.js` : lecture et écriture `localStorage`.
- `save-data.js` : validation, migration et modèle de sauvegarde multi-profils.
- `training-insights-engine.js` : rapport professeur, statuts mémoire et tri des difficultés.
- `theme-data.js` : catalogue des thèmes, prix, couleurs d'aperçu et migrations.
- `theme-manager.js` : application des thèmes.
- `reward-engine.js` : gains, achats de thèmes, états des tables et possessions.
- `collectibles/collectible-data.js` : définitions statiques de cartes et badges.
- `collectibles/collectible-engine.js` : logique de gain de cartes après session.
- `collectibles/badge-engine.js` : évaluation et attribution des badges.
- `collectibles/collection-renderer.js` : rendu grille de la collection.
- `collectibles/reward-reveal.js` : affichage des récompenses en fin de session.
- `premium-modes/mode-pack-data.js` : catalogue des packs et modes premium.
- `premium-modes/mode-pack-engine.js` : achat et possession des packs.
- `premium-modes/premium-session.js` : sessions premium et réponses.
- `premium-modes/competitive-engine.js` : scores et top 10 local.
- `premium-modes/chill-engine.js` : textes et compteurs des modes détente.
- `premium-modes/science-review-engine.js` : sélection intelligente des facts.
- `story-modes/magic-bracelets-*.js` : données, logique et rendu du mode Bracelets Magiques.
- `multiplication-data.js` : tables, facts et métadonnées pédagogiques.
- `multiplication-generator.js` : génération des questions.
- `practice-planner.js` : composition équilibrée des files de session.
- `spaced-repetition-engine.js` : planification espacée des facts.
- `table-selection.js` : tables actives et bonus de sélection.
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

79 cartes réparties en 10 univers thématiques (un par table + mode mix).
Chaque table possède 4 communes, 2 rares, 1 épique et 1 carte maîtrise.
Le mode mix contient aussi 3 cartes MAX.
Les cartes MAX apparaissent masquées dès le départ en haut de la collection pour
montrer qu'il existe un défi spécial à débloquer.

Raretés : `common`, `rare`, `epic`, `mastery`, `max`.

### Attribution des cartes après session

- Toujours au moins une chance de carte commune ;
- Si accuracy ≥ 75 %, chance de carte rare ;
- Si accuracy ≥ 90 % ou session parfaite, chance d'épique ;
- Carte maîtrise attribuée automatiquement quand une table est maîtrisée ;
- Carte MAX possible seulement si les 9 tables sont activées et si la réussite
  de la session est strictement supérieure à 90 % ;
- Maximum 3 cartes par session ;
- Si aucune nouvelle carte disponible, bonus de 2 pièces.

L'écran Collection explique ces règles avec un encart lisible pour l'enfant.
En fin de session, les récompenses sont dévoilées via une animation légère après
un clic sur le cadeau.

### Badges

20 badges liés aux exploits : première session, séries, sessions parfaites,
cartes rares/épiques, sessions cumulées, tables maîtrisées.

### Écran Collection

Route `#collection`. Affiche cartes et badges avec filtres par table et
rareté, barre de progression, et messages motivants. La grille utilise une
largeur plus importante sur desktop pour afficher davantage de cartes.

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
