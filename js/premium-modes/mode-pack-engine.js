import {
  getPackById,
  getSpecialModePacks as getPackCatalog,
  isKnownPack
} from "./mode-pack-data.js";

export function getSpecialModePacks() {
  return getPackCatalog();
}

export function createDefaultPremiumModes() {
  return {
    ownedPacks: [],
    highScores: {}
  };
}

export function normalizePremiumModes(premiumModes) {
  if (!isPlainObject(premiumModes)) {
    return createDefaultPremiumModes();
  }

  return {
    ownedPacks: normalizeOwnedPacks(premiumModes.ownedPacks),
    highScores: isPlainObject(premiumModes.highScores)
      ? { ...premiumModes.highScores }
      : {}
  };
}

export function isModePackOwned(saveData, packId) {
  return normalizePremiumModes(saveData?.premiumModes).ownedPacks.includes(packId);
}

export function canBuyModePack(saveData, packId) {
  const pack = getPackById(packId);

  if (!pack || isModePackOwned(saveData, packId)) {
    return false;
  }

  return normalizeCount(saveData?.rewards?.coins) >= pack.price;
}

export function buyModePack(saveData, packId) {
  const save = cloneData(saveData);
  const pack = getPackById(packId);

  if (!pack) {
    return { ok: false, error: "unknown-pack", save };
  }

  save.premiumModes = normalizePremiumModes(save.premiumModes);
  save.rewards = normalizeRewards(save.rewards);

  if (save.premiumModes.ownedPacks.includes(pack.id)) {
    return { ok: false, error: "already-owned", save, pack };
  }

  if (save.rewards.coins < pack.price) {
    return { ok: false, error: "coins", save, pack };
  }

  save.rewards.coins -= pack.price;
  save.premiumModes.ownedPacks = [...save.premiumModes.ownedPacks, pack.id];
  save.rewards.purchases.push({
    type: "mode-pack",
    id: pack.id,
    cost: pack.price,
    purchasedAt: new Date().toISOString()
  });

  return { ok: true, save, pack };
}

export function getPackShopState(saveData, pack) {
  const coins = normalizeCount(saveData?.rewards?.coins);
  const owned = isModePackOwned(saveData, pack.id);

  return {
    ...pack,
    isOwned: owned,
    canBuy: !owned && coins >= pack.price,
    isLocked: !owned,
    missingCoins: owned ? 0 : Math.max(0, pack.price - coins)
  };
}

function normalizeOwnedPacks(packIds) {
  const requested = Array.isArray(packIds) ? packIds : [];
  return [...new Set(requested.filter(isKnownPack))];
}

function normalizeRewards(rewards) {
  return {
    ...(isPlainObject(rewards) ? rewards : {}),
    coins: normalizeCount(rewards?.coins),
    totalCoinsEarned: normalizeCount(rewards?.totalCoinsEarned),
    purchases: Array.isArray(rewards?.purchases) ? [...rewards.purchases] : []
  };
}

function normalizeCount(value) {
  return Number.isFinite(value) && value >= 0 ? Math.round(value) : 0;
}

function cloneData(data) {
  return JSON.parse(JSON.stringify(data));
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
