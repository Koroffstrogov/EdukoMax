import { MULTIPLICATION_FACTS } from "./multiplication-data.js";
import {
  calculateFactMastery,
  calculateFactPriority,
  getFactMemoryState
} from "./mastery-engine.js";
import { normalizeMultiplicationProgress } from "./progress-engine.js";

export const TEACHER_FILTERS = Object.freeze([
  { id: "all", label: "Toutes" },
  { id: "fragile", label: "Fragiles" },
  { id: "review", label: "À revoir" },
  { id: "new", label: "Non essayées" },
  { id: "mastered", label: "Maîtrisées" }
]);

const MODE_LABELS = Object.freeze({
  "direct-answer": "Réponse directe",
  "multiple-choice": "QCM",
  "visual-groups": "Groupes visuels",
  "missing-factor": "Facteur manquant",
  mixed: "Mix",
  "speed-60": "Sprint 60”",
  "combo-max": "Combo Max",
  garden: "Jardin",
  "mascot-snack": "Goûter",
  "smart-review": "Révision intelligente",
  "anti-forget": "Anti-Oubli",
  "clever-mix": "Mix malin"
});

export function buildTrainingReport(saveData, options = {}) {
  const progress = normalizeMultiplicationProgress(saveData?.progress?.multiplication);
  const filter = normalizeFilter(options.filter);
  const allFacts = MULTIPLICATION_FACTS
    .map((fact) => buildFactInsight(fact, progress.facts[fact.id]))
    .sort(compareFactInsights);

  return {
    profile: saveData?.profile || null,
    filter,
    filters: TEACHER_FILTERS,
    summary: buildSummary(allFacts),
    allFacts,
    facts: allFacts.filter((fact) => matchesFilter(fact, filter))
  };
}

export function buildFactInsight(fact, factProgress) {
  const progress = factProgress || {};
  const attempts = normalizeCount(progress.attempts);
  const successes = normalizeCount(progress.successes);
  const errors = normalizeCount(progress.errors);
  const recentErrors = countRecentErrors(progress.recentResults);
  const mastery = calculateFactMastery(progress);
  const memoryState = getFactMemoryState(progress);
  const status = getTeacherStatus({ attempts, mastery, recentErrors, memoryState });
  const priority = calculateFactPriority(progress);

  return {
    ...fact,
    attempts,
    successes,
    errors,
    accuracyPercent: attempts > 0 ? Math.round((successes / attempts) * 100) : 0,
    currentStreak: normalizeCount(progress.currentStreak),
    bestStreak: normalizeCount(progress.bestStreak),
    recentErrors,
    lastAnsweredAt: progress.lastAnsweredAt || null,
    averageResponseMs: normalizeNullableCount(progress.averageResponseMs),
    mastery,
    memoryState,
    status,
    statusLabel: getStatusLabel(status),
    recommendation: getRecommendation(status),
    modeIds: getPlayedModeIds(progress),
    modeLabels: getPlayedModeIds(progress).map(getModeLabel),
    problemScore: getProblemScore(status, priority, recentErrors, errors)
  };
}

function buildSummary(facts) {
  const attempts = sum(facts, (fact) => fact.attempts);
  const successes = sum(facts, (fact) => fact.successes);

  return {
    attempts,
    successes,
    accuracyPercent: attempts > 0 ? Math.round((successes / attempts) * 100) : 0,
    fragileCount: countStatus(facts, "fragile"),
    reviewCount: countStatus(facts, "review"),
    newCount: countStatus(facts, "new"),
    masteredCount: countStatus(facts, "mastered")
  };
}

function getTeacherStatus({ attempts, mastery, recentErrors, memoryState }) {
  if (attempts === 0) return "new";
  if (memoryState === "struggling") return "fragile";
  if (mastery >= 85 && attempts >= 4 && recentErrors === 0) return "mastered";
  if (memoryState === "hesitating") return "review";
  return "easy";
}

function getStatusLabel(status) {
  return {
    fragile: "Fragile",
    review: "À revoir",
    new: "Nouvelle",
    mastered: "Maîtrisée",
    easy: "Facile"
  }[status] || "À observer";
}

function getRecommendation(status) {
  return {
    fragile: "À renforcer en priorité",
    review: "À revoir doucement",
    new: "Pas encore assez de données",
    mastered: "Réussite solide",
    easy: "Entretenir"
  }[status] || "Observer";
}

function getPlayedModeIds(progress) {
  const fromStats = Object.keys(progress.modeStats || {});
  const fromRecent = Array.isArray(progress.recentResults)
    ? progress.recentResults.map((result) => result.modeId).filter(Boolean)
    : [];

  return [...new Set([...fromStats, ...fromRecent])];
}

function compareFactInsights(first, second) {
  if (second.problemScore !== first.problemScore) {
    return second.problemScore - first.problemScore;
  }

  return first.id.localeCompare(second.id);
}

function matchesFilter(fact, filter) {
  return filter === "all" || fact.status === filter;
}

function normalizeFilter(filter) {
  return TEACHER_FILTERS.some((item) => item.id === filter) ? filter : "all";
}

function getProblemScore(status, priority, recentErrors, errors) {
  const statusWeight = { fragile: 5, review: 4, new: 2, easy: 1, mastered: 0 }[status] || 0;
  return statusWeight * 1000 + priority + recentErrors * 20 + errors;
}

function countRecentErrors(recentResults) {
  return Array.isArray(recentResults)
    ? recentResults.filter((result) => result && result.correct === false).length
    : 0;
}

function countStatus(facts, status) {
  return facts.filter((fact) => fact.status === status).length;
}

function getModeLabel(modeId) {
  return MODE_LABELS[modeId] || modeId;
}

function normalizeCount(value) {
  return Number.isFinite(value) && value >= 0 ? Math.round(value) : 0;
}

function normalizeNullableCount(value) {
  return Number.isFinite(value) && value >= 0 ? Math.round(value) : null;
}

function sum(values, getValue) {
  return values.reduce((total, value) => total + getValue(value), 0);
}
