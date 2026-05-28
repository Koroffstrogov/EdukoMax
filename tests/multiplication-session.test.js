import { test } from "./test-runner.js";
import { assert, assertEqual } from "./test-utils.js";
import {
  advanceMultiplicationSession,
  answerMultiplicationSession,
  createMultiplicationSession
} from "../js/games/multiplication-session.js";
import { getFactById } from "../js/multiplication-data.js";
import { createInitialMultiplicationProgress } from "../js/progress-engine.js";

test("session: mixed mode keeps question mode rotation", () => {
  const progress = createInitialMultiplicationProgress();
  const session = createMultiplicationSession(progress, { modeId: "mixed", totalQuestions: 8 });

  assertEqual(session.modes.join(","), [
    "direct-answer",
    "multiple-choice",
    "direct-answer",
    "missing-factor",
    "visual-groups",
    "multiple-choice",
    "direct-answer",
    "missing-factor"
  ].join(","));
});

test("session: wrong fact returns later, not immediately", () => {
  let progress = createInitialMultiplicationProgress();
  progress.selectedTables = [2];
  let session = createMultiplicationSession(progress, { modeId: "direct-answer", totalQuestions: 8 });
  const firstFactId = session.currentQuestion.factId;

  ({ session, progress } = answerMultiplicationSession(session, progress, -1));
  session = advanceMultiplicationSession(session, progress);
  assert(session.currentQuestion.factId !== firstFactId, "not repeated immediately");

  ({ session, progress } = answerMultiplicationSession(
    session,
    progress,
    session.currentQuestion.correctAnswer
  ));
  session = advanceMultiplicationSession(session, progress);
  assert(session.currentQuestion.factId !== firstFactId, "not repeated after one filler");

  ({ session, progress } = answerMultiplicationSession(
    session,
    progress,
    session.currentQuestion.correctAnswer
  ));
  session = advanceMultiplicationSession(session, progress);
  assertEqual(session.currentQuestion.factId, firstFactId, "retry appears after delay");
});

test("session: same multiplication is not proposed 3 times in a row", () => {
  let progress = createInitialMultiplicationProgress();
  progress.selectedTables = [2];
  let session = createMultiplicationSession(progress, { modeId: "direct-answer", totalQuestions: 4 });
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

  ({ session, progress } = answerMultiplicationSession(
    session,
    progress,
    session.currentQuestion.correctAnswer
  ));
  session = advanceMultiplicationSession(session, progress);
  assertEqual(session.currentQuestion.factId, firstFactId, "second repetition is still allowed");

  ({ session, progress } = answerMultiplicationSession(
    session,
    progress,
    session.currentQuestion.correctAnswer
  ));
  session = advanceMultiplicationSession(session, progress);
  assert(session.currentQuestion.factId !== firstFactId, "third repetition is replaced");
});

test("session: repeated QCM multiplication changes answer propositions", () => {
  let progress = createInitialMultiplicationProgress();
  progress.selectedTables = [2];
  let session = createMultiplicationSession(progress, { modeId: "multiple-choice", totalQuestions: 4 });
  const firstFactId = session.currentQuestion.factId;
  const firstChoices = getChoiceSignature(session.currentQuestion);

  session = {
    ...session,
    factQueue: [
      getFactById(firstFactId),
      getFactById(firstFactId),
      ...session.factQueue.slice(2)
    ]
  };

  ({ session, progress } = answerMultiplicationSession(
    session,
    progress,
    session.currentQuestion.correctAnswer
  ));
  session = advanceMultiplicationSession(session, progress);

  assertEqual(session.currentQuestion.factId, firstFactId, "same fact can appear twice");
  assert(
    getChoiceSignature(session.currentQuestion) !== firstChoices,
    "same fact does not reuse the same QCM propositions"
  );
});

function getChoiceSignature(question) {
  return question.choices
    .map((choice) => choice.value)
    .sort((first, second) => first - second)
    .join(",");
}
