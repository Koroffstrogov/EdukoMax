import { test } from "./test-runner.js";
import { assert, assertEqual } from "./test-utils.js";
import { buildPracticeQueue, scheduleRetryAfterError } from "../js/practice-planner.js";

test("planner: only chooses facts from selected tables", () => {
  const progress = { selectedTables: [7], facts: {} };
  const queue = buildPracticeQueue(progress, { count: 8, modeId: "mixed" });

  assertEqual(queue.length, 8);
  assert(queue.every((fact) => fact.table === 7));
});

test("planner: queue avoids immediate duplicates", () => {
  const progress = { selectedTables: [2], facts: {} };
  const queue = buildPracticeQueue(progress, { count: 8, modeId: "direct-answer" });

  for (let index = 1; index < queue.length; index += 1) {
    assert(queue[index].id !== queue[index - 1].id, `duplicate at ${index}`);
  }
});

test("planner: visual groups starts with discovery or fragile facts", () => {
  const progress = { selectedTables: [2], facts: { "2x2": easyFact(), "2x4": fragileFact() } };
  const queue = buildPracticeQueue(progress, { count: 4, modeId: "visual-groups" });
  const firstProgress = progress.facts[queue[0].id];

  assert(!firstProgress || queue[0].id === "2x4", `first fact ${queue[0].id}`);
});

test("planner: missing factor avoids new facts when enough known facts exist", () => {
  const facts = {};
  for (let factor = 2; factor <= 9; factor += 1) {
    facts[`2x${factor}`] = knownFact();
  }
  const progress = { selectedTables: [2], facts };
  const queue = buildPracticeQueue(progress, { count: 4, modeId: "missing-factor" });

  assert(queue.every((fact) => facts[fact.id]), "only known facts selected");
});

test("planner: retry after error is delayed by three question slots", () => {
  const session = {
    currentIndex: 0,
    totalQuestions: 8,
    retryQueue: [],
    retriedFactIds: []
  };
  const next = scheduleRetryAfterError(session, "2x3");

  assertEqual(next.retryQueue[0].factId, "2x3");
  assertEqual(next.retryQueue[0].availableAtIndex, 3);
});

function knownFact() {
  return {
    attempts: 6,
    successes: 5,
    errors: 1,
    currentStreak: 2,
    bestStreak: 4,
    recentResults: [{ correct: true }],
    mastery: 70,
    reviewIntervalDays: 1,
    retrievalStrength: 0.5,
    nextReviewAt: "2026-01-01T00:00:00.000Z"
  };
}

function easyFact() {
  return {
    ...knownFact(),
    attempts: 12,
    successes: 12,
    errors: 0,
    currentStreak: 8,
    recentResults: [{ correct: true }, { correct: true }],
    mastery: 95,
    retrievalStrength: 0.9
  };
}

function fragileFact() {
  return {
    attempts: 5,
    successes: 1,
    errors: 4,
    currentStreak: 0,
    recentResults: [{ correct: false }, { correct: false }],
    mastery: 15,
    lastDifficulty: "wrong"
  };
}
