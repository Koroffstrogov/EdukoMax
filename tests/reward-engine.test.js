import { test } from "./test-runner.js";
import { assert, assertEqual } from "./test-utils.js";
import {
  applyAnswerRewards,
  buyTable,
  canBuyTable,
  getTablePrice,
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
  const result = purchaseShopItem(save, "theme", "kpop-studio");
  assertEqual(result.ok, false);
  assert(result.save.rewards.coins >= 0, "coins >= 0");
});

test("reward: table purchase only requires enough coins", () => {
  const save = createDefaultSave();
  save.rewards.coins = 40;

  const result = buyTable(save, 3);
  assertEqual(result.ok, true, "can buy table 3 immediately with enough coins");
  assert(result.save.progress.multiplication.unlockedTables.includes(3), "table 3 unlocked");
  assertEqual(result.save.rewards.coins, 0, "40 coins spent");
});

test("reward: table purchase fails without enough coins", () => {
  const save = createDefaultSave();
  save.rewards.coins = 39;

  const result = buyTable(save, 3);
  assertEqual(result.ok, false, "cannot buy table 3 with 39 coins");
  assertEqual(result.error, "coins");
  assertEqual(canBuyTable(save, 3), false);
});

test("reward: any locked table can be bought immediately", () => {
  const save = createDefaultSave();
  save.rewards.coins = 90;

  const result = buyTable(save, 7);
  assertEqual(result.ok, true, "table 7 has no progression prerequisite");
  assert(result.save.progress.multiplication.unlockedTables.includes(7), "table 7 unlocked");
  assertEqual(result.save.rewards.coins, 0, "90 coins spent");
});

test("reward: table prices are centralized", () => {
  assertEqual(getTablePrice(3), 40);
  assertEqual(getTablePrice(4), 50);
  assertEqual(getTablePrice(6), 60);
  assertEqual(getTablePrice(8), 70);
  assertEqual(getTablePrice(9), 80);
  assertEqual(getTablePrice(7), 90);
});

test("reward: theme purchase works with enough coins", () => {
  const save = createDefaultSave();
  save.rewards.coins = 120;

  const result = purchaseShopItem(save, "theme", "kpop-studio");
  assertEqual(result.ok, true);
  assert(result.save.rewards.ownedThemes.includes("kpop-studio"), "kpop-studio owned");
  assertEqual(result.save.rewards.coins, 0, "120 coins spent");
});

test("reward: cannot buy already-owned item", () => {
  const save = createDefaultSave();
  save.rewards.coins = 100;
  // kawaii-pop is already owned by default
  const result = purchaseShopItem(save, "theme", "kawaii-pop");
  assertEqual(result.ok, false);
  assertEqual(result.error, "already-owned");
});

test("reward: shop summary shows correct owned state", () => {
  const save = createDefaultSave();
  const summary = getShopSummary(save);

  assertEqual(summary.coins, 0);
  assert(summary.modes.every((mode) => mode.isOwned), "all modes owned from start");
  assert(summary.tables.some((t) => t.table === 2 && t.isOwned), "table 2 owned");
  assert(summary.tables.some((t) => t.table === 3 && !t.isOwned && t.price === 40), "table 3 visible with price");
  assert(summary.themes.some((t) => t.id === "kawaii-pop" && t.isOwned), "kawaii-pop owned");
  assert(summary.themes.some((t) => t.id === "cosmic-cats" && t.isOwned), "cosmic-cats owned");
  assert(summary.themes.some((t) => t.id === "kpop-studio" && !t.isOwned), "kpop-studio not owned");
});

test("reward: all multiplication modes are owned from start", () => {
  const progress = { unlockedModes: ["direct-answer"], mixedModeUnlocked: false };
  assert(isModeOwned(progress, "direct-answer"), "direct-answer owned");
  assert(isModeOwned(progress, "multiple-choice"), "multiple-choice owned");
  assert(isModeOwned(progress, "visual-groups"), "visual-groups owned");
  assert(isModeOwned(progress, "missing-factor"), "missing-factor owned");
  assert(isModeOwned(progress, "mixed"), "mixed owned");
});

test("reward: theme ownership check works", () => {
  const save = createDefaultSave();
  assert(isThemeOwned(save, "kawaii-pop"), "kawaii-pop owned");
  assert(isThemeOwned(save, "cosmic-cats"), "cosmic-cats owned");
  assert(!isThemeOwned(save, "kpop-studio"), "kpop-studio not owned");
});
