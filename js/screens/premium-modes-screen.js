import { ROUTES } from "../router.js";
import { getModesForPack } from "../premium-modes/mode-pack-data.js";
import {
  getPackShopState,
  getSpecialModePacks
} from "../premium-modes/mode-pack-engine.js";

const FAMILY_ROUTES = Object.freeze({
  competitive: ROUTES.modesCompetitive,
  chill: ROUTES.modesChill,
  science: ROUTES.modesScience
});

export function renderPremiumModesView(state, family = null) {
  const packs = getSpecialModePacks().map((pack) => getPackShopState(state.save, pack));
  const selectedPack = family ? packs.find((pack) => pack.family === family) : null;

  return `
    <section class="shop-hero premium-hero" aria-labelledby="premium-title">
      <div>
        <p class="eyebrow">Modes spéciaux</p>
        <h1 id="premium-title">${selectedPack ? selectedPack.name : "Choisis ton pack"}</h1>
        <p>${selectedPack ? selectedPack.description : "Débloque des façons plus fun de t'entraîner avec tes pièces."}</p>
      </div>
      ${renderCoinPill(state.save.rewards.coins)}
    </section>
    ${state.shopMessage ? `<div class="shop-message" role="status">${state.shopMessage}</div>` : ""}
    ${selectedPack ? renderPackDetails(selectedPack, state.save.rewards.coins) : renderPackGrid(packs, state.save.rewards.coins)}
  `;
}

function renderPackGrid(packs, coins) {
  return `
    <section aria-labelledby="pack-list-title">
      <div class="section-heading">
        <p class="eyebrow">Boutique</p>
        <h2 id="pack-list-title">Packs premium avec pièces</h2>
      </div>
      <div class="shop-grid premium-pack-grid">
        ${packs.map((pack) => renderPackCard(pack, coins)).join("")}
      </div>
    </section>
  `;
}

function renderPackDetails(pack, coins) {
  return `
    <section class="premium-detail" aria-labelledby="premium-detail-title">
      <div class="panel">
        <p class="eyebrow">${pack.emoji} Pack spécial</p>
        <h2 id="premium-detail-title">${pack.name}</h2>
        <p>${pack.description}</p>
        ${pack.isOwned ? renderModeGrid(pack) : renderLockedPackActions(pack, coins)}
      </div>
      ${pack.family === "competitive" ? renderLeaderboardAccess() : renderPackTone(pack)}
    </section>
  `;
}

function renderPackCard(pack, coins) {
  const className = pack.isOwned ? " is-owned" : " is-locked";
  return `
    <article class="shop-card premium-pack-card${className}">
      <span class="table-token" aria-hidden="true">${pack.emoji}</span>
      <div>
        <span class="tag">Nouveau mode</span>
        <h3>${pack.name}</h3>
        <p>${pack.description}</p>
      </div>
      ${pack.isOwned ? renderOwnedPack(pack) : renderLockedPackActions(pack, coins)}
    </article>
  `;
}

function renderOwnedPack(pack) {
  return `
    <span class="tag">Possédé</span>
    <button class="button button-primary" type="button" data-route="${FAMILY_ROUTES[pack.family]}">
      Jouer
    </button>
  `;
}

function renderLockedPackActions(pack, coins) {
  const missing = Math.max(0, pack.price - coins);

  return `
    <span class="tag">${pack.price} 🪙</span>
    <p class="progress-line">
      ${missing > 0 ? `Il te manque ${missing} 🪙` : "Prêt à ouvrir ce pack !"}
    </p>
    ${missing > 0 ? renderEarnCoinsButton() : `
      <button class="button button-primary" type="button" data-buy-pack="${pack.id}">
        Acheter
      </button>
    `}
  `;
}

function renderModeGrid(pack) {
  const modes = getModesForPack(pack.id);
  return `
    <div class="shop-grid premium-mode-grid">
      ${modes.map((mode) => `
        <article class="shop-card premium-mode-card is-owned">
          <span class="subject-symbol" aria-hidden="true">${mode.emoji}</span>
          <div>
            <h3>${mode.name}</h3>
            <p>${mode.description}</p>
          </div>
          <button class="button button-primary" type="button" data-start-premium-mode="${mode.id}">
            Jouer
          </button>
        </article>
      `).join("")}
    </div>
  `;
}

function renderEarnCoinsButton() {
  return `
    <button class="button button-secondary" type="button" data-route="${ROUTES.multiplication}">
      Gagner des pièces
    </button>
  `;
}

function renderLeaderboardAccess() {
  return `
    <aside class="panel">
      <p class="eyebrow">Champions</p>
      <h2>Top 10 local</h2>
      <p>Les scores mélangent tous les profils de ce navigateur.</p>
      <button class="button button-secondary" type="button" data-route="${ROUTES.leaderboard}">
        Voir le classement
      </button>
    </aside>
  `;
}

function renderPackTone(pack) {
  const text = {
    chill: "Pas de chrono ici : tu joues tranquillement et chaque réussite construit un petit monde.",
    science: "Le coach choisit les multiplications utiles à revoir, sans bloquer les autres modes."
  }[pack.family] || "Un pack spécial pour varier les missions.";
  const action = pack.family === "science"
    ? `
      <button class="button button-secondary" type="button" data-route="${ROUTES.modesScienceFacts}">
        Voir les multiplications
      </button>
    `
    : "";

  return `
    <aside class="panel">
      <p class="eyebrow">Ambiance</p>
      <h2>${pack.emoji} ${pack.name}</h2>
      <p>${text}</p>
      ${action}
    </aside>
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
