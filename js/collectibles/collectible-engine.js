import { COLLECTIBLE_CARDS, CARD_RARITIES } from "./collectible-data.js";

/**
 * Determines cards earned after a session.
 * Returns { cards: [], bonusCoins: 0 }
 */
export function pickCardRewards(saveData, sessionSummary) {
  const eligible = getEligibleCardsForSession(saveData, sessionSummary);
  const picked = [];

  const masteryCards = pickMasteryCards(eligible, sessionSummary);
  picked.push(...masteryCards);

  const commonCard = pickByRarity(eligible, CARD_RARITIES.COMMON, picked);

  if (commonCard) {
    picked.push(commonCard);
  }

  if (sessionSummary.accuracy >= 0.75) {
    const rareCard = pickByRarity(eligible, CARD_RARITIES.RARE, picked);

    if (rareCard && shouldAwardRare(sessionSummary)) {
      picked.push(rareCard);
    }
  }

  if (sessionSummary.accuracy >= 0.9 || sessionSummary.perfect) {
    const epicCard = pickByRarity(eligible, CARD_RARITIES.EPIC, picked);

    if (epicCard && shouldAwardEpic(sessionSummary)) {
      picked.push(epicCard);
    }
  }

  const bonusCoins = picked.length === 0 ? 2 : 0;

  return { cards: picked.slice(0, 3), bonusCoins };
}

/**
 * Returns all cards not yet owned that match the session context.
 */
export function getEligibleCardsForSession(saveData, sessionSummary) {
  const owned = getOwnedCardIds(saveData);
  const table = sessionSummary.table;

  return COLLECTIBLE_CARDS.filter((card) => {
    if (owned.has(card.id)) {
      return false;
    }

    if (card.rarity === CARD_RARITIES.MASTERY) {
      return false;
    }

    if (card.table === table || card.table === "mix") {
      return true;
    }

    return false;
  });
}

/**
 * Applies earned cards to save data (mutates).
 */
export function applyCardRewards(saveData, cardRewards) {
  const collectibles = normalizeCollectibles(saveData);
  const owned = new Set(collectibles.cards.owned);

  for (const card of cardRewards) {
    if (!owned.has(card.id)) {
      collectibles.cards.owned.push(card.id);
      collectibles.cards.newlyUnlocked.push(card.id);
      owned.add(card.id);
    }
  }

  saveData.collectibles = collectibles;
  return saveData;
}

/**
 * Marks all newly unlocked collectibles as seen.
 */
export function markCollectiblesSeen(saveData) {
  const collectibles = normalizeCollectibles(saveData);
  collectibles.cards.newlyUnlocked = [];
  collectibles.badges.newlyUnlocked = [];
  saveData.collectibles = collectibles;
  return saveData;
}

/**
 * Returns collection stats.
 */
export function getCollectionStats(saveData) {
  const collectibles = normalizeCollectibles(saveData);
  const totalCards = COLLECTIBLE_CARDS.length;
  const ownedCards = collectibles.cards.owned.length;
  const percent = totalCards > 0 ? Math.round((ownedCards / totalCards) * 100) : 0;

  return { totalCards, ownedCards, percent };
}

/**
 * Normalizes collectibles structure on save data.
 */
export function normalizeCollectibles(saveData) {
  const raw = saveData?.collectibles;

  if (!isPlainObject(raw)) {
    return createDefaultCollectibles();
  }

  return {
    cards: normalizeCardSection(raw.cards),
    badges: normalizeBadgeSection(raw.badges),
    showcase: normalizeShowcase(raw.showcase)
  };
}

/**
 * Normalizes stats structure on save data.
 */
export function normalizeStats(saveData) {
  const raw = saveData?.stats;

  if (!isPlainObject(raw)) {
    return createDefaultStats(saveData);
  }

  return {
    sessionsCompleted: normalizeCount(raw.sessionsCompleted),
    totalCorrectAnswers: normalizeCount(raw.totalCorrectAnswers),
    totalQuestionsAnswered: normalizeCount(raw.totalQuestionsAnswered),
    perfectSessions: normalizeCount(raw.perfectSessions),
    bestGlobalStreak: normalizeCount(raw.bestGlobalStreak)
  };
}

export function createDefaultCollectibles() {
  return {
    cards: { owned: [], newlyUnlocked: [] },
    badges: { owned: [], newlyUnlocked: [] },
    showcase: { featuredCardIds: [], featuredBadgeIds: [] }
  };
}

function createDefaultStats(saveData) {
  return {
    sessionsCompleted: normalizeCount(saveData?.sessions?.completed),
    totalCorrectAnswers: 0,
    totalQuestionsAnswered: 0,
    perfectSessions: 0,
    bestGlobalStreak: 0
  };
}

function pickMasteryCards(eligible, sessionSummary) {
  const newlyMastered = sessionSummary.masteredTablesAfter?.filter(
    (table) => !sessionSummary.masteredTablesBefore?.includes(table)
  ) || [];

  if (newlyMastered.length === 0) {
    return [];
  }

  const owned = new Set();
  const result = [];

  for (const table of newlyMastered) {
    const masteryCard = COLLECTIBLE_CARDS.find(
      (c) => c.table === table && c.rarity === CARD_RARITIES.MASTERY && !owned.has(c.id)
    );

    if (masteryCard) {
      result.push(masteryCard);
      owned.add(masteryCard.id);
    }
  }

  return result;
}

function pickByRarity(eligible, rarity, alreadyPicked) {
  const pickedIds = new Set(alreadyPicked.map((c) => c.id));
  const candidates = eligible.filter(
    (c) => c.rarity === rarity && !pickedIds.has(c.id)
  );

  if (candidates.length === 0) {
    return null;
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}

function shouldAwardRare(sessionSummary) {
  const chance = Math.min(0.3 + sessionSummary.accuracy * 0.3, 0.7);
  return Math.random() < chance;
}

function shouldAwardEpic(sessionSummary) {
  const chance = sessionSummary.perfect ? 0.5 : 0.25;
  return Math.random() < chance;
}

function getOwnedCardIds(saveData) {
  const collectibles = normalizeCollectibles(saveData);
  return new Set(collectibles.cards.owned);
}

function normalizeCardSection(cards) {
  if (!isPlainObject(cards)) {
    return { owned: [], newlyUnlocked: [] };
  }

  return {
    owned: normalizeIdArray(cards.owned),
    newlyUnlocked: normalizeIdArray(cards.newlyUnlocked)
  };
}

function normalizeBadgeSection(badges) {
  if (!isPlainObject(badges)) {
    return { owned: [], newlyUnlocked: [] };
  }

  return {
    owned: normalizeIdArray(badges.owned),
    newlyUnlocked: normalizeIdArray(badges.newlyUnlocked)
  };
}

function normalizeShowcase(showcase) {
  if (!isPlainObject(showcase)) {
    return { featuredCardIds: [], featuredBadgeIds: [] };
  }

  return {
    featuredCardIds: normalizeIdArray(showcase.featuredCardIds),
    featuredBadgeIds: normalizeIdArray(showcase.featuredBadgeIds)
  };
}

function normalizeIdArray(arr) {
  if (!Array.isArray(arr)) {
    return [];
  }

  return [...new Set(arr.filter((id) => typeof id === "string" && id.length > 0))];
}

function normalizeCount(value) {
  return Number.isFinite(value) && value >= 0 ? Math.round(value) : 0;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
