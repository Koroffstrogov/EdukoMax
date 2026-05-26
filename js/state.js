import {
  advanceMultiplicationSession,
  answerMultiplicationSession,
  createMultiplicationSession
} from "./games/multiplication-session.js";
import { completeSession } from "./games/session-completion.js";
import {
  SESSION_MODES,
  applyAnswerRewards,
  isModeOwned,
  isThemeOwned,
  purchaseShopItem
} from "./reward-engine.js";
import { markCollectiblesSeen } from "./collectibles/collectible-engine.js";
import {
  advancePremiumSession,
  answerPremiumSession,
  createPremiumSession
} from "./premium-modes/premium-session.js";
import { getPackForMode } from "./premium-modes/mode-pack-data.js";
import { buyModePack, isModePackOwned } from "./premium-modes/mode-pack-engine.js";
import {
  activateProfile,
  addProfile,
  removeProfile,
  updateActiveProfileDetails
} from "./save-data.js";

const DEFAULT_ROUTE = "home";

const appState = {
  route: DEFAULT_ROUTE,
  save: null,
  activeSession: null,
  sessionRewards: null,
  shopMessage: null,
  profilePanelOpen: false,
  collectionFilter: { table: "all", rarity: "all" }
};

export function initializeState(saveData) {
  appState.route = DEFAULT_ROUTE;
  appState.save = cloneData(saveData);
  appState.activeSession = null;
  appState.sessionRewards = null;
  appState.shopMessage = null;
  appState.profilePanelOpen = false;
  appState.collectionFilter = { table: "all", rarity: "all" };
}

export function getStateSnapshot() {
  ensureInitialized();

  return {
    route: appState.route,
    save: cloneData(appState.save),
    activeSession: cloneData(appState.activeSession),
    sessionRewards: cloneData(appState.sessionRewards),
    shopMessage: cloneData(appState.shopMessage),
    profilePanelOpen: appState.profilePanelOpen,
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
  appState.profilePanelOpen = false;
}

export function updateTheme(theme) {
  ensureInitialized();

  if (!isThemeOwned(appState.save, theme)) {
    return false;
  }

  setActiveTheme(theme);
  touchSave();
  return true;
}

export function toggleProfilePanel() {
  ensureInitialized();
  appState.profilePanelOpen = !appState.profilePanelOpen;
}

export function createProfile(details) {
  ensureInitialized();
  appState.save = addProfile(appState.save, details);
  resetProfileSessionState();
}

export function selectProfile(profileId) {
  ensureInitialized();
  appState.save = activateProfile(appState.save, profileId);
  resetProfileSessionState();
}

export function deleteProfile(profileId) {
  ensureInitialized();
  appState.save = removeProfile(appState.save, profileId);
  resetProfileSessionState();
}

export function updateProfile(details) {
  ensureInitialized();
  appState.save = updateActiveProfileDetails(appState.save, details);
  appState.shopMessage = null;
}

export function startMultiplicationSession(modeId = SESSION_MODES.directAnswer, table = null) {
  ensureInitialized();
  const safeModeId = isModeOwned(appState.save.progress.multiplication, modeId)
    ? modeId
    : SESSION_MODES.directAnswer;

  appState.activeSession = createMultiplicationSession(
    appState.save.progress.multiplication,
    { modeId: safeModeId, table: normalizePlayableTable(table) }
  );
  appState.shopMessage = null;
}

export function startPremiumSession(modeId) {
  ensureInitialized();
  const pack = getPackForMode(modeId);

  if (!pack) {
    appState.shopMessage = "Ce mode spécial n'est pas disponible.";
    return false;
  }

  if (!isModePackOwned(appState.save, pack.id)) {
    appState.shopMessage = `Débloque d'abord le pack ${pack.name} ${pack.emoji}.`;
    return false;
  }

  appState.activeSession = createPremiumSession(appState.save, modeId);
  appState.shopMessage = null;
  return true;
}

export function submitMultiplicationAnswer(answerValue) {
  ensureInitialized();

  const result = answerActiveSession(answerValue);

  appState.save.progress.multiplication = result.progress;

  if (result.result) {
    const rewardResult = applyAnswerRewards(appState.save, result.result);
    appState.save = rewardResult.save;
    appState.activeSession = attachRewardToFeedback(result.session, rewardResult.reward);
  } else {
    appState.activeSession = result.session;
  }

  if (shouldRecordSessionCompletion(appState.activeSession)) {
    const completion = completeSession(appState.save, appState.activeSession);
    appState.save = completion.save;
    appState.activeSession = completion.session;
    appState.sessionRewards = completion.sessionRewards;
  }

  touchSave();
  return cloneData(result);
}

export function advanceActiveSession() {
  ensureInitialized();

  appState.activeSession = appState.activeSession?.type === "premium"
    ? advancePremiumSession(appState.activeSession, appState.save.progress.multiplication)
    : advanceMultiplicationSession(appState.activeSession, appState.save.progress.multiplication);
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
    setActiveTheme(itemId);
  }

  appState.shopMessage = buildShopMessage(itemType, result.item);

  touchSave();
  return cloneData(result);
}

export function buyModePackItem(packId) {
  ensureInitialized();
  const result = buyModePack(appState.save, packId);

  if (!result.ok) {
    return cloneData(result);
  }

  appState.save = result.save;
  appState.shopMessage = buildShopMessage("mode-pack", result.pack);
  touchSave();
  return cloneData(result);
}

function answerActiveSession(answerValue) {
  if (appState.activeSession?.type === "premium") {
    return answerPremiumSession(
      appState.activeSession,
      appState.save.progress.multiplication,
      answerValue
    );
  }

  return answerMultiplicationSession(
    appState.activeSession,
    appState.save.progress.multiplication,
    answerValue
  );
}

function shouldRecordSessionCompletion(session) {
  return Boolean(session?.isComplete) && !session.completionRecorded;
}

function normalizePlayableTable(table) {
  const numberTable = Number(table);

  if (appState.save.progress.multiplication.unlockedTables.includes(numberTable)) {
    return numberTable;
  }

  return null;
}

function resetProfileSessionState() {
  appState.activeSession = null;
  appState.sessionRewards = null;
  appState.shopMessage = null;
  appState.profilePanelOpen = false;
}

export function clearSessionRewards() {
  ensureInitialized();
  appState.sessionRewards = null;
  appState.shopMessage = null;
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
      message: `+${reward.coins} 🪙`,
      explanation: "",
      reward
    }
  };
}

function buildShopMessage(itemType, item) {
  if (itemType === "table") {
    return `Nouveau monde ouvert : ${item.label} ! ${item.icon}`;
  }

  if (itemType === "theme") {
    return `Nouvelle ambiance débloquée : ${item.label} !`;
  }

  if (itemType === "mode-pack") {
    return `Nouveau pack débloqué : ${item.name} ${item.emoji}`;
  }

  return null;
}

function setActiveTheme(theme) {
  appState.save.settings.theme = theme;
  appState.save.profile.favoriteTheme = theme;
  appState.save.cosmetics = {
    ...(appState.save.cosmetics || {}),
    activeTheme: theme,
    ownedThemes: uniqueStrings([...(appState.save.cosmetics?.ownedThemes || []), theme])
  };
  appState.save.rewards.ownedThemes = uniqueStrings([
    ...(appState.save.rewards?.ownedThemes || []),
    theme
  ]);
}

function uniqueStrings(values) {
  return [...new Set(values.filter(Boolean).map(String))];
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
