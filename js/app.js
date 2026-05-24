import { loadSave, saveGame } from "./storage.js";
import {
  advanceActiveSession,
  buyShopItem,
  clearSessionRewards,
  endActiveSession,
  getActiveTheme,
  getSaveSnapshot,
  getStateSnapshot,
  initializeState,
  startMultiplicationSession,
  submitMultiplicationAnswer,
  updateCollectionFilter,
  updateRoute,
  updateTheme
} from "./state.js";
import { navigate, ROUTES, startRouter } from "./router.js";
import { applyTheme, isKnownTheme } from "./theme-manager.js";
import { renderHomeView } from "./screens/home-screen.js";
import { renderMultiplicationView } from "./screens/multiplication-screen.js";
import {
  renderMultiplicationSessionView
} from "./screens/multiplication-session-screen.js";
import { renderSettingsView } from "./screens/settings-screen.js";
import { renderCollectionScreen } from "./screens/collection-screen.js";

let autoAdvanceTimer = null;

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

  const routeTarget = event.target.closest("[data-route]");

  if (routeTarget) {
    navigate(routeTarget.dataset.route);
    return;
  }

  const startTarget = event.target.closest("[data-start-session]");

  if (startTarget) {
    startMultiplicationSession(startTarget.dataset.startSession);
    saveGame(getSaveSnapshot());
    navigate(ROUTES.multiplicationSession);
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
    endActiveSession();
    clearSessionRewards();
    saveGame(getSaveSnapshot());
    navigate(ROUTES.multiplication);
    renderApp(root);
    return;
  }

  const themeTarget = event.target.closest("[data-theme]");

  if (themeTarget) {
    changeTheme(themeTarget.dataset.theme, root);
  }
}

function handleAppSubmit(event, root) {
  const answerForm = event.target.closest("[data-answer-form]");

  if (!answerForm) {
    return;
  }

  event.preventDefault();
  submitAnswerForm(answerForm, root);
}

function handleAppChange(event, root) {
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

function buyItem(itemType, itemId, root) {
  const result = buyShopItem(itemType, itemId);

  if (result.ok && itemType === "theme") {
    applyTheme(getActiveTheme());
  }

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
  root.innerHTML = `
    <div class="app-shell">
      ${renderHeader(state)}
      <main id="main-content" class="app-main" tabindex="-1">
        ${renderCurrentView(state)}
      </main>
    </div>
  `;
  focusAnswerInput(root);
  scheduleAutoAdvance(root, state);
}

function renderHeader(state) {
  return `
    <header class="topbar">
      <div class="brand" aria-label="EdukoMax">
        <span class="brand-mark" aria-hidden="true">EM</span>
        <span>
          <span class="brand-name">EdukoMax</span>
          <span class="brand-subtitle">Maths courtes et joyeuses</span>
        </span>
      </div>
      <nav class="topnav" aria-label="Navigation principale">
        ${renderNavButton("Accueil", ROUTES.home, state.route)}
        ${renderNavButton("Multiplications", ROUTES.multiplication, state.route)}
        ${renderNavButton("Collection", ROUTES.collection, state.route)}
        ${renderNavButton("Réglages", ROUTES.settings, state.route)}
      </nav>
    </header>
  `;
}

function renderNavButton(label, route, activeRoute) {
  const activeClass = route === activeRoute ? " is-active" : "";
  const current = route === activeRoute ? ' aria-current="page"' : "";

  return `
    <button class="nav-button${activeClass}" type="button" data-route="${route}" ${current}>
      ${label}
    </button>
  `;
}

function renderCurrentView(state) {
  if (state.route === ROUTES.multiplicationSession) {
    return renderMultiplicationSessionView(state);
  }

  if (state.route === ROUTES.multiplication) {
    return renderMultiplicationView(state);
  }

  if (state.route === ROUTES.collection) {
    return renderCollectionScreen(state);
  }

  if (state.route === ROUTES.settings) {
    return renderSettingsView(state);
  }

  return renderHomeView(state);
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
  }, 850);
}

function clearAutoAdvance() {
  if (autoAdvanceTimer !== null) {
    window.clearTimeout(autoAdvanceTimer);
    autoAdvanceTimer = null;
  }
}

function getPageTitle(route) {
  if (route === ROUTES.settings) {
    return "Réglages - EdukoMax";
  }

  if (route === ROUTES.multiplication) {
    return "Multiplications - EdukoMax";
  }

  if (route === ROUTES.multiplicationSession) {
    return "Session multiplications - EdukoMax";
  }

  if (route === ROUTES.collection) {
    return "Collection - EdukoMax";
  }

  return "EdukoMax";
}

function focusAnswerInput(root) {
  const answerInput = root.querySelector("[data-answer-input]");

  if (answerInput) {
    answerInput.focus();
  }
}
