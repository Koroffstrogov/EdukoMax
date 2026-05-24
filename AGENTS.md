# AGENTS.md

## Project

This repository is a vanilla HTML/CSS/JavaScript educational web app for children learning mathematics.

Current scope: multiplication tables from 2 to 10.

Future scopes:
- fractions
- one-variable equations
- additional math mini-games

## Hard constraints

- No framework.
- No build step unless explicitly requested.
- No external dependency unless explicitly approved.
- The app must run by opening `index.html` directly.
- Use `localStorage` for persistence.
- Maximum 400 lines per JavaScript file.
- Prefer many small focused modules over large files.
- Keep functions short and named clearly.
- Do not mix UI rendering, business rules, and persistence in the same file.

## Architecture rules

- `storage.js` handles localStorage only.
- `state.js` owns the in-memory app state.
- `theme-manager.js` handles themes only.
- `multiplication-generator.js` creates questions only.
- `mastery-engine.js` calculates mastery and spaced repetition priorities.
- `reward-engine.js` calculates XP, stars, coins, and unlocks.
- `collectible-engine.js` manages collectible ownership and drops.
- files in `screens/` render full screens.
- files in `games/` implement specific exercise modes.

## UX rules

- The app is for a 7-8 year-old child.
- The interface must be playful, modern, colorful, and readable.
- Avoid punitive language.
- Errors should trigger hints or explanations.
- Sessions should be short.
- Every completed session should give visible progress or a reward.
- Buttons must be large enough for tablet use.
- Animations must be light and optional through reduced-motion settings.

## Code style

- Use ES modules.
- Use plain objects for data models.
- Use `data-*` attributes for UI actions.
- Avoid inline event handlers in HTML.
- Avoid global mutable variables outside `state.js`.
- Validate loaded save data before using it.
- Keep naming explicit.

## Done criteria

For each change:
- no JavaScript file exceeds 400 lines;
- app still loads without console error;
- localStorage save/load works;
- UI is usable on desktop and tablet width;
- new gameplay logic is separated from rendering;
- README is updated if behavior changes.
