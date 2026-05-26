import { getLeaderboard } from "../premium-modes/competitive-engine.js";

export function renderLeaderboardView(state) {
  return `
    <section class="shop-hero" aria-labelledby="leaderboard-title">
      <div>
        <p class="eyebrow">Défis Champions</p>
        <h1 id="leaderboard-title">Top 10 des champions</h1>
        <p>Classement local de tous les profils de ce navigateur.</p>
      </div>
      <div class="coin-pill coin-pill--large" aria-label="Profil actif">
        <span aria-hidden="true">${state.save.profile.icon}</span>
        <strong>${escapeHtml(state.save.profile.name)}</strong>
      </div>
    </section>
    <section class="leaderboard-grid">
      ${renderBoard("Sprint 60”", getLeaderboard(state.save, "speed-60"))}
      ${renderBoard("Combo Max", getLeaderboard(state.save, "combo-max"))}
    </section>
  `;
}

function renderBoard(title, entries) {
  return `
    <article class="panel leaderboard-panel">
      <p class="eyebrow">🏆 ${title}</p>
      <h2>${title}</h2>
      ${entries.length > 0 ? renderEntries(entries) : "<p>Aucun score pour l'instant.</p>"}
    </article>
  `;
}

function renderEntries(entries) {
  return `
    <ol class="leaderboard-list">
      ${entries.map((entry, index) => `
        <li>
          <span>${index + 1}. ${entry.avatar} ${escapeHtml(entry.profileName)}</span>
          <strong>${entry.score}</strong>
          <small>${Math.round(entry.accuracy * 100)}%</small>
        </li>
      `).join("")}
    </ol>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
