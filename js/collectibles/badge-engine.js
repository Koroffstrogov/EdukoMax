import { BADGES, CARD_RARITIES, COLLECTIBLE_CARDS } from "./collectible-data.js";
import { normalizeCollectibles, normalizeStats } from "./collectible-engine.js";

/**
 * Evaluates which new badges the player has earned.
 * Returns array of badge objects.
 */
export function evaluateBadges(saveData, sessionSummary) {
  const collectibles = normalizeCollectibles(saveData);
  const stats = normalizeStats(saveData);
  const ownedBadges = new Set(collectibles.badges.owned);
  const ownedCards = new Set(collectibles.cards.owned);
  const newBadges = [];

  for (const badge of BADGES) {
    if (ownedBadges.has(badge.id)) {
      continue;
    }

    if (isBadgeEarned(badge, stats, sessionSummary, ownedCards, saveData)) {
      newBadges.push(badge);
    }
  }

  return newBadges;
}

/**
 * Applies earned badges to save data (mutates).
 */
export function applyBadgeRewards(saveData, badges) {
  const collectibles = normalizeCollectibles(saveData);
  const owned = new Set(collectibles.badges.owned);

  for (const badge of badges) {
    if (!owned.has(badge.id)) {
      collectibles.badges.owned.push(badge.id);
      collectibles.badges.newlyUnlocked.push(badge.id);
      owned.add(badge.id);
    }
  }

  saveData.collectibles = collectibles;
  return saveData;
}

/**
 * Returns badge collection stats.
 */
export function getBadgeStats(saveData) {
  const collectibles = normalizeCollectibles(saveData);
  const totalBadges = BADGES.length;
  const ownedBadges = collectibles.badges.owned.length;
  const percent = totalBadges > 0 ? Math.round((ownedBadges / totalBadges) * 100) : 0;

  return { totalBadges, ownedBadges, percent };
}

/**
 * Updates cumulative stats after a session (mutates saveData.stats).
 */
export function updateStatsAfterSession(saveData, sessionSummary) {
  const stats = normalizeStats(saveData);

  stats.sessionsCompleted += 1;
  stats.totalCorrectAnswers += sessionSummary.correctAnswers || 0;
  stats.totalQuestionsAnswered += sessionSummary.totalQuestions || 0;

  if (sessionSummary.perfect) {
    stats.perfectSessions += 1;
  }

  if ((sessionSummary.bestStreak || 0) > stats.bestGlobalStreak) {
    stats.bestGlobalStreak = sessionSummary.bestStreak;
  }

  saveData.stats = stats;
  return saveData;
}

function isBadgeEarned(badge, stats, sessionSummary, ownedCards, saveData) {
  switch (badge.condition) {
    case "firstSession":
      return stats.sessionsCompleted >= 1 || sessionSummary !== null;

    case "fiveStreak":
      return (sessionSummary?.bestStreak || 0) >= 5 || stats.bestGlobalStreak >= 5;

    case "perfectSession":
      return sessionSummary?.perfect === true || stats.perfectSessions > 0;

    case "firstRareCard":
      return hasCardOfRarity(ownedCards, CARD_RARITIES.RARE);

    case "firstEpicCard":
      return hasCardOfRarity(ownedCards, CARD_RARITIES.EPIC);

    case "tenSessions":
      return stats.sessionsCompleted >= 10;

    case "fiftyCorrect":
      return stats.totalCorrectAnswers >= 50;

    case "hundredCorrect":
      return stats.totalCorrectAnswers >= 100;

    case "tableMastered":
      return isTableBadgeEarned(badge.id, sessionSummary, saveData);

    case "easyTablesMastered":
      return areTablesMastered([2, 5, 10], sessionSummary, saveData);

    case "allTablesMastered":
      return areTablesMastered([2, 3, 4, 5, 6, 7, 8, 9, 10], sessionSummary, saveData);

    default:
      return false;
  }
}

function hasCardOfRarity(ownedCards, rarity) {
  for (const cardId of ownedCards) {
    const card = COLLECTIBLE_CARDS.find((c) => c.id === cardId);

    if (card && card.rarity === rarity) {
      return true;
    }
  }

  return false;
}

function isTableBadgeEarned(badgeId, sessionSummary, saveData) {
  const tableMatch = badgeId.match(/^table-(\d+)-mastered$/);

  if (!tableMatch) {
    return false;
  }

  const table = Number(tableMatch[1]);
  const masteredAfter = sessionSummary?.masteredTablesAfter || [];
  const alreadyMastered = getMasteredTables(saveData);

  return masteredAfter.includes(table) || alreadyMastered.includes(table);
}

function areTablesMastered(tables, sessionSummary, saveData) {
  const masteredAfter = sessionSummary?.masteredTablesAfter || [];
  const alreadyMastered = getMasteredTables(saveData);
  const allMastered = [...new Set([...alreadyMastered, ...masteredAfter])];

  return tables.every((table) => allMastered.includes(table));
}

function getMasteredTables(saveData) {
  const facts = saveData?.progress?.multiplication?.facts || {};
  const masteredTables = [];

  for (let table = 2; table <= 10; table++) {
    if (isTableMastered(table, facts)) {
      masteredTables.push(table);
    }
  }

  return masteredTables;
}

function isTableMastered(table, facts) {
  let masteredCount = 0;
  let totalFacts = 0;

  for (const [factId, progress] of Object.entries(facts)) {
    const factTable = Number(factId.split("x")[0]);

    if (factTable !== table) {
      continue;
    }

    totalFacts++;

    if ((progress?.mastery || 0) >= 80) {
      masteredCount++;
    }
  }

  return totalFacts >= 9 && masteredCount >= 8;
}

