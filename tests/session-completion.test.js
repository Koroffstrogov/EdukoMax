import { test } from "./test-runner.js";
import { assertEqual } from "./test-utils.js";
import { completeSession } from "../js/games/session-completion.js";
import { createDefaultSave } from "../js/storage.js";

function createCompletedSession(modeId) {
  return {
    type: "multiplication",
    modeId,
    table: 2,
    totalQuestions: 8,
    answeredCount: 8,
    correctCount: 8,
    answers: Array.from({ length: 8 }, (_, index) => ({
      factId: `2x${index + 2}`,
      isCorrect: true
    })),
    startedAtMs: Date.now() - 12000
  };
}

test("completion: multiple-choice-8 gives a 50 percent coin bonus", () => {
  const save = createDefaultSave();
  save.progress.multiplication.selectedTables = [2];

  const result = completeSession(save, createCompletedSession("multiple-choice-8"));

  assertEqual(result.sessionRewards.choice8BonusCoins, 4, "8 correct answers give +4 bonus coins");
  assertEqual(result.sessionRewards.tableSelectionBonus, 0, "single selected table gives no table bonus");
  assertEqual(result.save.rewards.coins, 4, "only QCM 8 bonus coins are added at completion");
});
