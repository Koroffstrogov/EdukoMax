import { test } from "./test-runner.js";
import { assert, assertEqual } from "./test-utils.js";
import {
  calculateFactMastery,
  calculateTableMastery,
  calculateFactPriority,
  createDefaultFactProgress,
  doesFactNeedPractice,
  getFactMemoryState
} from "../js/mastery-engine.js";

test("mastery: unseen fact has zero mastery", () => {
  const mastery = calculateFactMastery(null);
  assertEqual(mastery, 0, "null fact = 0 mastery");
});

test("mastery: unseen fact (default progress) has zero mastery", () => {
  const mastery = calculateFactMastery(createDefaultFactProgress());
  assertEqual(mastery, 0);
});

test("mastery: fact with many successes has higher mastery", () => {
  const highFact = {
    attempts: 20,
    successes: 19,
    errors: 1,
    currentStreak: 8,
    bestStreak: 10,
    recentResults: Array(10).fill({ correct: true, answeredAt: null }),
    lastAnsweredAt: new Date().toISOString(),
    averageResponseMs: 1200,
    mastery: 0
  };
  const mastery = calculateFactMastery(highFact);
  assert(mastery >= 70, `high mastery expected >=70, got ${mastery}`);
});

test("mastery: recent errors reduce mastery", () => {
  const goodFact = {
    attempts: 12,
    successes: 10,
    errors: 2,
    currentStreak: 5,
    bestStreak: 5,
    recentResults: Array(10).fill({ correct: true, answeredAt: null }),
    lastAnsweredAt: new Date().toISOString(),
    averageResponseMs: 1500,
    mastery: 0
  };
  const errorFact = {
    ...goodFact,
    successes: 8,
    errors: 4,
    currentStreak: 0,
    recentResults: [
      ...Array(6).fill({ correct: true, answeredAt: null }),
      ...Array(4).fill({ correct: false, answeredAt: null })
    ]
  };

  const goodMastery = calculateFactMastery(goodFact);
  const errorMastery = calculateFactMastery(errorFact);
  assert(goodMastery > errorMastery, `good ${goodMastery} > error ${errorMastery}`);
});

test("mastery: table cannot be mastered with too few attempts", () => {
  // Only 5 attempts total across the table
  const progress = {
    unlockedTables: [2],
    facts: {
      "2x2": makeFact(5, 5, 0)
    }
  };
  const stats = calculateTableMastery(2, progress);
  // With only 5 attempts on 1 fact out of 9, mastery should be low
  assert(stats.mastery < 50, `table mastery should be low: ${stats.mastery}`);
});

test("mastery: table can be mastered with 20+ attempts, 85%+ accuracy, <=3 recent errors", () => {
  const facts = {};
  // Spread 22 attempts across facts in table 2 with high accuracy
  for (let f = 2; f <= 10; f++) {
    facts[`2x${f}`] = {
      attempts: 3,
      successes: 3,
      errors: 0,
      currentStreak: 3,
      bestStreak: 3,
      recentResults: [
        { correct: true, answeredAt: null },
        { correct: true, answeredAt: null },
        { correct: true, answeredAt: null }
      ],
      lastAnsweredAt: new Date().toISOString(),
      averageResponseMs: 1200,
      mastery: 85
    };
  }

  const progress = { unlockedTables: [2], facts };
  const stats = calculateTableMastery(2, progress);

  // Total attempts = 27 (>20), accuracy = 100%, recent errors = 0
  assert(stats.attempts >= 20, `attempts ${stats.attempts} >= 20`);
  assert(stats.accuracy >= 0.85, `accuracy ${stats.accuracy} >= 0.85`);
});

test("mastery: priority is high for unseen facts", () => {
  const priority = calculateFactPriority(null);
  assertEqual(priority, 100, "unseen fact gets max priority");
});

test("mastery: memory state separates easy, hesitant and struggling facts", () => {
  const easy = makeFact(8, 8, 0);
  const hesitant = { ...makeFact(5, 5, 0), currentStreak: 1, averageResponseMs: 4200 };
  const struggling = { ...makeFact(6, 2, 4), currentStreak: 0 };

  assertEqual(getFactMemoryState(easy), "easy");
  assertEqual(getFactMemoryState(hesitant), "hesitating");
  assertEqual(getFactMemoryState(struggling), "struggling");
  assertEqual(doesFactNeedPractice(easy), false);
  assertEqual(doesFactNeedPractice(hesitant), true);
  assertEqual(doesFactNeedPractice(struggling), true);
});

function makeFact(attempts, successes, errors) {
  return {
    attempts,
    successes,
    errors,
    currentStreak: successes,
    bestStreak: successes,
    recentResults: Array(Math.min(attempts, 10)).fill({ correct: errors === 0, answeredAt: null }),
    lastAnsweredAt: new Date().toISOString(),
    averageResponseMs: 1500,
    mastery: 50
  };
}
