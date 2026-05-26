import { getSessionAccuracy } from "../games/multiplication-session.js";
import { renderRewardReveal } from "../collectibles/reward-reveal.js";
import {
  getChillRewardLabel
} from "../premium-modes/chill-engine.js";

export function renderMultiplicationSessionView(state) {
  const session = state.activeSession;

  if (!session) {
    return renderMissingSession();
  }

  if (session.isComplete && !session.currentFeedback) {
    return renderSessionSummary(session, state.sessionRewards);
  }

  return `
    <section class="session-grid" aria-labelledby="session-title">
      <div class="question-panel">
        ${renderSessionHeader(session)}
        ${renderQuestion(session.currentQuestion)}
        ${renderAnswerArea(session)}
      </div>
      ${renderSessionAside(session, state.save.rewards.coins)}
    </section>
  `;
}

function renderMissingSession() {
  return `
    <section class="panel" aria-labelledby="missing-session-title">
      <p class="eyebrow">Multiplications</p>
      <h1 id="missing-session-title">Aucune session en cours</h1>
      <p>Démarre une session courte depuis le module Multiplications.</p>
      <button class="button button-primary" type="button" data-route="multiplication">
        Aller aux multiplications
      </button>
    </section>
  `;
}

function renderSessionSummary(session, sessionRewards) {
  const totalBonusCoins = (sessionRewards?.bonusCoins || 0) +
    (sessionRewards?.premiumBonusCoins || 0);
  const rewardHtml = sessionRewards
    ? renderRewardReveal(sessionRewards.cards || [], sessionRewards.badges || [], totalBonusCoins)
    : "";

  return `
    <section class="session-grid" aria-labelledby="summary-title">
      <div class="question-panel">
        <p class="eyebrow">Session terminée</p>
        <h1 id="summary-title">Beau travail</h1>
        <p>
          Tu as répondu à ${session.answeredCount} questions avec
          ${session.correctCount} réussites.
        </p>
        ${renderPremiumSummary(session, sessionRewards)}
        <div class="score-card">
          <strong>${getSessionAccuracy(session)}%</strong>
          <span>de réussite sur cette session</span>
        </div>
        ${rewardHtml}
        <div class="action-row">
          <button class="button button-primary" type="button" ${getReplayAttribute(session)}>
            Rejouer pour tenter une nouvelle carte
          </button>
          <button class="button button-secondary" type="button" data-end-session>
            Retour au module
          </button>
        </div>
      </div>
      ${renderSessionHistory(session)}
    </section>
  `;
}

function renderSessionHeader(session) {
  const questionNumber = session.currentFeedback
    ? session.answeredCount
    : session.answeredCount + 1;

  return `
    <p class="eyebrow">${getSessionEyebrow(session, questionNumber)}</p>
    <h1 id="session-title">${session.type === "premium" ? session.modeName : "À toi de jouer"}</h1>
    <progress
      class="session-progress"
      value="${session.answeredCount}"
      max="${session.totalQuestions}"
      aria-label="Progression de la session"
    ></progress>
  `;
}

function renderQuestion(question) {
  return `
    <div class="question-box">
      <p class="question-prompt">${question.prompt}</p>
      ${question.mode === "visual-groups" ? renderVisualGroups(question) : ""}
    </div>
  `;
}

function renderAnswerArea(session) {
  const answerContent = getAnswerContent(session);

  return `
    <div class="answer-area">
      ${answerContent}
    </div>
  `;
}

function getAnswerContent(session) {
  if (session.currentFeedback) {
    return renderFeedback(session);
  }

  if (session.currentQuestion.answerType === "choice") {
    return renderChoices(session.currentQuestion);
  }

  return renderNumberForm();
}

function renderChoices(question) {
  return `
    <div class="choice-grid" aria-label="Choix de réponses">
      ${question.choices
        .map((choice) => `
          <button class="choice-button" type="button" data-session-answer="${choice.value}">
            ${choice.label}
          </button>
        `)
        .join("")}
    </div>
  `;
}

function renderNumberForm() {
  return `
    <form class="answer-form" data-answer-form>
      <label class="answer-label" for="answer-input">Ta réponse</label>
      <div class="answer-row">
        <input
          id="answer-input"
          name="answer"
          class="answer-input"
          data-answer-input
          type="number"
          inputmode="numeric"
          min="0"
          required
          autocomplete="off"
        >
        <button class="button button-primary" type="submit" data-submit-answer>Valider</button>
      </div>
    </form>
  `;
}

function renderFeedback(session) {
  const feedback = session.currentFeedback;
  const toneClass = feedback.isCorrect ? " feedback-card--success" : "";

  return `
    <div class="feedback-card${toneClass}" role="status">
      ${feedback.isCorrect ? '<span class="victory-burst" aria-hidden="true">★</span>' : ""}
      <h2>${feedback.title}</h2>
      <p>${feedback.message}</p>
      ${feedback.explanation ? `<p>${feedback.explanation}</p>` : ""}
      ${feedback.autoAdvance ? '<p class="progress-line">Question suivante...</p>' : `
        <button class="button button-primary" type="button" data-next-question>
          Continuer
        </button>
      `}
    </div>
  `;
}

function renderSessionAside(session, coins) {
  const premiumStats = renderPremiumStats(session);

  return `
    <aside class="panel" aria-labelledby="session-stats-title">
      <div class="coin-pill" aria-label="Pièces disponibles">
        <span aria-hidden="true">🪙</span>
        <strong>${coins}</strong>
        <span>pièces</span>
      </div>
      <p class="eyebrow">En cours</p>
      <h2 id="session-stats-title">${getModeLabel(session.modeId)}</h2>
      <ul class="status-list">
        <li><span>Réponses</span><strong>${session.answeredCount}/${session.totalQuestions}</strong></li>
        <li><span>Réussites</span><strong>${session.correctCount}</strong></li>
        <li><span>Score</span><strong>${getSessionAccuracy(session)}%</strong></li>
        ${premiumStats}
      </ul>
    </aside>
  `;
}

function getModeLabel(modeId) {
  return {
    "direct-answer": "Réponse directe",
    "multiple-choice": "Choix rapide",
    "visual-groups": "Groupes visuels",
    "missing-factor": "Facteur caché",
    mixed: "Mode mélange",
    "speed-60": "Sprint 60”",
    "combo-max": "Combo Max",
    garden: "Jardin",
    "mascot-snack": "Goûter",
    "smart-review": "Révision intelligente",
    "anti-forget": "Anti-Oubli",
    "clever-mix": "Mix malin"
  }[modeId] || "Session courte";
}

function renderPremiumSummary(session, rewards) {
  if (session.type !== "premium") {
    return "";
  }

  const rank = rewards?.leaderboardRank
    ? `<p class="progress-line">Rang local : #${rewards.leaderboardRank}</p>`
    : "";
  const science = rewards?.scienceSummary
    ? `<p class="progress-line">${rewards.scienceSummary}</p>`
    : "";
  const chill = session.packFamily === "chill"
    ? `<p class="progress-line">${getChillRewardLabel(session)}</p>`
    : "";

  return `
    <div class="shop-message" role="status">
      ${rank || science || chill || "Mode spécial terminé !"}
    </div>
  `;
}

function getReplayAttribute(session) {
  return session.type === "premium"
    ? `data-start-premium-mode="${session.modeId}"`
    : `data-start-session="${session.modeId}"`;
}

function getSessionEyebrow(session, questionNumber) {
  if (session.modeId === "speed-60") {
    return `Sprint · ${getRemainingSeconds(session)} s restantes`;
  }

  return `Question ${questionNumber} sur ${session.totalQuestions}`;
}

function renderPremiumStats(session) {
  if (session.type !== "premium") {
    return "";
  }

  if (session.modeId === "speed-60") {
    return `<li><span>Chrono</span><strong>${getRemainingSeconds(session)} s</strong></li>`;
  }

  if (session.modeId === "combo-max") {
    return `<li><span>Meilleure série</span><strong>${session.bestStreak}</strong></li>`;
  }

  if (session.packFamily === "chill") {
    return `<li><span>Détente</span><strong>${getChillRewardLabel(session)}</strong></li>`;
  }

  if (session.packFamily === "science") {
    return `<li><span>Coach</span><strong>facts utiles</strong></li>`;
  }

  return "";
}

function getRemainingSeconds(session) {
  if (!session.timeLimitMs || !Number.isFinite(session.startedAtMs)) {
    return 0;
  }

  const elapsed = Date.now() - session.startedAtMs;
  return Math.max(0, Math.ceil((session.timeLimitMs - elapsed) / 1000));
}

function renderSessionHistory(session) {
  return `
    <aside class="panel" aria-labelledby="history-title">
      <p class="eyebrow">Détails</p>
      <h2 id="history-title">Dernières réponses</h2>
      <ul class="status-list">
        ${session.answers
          .slice(-5)
          .map((answer) => `
            <li>
              <span>${answer.question}</span>
              <strong>${answer.isCorrect ? "OK" : answer.correctAnswer}</strong>
            </li>
          `)
          .join("")}
      </ul>
    </aside>
  `;
}

function renderVisualGroups(question) {
  return `
    <div class="visual-groups" aria-label="${question.factor} groupes de ${question.table}">
      ${question.visualGroups
        .map((group) => `
          <span class="visual-group">
            ${Array.from({ length: group.itemCount }, () => '<i aria-hidden="true"></i>').join("")}
          </span>
        `)
        .join("")}
    </div>
  `;
}
