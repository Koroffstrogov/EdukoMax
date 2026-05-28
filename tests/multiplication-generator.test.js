import { test } from "./test-runner.js";
import { assert, assertEqual } from "./test-utils.js";
import {
  generateMultiplicationQuestion,
  generateWrongAnswers,
  choosePriorityMultiplication,
  QUESTION_MODES
} from "../js/multiplication-generator.js";

function makeProgress(selectedTables = [2, 5, 10], facts = {}) {
  return { selectedTables, facts };
}

test("generator: direct-answer question has table, factor, and product", () => {
  const q = generateMultiplicationQuestion(makeProgress(), { mode: "direct-answer" });
  assert(q.table >= 2 && q.table <= 10, "table in range");
  assert(q.factor >= 2 && q.factor <= 10, "factor in range");
  assertEqual(q.correctAnswer, q.table * q.factor, "correct answer = product");
  assertEqual(q.mode, QUESTION_MODES.directAnswer);
});

test("generator: missing-factor question has coherent answer", () => {
  const q = generateMultiplicationQuestion(makeProgress(), { mode: "missing-factor" });
  assertEqual(q.mode, QUESTION_MODES.missingFactor);
  assertEqual(q.correctAnswer, q.factor, "answer is the missing factor");
  assert(q.prompt.includes("?"), "prompt contains ?");
});

test("generator: multiple-choice has exactly 4 choices", () => {
  const q = generateMultiplicationQuestion(makeProgress(), { mode: "multiple-choice" });
  assertEqual(q.choices.length, 4, "4 choices");
});

test("generator: multiple-choice-8 has exactly 8 choices", () => {
  const q = generateMultiplicationQuestion(makeProgress(), { mode: "multiple-choice-8" });
  const values = q.choices.map((choice) => choice.value);

  assertEqual(q.mode, QUESTION_MODES.multipleChoice8);
  assertEqual(q.choices.length, 8, "8 choices");
  assert(values.includes(q.correctAnswer), "correct answer in choices");
  assertEqual(new Set(values).size, 8, "choices are distinct");
});

test("generator: correct answer is present in choices", () => {
  const q = generateMultiplicationQuestion(makeProgress(), { mode: "multiple-choice" });
  const values = q.choices.map((c) => c.value);
  assert(values.includes(q.correctAnswer), "correct answer in choices");
});

test("generator: wrong choices differ from correct answer", () => {
  const q = generateMultiplicationQuestion(makeProgress(), { mode: "multiple-choice" });
  const wrong = q.choices.filter((c) => !c.isCorrect);
  for (const choice of wrong) {
    assert(choice.value !== q.correctAnswer, `wrong choice ${choice.value} != ${q.correctAnswer}`);
  }
});

test("generator: repeated QCM fact can receive different propositions", () => {
  const first = generateMultiplicationQuestion(makeProgress(), {
    mode: "multiple-choice",
    factId: "6x7",
    choiceVariant: 0
  });
  const second = generateMultiplicationQuestion(makeProgress(), {
    mode: "multiple-choice",
    factId: "6x7",
    choiceVariant: 1
  });

  assert(
    getChoiceSignature(first) !== getChoiceSignature(second),
    "same fact receives a different choice set"
  );
});

test("generator: generateWrongAnswers returns distinct positive values", () => {
  const wrongs = generateWrongAnswers(6, 7, 3);
  assertEqual(wrongs.length, 3, "3 wrong answers");
  for (const w of wrongs) {
    assert(w !== 42, "wrong answer != correct");
    assert(w > 0, "positive");
  }
  const unique = new Set(wrongs);
  assertEqual(unique.size, 3, "all distinct");
});

test("generator: prioritizes facts with many errors over untouched facts", () => {
  const facts = {};

  // Mark one fact as having many errors
  facts["2x3"] = {
    attempts: 8,
    successes: 2,
    errors: 6,
    currentStreak: 0,
    bestStreak: 1,
    recentResults: [
      { correct: false, answeredAt: null },
      { correct: false, answeredAt: null },
      { correct: false, answeredAt: null }
    ],
    lastAnsweredAt: new Date().toISOString(),
    averageResponseMs: 3000,
    mastery: 10
  };

  // Mark other facts as well-mastered
  for (let f = 2; f <= 10; f++) {
    const id = `2x${f}`;
    if (id === "2x3") continue;
    facts[id] = {
      attempts: 20,
      successes: 19,
      errors: 1,
      currentStreak: 10,
      bestStreak: 10,
      recentResults: Array(10).fill({ correct: true, answeredAt: null }),
      lastAnsweredAt: new Date().toISOString(),
      averageResponseMs: 1000,
      mastery: 95
    };
  }

  const progress = { selectedTables: [2], facts };
  const chosen = choosePriorityMultiplication(progress, { tables: [2] });

  // The fact with many errors should be prioritized
  assertEqual(chosen.id, "2x3", "prioritizes error-heavy fact");
});

test("generator: ignores inactive table even when requested", () => {
  const progress = makeProgress([2], {});
  const chosen = choosePriorityMultiplication(progress, { table: 7 });

  assertEqual(chosen.table, 2, "inactive table 7 is not selected");
});

test("generator: only chooses among active requested tables", () => {
  const progress = makeProgress([2, 5], {});
  const question = generateMultiplicationQuestion(progress, {
    mode: "direct-answer",
    tables: [5, 7]
  });

  assertEqual(question.table, 5, "table 7 ignored because it is inactive");
});

test("generator: falls back to legacy unlockedTables when selectedTables is missing", () => {
  const question = generateMultiplicationQuestion({ unlockedTables: [7], facts: {} }, {
    mode: "direct-answer"
  });

  assertEqual(question.table, 7);
});

function getChoiceSignature(question) {
  return question.choices
    .map((choice) => choice.value)
    .sort((first, second) => first - second)
    .join(",");
}
