import { getFactsForTable, isValidTable } from "./multiplication-data.js";
import { QUESTION_MODES } from "./multiplication-generator.js";
import { calculateFactPriority } from "./mastery-engine.js";
import {
  getPracticeBucket,
  getSpacedReviewScore
} from "./spaced-repetition-engine.js";
import { getSelectedTables } from "./table-selection.js";

const DEFAULT_COUNT = 8;
const RETRY_DELAY = 3;

const MODE_PROFILES = Object.freeze({
  [QUESTION_MODES.directAnswer]: profile([0.45, 0.35, 0.15, 0.05], [
    "priority", "consolidation", "priority", "easy", "consolidation", "new"
  ]),
  [QUESTION_MODES.multipleChoice]: profile([0.25, 0.35, 0.15, 0.25], [
    "consolidation", "new", "priority", "consolidation", "easy"
  ]),
  [QUESTION_MODES.multipleChoice8]: profile([0.3, 0.4, 0.2, 0.1], [
    "consolidation", "priority", "easy", "consolidation", "new"
  ]),
  [QUESTION_MODES.visualGroups]: profile([0.4, 0.15, 0.05, 0.4], [
    "new", "priority", "new", "priority", "consolidation", "easy"
  ]),
  [QUESTION_MODES.missingFactor]: profile([0.35, 0.45, 0.2, 0], [
    "consolidation", "priority", "easy", "consolidation"
  ]),
  mixed: profile([0.4, 0.3, 0.2, 0.1], [
    "priority", "consolidation", "easy", "priority", "new"
  ]),
  "speed-60": profile([0.25, 0.35, 0.35, 0.05], [
    "easy", "consolidation", "priority", "easy"
  ]),
  "combo-max": profile([0.3, 0.3, 0.35, 0.05], [
    "easy", "priority", "consolidation", "easy"
  ]),
  garden: profile([0.25, 0.25, 0.25, 0.25], [
    "new", "easy", "consolidation", "priority"
  ]),
  "mascot-snack": profile([0.25, 0.25, 0.25, 0.25], [
    "easy", "new", "consolidation", "priority"
  ]),
  "magic-bracelets": profile([0.35, 0.25, 0.1, 0.3], [
    "new", "priority", "consolidation", "new", "priority", "easy"
  ])
});

export function buildPracticeQueue(progress, options = {}) {
  const count = normalizeCount(options.count, DEFAULT_COUNT);
  const candidates = getCandidateFacts(progress, options);
  const entries = rankEntries(candidates, progress, options.now);

  if (entries.length === 0) {
    return [];
  }

  const slots = buildSlots(getModeProfile(options.modeId), count);
  const queue = [];
  const usedIds = new Set();

  for (const slot of slots) {
    queue.push(pickEntry(entries, slot, queue, usedIds).fact);
  }

  return queue;
}

export function scheduleRetryAfterError(session, factId) {
  if (!factId || session?.retriedFactIds?.includes(factId)) {
    return session;
  }

  const availableAtIndex = session.currentIndex + RETRY_DELAY;
  if (availableAtIndex >= session.totalQuestions) {
    return session;
  }

  return {
    ...session,
    retryQueue: [
      ...(session.retryQueue || []),
      { factId, availableAtIndex }
    ],
    retriedFactIds: [...(session.retriedFactIds || []), factId]
  };
}

function getCandidateFacts(progress, options) {
  const selectedTables = getSelectedTables(progress);
  const requestedTable = Number(options.table);
  const tables = isValidTable(requestedTable) && selectedTables.includes(requestedTable)
    ? [requestedTable]
    : selectedTables;

  return tables.flatMap(getFactsForTable);
}

function rankEntries(facts, progress, nowValue) {
  const now = nowValue instanceof Date ? nowValue : new Date();

  return facts
    .map((fact) => {
      const factProgress = progress?.facts?.[fact.id];
      const bucket = mapBucket(getPracticeBucket(factProgress, now));
      return {
        fact,
        bucket,
        score: calculateFactPriority(factProgress, now) +
          getSpacedReviewScore(factProgress, now) +
          getBucketBoost(bucket)
      };
    })
    .sort(compareEntries);
}

function buildSlots(profileConfig, count) {
  const quotas = getBucketQuotas(profileConfig.weights, count);
  const slots = [];

  while (slots.length < count) {
    for (const bucket of profileConfig.order) {
      if (quotas[bucket] > 0 && slots.length < count) {
        slots.push(bucket);
        quotas[bucket] -= 1;
      }
    }
  }

  return slots;
}

function getBucketQuotas(weights, count) {
  const buckets = ["priority", "consolidation", "easy", "new"];
  const raw = buckets.map((bucket, index) => ({ bucket, value: weights[index] * count }));
  const quotas = raw.reduce((result, item) => {
    result[item.bucket] = Math.floor(item.value);
    return result;
  }, {});
  let remaining = count - Object.values(quotas).reduce((total, value) => total + value, 0);

  raw
    .sort((first, second) => (second.value % 1) - (first.value % 1))
    .forEach((item) => {
      if (remaining > 0) {
        quotas[item.bucket] += 1;
        remaining -= 1;
      }
    });

  return quotas;
}

function pickEntry(entries, bucket, queue, usedIds) {
  const previousId = queue.at(-1)?.id;
  const preferred = entries.find((entry) => {
    return entry.bucket === bucket && entry.fact.id !== previousId && !usedIds.has(entry.fact.id);
  });
  const fallback = entries.find((entry) => entry.fact.id !== previousId && !usedIds.has(entry.fact.id)) ||
    entries.find((entry) => entry.fact.id !== previousId) ||
    entries[0];

  const picked = preferred || fallback;
  usedIds.add(picked.fact.id);
  return picked;
}

function mapBucket(bucket) {
  return bucket === "due" || bucket === "fragile" ? "priority" : bucket;
}

function getModeProfile(modeId) {
  return MODE_PROFILES[modeId] || MODE_PROFILES.mixed;
}

function getBucketBoost(bucket) {
  return { priority: 14, consolidation: 8, new: 5, easy: 0 }[bucket] || 0;
}

function compareEntries(first, second) {
  if (second.score !== first.score) {
    return second.score - first.score;
  }

  return first.fact.id.localeCompare(second.fact.id);
}

function profile(weights, order) {
  return Object.freeze({ weights, order });
}

function normalizeCount(value, fallback) {
  return Number.isInteger(value) && value > 0 ? value : fallback;
}
