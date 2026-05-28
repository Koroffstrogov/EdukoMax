import { ROUTES } from "../router.js";
import { renderCollectionScreen } from "./collection-screen.js";
import { renderHomeView } from "./home-screen.js";
import { renderLeaderboardView } from "./leaderboard-screen.js";
import { renderMultiplicationView } from "./multiplication-screen.js?v=magic-bracelets-20260527";
import { renderMultiplicationSessionView } from "./multiplication-session-screen.js?v=magic-bracelets-20260527";
import { renderPremiumModesView } from "./premium-modes-screen.js?v=magic-bracelets-20260527";
import { renderProfileControls } from "./profile-panel.js";
import { renderSettingsView } from "./settings-screen.js?v=settings-guard-20260525";
import { renderTeacherView } from "./teacher-screen.js";

export function renderAppShell(state, lastRenderedCoins) {
  return `
    <div class="app-shell">
      ${renderHeader(state, lastRenderedCoins)}
      ${renderNotice(state.noticeMessage)}
      <main id="main-content" class="app-main" tabindex="-1">
        ${renderCurrentView(state)}
      </main>
    </div>
  `;
}

function renderNotice(message) {
  return message
    ? `<div class="shop-message app-notice" role="status">${escapeHtml(message)}</div>`
    : "";
}

export function getPageTitle(route) {
  if (route === ROUTES.settings) return "Réglages - EdukoMax";
  if (route === ROUTES.multiplication) return "Multiplications - EdukoMax";
  if (route === ROUTES.multiplicationSession) return "Session multiplications - EdukoMax";
  if (route === ROUTES.collection) return "Collection - EdukoMax";
  if (route === ROUTES.teacher || route === ROUTES.modesScienceFacts) return "Bilan professeur - EdukoMax";
  if (route === ROUTES.modes || route.startsWith("modes/")) return "Modes spéciaux - EdukoMax";
  if (route === ROUTES.leaderboard) return "Classement - EdukoMax";
  return "EdukoMax";
}

function renderHeader(state, lastRenderedCoins) {
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
        ${renderNavButton("Modes spéciaux", ROUTES.modes, state.route)}
        ${renderNavButton("Collection", ROUTES.collection, state.route)}
        ${renderNavButton("Réglages", ROUTES.settings, state.route)}
      </nav>
      ${renderTeacherButton(state.route)}
      ${renderCoinCounter(state.save.rewards.coins, lastRenderedCoins)}
      ${renderProfileControls(state)}
    </header>
  `;
}

function renderTeacherButton(activeRoute) {
  const active = activeRoute === ROUTES.teacher || activeRoute === ROUTES.modesScienceFacts;
  const activeClass = active ? " is-active" : "";
  const current = active ? ' aria-current="page"' : "";

  return `
    <button
      class="nav-button icon-nav-button${activeClass}"
      type="button"
      data-route="${ROUTES.teacher}"
      aria-label="Bilan professeur"
      title="Bilan professeur"
      ${current}
    >
      <span aria-hidden="true">📊</span>
    </button>
  `;
}

function renderCoinCounter(coins, lastRenderedCoins) {
  const bumpClass = lastRenderedCoins !== null && lastRenderedCoins !== coins
    ? " coin-pill--bump"
    : "";

  return `
    <div class="coin-pill coin-pill--header${bumpClass}" aria-label="${coins} pièces">
      <span aria-hidden="true">🪙</span>
      <strong>${coins}</strong>
    </div>
  `;
}

function renderNavButton(label, route, activeRoute) {
  const active = route === activeRoute ||
    (route === ROUTES.modes && activeRoute.startsWith("modes/"));
  const activeClass = active ? " is-active" : "";
  const current = active ? ' aria-current="page"' : "";

  return `
    <button class="nav-button${activeClass}" type="button" data-route="${route}" ${current}>
      ${label}
    </button>
  `;
}

function renderCurrentView(state) {
  if (state.route === ROUTES.multiplicationSession) return renderMultiplicationSessionView(state);
  if (state.route === ROUTES.multiplication) return renderMultiplicationView(state);
  if (state.route === ROUTES.collection) return renderCollectionScreen(state);
  if (state.route === ROUTES.settings) return renderSettingsView(state);
  if (state.route === ROUTES.modes) return renderPremiumModesView(state);
  if (state.route === ROUTES.modesCompetitive) return renderPremiumModesView(state, "competitive");
  if (state.route === ROUTES.modesChill) return renderPremiumModesView(state, "chill");
  if (state.route === ROUTES.modesScience) return renderPremiumModesView(state, "science");
  if (state.route === ROUTES.modesBracelets) return renderPremiumModesView(state, "story");
  if (state.route === ROUTES.teacher || state.route === ROUTES.modesScienceFacts) return renderTeacherView(state);
  if (state.route === ROUTES.leaderboard) return renderLeaderboardView(state);
  return renderHomeView(state);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
