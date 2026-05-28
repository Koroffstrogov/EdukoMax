import { isMagicBraceletsQuestion } from "./magic-bracelets-engine.js";

export function renderMagicBraceletsSession(session) {
  const question = session.currentQuestion;

  if (!isMagicBraceletsQuestion(question)) {
    return "";
  }

  return `
    <div class="magic-bracelets" aria-label="Atelier Bracelets Magiques">
      <div class="bracelet-order-card">
        <span class="charm-reward" aria-hidden="true">💎</span>
        <div>
          <p class="eyebrow">${getVariantLabel(question.round.variant)}</p>
          <h2>${escapeHtml(question.prompt)}</h2>
          <p>${getInstruction(question.round.variant)}</p>
        </div>
      </div>
      ${renderBraceletWorkshop(question, false)}
      ${renderPearlChoices(question)}
    </div>
  `;
}

export function renderMagicBraceletsFeedback(session) {
  const question = session.currentQuestion;
  const feedback = session.currentFeedback;

  if (!isMagicBraceletsQuestion(question) || !feedback) {
    return "";
  }

  const toneClass = feedback.isCorrect ? " feedback-card--success bracelet-success-sparkle" : "";

  return `
    <div class="magic-bracelets">
      ${renderBraceletWorkshop(question, feedback.isCorrect)}
      <div class="feedback-card${toneClass}" role="status">
        ${feedback.isCorrect ? '<span class="victory-burst" aria-hidden="true">✦</span>' : ""}
        <h2>${escapeHtml(feedback.title)}</h2>
        <p>${escapeHtml(feedback.message)}</p>
        ${feedback.explanation ? `<p>${escapeHtml(feedback.explanation)}</p>` : ""}
        ${feedback.isCorrect ? `<p class="progress-line">Charm ${escapeHtml(feedback.charm)} gagné pour cette commande.</p>` : ""}
        ${feedback.autoAdvance ? '<p class="progress-line">Commande suivante...</p>' : `
          <button class="button button-primary" type="button" data-next-question>
            Continuer
          </button>
        `}
      </div>
    </div>
  `;
}

function renderBraceletWorkshop(question, filled) {
  const workshopText = filled
    ? question.round.successText
    : "Les bracelets attendent le bon choix de perles.";

  return `
    <div class="bracelet-workshop">
      <div class="bracelet-row" aria-label="${question.round.braceletCount} bracelets">
        ${Array.from({ length: question.round.braceletCount }, (_, index) => {
          return renderBraceletSlot(index + 1, question.round.pearlsPerBracelet, filled);
        }).join("")}
      </div>
      <p class="progress-line">${escapeHtml(workshopText)}</p>
    </div>
  `;
}

function renderBraceletSlot(number, pearlCount, filled) {
  const className = filled ? " bracelet-slot--filled" : "";
  const pearls = filled ? renderPearls(pearlCount) : '<span aria-hidden="true">○</span>';

  return `
    <span class="bracelet-slot${className}" aria-label="Bracelet ${number}">
      ${pearls}
    </span>
  `;
}

function renderPearlChoices(question) {
  return `
    <div class="pearl-lot-grid" aria-label="Choix de perles">
      ${question.choices.map((choice) => `
        <button class="pearl-lot" type="button" data-session-answer="${choice.value}">
          <span aria-hidden="true">${getChoiceEmoji(question.round.variant)}</span>
          <strong>${escapeHtml(choice.label)}</strong>
        </button>
      `).join("")}
    </div>
  `;
}

function renderPearls(count) {
  return Array.from({ length: Math.min(count, 10) }, () => '<i aria-hidden="true"></i>').join("");
}

function getVariantLabel(variant) {
  return {
    groups: "Groupes de perles",
    "total-mystery": "Total mystère",
    "missing-lot": "Perles par bracelet"
  }[variant] || "Atelier de perles";
}

function getInstruction(variant) {
  if (variant === "total-mystery") {
    return "Choisis le coffre avec le bon total de perles.";
  }

  return "Choisis le lot qui remplit chaque bracelet.";
}

function getChoiceEmoji(variant) {
  return variant === "total-mystery" ? "🎁" : "🧿";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
