import { test } from "./test-runner.js";
import { assert, assertEqual } from "./test-utils.js";
import { createDefaultSave, normalizeSave } from "../js/save-data.js";
import { getPackById } from "../js/premium-modes/mode-pack-data.js";
import { getShopSummary } from "../js/reward-engine.js";
import {
  buyModePack,
  canBuyModePack,
  isModePackOwned
} from "../js/premium-modes/mode-pack-engine.js";

test("mode pack purchase spends coins and stores ownership", () => {
  const save = createDefaultSave();
  save.rewards.coins = 200;

  const result = buyModePack(save, "chill-pack");

  assert(result.ok);
  assertEqual(result.save.rewards.coins, 60);
  assert(isModePackOwned(result.save, "chill-pack"));
});

test("mode pack purchase is refused without enough coins", () => {
  const save = createDefaultSave();
  save.rewards.coins = 10;

  const result = buyModePack(save, "competitive-pack");

  assertEqual(result.ok, false);
  assertEqual(result.error, "coins");
  assertEqual(canBuyModePack(save, "competitive-pack"), false);
});

test("magic bracelets pack is visible and costs 160 coins", () => {
  const pack = getPackById("magic-bracelets");
  const save = createDefaultSave();
  save.rewards.coins = 160;
  const result = buyModePack(save, "magic-bracelets");

  assertEqual(pack.price, 160);
  assertEqual(pack.family, "story");
  assert(result.ok);
  assertEqual(result.save.rewards.coins, 0);
  assert(isModePackOwned(result.save, "magic-bracelets"));
  assert(isModePackOwned(normalizeSave(result.save), "magic-bracelets"));
});

test("mode pack purchase is refused when already owned", () => {
  const save = createDefaultSave();
  save.rewards.coins = 500;
  const bought = buyModePack(save, "science-pack").save;

  const second = buyModePack(bought, "science-pack");

  assertEqual(second.ok, false);
  assertEqual(second.error, "already-owned");
});

test("old saves normalize with premium sections", () => {
  const save = normalizeSave({
    profile: { name: "Lina" },
    progress: { multiplication: { unlockedTables: [2, 5, 10] } },
    rewards: { coins: 0 }
  });

  assert(Array.isArray(save.premiumModes.ownedPacks));
  assert(Array.isArray(save.leaderboards["speed-60"]));
});

test("base multiplication modes remain free and owned", () => {
  const save = createDefaultSave();
  const shop = getShopSummary(save);

  assertEqual(shop.modes.length, 6);
  assert(shop.modes.some((mode) => mode.id === "multiple-choice-8"), "QCM 8 choices is free");
  assert(shop.modes.every((mode) => mode.isOwned && mode.cost === 0));
});
