import { getShopSummary } from "../reward-engine.js";
import {
  calculateTableSelectionBonus,
  getSelectedTables
} from "../table-selection.js";

export function renderMultiplicationView(state) {
  const shop = getShopSummary(state.save);
  const progress = state.save.progress.multiplication;
  const activeTableCount = getSelectedTables(progress).length;
  const tableBonus = calculateTableSelectionBonus(progress);

  return `
    <section class="shop-hero" aria-labelledby="multiplication-title">
      <div>
        <p class="eyebrow">Aventures de multiplication</p>
        <h1 id="multiplication-title">Choisis tes tables</h1>
        <p>
          Tape une tuile pour la mettre ON ou OFF. Plus tu joues avec des
          tables, plus le bonus grandit.
        </p>
        <div class="action-row">
          <button class="button button-secondary" type="button" data-route="modes">
            Voir les modes spéciaux
          </button>
        </div>
      </div>
      ${renderCoinBonusPanel(shop.coins, activeTableCount, tableBonus)}
    </section>
    ${state.shopMessage ? `<div class="shop-message" role="status">${state.shopMessage}</div>` : ""}

    <section aria-labelledby="modes-title">
      <div class="section-heading">
        <p class="eyebrow">Modes gratuits</p>
        <h2 id="modes-title">Missions à choisir</h2>
      </div>
      <div class="mode-mini-grid">
        ${shop.modes.map(renderModeCard).join("")}
      </div>
    </section>

    <section aria-labelledby="tables-title">
      <div class="section-heading">
        <p class="eyebrow">Mondes</p>
        <h2 id="tables-title">Tables à activer</h2>
      </div>
      <div class="table-tile-grid" aria-label="Tables activées ou en pause">
        ${shop.tables.map(renderTableCard).join("")}
      </div>
    </section>
  `;
}

function renderCoinBonusPanel(coins, activeTableCount, tableBonus) {
  return `
    <div class="coin-bonus-panel" aria-label="Pièces et bonus des tables actives">
      <div class="coin-pill coin-pill--large">
        <span aria-hidden="true">🪙</span>
        <strong>${coins}</strong>
        <span>pièces</span>
      </div>
      <div class="table-bonus-card">
        <span class="table-bonus-card__label">${activeTableCount} tables actives</span>
        <strong>+${tableBonus} 🪙</strong>
        <span>bonus à la fin d'une session</span>
      </div>
    </div>
  `;
}

function renderModeCard(mode) {
  const meta = getModeMeta(mode.id);

  return `
    <article class="mode-mini-card" data-mode-id="${mode.id}">
      <span class="mode-mini-card__icon" aria-hidden="true">${meta.icon}</span>
      <div class="mode-mini-card__copy">
        <h3>${meta.label}</h3>
        <p>${meta.hint}</p>
      </div>
      <button class="button button-primary button-sm" type="button" data-start-session="${mode.id}">
        Jouer
      </button>
    </article>
  `;
}

function renderTableCard(table) {
  const activeClass = table.isSelected ? " is-selected" : " is-muted";
  const stateText = table.isSelected ? "Dans les jeux" : "En pause";
  const recommendationIcon = getRecommendationIcon(table.recommendation);

  return `
    <button
      class="table-number-tile${activeClass}"
      type="button"
      data-toggle-table="${table.table}"
      aria-pressed="${table.isSelected ? "true" : "false"}"
      aria-label="Table de ${table.table} ${table.isSelected ? "activée" : "désactivée"}"
    >
      <span class="table-state-badge">${table.isSelected ? "ON" : "OFF"}</span>
      <span class="table-world-emoji" aria-hidden="true">${table.icon}</span>
      <span class="table-number">${table.table}</span>
      <span class="table-state-text">${stateText}</span>
      <span class="table-mini-progress">${table.masteryPercent}% · ${recommendationIcon}</span>
    </button>
  `;
}

function getModeMeta(modeId) {
  return {
    "direct-answer": { icon: "×", label: "Réponse", hint: "Tu écris" },
    "multiple-choice": { icon: "4", label: "QCM 4", hint: "4 choix" },
    "multiple-choice-8": { icon: "8", label: "QCM 8", hint: "Bonus pièces" },
    "visual-groups": { icon: "●", label: "Groupes", hint: "Avec dessins" },
    "missing-factor": { icon: "?", label: "Mystère", hint: "Nombre caché" },
    mixed: { icon: "★", label: "Mix", hint: "Tout mélangé" }
  }[modeId] || { icon: "×", label: "Réponse", hint: "Tu écris" };
}

function getRecommendationIcon(recommendation) {
  const label = String(recommendation || "");
  if (label.includes("🏆")) return "🏆";
  if (label.includes("🎯")) return "🎯";
  return "⭐";
}
