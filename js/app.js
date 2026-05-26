import { loadSave, saveGame } from "./storage.js";
import {
  advanceActiveSession,
  buyModePackItem,
  buyShopItem,
  clearSessionRewards,
  createProfile,
  deleteProfile,
  endActiveSession,
  getActiveTheme,
  getSaveSnapshot,
  getStateSnapshot,
  initializeState,
  selectProfile,
  startMultiplicationSession,
  startPremiumSession,
  submitMultiplicationAnswer,
  toggleProfilePanel,
  updateCollectionFilter,
  updateProfile,
  updateRoute,
  updateTheme
} from "./state.js";
import { navigate, ROUTES, startRouter } from "./router.js";
import { applyTheme, isKnownTheme } from "./theme-manager.js";
import { getPageTitle, renderAppShell } from "./screens/app-shell.js";

let autoAdvanceTimer = null;
let lastRenderedCoins = null;

startApp();

function startApp() {
  const root = document.querySelector("[data-app-root]");

  if (!root) {
    return;
  }

  initializeState(loadSave());
  applySavedTheme();
  saveGame(getSaveSnapshot());

  root.addEventListener("click", (event) => handleAppClick(event, root));
  root.addEventListener("submit", (event) => handleAppSubmit(event, root));
  root.addEventListener("change", (event) => handleAppChange(event, root));
  startRouter((route) => {
    updateRoute(route);
    renderApp(root);
  });
}

function applySavedTheme() {
  const activeTheme = getActiveTheme();
  const appliedTheme = applyTheme(activeTheme);

  if (appliedTheme !== activeTheme) {
    updateTheme(appliedTheme);
  }
}

function handleAppClick(event, root) {
  if (event.target.closest("[data-profile-toggle]")) {
    toggleProfilePanel();
    renderApp(root);
    return;
  }

  const profileSelect = event.target.closest("[data-profile-select]");

  if (profileSelect) {
    selectProfile(profileSelect.dataset.profileSelect);
    persistProfileState(root);
    return;
  }

  const profileDelete = event.target.closest("[data-profile-delete]");

  if (profileDelete) {
    deleteProfile(profileDelete.dataset.profileDelete);
    persistProfileState(root);
    return;
  }

  const profileCreateToggle = event.target.closest("[data-profile-create-toggle]");

  if (profileCreateToggle) {
    toggleProfileCreatePanel(root);
    return;
  }

  const submitTarget = event.target.closest("[data-submit-answer]");

  if (submitTarget) {
    event.preventDefault();
    submitAnswerForm(submitTarget.closest("[data-answer-form]"), root);
    return;
  }

  const buyTarget = event.target.closest("[data-buy-type][data-buy-id]");

  if (buyTarget) {
    buyItem(buyTarget.dataset.buyType, buyTarget.dataset.buyId, root);
    return;
  }

  const buyPackTarget = event.target.closest("[data-buy-pack]");

  if (buyPackTarget) {
    buyPack(buyPackTarget.dataset.buyPack, root);
    return;
  }

  const routeTarget = event.target.closest("[data-route]");

  if (routeTarget) {
    updateRoute(routeTarget.dataset.route);
    navigate(routeTarget.dataset.route);
    renderApp(root);
    return;
  }

  const startTarget = event.target.closest("[data-start-session]");

  if (startTarget) {
    clearSessionRewards();
    startMultiplicationSession(
      startTarget.dataset.startSession,
      startTarget.dataset.startTable
    );
    saveGame(getSaveSnapshot());
    navigate(ROUTES.multiplicationSession);
    renderApp(root);
    return;
  }

  const premiumStartTarget = event.target.closest("[data-start-premium-mode]");

  if (premiumStartTarget) {
    clearSessionRewards();
    if (startPremiumSession(premiumStartTarget.dataset.startPremiumMode)) {
      saveGame(getSaveSnapshot());
      navigate(ROUTES.multiplicationSession);
    }
    renderApp(root);
    return;
  }

  const answerTarget = event.target.closest("[data-session-answer]");

  if (answerTarget) {
    submitSessionAnswer(answerTarget.dataset.sessionAnswer, root);
    return;
  }

  if (event.target.closest("[data-next-question]")) {
    advanceActiveSession();
    saveGame(getSaveSnapshot());
    renderApp(root);
    return;
  }

  if (event.target.closest("[data-end-session]")) {
    const route = getStateSnapshot().activeSession?.type === "premium"
      ? ROUTES.modes
      : ROUTES.multiplication;
    endActiveSession();
    clearSessionRewards();
    saveGame(getSaveSnapshot());
    navigate(route);
    renderApp(root);
    return;
  }

  const themeTarget = event.target.closest("button[data-theme]");

  if (themeTarget) {
    changeTheme(themeTarget.dataset.theme, root);
  }
}

function handleAppSubmit(event, root) {
  const profileCreateForm = event.target.closest("[data-profile-create-form]");

  if (profileCreateForm) {
    event.preventDefault();
    createProfile(readProfileForm(profileCreateForm));
    persistProfileState(root);
    return;
  }

  const profileUpdateForm = event.target.closest("[data-profile-update-form]");

  if (profileUpdateForm) {
    event.preventDefault();
    updateProfile(readProfileForm(profileUpdateForm));
    persistProfileState(root);
    return;
  }

  const answerForm = event.target.closest("[data-answer-form]");

  if (!answerForm) {
    return;
  }

  event.preventDefault();
  submitAnswerForm(answerForm, root);
}

function handleAppChange(event, root) {
  const profileLiveField = event.target.closest("[data-profile-live]");

  if (profileLiveField) {
    const form = profileLiveField.closest("[data-profile-update-form]");
    updateProfile(readProfileForm(form));
    persistProfileState(root);
    return;
  }

  const filterSelect = event.target.closest("[data-collection-filter]");

  if (filterSelect) {
    updateCollectionFilter(filterSelect.dataset.collectionFilter, filterSelect.value);
    renderApp(root);
  }
}

function submitAnswerForm(form, root) {
  if (!form || (typeof form.reportValidity === "function" && !form.reportValidity())) {
    return;
  }

  const answerValue = new FormData(form).get("answer");

  if (answerValue === null || String(answerValue).trim() === "") {
    return;
  }

  submitSessionAnswer(answerValue, root);
}

function submitSessionAnswer(answerValue, root) {
  submitMultiplicationAnswer(answerValue);
  saveGame(getSaveSnapshot());
  renderApp(root);
}

function persistProfileState(root) { applySavedTheme(); saveGame(getSaveSnapshot()); renderApp(root); }

function toggleProfileCreatePanel(root) {
  const panel = root.querySelector("[data-profile-create-panel]");
  if (panel) panel.hidden = !panel.hidden;
}

function buyItem(itemType, itemId, root) {
  const result = buyShopItem(itemType, itemId);

  if (result.ok && itemType === "theme") {
    applyTheme(getActiveTheme());
  }

  saveGame(getSaveSnapshot());
  renderApp(root);
}

function buyPack(packId, root) {
  buyModePackItem(packId);
  saveGame(getSaveSnapshot());
  renderApp(root);
}

function changeTheme(theme, root) {
  if (!isKnownTheme(theme) || !updateTheme(theme)) {
    return;
  }

  applyTheme(theme);
  saveGame(getSaveSnapshot());
  renderApp(root);
}

function renderApp(root) {
  clearAutoAdvance();

  const state = getStateSnapshot();
  document.title = getPageTitle(state.route);
  root.innerHTML = renderAppShell(state, lastRenderedCoins);
  lastRenderedCoins = state.save.rewards.coins;
  focusAnswerInput(root);
  scheduleAutoAdvance(root, state);
}

function readProfileForm(form) {
  const data = new FormData(form);
  return {
    name: String(data.get("name") || "").trim(),
    icon: String(data.get("icon") || ""),
    favoriteTheme: String(data.get("favoriteTheme") || "")
  };
}

function scheduleAutoAdvance(root, state) {
  const feedback = state.activeSession?.currentFeedback;

  if (state.route !== ROUTES.multiplicationSession || !feedback?.autoAdvance) {
    return;
  }

  autoAdvanceTimer = window.setTimeout(() => {
    advanceActiveSession();
    saveGame(getSaveSnapshot());
    renderApp(root);
  }, feedback.fastAdvance ? 220 : 850);
}

function clearAutoAdvance() {
  if (autoAdvanceTimer !== null) {
    window.clearTimeout(autoAdvanceTimer);
    autoAdvanceTimer = null;
  }
}

function focusAnswerInput(root) {
  const answerInput = root.querySelector("[data-answer-input]");

  if (answerInput) {
    answerInput.focus();
  }
}
