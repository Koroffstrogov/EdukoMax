import {
  FACTORS,
  INITIAL_UNLOCKED_TABLES,
  TABLES,
  getFactById,
  getFactId,
  getFactsForTable,
  isValidTable
} from "./multiplication-data.js";
import { calculateFactPriority } from "./mastery-engine.js";

export const QUESTION_MODES = Object.freeze({
  directAnswer: "direct-answer",
  missingFactor: "missing-factor",
  multipleChoice: "multiple-choice",
  visualGroups: "visual-groups"
});

export function generateMultiplicationQuestion(progress, options = {}) {
  const mode = normalizeMode(options.mode);
  const fact = options.factId
    ? getFactById(options.factId)
    : choosePriorityMultiplication(progress, options);

  if (!fact) {
    throw new Error("Unable to generate a multiplication question.");
  }

  return buildQuestion(mode, fact);
}

export function choosePriorityMultiplication(progress, options = {}) {
  const candidateFacts = getCandidateFacts(progress, options);
  const totalAttempts = getTotalAttempts(progress);
  const now = new Date();

  return candidateFacts
    .map((fact) => ({
      fact,
      score: calculateFactPriority(progress?.facts?.[fact.id], now),
      tie: getStableTieScore(fact.id, totalAttempts)
    }))
    .sort((first, second) => {
      if (second.score !== first.score) {
        return second.score - first.score;
      }

      return second.tie - first.tie;
    })[0].fact;
}

export function generateWrongAnswers(table, factor, count = 3) {
  const correctAnswer = table * factor;
  const rawAnswers = [
    table * Math.max(2, factor - 1),
    table * Math.min(10, factor + 1),
    Math.max(2, table - 1) * factor,
    Math.min(10, table + 1) * factor,
    correctAnswer - table,
    correctAnswer + table,
    correctAnswer - factor,
    correctAnswer + factor,
    correctAnswer + 10,
    correctAnswer - 10
  ];

  const cleanAnswers = rawAnswers
    .filter((answer) => Number.isInteger(answer) && answer > 0)
    .filter((answer) => answer !== correctAnswer);

  return uniqueNumbers(cleanAnswers)
    .sort((first, second) => {
      const distance = Math.abs(first - correctAnswer) - Math.abs(second - correctAnswer);
      return distance === 0 ? first - second : distance;
    })
    .concat(createFallbackAnswers(correctAnswer))
    .filter((answer, index, list) => list.indexOf(answer) === index)
    .slice(0, count);
}

function buildQuestion(mode, fact) {
  if (mode === QUESTION_MODES.missingFactor) {
    return buildMissingFactorQuestion(fact);
  }

  if (mode === QUESTION_MODES.multipleChoice) {
    return buildMultipleChoiceQuestion(fact);
  }

  if (mode === QUESTION_MODES.visualGroups) {
    return buildVisualGroupsQuestion(fact);
  }

  return buildDirectAnswerQuestion(fact);
}

function buildDirectAnswerQuestion(fact) {
  return createBaseQuestion(fact, QUESTION_MODES.directAnswer, {
    prompt: `${fact.table} x ${fact.factor} = ?`,
    correctAnswer: fact.product,
    answerType: "number"
  });
}

function buildMissingFactorQuestion(fact) {
  return createBaseQuestion(fact, QUESTION_MODES.missingFactor, {
    prompt: `${fact.table} x ? = ${fact.product}`,
    correctAnswer: fact.factor,
    answerType: "factor",
    missingPart: "factor"
  });
}

function buildMultipleChoiceQuestion(fact) {
  const wrongAnswers = generateWrongAnswers(fact.table, fact.factor, 3);
  const choiceValues = deterministicShuffle(
    [fact.product, ...wrongAnswers],
    `${fact.id}-${QUESTION_MODES.multipleChoice}`
  );

  return createBaseQuestion(fact, QUESTION_MODES.multipleChoice, {
    prompt: `${fact.table} x ${fact.factor} = ?`,
    correctAnswer: fact.product,
    answerType: "choice",
    choices: choiceValues.map((value) => ({
      value,
      label: String(value),
      isCorrect: value === fact.product
    }))
  });
}

function buildVisualGroupsQuestion(fact) {
  const groups = Array.from({ length: fact.factor }, (_, index) => ({
    groupNumber: index + 1,
    itemCount: fact.table
  }));

  return createBaseQuestion(fact, QUESTION_MODES.visualGroups, {
    prompt: `${fact.factor} groupes de ${fact.table}, cela fait combien ?`,
    correctAnswer: fact.product,
    answerType: "number",
    visualGroups: groups
  });
}

function createBaseQuestion(fact, mode, details) {
  return {
    id: `${mode}-${fact.id}`,
    mode,
    factId: fact.id,
    table: fact.table,
    factor: fact.factor,
    product: fact.product,
    ...details
  };
}

function getCandidateFacts(progress, options) {
  const tables = getCandidateTables(progress, options);
  const facts = tables.flatMap((table) => getFactsForTable(table));

  return facts.length > 0 ? facts : INITIAL_UNLOCKED_TABLES.flatMap(getFactsForTable);
}

function getCandidateTables(progress, options) {
  if (isValidTable(options.table)) {
    return [Number(options.table)];
  }

  if (Array.isArray(options.tables)) {
    const optionTables = options.tables.map(Number).filter(isValidTable);

    if (optionTables.length > 0) {
      return TABLES.filter((table) => optionTables.includes(table));
    }
  }

  const unlockedTables = Array.isArray(progress?.unlockedTables)
    ? progress.unlockedTables.map(Number).filter(isValidTable)
    : [];

  return unlockedTables.length > 0 ? unlockedTables : [...INITIAL_UNLOCKED_TABLES];
}

function normalizeMode(mode) {
  return Object.values(QUESTION_MODES).includes(mode)
    ? mode
    : QUESTION_MODES.directAnswer;
}

function getTotalAttempts(progress) {
  if (!progress?.facts || typeof progress.facts !== "object") {
    return 0;
  }

  return Object.values(progress.facts).reduce((total, fact) => {
    return total + (Number.isFinite(fact?.attempts) ? fact.attempts : 0);
  }, 0);
}

function deterministicShuffle(values, seedText) {
  return [...values].sort((first, second) => {
    return getStableTieScore(`${seedText}-${first}`, 0) -
      getStableTieScore(`${seedText}-${second}`, 0);
  });
}

function getStableTieScore(text, offset) {
  const seed = `${text}:${offset % FACTORS.length}`;
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 1009;
  }

  return hash;
}

function uniqueNumbers(values) {
  return values.filter((value, index, list) => list.indexOf(value) === index);
}

function createFallbackAnswers(correctAnswer) {
  return [correctAnswer + 1, correctAnswer - 1, correctAnswer + 2, correctAnswer + 5]
    .filter((answer) => answer > 0 && answer !== correctAnswer);
}
