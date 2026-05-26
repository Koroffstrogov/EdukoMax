import { test } from "./test-runner.js";
import { assert, assertEqual } from "./test-utils.js";
import { createDefaultSave } from "../js/save-data.js";
import { selectScienceFacts } from "../js/premium-modes/science-review-engine.js";

test("science review prioritizes fragile facts", () => {
  const save = createDefaultSave();
  save.progress.multiplication.facts["2x2"] = fragileFact();
  save.progress.multiplication.facts["3x3"] = fragileFact();

  const facts = selectScienceFacts(save.progress.multiplication, "smart-review", { count: 5 });

  assertEqual(facts[0].id, "2x2");
  assert(facts.every((fact) => [2, 5, 10].includes(fact.table)));
});

test("anti-forget prioritizes old reviewed facts", () => {
  const save = createDefaultSave();
  save.progress.multiplication.facts["10x10"] = {
    attempts: 4,
    successes: 4,
    errors: 0,
    currentStreak: 4,
    bestStreak: 4,
    recentResults: [{ correct: true, answeredAt: "2025-01-01T00:00:00.000Z" }],
    lastAnsweredAt: "2025-01-01T00:00:00.000Z",
    averageResponseMs: 1200,
    mastery: 90,
    needsPractice: false
  };

  const facts = selectScienceFacts(save.progress.multiplication, "anti-forget", { count: 3 });

  assertEqual(facts[0].id, "10x10");
});

test("clever mix never selects locked tables", () => {
  const save = createDefaultSave();
  save.progress.multiplication.unlockedTables = [2, 5, 10];

  const facts = selectScienceFacts(save.progress.multiplication, "clever-mix", { count: 10 });

  assert(facts.length > 0);
  assert(facts.every((fact) => [2, 5, 10].includes(fact.table)));
});

function fragileFact() {
  return {
    attempts: 5,
    successes: 1,
    errors: 4,
    currentStreak: 0,
    bestStreak: 1,
    recentResults: [
      { correct: false, answeredAt: "2026-01-01T00:00:00.000Z" },
      { correct: false, answeredAt: "2026-01-02T00:00:00.000Z" }
    ],
    lastAnsweredAt: "2026-01-02T00:00:00.000Z",
    averageResponseMs: 5200,
    mastery: 10,
    needsPractice: true
  };
}
