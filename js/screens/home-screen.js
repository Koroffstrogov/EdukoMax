import { getAvailableThemes } from "../theme-manager.js";
import { renderShowcase } from "../collectibles/reward-reveal.js";
import { getCollectionStats } from "../collectibles/collectible-engine.js";

export function renderHomeView(state) {
  const profileName = escapeHtml(state.save.profile.name);
  const themeLabel = getThemeLabel(state.save.settings.theme);
  const selectedTables = state.save.progress.multiplication.selectedTables;
  const collectionStats = getCollectionStats(state.save);

  return `
    <section class="dashboard-grid" aria-labelledby="home-title">
      <div class="learning-column">
        <section class="welcome-panel">
          <p class="eyebrow">Socle prêt</p>
          <h1 id="home-title">Bonjour ${profileName}</h1>
          <p>
            Choisis les tables à mélanger, gagne des pièces avec tes bonnes
            réponses, puis complète tes ambiances et modes spéciaux.
          </p>
          <div class="action-row">
            <button class="button button-primary" type="button" data-route="multiplication">
              Ouvrir les multiplications
            </button>
            <button class="button button-secondary" type="button" data-route="modes">
              Modes spéciaux
            </button>
            <button class="button button-secondary" type="button" data-route="collection">
              Ma collection (${collectionStats.percent}%)
            </button>
          </div>
        </section>
        ${renderShowcase(state.save)}
        ${renderSubjectGrid()}
      </div>
      <aside class="panel" aria-labelledby="status-title">
        <p class="eyebrow">Progression</p>
        <h2 id="status-title">Tableau de bord</h2>
        <ul class="status-list">
          <li><span>Pièces</span><strong>🪙 ${state.save.rewards.coins}</strong></li>
          <li><span>Tables actives</span><strong>${selectedTables.join(", ")}</strong></li>
          <li><span>Thème actif</span><strong>${themeLabel}</strong></li>
          <li><span>Sessions terminées</span><strong>${state.save.sessions.completed}</strong></li>
          <li><span>Collection</span><strong>${collectionStats.ownedCards} cartes</strong></li>
        </ul>
      </aside>
    </section>
  `;
}

function renderSubjectGrid() {
  return `
    <section class="subject-grid" aria-label="Domaines de maths">
      ${renderSubjectCard("&times;", "Multiplications", "Tables de 2 à 10.", "Tables libres", "multiplication")}
      ${renderSubjectCard("&frac12;", "Fractions", "Socle réservé pour la suite.", "Plus tard")}
      ${renderSubjectCard("x", "Équations", "Une inconnue, tranquillement.", "Plus tard")}
    </section>
  `;
}

function renderSubjectCard(symbol, title, text, tag, route = null) {
  if (route) {
    return `
      <button
        class="subject-card subject-card--ready"
        type="button"
        data-route="${route}"
        aria-label="Ouvrir le module ${title}"
      >
        ${renderSubjectCardContent(symbol, title, text, tag)}
      </button>
    `;
  }

  return `
    <article class="subject-card">
      ${renderSubjectCardContent(symbol, title, text, tag)}
    </article>
  `;
}

function renderSubjectCardContent(symbol, title, text, tag) {
  return `
    <span class="subject-symbol" aria-hidden="true">${symbol}</span>
    <div>
      <h2>${title}</h2>
      <p>${text}</p>
    </div>
    <span class="tag">${tag}</span>
  `;
}

function getThemeLabel(themeId) {
  return (
    getAvailableThemes().find((theme) => theme.id === themeId)?.label || "Soleil"
  );
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
