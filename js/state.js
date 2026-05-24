import {
  advanceMultiplicationSession,
  answerMultiplicationSession,
  createMultiplicationSession
} from "./games/multiplication-session.js";
import {
  SESSION_MODES,
  applyAnswerRewards,
  isModeOwned,
  isThemeOwned,
  purchaseShopItem
} from "./reward-engine.js";
import { pickCardRewards, applyCardRewards, markCollectiblesSeen } from "./collectibles/collectible-engine.js";
import { evaluateBadges, applyBadgeRewards, updateStatsAfterSession } from "./collectibles/badge-engine.js";
import { calculateTableMastery } from "./mastery-engine.js";

const DEFAULT_ROUTE = "home";

const appState = {
  route: DEFAULT_ROUTE,
  save: null,
  activeSession: null,
  sessionRewards: null,
  collectionFilter: { table: "all", rarity: "all" }
};

export function initializeState(saveData) {
  appState.route = DEFAULT_ROUTE;
  appState.save = cloneData(saveData);
  appState.activeSession = null;
  appState.sessionRewards = null;
  appState.collectionFilter = { table: "all", rarity: "all" };
}

export function getStateSnapshot() {
  ensureInitialized();

  return {
    route: appState.route,
    save: cloneData(appState.save),
    activeSession: cloneData(appState.activeSession),
    sessionRewards: cloneData(appState.sessionRewards),
    collectionFilter: { ...appState.collectionFilter }
  };
}

export function getSaveSnapshot() {
  ensureInitialized();
  return cloneData(appState.save);
}

export function getActiveTheme() {
  ensureInitialized();
  return appState.save.settings.theme;
}

export function updateRoute(route) {
  appState.route = route;
}

export function updateTheme(theme) {
  ensureInitialized();

  if (!isThemeOwned(appState.save, theme)) {
    return false;
  }

  appState.save.settings.theme = theme;
  touchSave();
  return true;
}

export function startMultiplicationSession(modeId = SESSION_MODES.directAnswer) {
  ensureInitialized();
  const safeModeId = isModeOwned(appState.save.progress.multiplication, modeId)
    ? modeId
    : SESSION_MODES.directAnswer;

  appState.activeSession = createMultiplicationSession(
    appState.save.progress.multiplication,
    { modeId: safeModeId }
  );
}

export function submitMultiplicationAnswer(answerValue) {
  ensureInitialized();

  const result = answerMultiplicationSession(
    appState.activeSession,
    appState.save.progress.multiplication,
    answerValue
  );

  appState.save.progress.multiplication = result.progress;

  if (result.result) {
    const rewardResult = applyAnswerRewards(appState.save, result.result);
    appState.save = rewardResult.save;
    appState.activeSession = attachRewardToFeedback(result.session, rewardResult.reward);
  } else {
    appState.activeSession = result.session;
  }

  if (shouldRecordSessionCompletion(appState.activeSession)) {
    recordSessionCompletion();
  }

  touchSave();
  return cloneData(result);
}

export function advanceActiveSession() {
  ensureInitialized();

  appState.activeSession = advanceMultiplicationSession(
    appState.activeSession,
    appState.save.progress.multiplication
  );
}

export function endActiveSession() {
  ensureInitialized();
  appState.activeSession = null;
}

export function buyShopItem(itemType, itemId) {
  ensureInitialized();

  const result = purchaseShopItem(appState.save, itemType, itemId);

  if (!result.ok) {
    return cloneData(result);
  }

  appState.save = result.save;

  if (itemType === "theme") {
    appState.save.settings.theme = itemId;
  }

  touchSave();
  return cloneData(result);
}

function shouldRecordSessionCompletion(session) {
  return Boolean(session?.isComplete) && !session.completionRecorded;
}

function recordSessionCompletion() {
  appState.activeSession.completionRecorded = true;
  appState.save.sessions.completed += 1;
  appState.save.sessions.lastPlayedAt = new Date().toISOString();

  const session = appState.activeSession;
  const sessionSummary = buildSessionSummary(session);

  updateStatsAfterSession(appState.save, sessionSummary);

  const cardResult = pickCardRewards(appState.save, sessionSummary);
  applyCardRewards(appState.save, cardResult.cards);

  const badgeResult = evaluateBadges(appState.save, sessionSummary);
  applyBadgeRewards(appState.save, badgeResult);

  if (cardResult.bonusCoins > 0) {
    appState.save.rewards.coins += cardResult.bonusCoins;
    appState.save.rewards.totalCoinsEarned += cardResult.bonusCoins;
  }

  appState.sessionRewards = {
    cards: cardResult.cards,
    badges: badgeResult,
    bonusCoins: cardResult.bonusCoins
  };
}

function buildSessionSummary(session) {
  const table = getSessionTable(session);
  const masteredTablesBefore = getMasteredTablesList();

  return {
    table,
    mode: session.modeId,
    totalQuestions: session.totalQuestions,
    correctAnswers: session.correctCount,
    accuracy: session.answeredCount > 0 ? session.correctCount / session.answeredCount : 0,
    bestStreak: calculateBestStreak(session.answers),
    perfect: session.correctCount === session.totalQuestions,
    masteredTablesBefore,
    masteredTablesAfter: masteredTablesBefore
  };
}

function getSessionTable(session) {
  if (!session.answers || session.answers.length === 0) {
    return 2;
  }

  const tableCounts = {};

  for (const answer of session.answers) {
    const table = Number(String(answer.factId).split("x")[0]);

    if (table >= 2 && table <= 10) {
      tableCounts[table] = (tableCounts[table] || 0) + 1;
    }
  }

  let maxTable = 2;
  let maxCount = 0;

  for (const [table, count] of Object.entries(tableCounts)) {
    if (count > maxCount) {
      maxCount = count;
      maxTable = Number(table);
    }
  }

  return maxTable;
}

function getMasteredTablesList() {
  const mastered = [];

  for (let table = 2; table <= 10; table++) {
    const tableMastery = calculateTableMastery(
      table,
      appState.save.progress.multiplication
    );

    if (tableMastery.mastery >= 80) {
      mastered.push(table);
    }
  }

  return mastered;
}

function calculateBestStreak(answers) {
  let best = 0;
  let current = 0;

  for (const answer of answers || []) {
    if (answer.isCorrect) {
      current++;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }

  return best;
}

export function clearSessionRewards() {
  ensureInitialized();
  appState.sessionRewards = null;
  markCollectiblesSeen(appState.save);
}

export function updateCollectionFilter(key, value) {
  ensureInitialized();

  if (key === "table" || key === "rarity") {
    appState.collectionFilter[key] = value;
  }
}

function attachRewardToFeedback(session, reward) {
  if (!session?.currentFeedback || !session.currentFeedback.isCorrect) {
    return session;
  }

  return {
    ...session,
    currentFeedback: {
      ...session.currentFeedback,
      message: `+${reward.coins} pièce`,
      explanation: "",
      reward
    }
  };
}

function touchSave() {
  appState.save.updatedAt = new Date().toISOString();
}

function ensureInitialized() {
  if (appState.save === null) {
    throw new Error("State has not been initialized.");
  }
}

function cloneData(data) {
  if (data === null || data === undefined) {
    return data;
  }

  return JSON.parse(JSON.stringify(data));
}
