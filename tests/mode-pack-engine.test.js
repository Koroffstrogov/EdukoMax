import { test } from "./test-runner.js";
import { assert, assertEqual } from "./test-utils.js";
import { createDefaultSave, normalizeSave } from "../js/save-data.js";
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

  assertEqual(shop.modes.length, 5);
  assert(shop.modes.every((mode) => mode.isOwned && mode.cost === 0));
});
