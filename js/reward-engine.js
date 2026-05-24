import {
  INITIAL_UNLOCKED_TABLES,
  TABLE_UNLOCK_ORDER,
  TABLES,
  isValidTable
} from "./multiplication-data.js";
import { QUESTION_MODES } from "./multiplication-generator.js";

export const SESSION_MODES = Object.freeze({
  directAnswer: QUESTION_MODES.directAnswer,
  multipleChoice: QUESTION_MODES.multipleChoice,
  visualGroups: QUESTION_MODES.visualGroups,
  missingFactor: QUESTION_MODES.missingFactor,
  mixed: "mixed"
});

export const INITIAL_UNLOCKED_MODES = Object.freeze([SESSION_MODES.directAnswer]);
export const INITIAL_OWNED_THEMES = Object.freeze(["sunny"]);

const BASE_MODE_IDS = Object.freeze([
  SESSION_MODES.directAnswer,
  SESSION_MODES.multipleChoice,
  SESSION_MODES.visualGroups,
  SESSION_MODES.missingFactor
]);

const TABLE_SHOP_ITEMS = Object.freeze([
  tableItem(3, 6, [2, 5, 10], 6),
  tableItem(4, 6, [3], 6),
  tableItem(6, 8, [4], 8),
  tableItem(8, 8, [6], 8),
  tableItem(9, 10, [8], 10),
  tableItem(7, 10, [9], 10)
]);

const MODE_SHOP_ITEMS = Object.freeze([
  modeItem(SESSION_MODES.directAnswer, "Réponse directe", "Écris le résultat.", 0),
  modeItem(SESSION_MODES.multipleChoice, "Choix rapide", "Choisis parmi 4 réponses.", 4, "correct-total", 4),
  modeItem(SESSION_MODES.visualGroups, "Groupes visuels", "Compte les petits groupes.", 4, "correct-total", 4),
  modeItem(SESSION_MODES.missingFactor, "Facteur caché", "Trouve le nombre manquant.", 8, "table", 3),
  modeItem(SESSION_MODES.mixed, "Mode mélange", "Toutes les formes en session.", 12, "mixed")
]);

const THEME_SHOP_ITEMS = Object.freeze([
  themeItem("sunny", "Soleil", "Clair, chaud et joyeux.", 0),
  themeItem("ocean", "Océan", "Frais, calme et concentré.", 8),
  themeItem("berry", "Fruits", "Vif, doux et pétillant.", 10)
]);

export function createInitialTablePoints() {
  return TABLES.reduce((points, table) => {
    points[table] = 0;
    return points;
  }, {});
}

export function applyAnswerRewards(save, answerResult) {
  const nextSave = cloneData(save);
  const reward = { coins: 0, table: null, tablePoints: 0 };

  if (!answerResult?.isCorrect) {
    return { save: nextSave, reward };
  }

  const table = getTableFromFactId(answerResult.factId);
  nextSave.rewards.coins += 1;
  nextSave.rewards.totalCoinsEarned += 1;
  nextSave.progress.multiplication.tablePoints = normalizeTablePoints(
    nextSave.progress.multiplication.tablePoints
  );

  if (table !== null) {
    nextSave.progress.multiplication.tablePoints[table] += 1;
  }

  return {
    save: nextSave,
    reward: {
      coins: 1,
      table,
      tablePoints: table === null
        ? 0
        : nextSave.progress.multiplication.tablePoints[table]
    }
  };
}

export function getShopSummary(save) {
  const normalizedSave = normalizeShopSave(save);

  return {
    coins: normalizedSave.rewards.coins,
    totalCorrect: getTotalCorrectAnswers(normalizedSave),
    tables: TABLE_SHOP_ITEMS.map((item) => getTableShopState(normalizedSave, item)),
    modes: MODE_SHOP_ITEMS.map((item) => getModeShopState(normalizedSave, item)),
    themes: THEME_SHOP_ITEMS.map((item) => getThemeShopState(normalizedSave, item))
  };
}

export function purchaseShopItem(save, itemType, itemId) {
  const nextSave = normalizeShopSave(save);
  const item = findShopItem(itemType, itemId);

  if (!item) {
    return { ok: false, error: "unknown-item", save: nextSave };
  }

  const state = getShopItemState(nextSave, itemType, item);

  if (state.isOwned) {
    return { ok: false, error: "already-owned", save: nextSave, item: state };
  }

  if (!state.requirementsMet) {
    return { ok: false, error: "requirements", save: nextSave, item: state };
  }

  if (nextSave.rewards.coins < item.cost) {
    return { ok: false, error: "coins", save: nextSave, item: state };
  }

  nextSave.rewards.coins -= item.cost;
  applyOwnership(nextSave, itemType, item);
  nextSave.rewards.purchases.push({
    type: itemType,
    id: String(item.id),
    cost: item.cost,
    purchasedAt: new Date().toISOString()
  });

  return { ok: true, save: nextSave, item: getShopItemState(nextSave, itemType, item) };
}

export function isModeOwned(progress, modeId) {
  return normalizeUnlockedModes(progress?.unlockedModes, progress?.mixedModeUnlocked)
    .includes(modeId);
}

export function isThemeOwned(save, themeId) {
  return normalizeOwnedThemes(save?.rewards?.ownedThemes, save?.settings?.theme)
    .includes(themeId);
}

export function normalizeUnlockedModes(modeIds, mixedModeUnlocked = false) {
  const requestedModes = Array.isArray(modeIds) ? modeIds : [];
  const modes = [...INITIAL_UNLOCKED_MODES, ...requestedModes];

  if (mixedModeUnlocked) {
    modes.push(SESSION_MODES.mixed);
  }

  return MODE_SHOP_ITEMS
    .map((item) => item.id)
    .filter((modeId) => modes.includes(modeId));
}

export function normalizeOwnedThemes(themeIds, activeTheme = "sunny") {
  const requestedThemes = Array.isArray(themeIds) ? themeIds : [];
  const themes = [...INITIAL_OWNED_THEMES, activeTheme, ...requestedThemes];

  return THEME_SHOP_ITEMS
    .map((item) => item.id)
    .filter((themeId) => themes.includes(themeId));
}

export function normalizeTablePoints(tablePoints) {
  const source = isPlainObject(tablePoints) ? tablePoints : {};

  return TABLES.reduce((points, table) => {
    points[table] = normalizeCount(source[table]);
    return points;
  }, {});
}

function getTableShopState(save, item) {
  const state = getShopItemState(save, "table", item);
  const currentPoints = getPointsForTables(save, item.requiredTables);

  return {
    ...state,
    table: item.table,
    currentPoints,
    requiredPoints: item.requiredPoints,
    requirementLabel: `Points: ${currentPoints}/${item.requiredPoints}`
  };
}

function getModeShopState(save, item) {
  return getShopItemState(save, "mode", item);
}

function getThemeShopState(save, item) {
  return getShopItemState(save, "theme", item);
}

function getShopItemState(save, itemType, item) {
  const isOwned = isItemOwned(save, itemType, item);
  const requirementsMet = areRequirementsMet(save, itemType, item);
  const canBuy = !isOwned && requirementsMet && save.rewards.coins >= item.cost;

  return {
    ...item,
    type: itemType,
    isOwned,
    requirementsMet,
    canBuy,
    isLocked: !isOwned && !requirementsMet,
    needsCoins: !isOwned && requirementsMet && save.rewards.coins < item.cost
  };
}

function areRequirementsMet(save, itemType, item) {
  if (itemType === "table") {
    return getPointsForTables(save, item.requiredTables) >= item.requiredPoints;
  }

  if (item.requirementType === "correct-total") {
    return getTotalCorrectAnswers(save) >= item.requirementValue;
  }

  if (item.requirementType === "table") {
    return save.progress.multiplication.unlockedTables.includes(item.requirementValue);
  }

  if (item.requirementType === "mixed") {
    return save.progress.multiplication.unlockedTables.length >= 3 &&
      BASE_MODE_IDS.every((modeId) => isModeOwned(save.progress.multiplication, modeId));
  }

  return true;
}

function isItemOwned(save, itemType, item) {
  if (itemType === "table") {
    return save.progress.multiplication.unlockedTables.includes(item.table);
  }

  if (itemType === "mode") {
    return isModeOwned(save.progress.multiplication, item.id);
  }

  return isThemeOwned(save, item.id);
}

function applyOwnership(save, itemType, item) {
  if (itemType === "table") {
    save.progress.multiplication.unlockedTables = orderTables([
      ...save.progress.multiplication.unlockedTables,
      item.table
    ]);
    return;
  }

  if (itemType === "mode") {
    save.progress.multiplication.unlockedModes = normalizeUnlockedModes([
      ...save.progress.multiplication.unlockedModes,
      item.id
    ]);
    save.progress.multiplication.mixedModeUnlocked = item.id === SESSION_MODES.mixed ||
      save.progress.multiplication.mixedModeUnlocked;
    return;
  }

  save.rewards.ownedThemes = normalizeOwnedThemes([
    ...save.rewards.ownedThemes,
    item.id
  ], save.settings.theme);
}

function findShopItem(itemType, itemId) {
  const list = {
    table: TABLE_SHOP_ITEMS,
    mode: MODE_SHOP_ITEMS,
    theme: THEME_SHOP_ITEMS
  }[itemType] || [];

  return list.find((item) => String(item.id) === String(itemId)) || null;
}

function getPointsForTables(save, tables) {
  const points = normalizeTablePoints(save.progress.multiplication.tablePoints);

  return tables.reduce((total, table) => total + (points[table] || 0), 0);
}

function getTotalCorrectAnswers(save) {
  const factSuccesses = Object.values(save.progress.multiplication.facts || {})
    .reduce((total, fact) => total + normalizeCount(fact?.successes), 0);

  return Math.max(normalizeCount(save.rewards.totalCoinsEarned), factSuccesses);
}

function normalizeShopSave(save) {
  const nextSave = cloneData(save);
  nextSave.progress.multiplication.unlockedTables = orderTables(
    nextSave.progress.multiplication.unlockedTables
  );
  nextSave.progress.multiplication.unlockedModes = normalizeUnlockedModes(
    nextSave.progress.multiplication.unlockedModes,
    nextSave.progress.multiplication.mixedModeUnlocked
  );
  nextSave.progress.multiplication.tablePoints = normalizeTablePoints(
    nextSave.progress.multiplication.tablePoints
  );
  nextSave.rewards.coins = normalizeCount(nextSave.rewards.coins);
  nextSave.rewards.totalCoinsEarned = normalizeCount(nextSave.rewards.totalCoinsEarned);
  nextSave.rewards.ownedThemes = normalizeOwnedThemes(
    nextSave.rewards.ownedThemes,
    nextSave.settings.theme
  );
  nextSave.rewards.purchases = Array.isArray(nextSave.rewards.purchases)
    ? nextSave.rewards.purchases
    : [];
  return nextSave;
}

function orderTables(tables) {
  const cleanTables = [...INITIAL_UNLOCKED_TABLES, ...(Array.isArray(tables) ? tables : [])]
    .map(Number)
    .filter(isValidTable);

  return TABLE_UNLOCK_ORDER.filter((table) => cleanTables.includes(table));
}

function getTableFromFactId(factId) {
  const table = Number(String(factId).split("x")[0]);
  return isValidTable(table) ? table : null;
}

function tableItem(table, cost, requiredTables, requiredPoints) {
  return Object.freeze({
    id: String(table),
    table,
    label: `Table de ${table}`,
    description: `Ajoute la table de ${table} à tes missions.`,
    cost,
    requiredTables,
    requiredPoints
  });
}

function modeItem(id, label, description, cost, requirementType = null, requirementValue = 0) {
  return Object.freeze({ id, label, description, cost, requirementType, requirementValue });
}

function themeItem(id, label, description, cost) {
  return Object.freeze({ id, label, description, cost });
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
