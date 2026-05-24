import { test } from "./test-runner.js";
import { assert, assertEqual } from "./test-utils.js";
import {
  applyAnswerRewards,
  purchaseShopItem,
  getShopSummary,
  isModeOwned,
  isThemeOwned
} from "../js/reward-engine.js";
import { createDefaultSave } from "../js/storage.js";

test("reward: correct answer gives +1 coin", () => {
  const save = createDefaultSave();
  const answerResult = { isCorrect: true, factId: "2x3" };
  const { save: next, reward } = applyAnswerRewards(save, answerResult);

  assertEqual(reward.coins, 1);
  assertEqual(next.rewards.coins, 1);
  assertEqual(next.rewards.totalCoinsEarned, 1);
});

test("reward: incorrect answer gives 0 coins", () => {
  const save = createDefaultSave();
  const answerResult = { isCorrect: false, factId: "2x3" };
  const { reward } = applyAnswerRewards(save, answerResult);

  assertEqual(reward.coins, 0);
});

test("reward: coins never become negative", () => {
  const save = createDefaultSave();
  save.rewards.coins = 0;

  // Try to buy something without coins
  const result = purchaseShopItem(save, "theme", "ocean");
  assertEqual(result.ok, false);
  assert(result.save.rewards.coins >= 0, "coins >= 0");
});

test("reward: table purchase requires prerequisite points", () => {
  const save = createDefaultSave();
  save.rewards.coins = 100; // plenty of coins

  // Table 3 requires 6 points on tables 2, 5, or 10
  const result = purchaseShopItem(save, "table", "3");

  // Should fail because no table points earned yet
  assertEqual(result.ok, false, "cannot buy table 3 without prerequisite");
  assertEqual(result.error, "requirements");
});

test("reward: table purchase succeeds with prerequisites met", () => {
  const save = createDefaultSave();
  save.rewards.coins = 100;
  // Give 6 points on tables 2, 5, 10
  save.progress.multiplication.tablePoints = {
    2: 3, 3: 0, 4: 0, 5: 2, 6: 0, 7: 0, 8: 0, 9: 0, 10: 1
  };

  const result = purchaseShopItem(save, "table", "3");
  assertEqual(result.ok, true, "can buy table 3 with points");
  assert(result.save.progress.multiplication.unlockedTables.includes(3), "table 3 unlocked");
});

test("reward: theme purchase works with enough coins", () => {
  const save = createDefaultSave();
  save.rewards.coins = 10;

  const result = purchaseShopItem(save, "theme", "ocean");
  assertEqual(result.ok, true);
  assert(result.save.rewards.ownedThemes.includes("ocean"), "ocean owned");
  assertEqual(result.save.rewards.coins, 2, "8 coins spent");
});

test("reward: cannot buy already-owned item", () => {
  const save = createDefaultSave();
  save.rewards.coins = 100;
  // sunny is already owned by default
  const result = purchaseShopItem(save, "theme", "sunny");
  assertEqual(result.ok, false);
  assertEqual(result.error, "already-owned");
});

test("reward: shop summary shows correct owned state", () => {
  const save = createDefaultSave();
  const summary = getShopSummary(save);

  assertEqual(summary.coins, 0);
  assert(summary.modes.some((m) => m.id === "direct-answer" && m.isOwned), "direct-answer owned");
  assert(summary.themes.some((t) => t.id === "sunny" && t.isOwned), "sunny owned");
  assert(summary.themes.some((t) => t.id === "ocean" && !t.isOwned), "ocean not owned");
});

test("reward: unlocks are coherent with progression", () => {
  const save = createDefaultSave();
  save.rewards.coins = 100;

  // Cannot buy table 6 directly (requires table 4 unlocked with 8 points)
  const result = purchaseShopItem(save, "table", "6");
  assertEqual(result.ok, false, "table 6 requires table 4 points");
});

test("reward: mode ownership check works", () => {
  const progress = { unlockedModes: ["direct-answer"], mixedModeUnlocked: false };
  assert(isModeOwned(progress, "direct-answer"), "direct-answer owned");
  assert(!isModeOwned(progress, "multiple-choice"), "multiple-choice not owned");
});

test("reward: theme ownership check works", () => {
  const save = createDefaultSave();
  assert(isThemeOwned(save, "sunny"), "sunny owned");
  assert(!isThemeOwned(save, "ocean"), "ocean not owned");
});
