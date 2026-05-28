import { COLLECTIBLE_CARDS, BADGES, TABLE_UNIVERSES, CARD_RARITIES } from "./collectible-data.js";
import { normalizeCollectibles, getCollectionStats } from "./collectible-engine.js";
import { getBadgeStats } from "./badge-engine.js";

/**
 * Renders the full collection view with filters and grids.
 */
export function renderCollectionView(saveData, activeFilter = {}) {
  const collectibles = normalizeCollectibles(saveData);
  const cardStats = getCollectionStats(saveData);
  const badgeStats = getBadgeStats(saveData);
  const tableFilter = activeFilter.table || "all";
  const rarityFilter = activeFilter.rarity || "all";

  return `
    <section class="collection-screen" aria-labelledby="collection-title">
      <div class="collection-header">
        <p class="eyebrow">Ma collection</p>
        <h1 id="collection-title">Cartes & Badges</h1>
        ${renderProgress(cardStats, badgeStats)}
      </div>
      ${renderCollectionHelp()}
      ${renderFilters(tableFilter, rarityFilter)}
      <section class="collection-section" aria-labelledby="cards-title">
        <h2 id="cards-title">Cartes <span class="collection-count">${cardStats.ownedCards}/${cardStats.totalCards}</span></h2>
        <div class="collection-grid">
          ${renderCards(collectibles, tableFilter, rarityFilter)}
        </div>
      </section>
      <section class="collection-section" aria-labelledby="badges-title">
        <h2 id="badges-title">Badges <span class="collection-count">${badgeStats.ownedBadges}/${badgeStats.totalBadges}</span></h2>
        <div class="collection-grid collection-grid--badges">
          ${renderBadges(collectibles)}
        </div>
      </section>
      ${renderMotivation(cardStats)}
    </section>
  `;
}

function renderProgress(cardStats, badgeStats) {
  const total = cardStats.totalCards + badgeStats.totalBadges;
  const owned = cardStats.ownedCards + badgeStats.ownedBadges;
  const percent = total > 0 ? Math.round((owned / total) * 100) : 0;

  return `
    <div class="collection-progress" role="progressbar" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100">
      <div class="collection-progress__bar" style="width: ${percent}%"></div>
      <span class="collection-progress__label">${percent}% complétée</span>
    </div>
  `;
}

function renderFilters(tableFilter, rarityFilter) {
  const tables = [
    { value: "all", label: "Toutes" },
    ...Object.entries(TABLE_UNIVERSES)
      .filter(([key]) => key !== "mix")
      .map(([key, data]) => ({ value: key, label: `${data.emoji} ${key}` })),
    { value: "mix", label: "👑 Mix" }
  ];

  const rarities = [
    { value: "all", label: "Toutes" },
    { value: "common", label: "Commune" },
    { value: "rare", label: "Rare" },
    { value: "epic", label: "Épique" },
    { value: "mastery", label: "Maîtrise" },
    { value: "max", label: "MAX" }
  ];

  return `
    <div class="collection-filters">
      <label class="collection-filter">
        <span>Table</span>
        <select data-collection-filter="table">
          ${tables.map((t) => `<option value="${t.value}"${t.value === tableFilter ? " selected" : ""}>${t.label}</option>`).join("")}
        </select>
      </label>
      <label class="collection-filter">
        <span>Rareté</span>
        <select data-collection-filter="rarity">
          ${rarities.map((r) => `<option value="${r.value}"${r.value === rarityFilter ? " selected" : ""}>${r.label}</option>`).join("")}
        </select>
      </label>
    </div>
  `;
}

function renderCollectionHelp() {
  return `
    <aside class="collection-help" aria-label="Comment gagner des cartes">
      <h2>Comment gagner des cartes ?</h2>
      <p>Termine une manche pour tenter une carte. Plus tu réussis, plus les cartes brillent.</p>
      <ul>
        <li>75 % de réussite : une carte rare peut apparaître.</li>
        <li>90 % ou sans erreur : une carte épique peut apparaître.</li>
        <li>Toutes les tables activées et plus de 90 % : une carte MAX peut apparaître.</li>
      </ul>
    </aside>
  `;
}

function renderCards(collectibles, tableFilter, rarityFilter) {
  const owned = new Set(collectibles.cards.owned);
  const newlyUnlocked = new Set(collectibles.cards.newlyUnlocked);

  const filtered = COLLECTIBLE_CARDS.filter((card) => {
    if (tableFilter !== "all" && String(card.table) !== tableFilter) {
      return false;
    }

    if (rarityFilter !== "all" && card.rarity !== rarityFilter) {
      return false;
    }

    return true;
  });

  if (filtered.length === 0) {
    return `<p class="collection-empty">Aucune carte dans ce filtre.</p>`;
  }

  return sortCardsForDisplay(filtered)
    .map((card) => renderCard(card, owned.has(card.id), newlyUnlocked.has(card.id)))
    .join("");
}

function renderCard(card, isOwned, isNew) {
  const rarityClass = `collectible-card--${card.rarity}`;
  const lockedClass = isOwned ? "" : " collectible-card--locked";
  const newClass = isNew ? " collectible-card--new" : "";
  const universe = TABLE_UNIVERSES[card.table];

  if (!isOwned) {
    if (card.rarity === CARD_RARITIES.MAX) {
      return `
        <article class="collectible-card ${rarityClass}${lockedClass}" aria-label="Carte MAX masquée">
          <span class="collectible-card__emoji" aria-hidden="true">🌟</span>
          <span class="collectible-card__name">Carte MAX masquée</span>
          <span class="collectible-card__hint">9 tables actives + plus de 90 %</span>
          <span class="collectible-card__rarity">${getRarityLabel(card.rarity)}</span>
        </article>
      `;
    }

    return `
      <article class="collectible-card ${rarityClass}${lockedClass}" aria-label="Carte mystère">
        <span class="collectible-card__emoji" aria-hidden="true">❓</span>
        <span class="collectible-card__name">???</span>
        <span class="collectible-card__hint">${universe ? universe.name : "À découvrir"}</span>
        <span class="collectible-card__rarity">${getRarityLabel(card.rarity)}</span>
      </article>
    `;
  }

  return `
    <article class="collectible-card ${rarityClass}${newClass}" aria-label="${card.name}">
      ${isNew ? '<span class="collectible-card__new-badge">Nouveau !</span>' : ""}
      <span class="collectible-card__emoji" aria-hidden="true">${card.emoji}</span>
      <span class="collectible-card__name">${card.name}</span>
      <span class="collectible-card__title">${card.title}</span>
      <span class="collectible-card__rarity">${getRarityLabel(card.rarity)}</span>
    </article>
  `;
}

function sortCardsForDisplay(cards) {
  return [...cards].sort((first, second) => {
    if (first.rarity === CARD_RARITIES.MAX && second.rarity !== CARD_RARITIES.MAX) return -1;
    if (second.rarity === CARD_RARITIES.MAX && first.rarity !== CARD_RARITIES.MAX) return 1;
    return COLLECTIBLE_CARDS.indexOf(first) - COLLECTIBLE_CARDS.indexOf(second);
  });
}

function renderBadges(collectibles) {
  const owned = new Set(collectibles.badges.owned);
  const newlyUnlocked = new Set(collectibles.badges.newlyUnlocked);

  return BADGES.map((badge) => renderBadge(badge, owned.has(badge.id), newlyUnlocked.has(badge.id))).join("");
}

function renderBadge(badge, isOwned, isNew) {
  const lockedClass = isOwned ? "" : " badge-card--locked";
  const newClass = isNew ? " badge-card--new" : "";

  if (!isOwned) {
    return `
      <article class="badge-card${lockedClass}" aria-label="Badge verrouillé">
        <span class="badge-card__emoji" aria-hidden="true">🔒</span>
        <span class="badge-card__name">???</span>
        <span class="badge-card__hint">${badge.description}</span>
      </article>
    `;
  }

  return `
    <article class="badge-card${newClass}" aria-label="${badge.name}">
      ${isNew ? '<span class="badge-card__new-badge">Nouveau !</span>' : ""}
      <span class="badge-card__emoji" aria-hidden="true">${badge.emoji}</span>
      <span class="badge-card__name">${badge.name}</span>
      <span class="badge-card__desc">${badge.description}</span>
    </article>
  `;
}

function renderMotivation(cardStats) {
  if (cardStats.ownedCards === 0) {
    return `<p class="collection-motivation">Joue des sessions pour gagner tes premières cartes ! 🎮</p>`;
  }

  if (cardStats.percent >= 100) {
    return `<p class="collection-motivation">Collection complète ! Tu es incroyable ! 🏆</p>`;
  }

  if (cardStats.percent >= 50) {
    return `<p class="collection-motivation">Plus de la moitié ! Continue comme ça ! 🌟</p>`;
  }

  return `<p class="collection-motivation">Continue à jouer pour agrandir ta collection ! 🚀</p>`;
}

function getRarityLabel(rarity) {
  return {
    [CARD_RARITIES.COMMON]: "Commune",
    [CARD_RARITIES.RARE]: "Rare",
    [CARD_RARITIES.EPIC]: "Épique",
    [CARD_RARITIES.MASTERY]: "Maîtrise",
    [CARD_RARITIES.MAX]: "MAX"
  }[rarity] || rarity;
}
