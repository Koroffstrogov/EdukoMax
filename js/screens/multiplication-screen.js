import { SESSION_MODES, getShopSummary } from "../reward-engine.js";

export function renderMultiplicationView(state) {
  const shop = getShopSummary(state.save);

  return `
    <section class="shop-hero" aria-labelledby="multiplication-title">
      <div>
        <p class="eyebrow">Aventures de multiplication</p>
        <h1 id="multiplication-title">Choisis ton monde</h1>
        <p>
          Tous les modes sont ouverts. Gagne des pièces dans les mondes déjà
          disponibles, puis achète la table que tu veux.
        </p>
        <div class="action-row">
          <button class="button button-secondary" type="button" data-route="modes">
            Voir les modes spéciaux
          </button>
        </div>
      </div>
      ${renderCoinPill(shop.coins)}
    </section>
    ${state.shopMessage ? `<div class="shop-message" role="status">${state.shopMessage}</div>` : ""}

    <section aria-labelledby="modes-title">
      <div class="section-heading">
        <p class="eyebrow">Modes gratuits</p>
        <h2 id="modes-title">Missions à choisir</h2>
      </div>
      <div class="shop-grid">
        ${shop.modes.map(renderModeCard).join("")}
      </div>
    </section>

    <section aria-labelledby="tables-title">
      <div class="section-heading">
        <p class="eyebrow">Mondes</p>
        <h2 id="tables-title">Tables à collectionner</h2>
      </div>
      <div class="shop-grid shop-grid--tables">
        ${shop.tables.map((table) => renderTableCard(table, shop.coins)).join("")}
      </div>
    </section>
  `;
}

function renderCoinPill(coins) {
  return `
    <div class="coin-pill coin-pill--large" aria-label="Pièces disponibles">
      <span aria-hidden="true">🪙</span>
      <strong>${coins}</strong>
      <span>pièces</span>
    </div>
  `;
}

function renderModeCard(mode) {
  return `
    <article class="shop-card mode-card is-owned">
      <span class="subject-symbol" aria-hidden="true">${getModeIcon(mode.id)}</span>
      <div>
        <h3>${mode.label}</h3>
        <p>${mode.description}</p>
      </div>
      <span class="tag">Gratuit</span>
      <button class="button button-primary" type="button" data-start-session="${mode.id}">
        Jouer
      </button>
    </article>
  `;
}

function renderTableCard(table, coins) {
  const ownedClass = table.isOwned ? " is-owned" : " is-locked";

  return `
    <article class="shop-card table-card${ownedClass}">
      <span class="table-token" aria-hidden="true">${table.icon}</span>
      <div>
        <h3>${table.label}</h3>
        <p>Table de ${table.table}</p>
      </div>
      ${table.isOwned ? renderOwnedTable(table) : renderLockedTable(table, coins)}
    </article>
  `;
}

function renderOwnedTable(table) {
  return `
    <span class="tag">${table.recommendation}</span>
    <p class="progress-line">Progression: ${table.masteryPercent}%</p>
    <p class="progress-line">${table.progressLabel}</p>
    <button
      class="button button-primary"
      type="button"
      data-start-session="${SESSION_MODES.directAnswer}"
      data-start-table="${table.table}"
    >
      Jouer
    </button>
  `;
}

function renderLockedTable(table, coins) {
  const missingCoins = Math.max(0, table.price - coins);

  return `
    <span class="tag">🔒 À débloquer</span>
    <p class="progress-line">Prix : ${table.price} 🪙</p>
    <p class="progress-line">
      ${missingCoins > 0
        ? `Il te manque ${missingCoins} 🪙`
        : `Débloque ce monde !`}
    </p>
    ${missingCoins === 0 ? renderBuyButton(table) : renderEarnButton()}
  `;
}

function renderBuyButton(table) {
  return `
    <button
      class="button button-primary"
      type="button"
      data-buy-type="table"
      data-buy-id="${table.table}"
    >
      Acheter
    </button>
  `;
}

function renderEarnButton() {
  return `
    <button class="button button-secondary" type="button" data-start-session="${SESSION_MODES.directAnswer}">
      Gagner des pièces
    </button>
  `;
}

function getModeIcon(modeId) {
  return {
    "direct-answer": "×",
    "multiple-choice": "4",
    "visual-groups": "●",
    "missing-factor": "?",
    mixed: "★"
  }[modeId] || "×";
}
