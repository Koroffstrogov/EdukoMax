import { test } from "./test-runner.js";
import { assert, assertEqual } from "./test-utils.js";
import {
  recordMultiplicationAnswer,
  createInitialMultiplicationProgress,
  normalizeFactProgress
} from "../js/progress-engine.js";

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
  assert(!progress.facts["7x8"], "fact does not exist yet");

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
