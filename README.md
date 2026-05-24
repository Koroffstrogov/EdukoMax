# EdukoMax

EdukoMax est une application éducative en HTML, CSS et JavaScript vanilla pour
des sessions courtes de mathématiques. Elle vise une interface moderne,
enfantine et lisible pour des enfants de 7 à 8 ans.

## Lancer l'application

L'application utilise des modules ES et nécessite un serveur local.

### Serveur local

```bash
python -m http.server 8000
```

Puis ouvrir <http://127.0.0.1:8000/> dans un navigateur moderne.

### Pourquoi pas `file://` ?

Les navigateurs bloquent les imports ES modules depuis le protocole `file://`.
L'application affiche un message d'aide si elle détecte ce protocole.

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
- une boutique du module Multiplications ;
- un écran de session Multiplications de 8 questions ;
- un choix de modes d'exercices ;
- une boutique de thèmes ;
- une sauvegarde locale avec `localStorage` ;
- un moteur de progression pour les multiplications ;
- un générateur de questions de multiplication ;
- un système de pièces gagnées avec les bonnes réponses.

## Progression multiplication

Les tables disponibles vont de 2 à 10.

Tables débloquées au départ :

- 2
- 5
- 10

Ordre de déblocage en boutique :

```txt
2, 5, 10 -> 3 -> 4 -> 6 -> 8 -> 9 -> 7 -> mode mélange
```

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

## Boutique et pièces

Chaque bonne réponse donne :

- `+1 pièce` ;
- `+1 point` sur la table travaillée.

Les pièces se dépensent dans la boutique. Les points de table restent gardés
pour débloquer les tables suivantes.

Coûts principaux :

- table 3 : 6 points sur les tables 2, 5 ou 10, puis 6 pièces ;
- table 4 : 6 points sur la table 3, puis 6 pièces ;
- table 6 : 8 points sur la table 4, puis 8 pièces ;
- table 8 : 8 points sur la table 6, puis 8 pièces ;
- table 9 : 10 points sur la table 8, puis 10 pièces ;
- table 7 : 10 points sur la table 9, puis 10 pièces.

Les modes et thèmes s'achètent aussi avec les pièces.

### Audit boutique — achats vs progression

Éléments qui peuvent être achetés librement (cosmétiques) :

- thèmes (Soleil, Océan, Fruits) ;
- modes bonus (Choix rapide, Groupes visuels, Facteur caché) ;
- futurs collectibles et effets visuels.

Éléments qui nécessitent une progression pédagogique :

- **tables** : l'achat requiert déjà des points gagnés sur des tables
  prérequises (ex: table 3 requiert 6 points sur les tables 2/5/10). Cela
  garantit que l'enfant a pratiqué avant de débloquer la suite ;
- **mode mélange** : requiert que les 4 modes de base soient possédés et au
  moins 3 tables débloquées.

Le système actuel est **cohérent** : les tables ne sont pas achetables sans
prérequis pédagogiques. Le coût en pièces ajoute une couche supplémentaire
de motivation sans court-circuiter la progression.

## Modes d'exercices

Les modes sont affichés en cartes et se débloquent séparément :

- `direct-answer` : réponse directe, disponible au départ ;
- `multiple-choice` : choix parmi 4 réponses ;
- `visual-groups` : groupes visuels simples ;
- `missing-factor` : facteur manquant ;
- `mixed` : mélange des modes achetés.

La sélection des questions privilégie les multiplications peu vues, ratées ou
anciennes, afin d'éviter un hasard pur.

## Session Multiplications

Depuis l'accueil, ouvrir `Multiplications`, puis choisir un mode possédé avec
le bouton `Jouer`.

Une session contient 8 questions courtes. Après chaque réponse :

- la progression de la multiplication concernée est mise à jour ;
- une bonne réponse affiche une petite animation de victoire, ajoute 1 pièce,
  puis passe automatiquement à la question suivante ;
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
  themes.css
js/
  app.js
  router.js
  state.js
  storage.js
  theme-manager.js
  games/
    multiplication-session.js
  screens/
    home-screen.js
    multiplication-screen.js
    multiplication-session-screen.js
    settings-screen.js
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
```

## Rôle des modules JavaScript

- `app.js` : démarrage de l'application, événements et rendu de la route active.
- `router.js` : navigation simple par hash.
- `state.js` : état en mémoire.
- `storage.js` : lecture, validation et écriture `localStorage`.
- `theme-manager.js` : application des thèmes.
- `reward-engine.js` : gains, achats, prérequis de boutique et possessions.
- `multiplication-data.js` : tables, facts et métadonnées pédagogiques.
- `multiplication-generator.js` : génération des questions.
- `mastery-engine.js` : calculs de maîtrise et priorités.
- `progress-engine.js` : enregistrement des réponses.
- `multiplication-feedback.js` : messages positifs ou aidants après réponse.

## Limites actuelles

- **Fractions** : socle réservé, pas encore implémenté.
- **Équations** : socle réservé, pas encore implémenté.
- **Collectibles** : pas encore implémentés (cosmétiques décoratifs).
- **Tests** : couverture des moteurs métier uniquement ; pas de tests d'intégration UI.

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
