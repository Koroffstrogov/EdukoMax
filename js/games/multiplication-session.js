import {
  QUESTION_MODES,
  generateMultiplicationQuestion
} from "../multiplication-generator.js";
import { createMultiplicationFeedback } from "../multiplication-feedback.js";
import { recordMultiplicationAnswer } from "../progress-engine.js";
import {
  buildPracticeQueue,
  scheduleRetryAfterError
} from "../practice-planner.js";

const DEFAULT_QUESTION_COUNT = 8;
const MIXED_MODE_ID = "mixed";
const MODE_SEQUENCE = Object.freeze([
  QUESTION_MODES.directAnswer,
  QUESTION_MODES.multipleChoice,
  QUESTION_MODES.directAnswer,
  QUESTION_MODES.missingFactor,
  QUESTION_MODES.visualGroups,
  QUESTION_MODES.multipleChoice,
  QUESTION_MODES.directAnswer,
  QUESTION_MODES.missingFactor
]);

export function createMultiplicationSession(progress, options = {}) {
  const totalQuestions = normalizeQuestionCount(options.totalQuestions);
  const modeId = normalizeSessionMode(options.modeId);
  const modes = buildModeSequence(totalQuestions, modeId);
  const table = normalizeSessionTable(options.table);
  const factQueue = buildPracticeQueue(progress, { count: totalQuestions, modeId, table });

  return {
    type: "multiplication",
    modeId,
    table,
    totalQuestions,
    currentIndex: 0,
    answeredCount: 0,
    correctCount: 0,
    answers: [],
    factQueue,
    retryQueue: [],
    retriedFactIds: [],
    currentQuestion: generateQuestion(progress, modes, 0, factQueue[0]?.id),
    currentFeedback: null,
    isComplete: false,
    completionRecorded: false,
    startedAt: new Date().toISOString(),
    questionStartedAt: Date.now(),
    modes
  };
}

export function answerMultiplicationSession(session, progress, answerValue) {
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
  const result = recordMultiplicationAnswer(
    progress,
    session.currentQuestion,
    answerDetails
  );
  const feedback = createMultiplicationFeedback(
    session.currentQuestion,
    answerDetails
  );
  const answeredSession = {
    ...session,
    answeredCount: session.answeredCount + 1,
    correctCount: session.correctCount + (result.isCorrect ? 1 : 0),
    currentFeedback: feedback,
    answers: [
      ...session.answers,
      {
        factId: result.factId,
        question: session.currentQuestion.prompt,
        value: answerDetails.value,
        correctAnswer: session.currentQuestion.correctAnswer,
        isCorrect: result.isCorrect,
        responseMs
      }
    ]
  };
  const nextSession = result.isCorrect
    ? answeredSession
    : scheduleRetryAfterError(answeredSession, result.factId);

  return {
    session: markCompleteIfNeeded(nextSession),
    progress: result.progress,
    result
  };
}

export function advanceMultiplicationSession(session, progress) {
  if (!session) {
    return session;
  }

  if (session.isComplete) {
    return session.currentFeedback
      ? { ...session, currentFeedback: null }
      : session;
  }

  if (session.currentFeedback === null) {
    return session;
  }

  const nextIndex = session.currentIndex + 1;

  if (nextIndex >= session.totalQuestions) {
    return markCompleteIfNeeded(session);
  }
  const queued = takeQueuedFact(session, nextIndex);

  return {
    ...queued.session,
    currentIndex: nextIndex,
    currentQuestion: generateQuestion(progress, session.modes, nextIndex, queued.factId),
    currentFeedback: null,
    questionStartedAt: Date.now()
  };
}

export function getSessionAccuracy(session) {
  if (!session || session.answeredCount === 0) {
    return 0;
  }

  return Math.round((session.correctCount / session.answeredCount) * 100);
}

function generateQuestion(progress, modes, index, factId) {
  return generateMultiplicationQuestion(progress, {
    mode: modes[index] || QUESTION_MODES.directAnswer,
    factId,
    choiceVariant: index
  });
}

function takeQueuedFact(session, nextIndex) {
  const dueRetry = (session.retryQueue || []).find((retry) => {
    return retry.availableAtIndex <= nextIndex;
  });

  if (dueRetry && !wouldRepeatFactThreeTimes(session, dueRetry.factId)) {
    return {
      session: {
        ...session,
        retryQueue: session.retryQueue.filter((retry) => retry !== dueRetry)
      },
      factId: dueRetry.factId
    };
  }

  const queuedFactId = session.factQueue[nextIndex]?.id;

  if (!wouldRepeatFactThreeTimes(session, queuedFactId)) {
    return { session, factId: queuedFactId };
  }

  const alternative = findAlternativeFact(session, nextIndex);

  if (alternative.index >= 0) {
    return {
      session: swapQueuedFact(session, nextIndex, alternative.index),
      factId: alternative.factId
    };
  }

  return { session, factId: queuedFactId };
}

function wouldRepeatFactThreeTimes(session, factId) {
  const recentFacts = (session.answers || []).slice(-2).map((answer) => answer.factId);
  return Boolean(factId) &&
    recentFacts.length === 2 &&
    recentFacts.every((recentFactId) => recentFactId === factId);
}

function findAlternativeFact(session, nextIndex) {
  const factQueue = session.factQueue || [];

  for (let offset = 1; offset <= factQueue.length; offset += 1) {
    const index = (nextIndex + offset) % factQueue.length;
    const factId = factQueue[index]?.id;

    if (index !== nextIndex && factId && !wouldRepeatFactThreeTimes(session, factId)) {
      return { index, factId };
    }
  }

  return { index: -1, factId: null };
}

function swapQueuedFact(session, firstIndex, secondIndex) {
  const factQueue = [...(session.factQueue || [])];
  [factQueue[firstIndex], factQueue[secondIndex]] = [factQueue[secondIndex], factQueue[firstIndex]];

  return {
    ...session,
    factQueue
  };
}

function canAnswer(session) {
  return Boolean(session?.currentQuestion) &&
    session.currentFeedback === null &&
    !session.isComplete;
}

function markCompleteIfNeeded(session) {
  return {
    ...session,
    isComplete: session.answeredCount >= session.totalQuestions
  };
}

function buildModeSequence(totalQuestions, modeId) {
  if (modeId !== MIXED_MODE_ID) {
    return Array.from({ length: totalQuestions }, () => modeId);
  }

  return Array.from({ length: totalQuestions }, (_, index) => {
    return MODE_SEQUENCE[index % MODE_SEQUENCE.length];
  });
}

function normalizeSessionMode(modeId) {
  if (modeId === MIXED_MODE_ID) {
    return MIXED_MODE_ID;
  }

  return Object.values(QUESTION_MODES).includes(modeId)
    ? modeId
    : QUESTION_MODES.directAnswer;
}

function normalizeSessionTable(table) {
  const numberTable = Number(table);
  return Number.isInteger(numberTable) && numberTable >= 2 && numberTable <= 10
    ? numberTable
    : null;
}

function normalizeQuestionCount(value) {
  return Number.isInteger(value) && value >= 4 && value <= 12
    ? value
    : DEFAULT_QUESTION_COUNT;
}
