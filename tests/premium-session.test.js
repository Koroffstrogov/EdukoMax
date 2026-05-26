import { test } from "./test-runner.js";
import { assert, assertEqual } from "./test-utils.js";
import { createDefaultSave } from "../js/save-data.js";
import {
  answerPremiumSession,
  createPremiumSession
} from "../js/premium-modes/premium-session.js";

test("premium session creates questions only from unlocked tables", () => {
  const save = createDefaultSave();
  const session = createPremiumSession(save, "smart-review", { totalQuestions: 5 });

  assert([2, 5, 10].includes(session.currentQuestion.table));
});

test("chill premium answer updates progress and visual counter", () => {
  const save = createDefaultSave();
  const session = createPremiumSession(save, "garden", { totalQuestions: 4 });
  const answer = answerPremiumSession(
    session,
    save.progress.multiplication,
    session.currentQuestion.correctAnswer
  );

  assert(answer.result.isCorrect);
  assertEqual(answer.session.flowers, 1);
  assertEqual(answer.progress.facts[answer.result.factId].attempts, 1);
});
