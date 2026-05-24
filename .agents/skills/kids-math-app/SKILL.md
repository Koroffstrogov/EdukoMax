---
name: kids-math-app
description: Build, modify, or review EdukoMax, a vanilla HTML/CSS/ES module educational math app for 7-8 year-old children. Use for multiplication tables from 2 to 10, mastery and spaced repetition, rewards, collectibles, themes, localStorage persistence, screen/game modules, README updates, and enforcing no-framework, no-build, no-dependency, and 400-line JavaScript file constraints.
---

# Kids Math App

## Workflow

- Read `AGENTS.md` and the existing module shape before editing.
- Keep the app runnable by opening `index.html` directly.
- Preserve vanilla HTML, CSS, and JavaScript. Do not add frameworks, build steps, or dependencies unless the user explicitly approves them.
- Choose small, focused ES modules. Keep every JavaScript file under 400 lines.
- Update `README.md` when behavior, setup, or gameplay changes.

## Architecture

- Keep `storage.js` limited to validating, loading, saving, and migrating `localStorage` data.
- Keep `state.js` responsible for in-memory app state and state transitions.
- Keep `theme-manager.js` responsible for theme application only.
- Keep `multiplication-generator.js` responsible for question creation only.
- Keep `mastery-engine.js` responsible for mastery scores and spaced repetition priorities.
- Keep `reward-engine.js` responsible for XP, stars, coins, and unlock calculations.
- Keep `collectible-engine.js` responsible for collectible ownership and drops.
- Put full-screen rendering in `screens/`.
- Put exercise mode logic in `games/`.
- Keep rendering, business rules, and persistence in separate files.

## Gameplay

- Track each multiplication fact independently, such as `6x7`.
- Prefer mastery, recent errors, and last practice date when selecting questions.
- Avoid pure random question selection for practice sessions.
- Keep sessions short and make completion visibly rewarding.
- Unlock harder tables and mixed modes gradually.
- Give hints or explanations after mistakes. Avoid punitive language.

## UI

- Design for a 7-8 year-old child: playful, modern, colorful, and readable.
- Use large tablet-friendly buttons and clear visual feedback.
- Use `data-*` attributes for UI actions and avoid inline event handlers.
- Use CSS variables for themes.
- Respect `prefers-reduced-motion`; keep animations light and optional.
- Keep screens calm enough for repeated practice.

## Validation

- Check that the app loads without console errors.
- Verify `localStorage` save and load behavior after persistence changes.
- Check desktop and tablet-width layouts.
- Check JavaScript file lengths after edits.
- Confirm new gameplay rules remain separate from rendering and persistence.
