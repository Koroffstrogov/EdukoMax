import {
  INITIAL_UNLOCKED_TABLES,
  TABLE_UNLOCK_ORDER,
  getFactById,
  getFactId,
  isValidFactor,
  isValidTable
} from "./multiplication-data.js";
import {
  calculateFactMastery,
  calculateTableMastery,
  createDefaultFactProgress
} from "./mastery-engine.js";
import {
  INITIAL_UNLOCKED_MODES,
  normalizeTablePoints,
  normalizeUnlockedModes
} from "./reward-engine.js";

export function createInitialMultiplicationProgress() {
  return {
    unlockedTables: [...INITIAL_UNLOCKED_TABLES],
    mixedModeUnlocked: false,
    unlockedModes: [...INITIAL_UNLOCKED_MODES],
    tablePoints: normalizeTablePoints({}),
    facts: {}
  };
}

export function normalizeMultiplicationProgress(progress) {
  const initialProgress = createInitialMultiplicationProgress();

  if (!isPlainObject(progress)) {
    return initialProgress;
  }

  return {
    unlockedTables: normalizeUnlockedTables(progress.unlockedTables),
    mixedModeUnlocked: Boolean(progress.mixedModeUnlocked),
    unlockedModes: normalizeUnlockedModes(
      progress.unlockedModes,
      progress.mixedModeUnlocked
    ),
    tablePoints: normalizeTablePoints(progress.tablePoints),
    facts: normalizeFactMap(progress.facts)
  };
}

export function recordMultiplicationAnswer(progress, question, answerDetails = {}) {
  const nextProgress = normalizeMultiplicationProgress(progress);
  const fact = getQuestionFact(question);
  const factProgress = normalizeFactProgress(nextProgress.facts[fact.id]);
  const answeredAt = normalizeAnsweredAt(answerDetails.answeredAt);
  const isCorrect = resolveCorrectness(question, answerDetails);
  const updatedFact = updateFactProgress(factProgress, isCorrect, answerDetails, answeredAt);

  updatedFact.mastery = calculateFactMastery(updatedFact, new Date(answeredAt));
  nextProgress.facts[fact.id] = updatedFact;

  return {
    progress: nextProgress,
    factId: fact.id,
    fact: updatedFact,
    isCorrect,
    unlockedTable: null,
    mixedModeUnlocked: false
  };
}

export function isTableMastered(progress, table) {
  if (!isValidTable(table)) {
    return false;
  }

  const stats = calculateTableMastery(table, normalizeMultiplicationProgress(progress));

  return (
    stats.attempts >= 20 &&
    stats.accuracy >= 0.85 &&
    stats.recentErrors <= 3
  );
}

export function getNextUnlock(progress) {
  return null;
}

export function shouldUnlockNewTable(progress) {
  return getNextUnlock(progress) !== null;
}

export function shouldUnlockMixedMode(progress) {
  return false;
}

export function getTableProgressSummary(progress, table) {
  const normalizedProgress = normalizeMultiplicationProgress(progress);
  const stats = calculateTableMastery(table, normalizedProgress);

  return {
    ...stats,
    isMastered: isTableMastered(normalizedProgress, table)
  };
}

export function normalizeFactProgress(factProgress) {
  const fallback = createDefaultFactProgress();

  if (!isPlainObject(factProgress)) {
    return fallback;
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

function getQuestionFact(question) {
  if (question?.factId) {
    const fact = getFactById(question.factId);

    if (fact) {
      return fact;
    }
  }

  if (isValidTable(question?.table) && isValidFactor(question?.factor)) {
    return getFactById(getFactId(Number(question.table), Number(question.factor)));
  }

  throw new Error("A valid multiplication question is required.");
}

function updateFactProgress(factProgress, isCorrect, answerDetails, answeredAt) {
  const attempts = factProgress.attempts + 1;
  const successes = factProgress.successes + (isCorrect ? 1 : 0);
  const errors = factProgress.errors + (isCorrect ? 0 : 1);
  const currentStreak = isCorrect ? factProgress.currentStreak + 1 : 0;

  return {
    attempts,
    successes,
    errors,
    currentStreak,
    bestStreak: Math.max(factProgress.bestStreak, currentStreak),
    recentResults: [
      ...factProgress.recentResults,
      { correct: isCorrect, answeredAt }
    ].slice(-10),
    lastAnsweredAt: answeredAt,
    averageResponseMs: updateAverageResponseMs(factProgress, answerDetails.responseMs),
    mastery: factProgress.mastery
  };
}

function resolveCorrectness(question, answerDetails) {
  if (typeof answerDetails.isCorrect === "boolean") {
    return answerDetails.isCorrect;
  }

  return Number(answerDetails.value) === Number(question.correctAnswer);
}

function updateAverageResponseMs(factProgress, responseMs) {
  const cleanResponseMs = normalizeNullableCount(responseMs);

  if (cleanResponseMs === null) {
    return factProgress.averageResponseMs;
  }

  if (factProgress.averageResponseMs === null || factProgress.attempts === 0) {
    return cleanResponseMs;
  }

  const total = factProgress.averageResponseMs * factProgress.attempts + cleanResponseMs;
  return Math.round(total / (factProgress.attempts + 1));
}

function normalizeFactMap(facts) {
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

function normalizeUnlockedTables(tables) {
  const requestedTables = Array.isArray(tables) ? tables : [];
  const allTables = [...INITIAL_UNLOCKED_TABLES, ...requestedTables]
    .map(Number)
    .filter(isValidTable);

  return TABLE_UNLOCK_ORDER.filter((table) => allTables.includes(table));
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

function normalizeAnsweredAt(answeredAt) {
  return typeof answeredAt === "string" ? answeredAt : new Date().toISOString();
}

function normalizeCount(value) {
  return Number.isFinite(value) && value >= 0 ? Math.round(value) : 0;
}

function normalizeNullableCount(value) {
  return Number.isFinite(value) && value >= 0 ? Math.round(value) : null;
}

function normalizeNullableString(value) {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function clampScore(value) {
  return Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : 0;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
