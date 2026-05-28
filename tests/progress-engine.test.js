import { test } from "./test-runner.js";
import { assert, assertEqual } from "./test-utils.js";
import {
  recordMultiplicationAnswer,
  createInitialMultiplicationProgress,
  normalizeFactProgress,
  normalizeMultiplicationProgress
} from "../js/progress-engine.js";
import {
  calculateTableSelectionBonus,
  toggleSelectedTable
} from "../js/table-selection.js";

function makeQuestion(table = 3, factor = 4) {
  return {
    id: `direct-answer-${table}x${factor}`,
    mode: "direct-answer",
    factId: `${table}x${factor}`,
    table,
    factor,
    product: table * factor,
    prompt: `${table} x ${factor} = ?`,
    correctAnswer: table * factor,
    answerType: "number"
  };
}

test("progress: correct answer increments attempts, successes, currentStreak", () => {
  const progress = createInitialMultiplicationProgress();
  const question = makeQuestion(3, 4);
  const result = recordMultiplicationAnswer(progress, question, {
    value: 12,
    isCorrect: true,
    answeredAt: new Date().toISOString()
  });

  const fact = result.progress.facts["3x4"];
  assertEqual(fact.attempts, 1);
  assertEqual(fact.successes, 1);
  assertEqual(fact.currentStreak, 1);
  assertEqual(fact.errors, 0);
  assertEqual(fact.needsPractice, true, "one answer still needs practice");
});

test("progress: wrong answer increments attempts, errors and resets streak", () => {
  const progress = createInitialMultiplicationProgress();
  // First correct
  const r1 = recordMultiplicationAnswer(progress, makeQuestion(3, 4), {
    value: 12,
    isCorrect: true,
    answeredAt: new Date().toISOString()
  });
  // Then incorrect
  const r2 = recordMultiplicationAnswer(r1.progress, makeQuestion(3, 4), {
    value: 11,
    isCorrect: false,
    answeredAt: new Date().toISOString()
  });

  const fact = r2.progress.facts["3x4"];
  assertEqual(fact.attempts, 2);
  assertEqual(fact.successes, 1);
  assertEqual(fact.errors, 1);
  assertEqual(fact.currentStreak, 0, "streak reset after error");
  assertEqual(fact.needsPractice, true, "wrong answer marks practice need");
});

test("progress: recentResults stays bounded (max 10)", () => {
  let progress = createInitialMultiplicationProgress();
  const question = makeQuestion(2, 5);

  for (let i = 0; i < 15; i++) {
    const result = recordMultiplicationAnswer(progress, question, {
      value: 10,
      isCorrect: true,
      answeredAt: new Date().toISOString()
    });
    progress = result.progress;
  }

  const fact = progress.facts["2x5"];
  assert(fact.recentResults.length <= 10, `recentResults bounded: ${fact.recentResults.length}`);
});

test("progress: averageResponseMs updates without erasing history", () => {
  let progress = createInitialMultiplicationProgress();
  const question = makeQuestion(5, 5);

  // First answer at 2000ms
  const r1 = recordMultiplicationAnswer(progress, question, {
    value: 25,
    isCorrect: true,
    responseMs: 2000,
    answeredAt: new Date().toISOString()
  });
  assertEqual(r1.progress.facts["5x5"].averageResponseMs, 2000);

  // Second answer at 1000ms — average should be ~1500
  const r2 = recordMultiplicationAnswer(r1.progress, question, {
    value: 25,
    isCorrect: true,
    responseMs: 1000,
    answeredAt: new Date().toISOString()
  });

  const avg = r2.progress.facts["5x5"].averageResponseMs;
  assert(avg > 1000 && avg < 2000, `average ${avg} between 1000 and 2000`);
});

test("progress: unknown fact is initialized properly", () => {
  const progress = createInitialMultiplicationProgress();
  assertEqual(progress.facts["7x8"].attempts, 0, "fact starts with default memory");

  const result = recordMultiplicationAnswer(progress, makeQuestion(7, 8), {
    value: 56,
    isCorrect: true,
    answeredAt: new Date().toISOString()
  });

  const fact = result.progress.facts["7x8"];
  assertEqual(fact.attempts, 1);
  assertEqual(fact.successes, 1);
  assertEqual(fact.currentStreak, 1);
});

test("progress: every fact has a complete default memory", () => {
  const progress = createInitialMultiplicationProgress();
  const fact = normalizeFactProgress(progress.facts["6x7"]);

  assertEqual(Object.keys(progress.facts).length, 81);
  assertEqual(fact.needsPractice, false);
  assert(Array.isArray(fact.recentResults), "recent results list exists");
  assertEqual(fact.reviewIntervalDays, 0);
  assertEqual(fact.retrievalStrength, 0);
  assertEqual(fact.lastDifficulty, "new");
});

test("progress: new profile starts with tables 2, 5 and 10 selected", () => {
  const progress = createInitialMultiplicationProgress();

  assertEqual(progress.selectedTables.join(","), "2,5,10");
});

test("progress: legacy unlocked tables migrate into selectedTables", () => {
  const progress = normalizeMultiplicationProgress({ unlockedTables: [2, 5, 10, 7] });

  assertEqual(progress.selectedTables.join(","), "2,5,10,7");
});

test("progress: cannot deactivate the last selected table", () => {
  const progress = normalizeMultiplicationProgress({ selectedTables: [2] });
  const next = toggleSelectedTable(progress, 2);

  assertEqual(next.selectedTables.join(","), "2");
});

test("progress: table selection bonus scales with active tables", () => {
  assertEqual(calculateTableSelectionBonus({ selectedTables: [2] }), 0);
  assertEqual(calculateTableSelectionBonus({ selectedTables: [2, 5, 10] }), 4);
  assertEqual(calculateTableSelectionBonus({ selectedTables: [2, 3, 4, 5, 6, 7, 8, 9, 10] }), 16);
});
