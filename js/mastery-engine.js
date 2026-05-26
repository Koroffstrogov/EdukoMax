import { getFactsForTable } from "./multiplication-data.js";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function createDefaultFactProgress() {
  return {
    attempts: 0,
    successes: 0,
    errors: 0,
    currentStreak: 0,
    bestStreak: 0,
    recentResults: [],
    lastAnsweredAt: null,
    averageResponseMs: null,
    mastery: 0,
    needsPractice: false,
    modeStats: {}
  };
}

export function calculateFactMastery(factProgress, now = new Date()) {
  const fact = normalizeFactForMastery(factProgress);

  if (fact.attempts === 0) {
    return 0;
  }

  const accuracy = fact.successes / fact.attempts;
  const recentAccuracy = calculateRecentAccuracy(fact.recentResults, accuracy);
  const practiceScore = Math.min(fact.attempts / 8, 1);
  const streakScore = Math.min(fact.currentStreak / 5, 1);
  const recentErrors = countRecentErrors(fact.recentResults);
  const agePenalty = calculateAgePenalty(fact.lastAnsweredAt, now);

  const mastery =
    accuracy * 45 +
    recentAccuracy * 25 +
    practiceScore * 15 +
    streakScore * 15 -
    recentErrors * 4 -
    agePenalty;

  return clampScore(Math.round(mastery));
}

export function calculateTableMastery(table, multiplicationProgress, now = new Date()) {
  const facts = getFactsForTable(table);
  const progressFacts = getProgressFacts(multiplicationProgress);
  const factStats = facts.map((fact) => {
    const progress = normalizeFactForMastery(progressFacts[fact.id]);

    return {
      ...fact,
      progress,
      mastery: calculateFactMastery(progress, now)
    };
  });

  const attempts = sum(factStats, (fact) => fact.progress.attempts);
  const successes = sum(factStats, (fact) => fact.progress.successes);
  const errors = sum(factStats, (fact) => fact.progress.errors);
  const mastery = average(factStats.map((fact) => fact.mastery));
  const recentResults = getRecentTableResults(table, multiplicationProgress);

  return {
    table,
    mastery,
    attempts,
    successes,
    errors,
    accuracy: attempts > 0 ? successes / attempts : 0,
    practicedFacts: factStats.filter((fact) => fact.progress.attempts > 0).length,
    totalFacts: facts.length,
    recentErrors: countRecentErrors(recentResults),
    recentResults
  };
}

export function calculateFactPriority(factProgress, now = new Date()) {
  const fact = normalizeFactForMastery(factProgress);

  if (fact.attempts === 0) {
    return 100;
  }

  const masteryGap = 100 - calculateFactMastery(fact, now);
  const recentErrorBoost = countRecentErrors(fact.recentResults) * 8;
  const ageBoost = calculateAgeBoost(fact.lastAnsweredAt, now);
  const lowPracticeBoost = Math.max(0, 4 - fact.attempts) * 8;
  const streakEase = Math.min(fact.currentStreak * 3, 15);
  const hesitationBoost = calculateHesitationBoost(fact.averageResponseMs);
  const memoryBoost = getMemoryPriorityBoost(getFactMemoryState(fact));
  const practiceBoost = fact.needsPractice ? 14 : 0;

  return clampScore(
    masteryGap + recentErrorBoost + ageBoost + lowPracticeBoost +
    hesitationBoost + memoryBoost + practiceBoost - streakEase
  );
}

export function getFactMemoryState(factProgress) {
  const fact = normalizeFactForMastery(factProgress);

  if (fact.attempts === 0) {
    return "new";
  }

  const accuracy = fact.successes / fact.attempts;
  const recentErrors = countRecentErrors(fact.recentResults);

  if (recentErrors >= 2 || accuracy < 0.65) {
    return "struggling";
  }

  if (isSlowFact(fact) || accuracy < 0.85 || fact.currentStreak < 2) {
    return "hesitating";
  }

  return "easy";
}

export function doesFactNeedPractice(factProgress) {
  const state = getFactMemoryState(factProgress);
  return state === "struggling" || state === "hesitating";
}

export function getRecentTableResults(table, multiplicationProgress) {
  const progressFacts = getProgressFacts(multiplicationProgress);

  return getFactsForTable(table)
    .flatMap((fact) => normalizeRecentResults(progressFacts[fact.id]?.recentResults))
    .sort(compareRecentResults)
    .slice(0, 10);
}

function normalizeFactForMastery(factProgress) {
  return {
    ...createDefaultFactProgress(),
    ...(isPlainObject(factProgress) ? factProgress : {}),
    recentResults: normalizeRecentResults(factProgress?.recentResults)
  };
}

function normalizeRecentResults(recentResults) {
  if (!Array.isArray(recentResults)) {
    return [];
  }

  return recentResults
    .map((result) => {
      if (typeof result === "boolean") {
        return { correct: result, answeredAt: null };
      }

      if (!isPlainObject(result)) {
        return null;
      }

      return {
        correct: Boolean(result.correct),
        answeredAt: typeof result.answeredAt === "string" ? result.answeredAt : null
      };
    })
    .filter(Boolean)
    .slice(-10);
}

function calculateRecentAccuracy(recentResults, fallbackAccuracy) {
  if (recentResults.length === 0) {
    return fallbackAccuracy;
  }

  const recentSuccesses = recentResults.filter((result) => result.correct).length;
  return recentSuccesses / recentResults.length;
}

function compareRecentResults(first, second) {
  if (first.answeredAt === null && second.answeredAt === null) {
    return 0;
  }

  if (first.answeredAt === null) {
    return 1;
  }

  if (second.answeredAt === null) {
    return -1;
  }

  return second.answeredAt.localeCompare(first.answeredAt);
}

function countRecentErrors(recentResults) {
  return recentResults.filter((result) => !result.correct).length;
}

function calculateAgePenalty(lastAnsweredAt, now) {
  const days = getDaysSince(lastAnsweredAt, now);

  if (days === null) {
    return 12;
  }

  return Math.min(days * 1.2, 18);
}

function calculateAgeBoost(lastAnsweredAt, now) {
  const days = getDaysSince(lastAnsweredAt, now);

  if (days === null) {
    return 20;
  }

  return Math.min(days * 2, 30);
}

function calculateHesitationBoost(averageResponseMs) {
  if (!Number.isFinite(averageResponseMs)) {
    return 0;
  }

  return Math.min(Math.max(averageResponseMs - 2500, 0) / 120, 18);
}

function getMemoryPriorityBoost(state) {
  return { struggling: 28, hesitating: 14, easy: -18, new: 0 }[state] || 0;
}

function isSlowFact(fact) {
  return Number.isFinite(fact.averageResponseMs) && fact.averageResponseMs >= 3500;
}

function getDaysSince(dateText, now) {
  if (typeof dateText !== "string") {
    return null;
  }

  const date = new Date(dateText);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return Math.max(0, (now.getTime() - date.getTime()) / MS_PER_DAY);
}

function getProgressFacts(multiplicationProgress) {
  if (isPlainObject(multiplicationProgress?.facts)) {
    return multiplicationProgress.facts;
  }

  return isPlainObject(multiplicationProgress) ? multiplicationProgress : {};
}

function average(values) {
  if (values.length === 0) {
    return 0;
  }

  return Math.round(sum(values, (value) => value) / values.length);
}

function sum(values, getValue) {
  return values.reduce((total, value) => total + getValue(value), 0);
}

function clampScore(value) {
  return Math.max(0, Math.min(100, value));
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
