import { test } from "./test-runner.js";
import { assert, assertEqual } from "./test-utils.js";
import { createDefaultSave, normalizeSave } from "../js/save-data.js";
import {
  createInitialMultiplicationProgress,
  recordMultiplicationAnswer
} from "../js/progress-engine.js";
import { buildTrainingReport } from "../js/training-insights-engine.js";

test("teacher report contains the 81 multiplication facts", () => {
  const report = buildTrainingReport(createDefaultSave());

  assertEqual(report.allFacts.length, 81);
  assertEqual(report.summary.newCount, 81);
});

test("teacher report sorts fragile facts before easy facts", () => {
  const save = createDefaultSave();
  save.progress.multiplication.facts["6x7"] = fragileFact();
  save.progress.multiplication.facts["2x2"] = easyFact();

  const report = buildTrainingReport(save);

  assertEqual(report.allFacts[0].id, "6x7");
  assertEqual(report.allFacts[0].status, "fragile");
});

test("teacher report filters new and mastered facts", () => {
  const save = createDefaultSave();
  save.progress.multiplication.facts["2x2"] = easyFact();

  const newReport = buildTrainingReport(save, { filter: "new" });
  const masteredReport = buildTrainingReport(save, { filter: "mastered" });

  assert(newReport.facts.every((fact) => fact.status === "new"));
  assert(masteredReport.facts.some((fact) => fact.id === "2x2"));
});

test("old saves normalize missing modeStats", () => {
  const save = normalizeSave({
    progress: { multiplication: { facts: { "2x3": { attempts: 1, successes: 1 } } } },
    rewards: { coins: 0 }
  });

  assertEqual(typeof save.progress.multiplication.facts["2x3"].modeStats, "object");
});

test("future answers update global stats and modeStats", () => {
  const progress = createInitialMultiplicationProgress();
  const result = recordMultiplicationAnswer(progress, question("5x6"), {
    value: 30,
    responseMs: 1200,
    modeId: "mixed",
    questionMode: "multiple-choice",
    answeredAt: "2026-01-01T00:00:00.000Z"
  });
  const fact = result.progress.facts["5x6"];

  assertEqual(fact.attempts, 1);
  assertEqual(fact.modeStats.mixed.attempts, 1);
  assertEqual(fact.recentResults[0].modeId, "mixed");
  assertEqual(fact.recentResults[0].questionMode, "multiple-choice");
});

function question(factId) {
  const [table, factor] = factId.split("x").map(Number);
  return {
    id: `direct-answer-${factId}`,
    mode: "direct-answer",
    factId,
    table,
    factor,
    product: table * factor,
    prompt: `${table} x ${factor} = ?`,
    correctAnswer: table * factor,
    answerType: "number"
  };
}

function fragileFact() {
  return {
    attempts: 6,
    successes: 1,
    errors: 5,
    currentStreak: 0,
    bestStreak: 1,
    recentResults: [{ correct: false }, { correct: false }],
    lastAnsweredAt: "2026-01-01T00:00:00.000Z",
    averageResponseMs: 5200,
    mastery: 12,
    needsPractice: true,
    modeStats: {}
  };
}

function easyFact() {
  return {
    attempts: 6,
    successes: 6,
    errors: 0,
    currentStreak: 6,
    bestStreak: 6,
    recentResults: [{ correct: true }, { correct: true }],
    lastAnsweredAt: new Date().toISOString(),
    averageResponseMs: 900,
    mastery: 96,
    needsPractice: false,
    modeStats: { "direct-answer": { attempts: 6, successes: 6 } }
  };
}
