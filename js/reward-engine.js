import {
  INITIAL_UNLOCKED_TABLES,
  TABLE_UNLOCK_ORDER,
  TABLES,
  getTableMetadata,
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

export const INITIAL_UNLOCKED_MODES = Object.freeze(Object.values(SESSION_MODES));
export const INITIAL_OWNED_THEMES = Object.freeze(["sunny"]);

export const TABLE_SHOP_ITEMS = Object.freeze([
  tableItem(3, 40, "🌿", "Jardin des Trois"),
  tableItem(4, 50, "🛠️", "Atelier Quatre"),
  tableItem(6, 60, "🎡", "Roue de Six"),
  tableItem(8, 70, "🚀", "Ville Huit"),
  tableItem(9, 80, "⭐", "Étoiles Neuf"),
  tableItem(7, 90, "🏰", "Château Mystérieux")
]);

const MODE_SHOP_ITEMS = Object.freeze([
  modeItem(SESSION_MODES.directAnswer, "Réponse directe", "Écris le résultat.", 0),
  modeItem(SESSION_MODES.multipleChoice, "QCM", "Choisis parmi 4 réponses.", 0),
  modeItem(SESSION_MODES.visualGroups, "Groupes visuels", "Compte les petits groupes.", 0),
  modeItem(SESSION_MODES.missingFactor, "Facteur manquant", "Trouve le nombre caché.", 0),
  modeItem(SESSION_MODES.mixed, "Mix", "Toutes les formes en session.", 0)
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
    tables: getTableCatalog().map((item) => getTableShopState(normalizedSave, item)),
    modes: MODE_SHOP_ITEMS.map((item) => getShopItemState(normalizedSave, "mode", item)),
    themes: THEME_SHOP_ITEMS.map((item) => getShopItemState(normalizedSave, "theme", item))
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

export function getTablePrice(table) {
  const item = TABLE_SHOP_ITEMS.find((shopItem) => shopItem.table === Number(table));
  return item?.price ?? 0;
}

export function isTableOwned(save, table) {
  return normalizeTableList(save?.progress?.multiplication?.unlockedTables)
    .includes(Number(table));
}

export function canBuyTable(save, table) {
  const price = getTablePrice(table);
  return price > 0 && !isTableOwned(save, table) &&
    normalizeCount(save?.rewards?.coins) >= price;
}

export function buyTable(save, table) {
  return purchaseShopItem(save, "table", String(table));
}

export function isThemeOwned(save, themeId) {
  return normalizeOwnedThemes(save?.rewards?.ownedThemes, save?.settings?.theme)
    .includes(themeId);
}

export function normalizeUnlockedModes(modeIds, mixedModeUnlocked = false) {
  return MODE_SHOP_ITEMS.map((item) => item.id);
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
  const progression = getTableProgression(save, item.table);

  return {
    ...state,
    table: item.table,
    price: item.price,
    cost: item.price,
    progression,
    progressLabel: progression.label,
    masteryPercent: progression.masteryPercent,
    recommendation: getTableRecommendation(progression)
  };
}

function getShopItemState(save, itemType, item) {
  const isOwned = isItemOwned(save, itemType, item);
  const canBuy = !isOwned && save.rewards.coins >= item.cost;

  return {
    ...item,
    type: itemType,
    isOwned,
    requirementsMet: true,
    canBuy,
    isLocked: !isOwned,
    needsCoins: !isOwned && save.rewards.coins < item.cost
  };
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
    save.progress.multiplication.unlockedTables = normalizeTableList([
      ...save.progress.multiplication.unlockedTables,
      item.table
    ]);
    return;
  }

  save.rewards.ownedThemes = normalizeOwnedThemes([
    ...save.rewards.ownedThemes,
    item.id
  ], save.settings.theme);
}

function findShopItem(itemType, itemId) {
  const list = {
    table: getTableCatalog(),
    mode: MODE_SHOP_ITEMS,
    theme: THEME_SHOP_ITEMS
  }[itemType] || [];

  return list.find((item) => String(item.id) === String(itemId)) || null;
}

function getTotalCorrectAnswers(save) {
  const factSuccesses = Object.values(save.progress.multiplication.facts || {})
    .reduce((total, fact) => total + normalizeCount(fact?.successes), 0);

  return Math.max(normalizeCount(save.rewards.totalCoinsEarned), factSuccesses);
}

function normalizeShopSave(save) {
  const nextSave = cloneData(save);
  nextSave.progress.multiplication.unlockedTables = normalizeTableList(
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

function getTableFromFactId(factId) {
  const table = Number(String(factId).split("x")[0]);
  return isValidTable(table) ? table : null;
}

function getTableCatalog() {
  return TABLES.map((table) => {
    const shopItem = TABLE_SHOP_ITEMS.find((item) => item.table === table);
    const metadata = getTableMetadata(table);

    return shopItem || tableItem(
      table,
      0,
      getFreeTableIcon(table),
      metadata?.worldName || `Monde de ${table}`
    );
  });
}

function getTableProgression(save, table) {
  const facts = save.progress.multiplication.facts || {};
  const tableFacts = Object.entries(facts)
    .filter(([factId]) => factId.startsWith(`${table}x`))
    .map(([, fact]) => fact);
  const attempts = tableFacts.reduce((total, fact) => total + normalizeCount(fact.attempts), 0);
  const successes = tableFacts.reduce((total, fact) => total + normalizeCount(fact.successes), 0);
  const masteryPercent = attempts === 0 ? 0 : Math.round((successes / attempts) * 100);

  return {
    attempts,
    successes,
    masteryPercent,
    label: getProgressLabel(attempts, masteryPercent)
  };
}

function getProgressLabel(attempts, masteryPercent) {
  if (attempts === 0) {
    return "Pas encore essayée";
  }

  if (masteryPercent >= 90 && attempts >= 12) {
    return "Maîtrisée";
  }

  if (masteryPercent >= 75 && attempts >= 8) {
    return "Presque maîtrisée";
  }

  if (attempts >= 4) {
    return "En progrès";
  }

  return "En découverte";
}

function getTableRecommendation(progression) {
  if (progression.label === "Maîtrisée") {
    return "🏆 Maîtrisée";
  }

  if (progression.attempts > 0 && progression.masteryPercent < 75) {
    return "🎯 À renforcer";
  }

  return "⭐ Recommandée";
}

function normalizeTableList(tables) {
  const cleanTables = [...INITIAL_UNLOCKED_TABLES, ...(Array.isArray(tables) ? tables : [])]
    .map(Number)
    .filter(isValidTable);

  return TABLE_UNLOCK_ORDER.filter((table) => cleanTables.includes(table));
}

function tableItem(table, price, icon, worldName) {
  const metadata = getTableMetadata(table);

  return Object.freeze({
    id: String(table),
    table,
    label: worldName || metadata?.worldName || `Monde de ${table}`,
    worldName,
    description: metadata?.description || `Ouvre l'aventure de la table de ${table}.`,
    icon,
    price,
    cost: price
  });
}

function modeItem(id, label, description, cost, requirementType = null, requirementValue = 0) {
  return Object.freeze({ id, label, description, cost, requirementType, requirementValue });
}

function themeItem(id, label, description, cost) {
  return Object.freeze({ id, label, description, cost });
}

function getFreeTableIcon(table) {
  return { 2: "🌲", 5: "🚀", 10: "🪐" }[table] || "✨";
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
