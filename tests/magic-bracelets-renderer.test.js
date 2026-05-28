import { test } from "./test-runner.js";
import { assert } from "./test-utils.js";
import { getFactById } from "../js/multiplication-data.js";
import { createMagicBraceletsQuestion } from "../js/story-modes/magic-bracelets-engine.js";
import {
  renderMagicBraceletsFeedback,
  renderMagicBraceletsSession
} from "../js/story-modes/magic-bracelets-renderer.js";

test("magic bracelets renderer shows atelier choices without input", () => {
  const session = {
    currentQuestion: createMagicBraceletsQuestion(getFactById("4x6"), 0)
  };
  const html = renderMagicBraceletsSession(session);

  assert(html.includes("magic-bracelets"));
  assert(html.includes("bracelet-workshop"));
  assert(html.includes("data-session-answer"));
  assert(!html.includes("<input"));
});

test("magic bracelets feedback gives a gentle hint", () => {
  const question = createMagicBraceletsQuestion(getFactById("4x6"), 0);
  const session = {
    currentQuestion: question,
    currentFeedback: {
      isCorrect: false,
      title: "On ajuste le bracelet",
      message: "On ajuste doucement l'atelier.",
      explanation: question.round.hintText,
      autoAdvance: false
    }
  };
  const html = renderMagicBraceletsFeedback(session);

  assert(html.includes("Continuer"));
  assert(html.includes("Astuce"));
  assert(!html.includes("Erreur"));
  assert(!html.includes("<input"));
});
