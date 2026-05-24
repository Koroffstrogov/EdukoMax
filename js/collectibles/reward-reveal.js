import { COLLECTIBLE_CARDS, BADGES, CARD_RARITIES } from "./collectible-data.js";
import { normalizeCollectibles } from "./collectible-engine.js";

/**
 * Renders the reward reveal block shown after a session.
 * cardRewards: array of card objects earned
 * badgeRewards: array of badge objects earned
 * bonusCoins: number of bonus coins
 */
export function renderRewardReveal(cardRewards, badgeRewards, bonusCoins) {
  if (cardRewards.length === 0 && badgeRewards.length === 0 && bonusCoins === 0) {
    return "";
  }

  return `
    <div class="reward-reveal" aria-live="polite" aria-label="Nouvelles récompenses">
      <h2 class="reward-reveal__title">🎁 Nouvelles récompenses !</h2>
      <div class="reward-reveal__items">
        ${cardRewards.map((card) => renderRevealCard(card)).join("")}
        ${badgeRewards.map((badge) => renderRevealBadge(badge)).join("")}
        ${bonusCoins > 0 ? renderBonusCoins(bonusCoins) : ""}
      </div>
      ${renderRevealMessage(cardRewards, badgeRewards)}
      <div class="reward-reveal__actions">
        <button class="button button-secondary" type="button" data-route="collection">
          Voir ma collection
        </button>
      </div>
    </div>
  `;
}

/**
 * Builds a compact showcase of the last 3 rewards for the home screen.
 */
export function renderShowcase(saveData) {
  const collectibles = normalizeCollectibles(saveData);
  const recentCards = collectibles.cards.owned.slice(-3);

  if (recentCards.length === 0) {
    return "";
  }

  const cards = recentCards
    .map((id) => COLLECTIBLE_CARDS.find((c) => c.id === id))
    .filter(Boolean);

  if (cards.length === 0) {
    return "";
  }

  return `
    <div class="showcase" aria-label="Dernières cartes">
      <p class="eyebrow">Dernières cartes</p>
      <div class="showcase__cards">
        ${cards.map((card) => `
          <span class="showcase__card showcase__card--${card.rarity}" aria-label="${card.name}">
            <span aria-hidden="true">${card.emoji}</span>
          </span>
        `).join("")}
      </div>
      <button class="button button-secondary button-sm" type="button" data-route="collection">
        Collection
      </button>
    </div>
  `;
}

function renderRevealCard(card) {
  const rarityClass = `reward-reveal__item--${card.rarity}`;

  return `
    <div class="reward-reveal__item ${rarityClass}" aria-label="Carte obtenue: ${card.name}">
      <span class="reward-reveal__emoji" aria-hidden="true">${card.emoji}</span>
      <span class="reward-reveal__name">${card.name}</span>
      <span class="reward-reveal__rarity">${getRarityLabel(card.rarity)}</span>
    </div>
  `;
}

function renderRevealBadge(badge) {
  return `
    <div class="reward-reveal__item reward-reveal__item--badge" aria-label="Badge obtenu: ${badge.name}">
      <span class="reward-reveal__emoji" aria-hidden="true">${badge.emoji}</span>
      <span class="reward-reveal__name">${badge.name}</span>
      <span class="reward-reveal__rarity">Badge</span>
    </div>
  `;
}

function renderBonusCoins(amount) {
  return `
    <div class="reward-reveal__item reward-reveal__item--coins" aria-label="${amount} pièces bonus">
      <span class="reward-reveal__emoji" aria-hidden="true">🪙</span>
      <span class="reward-reveal__name">+${amount} pièces</span>
      <span class="reward-reveal__rarity">Bonus</span>
    </div>
  `;
}

function renderRevealMessage(cardRewards, badgeRewards) {
  const epic = cardRewards.find((c) => c.rarity === CARD_RARITIES.EPIC);
  const mastery = cardRewards.find((c) => c.rarity === CARD_RARITIES.MASTERY);
  const rare = cardRewards.find((c) => c.rarity === CARD_RARITIES.RARE);

  let message = "Bien joué, continue comme ça !";

  if (mastery) {
    message = "🏆 Carte de maîtrise débloquée ! Tu es un champion !";
  } else if (epic) {
    message = "🌟 Incroyable ! Une carte épique !";
  } else if (rare) {
    message = "✨ Super ! Une carte rare !";
  } else if (badgeRewards.length > 0) {
    message = "🎖️ Nouveau badge obtenu ! Bravo !";
  }

  return `<p class="reward-reveal__message">${message}</p>`;
}

function getRarityLabel(rarity) {
  return {
    [CARD_RARITIES.COMMON]: "Commune",
    [CARD_RARITIES.RARE]: "Rare",
    [CARD_RARITIES.EPIC]: "Épique",
    [CARD_RARITIES.MASTERY]: "Maîtrise"
  }[rarity] || rarity;
}
