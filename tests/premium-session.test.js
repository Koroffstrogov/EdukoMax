import { test } from "./test-runner.js";
import { assert, assertEqual } from "./test-utils.js";
import { createDefaultSave } from "../js/save-data.js";
import {
  advancePremiumSession,
  answerPremiumSession,
  createPremiumSession
} from "../js/premium-modes/premium-session.js";
import { getFactById } from "../js/multiplication-data.js";
import { MAGIC_BRACELETS_QUESTION_MODES } from "../js/story-modes/magic-bracelets-data.js";
import { createMagicBraceletsQuestion } from "../js/story-modes/magic-bracelets-engine.js";

test("premium session creates questions only from active tables", () => {
  const save = createDefaultSave();
  save.progress.multiplication.selectedTables = [7];
  const session = createPremiumSession(save, "smart-review", { totalQuestions: 5 });

  assertEqual(session.currentQuestion.table, 7);
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

test("premium session avoids proposing the same multiplication 3 times in a row", () => {
  const save = createDefaultSave();
  save.progress.multiplication.selectedTables = [2];
  let progress = save.progress.multiplication;
  let session = createPremiumSession(save, "garden", { totalQuestions: 4 });
  const firstFactId = session.currentQuestion.factId;
  const altFactId = firstFactId === "2x2" ? "2x3" : "2x2";

  session = {
    ...session,
    factQueue: [
      getFactById(firstFactId),
      getFactById(firstFactId),
      getFactById(firstFactId),
      getFactById(altFactId)
    ]
  };

  ({ session, progress } = answerPremiumSession(
    session,
    progress,
    session.currentQuestion.correctAnswer
  ));
  session = advancePremiumSession(session, progress);

  ({ session, progress } = answerPremiumSession(
    session,
    progress,
    session.currentQuestion.correctAnswer
  ));
  session = advancePremiumSession(session, progress);

  assert(session.currentQuestion.factId !== firstFactId, "third repetition is replaced");
});

test("magic bracelets session contains 8 tactile commands with all variants", () => {
  const save = createDefaultSave();
  const session = createPremiumSession(save, "magic-bracelets");
  const generatedModes = session.factQueue.map((fact, index) => {
    return createMagicBraceletsQuestion(fact, index).mode;
  });

  assertEqual(session.totalQuestions, 8);
  assertEqual(session.currentQuestion.answerType, "bracelet-choice");
  assertEqual(session.factQueue.length, 8);
  assert(generatedModes.includes(MAGIC_BRACELETS_QUESTION_MODES.groups));
  assert(generatedModes.includes(MAGIC_BRACELETS_QUESTION_MODES["total-mystery"]));
  assert(generatedModes.includes(MAGIC_BRACELETS_QUESTION_MODES["missing-lot"]));
});

test("magic bracelets uses only active tables and updates memory", () => {
  const save = createDefaultSave();
  save.progress.multiplication.selectedTables = [7];
  const session = createPremiumSession(save, "magic-bracelets", { totalQuestions: 4 });
  const answer = answerPremiumSession(
    session,
    save.progress.multiplication,
    session.currentQuestion.correctAnswer
  );

  assertEqual(session.currentQuestion.table, 7);
  assert(answer.result.isCorrect);
  assertEqual(answer.session.charms, 1);
  assertEqual(answer.progress.facts[answer.result.factId].attempts, 1);
});
