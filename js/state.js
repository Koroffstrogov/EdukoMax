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

const DEFAULT_ROUTE = "home";

const appState = {
  route: DEFAULT_ROUTE,
  save: null,
  activeSession: null
};

export function initializeState(saveData) {
  appState.route = DEFAULT_ROUTE;
  appState.save = cloneData(saveData);
  appState.activeSession = null;
}

export function getStateSnapshot() {
  ensureInitialized();

  return {
    route: appState.route,
    save: cloneData(appState.save),
    activeSession: cloneData(appState.activeSession)
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
