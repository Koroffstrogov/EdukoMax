import { test } from "./test-runner.js";
import { assert, assertEqual } from "./test-utils.js";
import { getFactById } from "../js/multiplication-data.js";
import {
  createMagicBraceletsQuestion,
  createMagicBraceletsRound,
  generateBraceletChoices
} from "../js/story-modes/magic-bracelets-engine.js";
import { MAGIC_BRACELETS_QUESTION_MODES } from "../js/story-modes/magic-bracelets-data.js";

test("magic bracelets creates group command from a fact", () => {
  const fact = getFactById("4x6");
  const round = createMagicBraceletsRound(fact, 0);
  const choices = generateBraceletChoices(round);

  assertEqual(round.variant, "groups");
  assertEqual(round.braceletCount, 4);
  assertEqual(round.correctAnswer, 6);
  assertEqual(round.expectedAnswer, 24);
  assertEqual(choices.length, 4);
  assert(choices.some((choice) => choice.value === 6));
});

test("magic bracelets creates total mystery and missing lot variants", () => {
  const fact = getFactById("5x4");
  const totalQuestion = createMagicBraceletsQuestion(fact, 1);
  const missingQuestion = createMagicBraceletsQuestion(fact, 2);

  assertEqual(totalQuestion.mode, MAGIC_BRACELETS_QUESTION_MODES["total-mystery"]);
  assertEqual(totalQuestion.correctAnswer, 20);
  assertEqual(missingQuestion.mode, MAGIC_BRACELETS_QUESTION_MODES["missing-lot"]);
  assertEqual(missingQuestion.correctAnswer, 4);
  assertEqual(missingQuestion.answerType, "bracelet-choice");
});

test("magic bracelets choices are numeric and do not need typing", () => {
  const question = createMagicBraceletsQuestion(getFactById("7x8"), 3);
  const values = question.choices.map((choice) => choice.value);

  assertEqual(new Set(values).size, 4);
  assert(question.choices.every((choice) => Number.isInteger(choice.value)));
  assertEqual(question.answerType, "bracelet-choice");
});
