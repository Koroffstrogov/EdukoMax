import {
  INITIAL_UNLOCKED_TABLES,
  TABLE_UNLOCK_ORDER,
  getFactById,
  isValidTable
} from "./multiplication-data.js";
import {
  INITIAL_UNLOCKED_MODES,
  INITIAL_OWNED_THEMES,
  normalizeOwnedThemes,
  normalizeTablePoints,
  normalizeUnlockedModes
} from "./reward-engine.js";

const SAVE_KEY = "edukomax.save.v1";
const CURRENT_VERSION = 1;

export function loadSave() {
  const rawSave = readRawSave();

  if (rawSave === null) {
    return createDefaultSave();
  }

  const parsedSave = parseSave(rawSave);

  if (!isPlainObject(parsedSave)) {
    return createDefaultSave();
  }

  return normalizeSave(parsedSave);
}

export function saveGame(saveData) {
  const normalizedSave = normalizeSave(saveData);

  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(normalizedSave));
    return true;
  } catch {
    return false;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function createDefaultSave() {
  const now = new Date().toISOString();
  return {
    version: CURRENT_VERSION,
    profile: { name: "Explorateur", createdAt: now },
    settings: { theme: "sunny", reducedMotion: false },
    progress: {
      multiplication: {
        unlockedTables: [...INITIAL_UNLOCKED_TABLES],
        mixedModeUnlocked: false,
        unlockedModes: [...INITIAL_UNLOCKED_MODES],
        tablePoints: normalizeTablePoints({}),
        facts: {}
      },
      fractions: { unlocked: false },
      equations: { unlocked: false }
    },
    rewards: {
      xp: 0, stars: 0, coins: 0, totalCoinsEarned: 0,
      ownedThemes: [...INITIAL_OWNED_THEMES],
      purchases: [], collectibles: []
    },
    sessions: { completed: 0, lastPlayedAt: null },
    collectibles: {
      cards: { owned: [], newlyUnlocked: [] },
      badges: { owned: [], newlyUnlocked: [] },
      showcase: { featuredCardIds: [], featuredBadgeIds: [] }
    },
    stats: {
      sessionsCompleted: 0, totalCorrectAnswers: 0,
      totalQuestionsAnswered: 0, perfectSessions: 0, bestGlobalStreak: 0
    },
    updatedAt: now
  };
}

function readRawSave() {
  try {
    return localStorage.getItem(SAVE_KEY);
  } catch {
    return null;
  }
}

function parseSave(rawSave) {
  try {
    return JSON.parse(rawSave);
  } catch {
    return null;
  }
}

function normalizeSave(saveData) {
  const defaultSave = createDefaultSave();

  if (!isPlainObject(saveData)) {
    return defaultSave;
  }

  const settings = normalizeSettings(saveData.settings, defaultSave.settings);

  return {
    version: CURRENT_VERSION,
    profile: normalizeProfile(saveData.profile, defaultSave.profile),
    settings,
    progress: normalizeProgress(saveData.progress, defaultSave.progress),
    rewards: normalizeRewards(saveData.rewards, defaultSave.rewards, settings.theme),
    sessions: normalizeSessions(saveData.sessions, defaultSave.sessions),
    collectibles: normalizeCollectiblesSection(saveData.collectibles),
    stats: normalizeStatsSection(saveData.stats, saveData.sessions),
    updatedAt: normalizeString(saveData.updatedAt, defaultSave.updatedAt)
  };
}

function normalizeProfile(profile, fallback) {
  if (!isPlainObject(profile)) {
    return fallback;
  }

  return {
    name: normalizeString(profile.name, fallback.name),
    createdAt: normalizeString(profile.createdAt, fallback.createdAt)
  };
}

function normalizeSettings(settings, fallback) {
  if (!isPlainObject(settings)) {
    return fallback;
  }

  return {
    theme: normalizeString(settings.theme, fallback.theme),
    reducedMotion: Boolean(settings.reducedMotion)
  };
}

function normalizeProgress(progress, fallback) {
  if (!isPlainObject(progress)) {
    return fallback;
  }

  return {
    multiplication: normalizeMultiplicationProgress(
      progress.multiplication,
      fallback.multiplication
    ),
    fractions: {
      unlocked: Boolean(progress.fractions?.unlocked)
    },
    equations: {
      unlocked: Boolean(progress.equations?.unlocked)
    }
  };
}

function normalizeMultiplicationProgress(progress, fallback) {
  if (!isPlainObject(progress)) {
    return fallback;
  }

  return {
    unlockedTables: normalizeUnlockedTables(progress.unlockedTables),
    mixedModeUnlocked: Boolean(progress.mixedModeUnlocked),
    unlockedModes: normalizeUnlockedModes(
      progress.unlockedModes,
      progress.mixedModeUnlocked
    ),
    tablePoints: normalizeTablePoints(progress.tablePoints),
    facts: normalizeMultiplicationFacts(progress.facts)
  };
}

function normalizeUnlockedTables(tables) {
  const requestedTables = Array.isArray(tables) ? tables : [];
  const cleanTables = [...INITIAL_UNLOCKED_TABLES, ...requestedTables]
    .map(Number)
    .filter(isValidTable);

  return TABLE_UNLOCK_ORDER.filter((table) => cleanTables.includes(table));
}

function normalizeMultiplicationFacts(facts) {
  if (!isPlainObject(facts)) {
    return {};
  }

  return Object.entries(facts).reduce((cleanFacts, [factId, factProgress]) => {
    if (getFactById(factId)) {
      cleanFacts[factId] = normalizeFactProgress(factProgress);
    }

    return cleanFacts;
  }, {});
}

function normalizeFactProgress(factProgress) {
  if (!isPlainObject(factProgress)) {
    return createDefaultFactProgress();
  }

  const attempts = normalizeCount(factProgress.attempts);
  const successes = Math.min(normalizeCount(factProgress.successes), attempts);
  const errors = Math.min(normalizeCount(factProgress.errors), attempts);

  return {
    attempts,
    successes,
    errors,
    currentStreak: normalizeCount(factProgress.currentStreak),
    bestStreak: normalizeCount(factProgress.bestStreak),
    recentResults: normalizeRecentResults(factProgress.recentResults),
    lastAnsweredAt: normalizeNullableString(factProgress.lastAnsweredAt),
    averageResponseMs: normalizeNullableCount(factProgress.averageResponseMs),
    mastery: clampScore(factProgress.mastery)
  };
}

function createDefaultFactProgress() {
  return {
    attempts: 0,
    successes: 0,
    errors: 0,
    currentStreak: 0,
    bestStreak: 0,
    recentResults: [],
    lastAnsweredAt: null,
    averageResponseMs: null,
    mastery: 0
  };
}

function normalizeRecentResults(recentResults) {
  if (!Array.isArray(recentResults)) {
    return [];
  }

  return recentResults
    .map(normalizeRecentResult)
    .filter(Boolean)
    .slice(-10);
}

function normalizeRecentResult(result) {
  if (typeof result === "boolean") {
    return { correct: result, answeredAt: null };
  }

  if (!isPlainObject(result)) {
    return null;
  }

  return {
    correct: Boolean(result.correct),
    answeredAt: normalizeNullableString(result.answeredAt)
  };
}

function normalizeRewards(rewards, fallback, activeTheme) {
  if (!isPlainObject(rewards)) {
    return {
      ...fallback,
      ownedThemes: normalizeOwnedThemes(fallback.ownedThemes, activeTheme)
    };
  }

  return {
    xp: normalizeCount(rewards.xp),
    stars: normalizeCount(rewards.stars),
    coins: normalizeCount(rewards.coins),
    totalCoinsEarned: normalizeCount(rewards.totalCoinsEarned),
    ownedThemes: normalizeOwnedThemes(rewards.ownedThemes, activeTheme),
    purchases: normalizePurchases(rewards.purchases),
    collectibles: Array.isArray(rewards.collectibles) ? rewards.collectibles : []
  };
}

function normalizePurchases(purchases) {
  if (!Array.isArray(purchases)) {
    return [];
  }

  return purchases
    .filter(isPlainObject)
    .map((purchase) => ({
      type: normalizeString(purchase.type, "unknown"),
      id: normalizeString(purchase.id, "unknown"),
      cost: normalizeCount(purchase.cost),
      purchasedAt: normalizeNullableString(purchase.purchasedAt)
    }));
}

function normalizeSessions(sessions, fallback) {
  if (!isPlainObject(sessions)) {
    return fallback;
  }

  return {
    completed: normalizeCount(sessions.completed),
    lastPlayedAt:
      typeof sessions.lastPlayedAt === "string" ? sessions.lastPlayedAt : null
  };
}

function normalizeCount(value) {
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function normalizeNullableCount(value) {
  return Number.isFinite(value) && value >= 0 ? Math.round(value) : null;
}

function normalizeString(value, fallback) {
  return typeof value === "string" && value.trim() !== "" ? value : fallback;
}

function normalizeNullableString(value) {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function clampScore(value) {
  return Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : 0;
}

function normalizeCollectiblesSection(collectibles) {
  if (!isPlainObject(collectibles)) {
    return {
      cards: { owned: [], newlyUnlocked: [] },
      badges: { owned: [], newlyUnlocked: [] },
      showcase: { featuredCardIds: [], featuredBadgeIds: [] }
    };
  }
  return {
    cards: normalizeIdPair(collectibles.cards),
    badges: normalizeIdPair(collectibles.badges),
    showcase: normalizeShowcaseSection(collectibles.showcase)
  };
}

function normalizeIdPair(section) {
  if (!isPlainObject(section)) {
    return { owned: [], newlyUnlocked: [] };
  }
  return {
    owned: normalizeStringArray(section.owned),
    newlyUnlocked: normalizeStringArray(section.newlyUnlocked)
  };
}

function normalizeShowcaseSection(showcase) {
  if (!isPlainObject(showcase)) {
    return { featuredCardIds: [], featuredBadgeIds: [] };
  }
  return {
    featuredCardIds: normalizeStringArray(showcase.featuredCardIds),
    featuredBadgeIds: normalizeStringArray(showcase.featuredBadgeIds)
  };
}

function normalizeStatsSection(stats, sessions) {
  if (!isPlainObject(stats)) {
    return {
      sessionsCompleted: normalizeCount(sessions?.completed),
      totalCorrectAnswers: 0,
      totalQuestionsAnswered: 0,
      perfectSessions: 0,
      bestGlobalStreak: 0
    };
  }
  return {
    sessionsCompleted: normalizeCount(stats.sessionsCompleted),
    totalCorrectAnswers: normalizeCount(stats.totalCorrectAnswers),
    totalQuestionsAnswered: normalizeCount(stats.totalQuestionsAnswered),
    perfectSessions: normalizeCount(stats.perfectSessions),
    bestGlobalStreak: normalizeCount(stats.bestGlobalStreak)
  };
}

function normalizeStringArray(arr) {
  return Array.isArray(arr) ? arr.filter((item) => typeof item === "string" && item.length > 0) : [];
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
