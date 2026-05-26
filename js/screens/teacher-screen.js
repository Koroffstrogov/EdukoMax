import { getFactMemoryState } from "../mastery-engine.js";
import { selectScienceFacts } from "../premium-modes/science-review-engine.js";
import { buildTrainingReport } from "../training-insights-engine.js";

const SCIENCE_SECTIONS = Object.freeze([
  ["smart-review", "Révision Intelligente", "Facts fragiles à renforcer"],
  ["anti-forget", "Mission Anti-Oubli", "Facts anciennes ou peu revues"],
  ["clever-mix", "Mix Malin", "Facts proches à ne pas confondre"]
]);

export function renderTeacherView(state) {
  const report = buildTrainingReport(state.save, { filter: state.teacherFilter });
  const profileName = escapeHtml(report.profile?.name || "Explorateur");

  return `
    <section class="shop-hero teacher-hero" aria-labelledby="teacher-title">
      <div>
        <p class="eyebrow">Bilan professeur</p>
        <h1 id="teacher-title">Difficultés de ${profileName}</h1>
        <p>Vue globale des multiplications, tous modes de jeu confondus.</p>
      </div>
      <div class="coin-pill coin-pill--large" aria-label="Profil analysé">
        <span aria-hidden="true">${escapeHtml(report.profile?.icon || "🧒")}</span>
        <strong>${profileName}</strong>
      </div>
    </section>
    ${renderSummary(report.summary)}
    ${renderCoachPanel(state.save.progress.multiplication)}
    ${renderFilterBar(report)}
    ${renderFactTable(report)}
  `;
}

function renderSummary(summary) {
  return `
    <section class="teacher-summary-grid" aria-label="Résumé professeur">
      ${summaryCard("Essais", summary.attempts)}
      ${summaryCard("Réussite", `${summary.accuracyPercent}%`)}
      ${summaryCard("Fragiles", summary.fragileCount)}
      ${summaryCard("À revoir", summary.reviewCount)}
      ${summaryCard("Non essayées", summary.newCount)}
      ${summaryCard("Maîtrisées", summary.masteredCount)}
    </section>
  `;
}

function summaryCard(label, value) {
  return `
    <article class="panel teacher-summary-card">
      <span>${label}</span>
      <strong>${value}</strong>
    </article>
  `;
}

function renderFilterBar(report) {
  return `
    <section class="teacher-filter-row" aria-label="Filtres du bilan">
      ${report.filters.map((filter) => `
        <button
          class="button ${filter.id === report.filter ? "button-primary" : "button-secondary"}"
          type="button"
          data-teacher-filter="${filter.id}"
        >
          ${filter.label}
        </button>
      `).join("")}
    </section>
  `;
}

function renderFactTable(report) {
  return `
    <section class="panel teacher-table-panel" aria-labelledby="teacher-table-title">
      <div class="section-heading">
        <p class="eyebrow">Tableau bilan</p>
        <h2 id="teacher-table-title">${report.facts.length} multiplications affichées</h2>
      </div>
      <div class="teacher-table-wrap">
        <table class="teacher-table">
          <thead>
            <tr>
              <th>Multiplication</th><th>Table</th><th>Statut</th><th>Maîtrise</th>
              <th>Essais</th><th>Réussites</th><th>Erreurs</th><th>Réussite</th>
              <th>Err. récentes</th><th>Série</th><th>Temps moyen</th><th>Dernière révision</th>
              <th>Modes joués</th><th>Recommandation</th>
            </tr>
          </thead>
          <tbody>${report.facts.map(renderFactRow).join("")}</tbody>
        </table>
      </div>
    </section>
  `;
}

function renderFactRow(fact) {
  return `
    <tr>
      <th>${fact.table} x ${fact.factor}</th>
      <td>${fact.table}</td>
      <td><span class="memory-badge memory-badge--${fact.status}">${fact.statusLabel}</span></td>
      <td>${fact.mastery}%</td>
      <td>${fact.attempts}</td>
      <td>${fact.successes}</td>
      <td>${fact.errors}</td>
      <td>${fact.accuracyPercent}%</td>
      <td>${fact.recentErrors}</td>
      <td>${fact.currentStreak}</td>
      <td>${formatMs(fact.averageResponseMs)}</td>
      <td>${formatDate(fact.lastAnsweredAt)}</td>
      <td>${fact.modeLabels.length > 0 ? fact.modeLabels.map(escapeHtml).join(", ") : "Historique global"}</td>
      <td>${fact.recommendation}</td>
    </tr>
  `;
}

function renderCoachPanel(progress) {
  return `
    <section class="panel teacher-coach-panel" aria-labelledby="teacher-coach-title">
      <p class="eyebrow">Coach Mémoire</p>
      <h2 id="teacher-coach-title">Multiplications ciblées par le coach</h2>
      <div class="coach-fact-grid">
        ${SCIENCE_SECTIONS.map(([modeId, title, description]) => {
          return renderScienceSection(progress, modeId, title, description);
        }).join("")}
      </div>
    </section>
  `;
}

function renderScienceSection(progress, modeId, title, description) {
  const facts = selectScienceFacts(progress, modeId, { count: 12 });

  return `
    <article class="coach-fact-panel">
      <p class="eyebrow">${title}</p>
      <h3>${description}</h3>
      <div class="fact-chip-grid">
        ${facts.map((fact) => renderFactChip(fact, progress.facts?.[fact.id])).join("")}
      </div>
    </article>
  `;
}

function renderFactChip(fact, factProgress) {
  const state = getFactMemoryState(factProgress);
  const label = { new: "nouvelle", easy: "facile", hesitating: "à revoir", struggling: "fragile" }[state] || "à revoir";

  return `
    <span class="fact-chip fact-chip--${state}">
      <strong>${fact.table} x ${fact.factor}</strong>
      <small>${label}</small>
    </span>
  `;
}

function formatMs(value) {
  return Number.isFinite(value) ? `${(value / 1000).toFixed(1)} s` : "—";
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString("fr-FR") : "Jamais";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
