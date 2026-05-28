import {
  INITIAL_UNLOCKED_TABLES,
  TABLE_UNLOCK_ORDER,
  MULTIPLICATION_FACTS,
  getFactById,
  getFactId,
  isValidFactor,
  isValidTable
} from "./multiplication-data.js";
import {
  calculateFactMastery,
  calculateTableMastery,
  createDefaultFactProgress,
  doesFactNeedPractice
} from "./mastery-engine.js";
import {
  INITIAL_UNLOCKED_MODES,
  normalizeTablePoints,
  normalizeUnlockedModes
} from "./reward-engine.js";
import {
  normalizeSpacedSchedule,
  updateSpacedSchedule
} from "./spaced-repetition-engine.js";
import { normalizeSelectedTables } from "./table-selection.js";

export function createInitialMultiplicationProgress() {
  return {
    unlockedTables: [...INITIAL_UNLOCKED_TABLES],
    selectedTables: [...INITIAL_UNLOCKED_TABLES],
    mixedModeUnlocked: false,
    unlockedModes: [...INITIAL_UNLOCKED_MODES],
    tablePoints: normalizeTablePoints({}),
    facts: createInitialFactMap()
  };
}

export function normalizeMultiplicationProgress(progress) {
  const initialProgress = createInitialMultiplicationProgress();

  if (!isPlainObject(progress)) {
    return initialProgress;
  }

  return {
    unlockedTables: normalizeUnlockedTables(progress.unlockedTables),
    selectedTables: normalizeSelectedTables(
      progress.selectedTables,
      progress.unlockedTables || INITIAL_UNLOCKED_TABLES
    ),
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
  const updatedFact = updateFactProgress(
    factProgress,
    isCorrect,
    answerDetails,
    answeredAt,
    question
  );

  updatedFact.mastery = calculateFactMastery(updatedFact, new Date(answeredAt));
  updatedFact.needsPractice = doesFactNeedPractice(updatedFact);
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

  const stats = normalizePracticeStats(factProgress);

  return {
    ...stats,
    ...normalizeSpacedSchedule(factProgress),
    mastery: clampScore(factProgress.mastery),
    needsPractice: Boolean(factProgress.needsPractice),
    modeStats: normalizeModeStats(factProgress.modeStats)
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

function updateFactProgress(factProgress, isCorrect, answerDetails, answeredAt, question) {
  const modeId = normalizeModeId(answerDetails.modeId);
  const questionMode = normalizeModeId(answerDetails.questionMode || question?.mode);
  const recentMeta = { modeId, questionMode };
  const updatedStats = updatePracticeStats(
    factProgress,
    isCorrect,
    answerDetails,
    answeredAt,
    recentMeta
  );
  const modeStats = { ...factProgress.modeStats };
  const spacedSchedule = updateSpacedSchedule(
    { ...factProgress, ...updatedStats },
    { ...answerDetails, isCorrect, answeredAt }
  );

  if (modeId !== null) {
    modeStats[modeId] = updatePracticeStats(
      normalizePracticeStats(modeStats[modeId]),
      isCorrect,
      answerDetails,
      answeredAt,
      recentMeta
    );
  }

  return {
    ...updatedStats,
    ...spacedSchedule,
    mastery: factProgress.mastery,
    needsPractice: factProgress.needsPractice,
    modeStats
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

function updatePracticeStats(stats, isCorrect, answerDetails, answeredAt, recentMeta = {}) {
  const attempts = stats.attempts + 1;
  const successes = stats.successes + (isCorrect ? 1 : 0);
  const errors = stats.errors + (isCorrect ? 0 : 1);
  const currentStreak = isCorrect ? stats.currentStreak + 1 : 0;

  return {
    attempts,
    successes,
    errors,
    currentStreak,
    bestStreak: Math.max(stats.bestStreak, currentStreak),
    recentResults: [
      ...stats.recentResults,
      createRecentResult(isCorrect, answeredAt, recentMeta)
    ].slice(-10),
    lastAnsweredAt: answeredAt,
    averageResponseMs: updateAverageResponseMs(stats, answerDetails.responseMs)
  };
}

function normalizePracticeStats(stats) {
  const attempts = normalizeCount(stats?.attempts);
  const successes = Math.min(normalizeCount(stats?.successes), attempts);
  const errors = Math.min(normalizeCount(stats?.errors), attempts);

  return {
    attempts,
    successes,
    errors,
    currentStreak: normalizeCount(stats?.currentStreak),
    bestStreak: normalizeCount(stats?.bestStreak),
    recentResults: normalizeRecentResults(stats?.recentResults),
    lastAnsweredAt: normalizeNullableString(stats?.lastAnsweredAt),
    averageResponseMs: normalizeNullableCount(stats?.averageResponseMs)
  };
}

function normalizeModeStats(modeStats) {
  if (!isPlainObject(modeStats)) {
    return {};
  }

  return Object.entries(modeStats).reduce((stats, [modeId, value]) => {
    const safeModeId = normalizeModeId(modeId);
    if (safeModeId !== null) {
      stats[safeModeId] = normalizePracticeStats(value);
    }
    return stats;
  }, {});
}

function normalizeFactMap(facts) {
  const source = isPlainObject(facts) ? facts : {};

  return MULTIPLICATION_FACTS.reduce((cleanFacts, fact) => {
    cleanFacts[fact.id] = normalizeFactProgress(source[fact.id]);
    return cleanFacts;
  }, {});
}

function createInitialFactMap() {
  return MULTIPLICATION_FACTS.reduce((facts, fact) => {
    facts[fact.id] = createDefaultFactProgress();
    return facts;
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
    answeredAt: normalizeNullableString(result.answeredAt),
    modeId: normalizeModeId(result.modeId),
    questionMode: normalizeModeId(result.questionMode)
  };
}

function createRecentResult(isCorrect, answeredAt, meta) {
  return {
    correct: isCorrect,
    answeredAt,
    modeId: meta.modeId,
    questionMode: meta.questionMode
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

function normalizeModeId(value) {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function clampScore(value) {
  return Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : 0;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
