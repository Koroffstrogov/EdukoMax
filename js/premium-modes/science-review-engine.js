import { getFactsForTable, isValidTable } from "../multiplication-data.js";
import { calculateFactPriority, getFactMemoryState } from "../mastery-engine.js";
import { getSpacedReviewScore } from "../spaced-repetition-engine.js";
import { getSelectedTables } from "../table-selection.js";

const CONFUSABLE_GROUPS = Object.freeze([
  ["6x7", "7x6", "8x7"],
  ["9x5", "10x5", "5x9"],
  ["4x8", "8x4", "6x8"],
  ["7x8", "8x7", "9x7"],
  ["3x6", "6x3", "4x6"]
]);

export function selectScienceFacts(progress, scienceModeId, options = {}) {
  const count = normalizeCount(options.count, 10);
  const candidates = getPlayableFacts(progress);

  if (candidates.length === 0) {
    return [];
  }

  if (scienceModeId === "anti-forget") {
    return rankOldFacts(progress, candidates).slice(0, count);
  }

  if (scienceModeId === "clever-mix") {
    return rankConfusableFacts(progress, candidates).slice(0, count);
  }

  return rankFragileFacts(progress, candidates).slice(0, count);
}

export function summarizeScienceFocus(session) {
  const tableCounts = {};

  for (const answer of session?.answers || []) {
    const table = Number(String(answer.factId).split("x")[0]);
    if (isValidTable(table)) tableCounts[table] = (tableCounts[table] || 0) + 1;
  }

  const tables = Object.entries(tableCounts)
    .sort((first, second) => second[1] - first[1])
    .slice(0, 2)
    .map(([table]) => `table de ${table}`);

  if (session?.modeId === "anti-forget") {
    return `Tu as réveillé ${session.answeredCount} multiplications oubliées.`;
  }

  if (tables.length === 0) {
    return "Le coach a préparé ta mémoire en douceur.";
  }

  return `On a renforcé surtout la ${tables.join(" et la ")} aujourd'hui.`;
}

function rankFragileFacts(progress, facts) {
  const now = new Date();
  return facts
    .map((fact) => ({
      fact,
      score: calculateFactPriority(progress?.facts?.[fact.id], now) +
        getSpacedReviewScore(progress?.facts?.[fact.id], now) +
        getMemoryBoost(progress?.facts?.[fact.id])
    }))
    .sort(compareScoredFacts)
    .map((entry) => entry.fact);
}

function rankOldFacts(progress, facts) {
  return facts
    .map((fact) => ({
      fact,
      score: getAgeScore(progress?.facts?.[fact.id]) +
        getSpacedReviewScore(progress?.facts?.[fact.id]) +
        getEasyMotivationBoost(progress?.facts?.[fact.id])
    }))
    .sort(compareScoredFacts)
    .map((entry) => entry.fact);
}

function rankConfusableFacts(progress, facts) {
  const factMap = new Map(facts.map((fact) => [fact.id, fact]));
  const groupedFacts = CONFUSABLE_GROUPS
    .flatMap((group) => group.map((id) => factMap.get(id)).filter(Boolean));
  const remainingFacts = rankFragileFacts(progress, facts)
    .filter((fact) => !groupedFacts.some((groupFact) => groupFact.id === fact.id));

  return uniqueFacts([...groupedFacts, ...remainingFacts]);
}

function getPlayableFacts(progress) {
  return getSelectedTables(progress).flatMap(getFactsForTable);
}

function getMemoryBoost(factProgress) {
  return { struggling: 35, hesitating: 18, easy: -12, new: 5 }[
    getFactMemoryState(factProgress)
  ] || 0;
}

function getAgeScore(factProgress) {
  if (!factProgress?.lastAnsweredAt) {
    return 120;
  }

  const lastDate = new Date(factProgress.lastAnsweredAt);
  if (Number.isNaN(lastDate.getTime())) {
    return 100;
  }

  return Math.min(120, (Date.now() - lastDate.getTime()) / 86400000 * 10);
}

function getEasyMotivationBoost(factProgress) {
  const mastery = Number.isFinite(factProgress?.mastery) ? factProgress.mastery : 0;
  return mastery >= 70 ? 12 : 0;
}

function uniqueFacts(facts) {
  const seen = new Set();
  return facts.filter((fact) => {
    if (seen.has(fact.id)) return false;
    seen.add(fact.id);
    return true;
  });
}

function compareScoredFacts(first, second) {
  if (second.score !== first.score) {
    return second.score - first.score;
  }

  return first.fact.id.localeCompare(second.fact.id);
}

function normalizeCount(value, fallback) {
  return Number.isInteger(value) && value > 0 ? value : fallback;
}
