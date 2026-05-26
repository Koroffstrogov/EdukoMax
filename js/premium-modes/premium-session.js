import { QUESTION_MODES, generateMultiplicationQuestion } from "../multiplication-generator.js";
import { createMultiplicationFeedback } from "../multiplication-feedback.js";
import { recordMultiplicationAnswer } from "../progress-engine.js";
import {
  getModeById,
  getPackForMode,
  isKnownPremiumMode
} from "./mode-pack-data.js";
import { selectScienceFacts } from "./science-review-engine.js";

const MODE_SEQUENCE = Object.freeze([
  QUESTION_MODES.directAnswer,
  QUESTION_MODES.multipleChoice,
  QUESTION_MODES.directAnswer,
  QUESTION_MODES.visualGroups,
  QUESTION_MODES.missingFactor
]);

export function createPremiumSession(saveData, modeId, options = {}) {
  const mode = getModeById(modeId);
  const pack = getPackForMode(modeId);

  if (!mode || !pack) {
    throw new Error("Unknown premium mode.");
  }

  const progress = saveData.progress.multiplication;
  const totalQuestions = normalizeQuestionCount(options.totalQuestions, mode.questionCount);
  const session = {
    type: "premium",
    packId: pack.id,
    packFamily: pack.family,
    modeId: mode.id,
    modeName: mode.name,
    table: null,
    totalQuestions,
    currentIndex: 0,
    answeredCount: 0,
    correctCount: 0,
    errorCount: 0,
    currentStreak: 0,
    bestStreak: 0,
    score: 0,
    answers: [],
    currentFeedback: null,
    isComplete: false,
    completionRecorded: false,
    startedAt: new Date().toISOString(),
    startedAtMs: Date.now(),
    questionStartedAt: Date.now(),
    factQueue: buildFactQueue(progress, mode.id, totalQuestions),
    timeLimitMs: mode.id === "speed-60" ? 60000 : null,
    flowers: 0,
    snacks: 0
  };

  return {
    ...session,
    currentQuestion: generatePremiumQuestion(progress, session)
  };
}

export function answerPremiumSession(session, progress, answerValue) {
  if (!canAnswer(session)) {
    return { session, progress, result: null };
  }

  const responseMs = Date.now() - session.questionStartedAt;
  const answerDetails = {
    value: Number(answerValue),
    responseMs,
    answeredAt: new Date().toISOString(),
    modeId: session.modeId,
    questionMode: session.currentQuestion.mode
  };
  const result = recordMultiplicationAnswer(progress, session.currentQuestion, answerDetails);
  const feedback = createPremiumFeedback(session, answerDetails, result.isCorrect);
  const nextSession = updatePremiumSession(session, result, answerDetails, responseMs, feedback);

  return {
    session: markPremiumComplete(nextSession),
    progress: result.progress,
    result
  };
}

export function advancePremiumSession(session, progress) {
  if (!session) return session;

  if (session.isComplete) {
    return session.currentFeedback ? { ...session, currentFeedback: null } : session;
  }

  if (session.currentFeedback === null) {
    return markPremiumComplete(session);
  }

  const nextIndex = session.currentIndex + 1;
  const nextSession = {
    ...session,
    currentIndex: nextIndex,
    currentFeedback: null,
    questionStartedAt: Date.now()
  };

  if (nextIndex >= session.totalQuestions) {
    return markPremiumComplete(nextSession);
  }

  return markPremiumComplete({
    ...nextSession,
    currentQuestion: generatePremiumQuestion(progress, nextSession)
  });
}

export function isPremiumSessionMode(modeId) {
  return isKnownPremiumMode(modeId);
}

function updatePremiumSession(session, result, answerDetails, responseMs, feedback) {
  const correctCount = session.correctCount + (result.isCorrect ? 1 : 0);
  const errorCount = session.errorCount + (result.isCorrect ? 0 : 1);
  const currentStreak = result.isCorrect ? session.currentStreak + 1 : 0;
  const bestStreak = Math.max(session.bestStreak, currentStreak);
  const nextSession = {
    ...session,
    answeredCount: session.answeredCount + 1,
    correctCount,
    errorCount,
    currentStreak,
    bestStreak,
    score: getSessionScore(session.modeId, correctCount, bestStreak),
    currentFeedback: feedback,
    flowers: session.flowers + (session.modeId === "garden" && result.isCorrect ? 1 : 0),
    snacks: session.snacks + (session.modeId === "mascot-snack" && result.isCorrect ? 1 : 0),
    answers: [...session.answers, buildAnswerRecord(session, result, answerDetails, responseMs)]
  };

  return nextSession;
}

function buildAnswerRecord(session, result, answerDetails, responseMs) {
  return {
    factId: result.factId,
    question: session.currentQuestion.prompt,
    value: answerDetails.value,
    correctAnswer: session.currentQuestion.correctAnswer,
    isCorrect: result.isCorrect,
    responseMs
  };
}

function generatePremiumQuestion(progress, session) {
  const factId = session.factQueue[session.currentIndex]?.id;
  return generateMultiplicationQuestion(progress, {
    mode: getQuestionMode(session.modeId, session.currentIndex),
    factId
  });
}

function buildFactQueue(progress, modeId, totalQuestions) {
  if (!["smart-review", "anti-forget", "clever-mix"].includes(modeId)) {
    return [];
  }

  const selectedFacts = selectScienceFacts(progress, modeId, { count: totalQuestions });
  return Array.from({ length: totalQuestions }, (_, index) => {
    return selectedFacts[index % selectedFacts.length];
  }).filter(Boolean);
}

function getQuestionMode(modeId, index) {
  if (modeId === "speed-60") {
    return [QUESTION_MODES.directAnswer, QUESTION_MODES.multipleChoice][index % 2];
  }

  if (modeId === "garden") {
    return [QUESTION_MODES.visualGroups, QUESTION_MODES.directAnswer][index % 2];
  }

  return MODE_SEQUENCE[index % MODE_SEQUENCE.length];
}

function createPremiumFeedback(session, answerDetails, isCorrect) {
  const feedback = createMultiplicationFeedback(session.currentQuestion, answerDetails);

  if (!isCorrect) {
    return {
      ...feedback,
      message: getHelpfulPremiumMessage(session)
    };
  }

  return {
    ...feedback,
    title: getSuccessTitle(session),
    message: "",
    explanation: "",
    fastAdvance: session.packFamily === "competitive"
  };
}

function getHelpfulPremiumMessage(session) {
  if (session.modeId === "mascot-snack") {
    return "La mascotte te donne un indice tout doux.";
  }

  if (session.modeId === "garden") {
    return "On arrose tranquillement cette multiplication.";
  }

  if (session.packFamily === "science") {
    return "Le coach garde cette multiplication pour la renforcer.";
  }

  return "Respire, puis tente la suivante.";
}

function getSuccessTitle(session) {
  if (session.modeId === "speed-60") return "Sprint réussi";
  if (session.modeId === "combo-max") return "Combo +1";
  if (session.modeId === "garden") return "Une fleur pousse";
  if (session.modeId === "mascot-snack") return "Friandise gagnée";
  return "Mémoire renforcée";
}

function markPremiumComplete(session) {
  const timeDone = session.timeLimitMs !== null &&
    Date.now() - session.startedAtMs >= session.timeLimitMs;
  const comboDone = session.modeId === "combo-max" && session.errorCount >= 3;
  const countDone = session.answeredCount >= session.totalQuestions;

  return {
    ...session,
    isComplete: timeDone || comboDone || countDone
  };
}

function getSessionScore(modeId, correctCount, bestStreak) {
  return modeId === "combo-max" ? bestStreak : correctCount;
}

function canAnswer(session) {
  return Boolean(session?.currentQuestion) &&
    session.currentFeedback === null &&
    !session.isComplete;
}

function normalizeQuestionCount(value, fallback) {
  return Number.isInteger(value) && value >= 4 && value <= 60 ? value : fallback;
}
