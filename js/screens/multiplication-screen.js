import { getShopSummary } from "../reward-engine.js";

export function renderMultiplicationView(state) {
  const shop = getShopSummary(state.save);

  return `
    <section class="shop-hero" aria-labelledby="multiplication-title">
      <div>
        <p class="eyebrow">Boutique des tables</p>
        <h1 id="multiplication-title">Choisis ton mode</h1>
        <p>
          Gagne des pièces avec les bonnes réponses, puis débloque des tables,
          des modes et des ambiances.
        </p>
      </div>
      <div class="coin-pill" aria-label="Pièces disponibles">
        <span aria-hidden="true">●</span>
        <strong>${shop.coins}</strong>
        <span>pièces</span>
      </div>
    </section>

    <section aria-labelledby="modes-title">
      <div class="section-heading">
        <p class="eyebrow">Modes</p>
        <h2 id="modes-title">Missions à choisir</h2>
      </div>
      <div class="shop-grid">
        ${shop.modes.map(renderModeCard).join("")}
      </div>
    </section>

    <section aria-labelledby="tables-title">
      <div class="section-heading">
        <p class="eyebrow">Collectibles</p>
        <h2 id="tables-title">Tables à collectionner</h2>
      </div>
      <div class="shop-grid shop-grid--tables">
        ${renderInitialTableCards(state)}
        ${shop.tables.map(renderTableCard).join("")}
      </div>
    </section>
  `;
}

function renderModeCard(mode) {
  return `
    <article class="shop-card${mode.isOwned ? " is-owned" : ""}">
      <span class="subject-symbol" aria-hidden="true">${getModeIcon(mode.id)}</span>
      <div>
        <h3>${mode.label}</h3>
        <p>${mode.description}</p>
      </div>
      ${renderCost(mode)}
      ${renderModeAction(mode)}
    </article>
  `;
}

function renderTableCard(table) {
  return `
    <article class="shop-card table-card${table.isOwned ? " is-owned" : ""}">
      <span class="table-token" aria-hidden="true">${table.table}</span>
      <div>
        <h3>${table.label}</h3>
        <p>${table.description}</p>
      </div>
      <p class="progress-line">${table.requirementLabel}</p>
      ${renderCost(table)}
      ${renderBuyAction(table)}
    </article>
  `;
}

function renderInitialTableCards(state) {
  return state.save.progress.multiplication.unlockedTables
    .filter((table) => [2, 5, 10].includes(table))
    .map((table) => `
      <article class="shop-card table-card is-owned">
        <span class="table-token" aria-hidden="true">${table}</span>
        <div>
          <h3>Table de ${table}</h3>
          <p>Déjà dans ta collection.</p>
        </div>
        <span class="tag">Possédée</span>
      </article>
    `)
    .join("");
}

function renderModeAction(mode) {
  if (mode.isOwned) {
    return `
      <button class="button button-primary" type="button" data-start-session="${mode.id}">
        Jouer
      </button>
    `;
  }

  return renderBuyAction(mode);
}

function renderBuyAction(item) {
  if (item.canBuy) {
    return `
      <button
        class="button button-primary"
        type="button"
        data-buy-type="${item.type}"
        data-buy-id="${item.id}"
      >
        Acheter
      </button>
    `;
  }

  return `
    <button class="button button-secondary" type="button" disabled>
      ${getLockedLabel(item)}
    </button>
  `;
}

function renderCost(item) {
  if (item.cost === 0) {
    return '<span class="tag">Gratuit</span>';
  }

  return `<span class="tag">${item.cost} pièces</span>`;
}

function getLockedLabel(item) {
  if (item.isOwned) {
    return "Possédé";
  }

  if (item.needsCoins) {
    return "Pièces à gagner";
  }

  return "Verrouillé";
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
