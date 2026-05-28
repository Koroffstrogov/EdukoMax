import {
  FACTORS,
  INITIAL_UNLOCKED_TABLES,
  getFactById,
  getFactId,
  getFactsForTable,
  isValidTable
} from "./multiplication-data.js";
import { calculateFactPriority } from "./mastery-engine.js";
import { getSelectedTables } from "./table-selection.js";

export const QUESTION_MODES = Object.freeze({
  directAnswer: "direct-answer",
  missingFactor: "missing-factor",
  multipleChoice: "multiple-choice",
  multipleChoice8: "multiple-choice-8",
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

  return buildQuestion(mode, fact, normalizeVariant(options.choiceVariant));
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

export function generateWrongAnswers(table, factor, count = 3, variant = 0) {
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

  const candidates = uniqueNumbers(cleanAnswers)
    .sort((first, second) => {
      const distance = Math.abs(first - correctAnswer) - Math.abs(second - correctAnswer);
      return distance === 0 ? first - second : distance;
    })
    .concat(createFallbackAnswers(correctAnswer))
    .filter((answer, index, list) => list.indexOf(answer) === index);

  return rotateAnswers(candidates, variant)
    .slice(0, count);
}

function buildQuestion(mode, fact, choiceVariant) {
  if (mode === QUESTION_MODES.missingFactor) {
    return buildMissingFactorQuestion(fact);
  }

  if (mode === QUESTION_MODES.multipleChoice || mode === QUESTION_MODES.multipleChoice8) {
    return buildMultipleChoiceQuestion(fact, mode, choiceVariant);
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

function buildMultipleChoiceQuestion(fact, mode, choiceVariant) {
  const choiceCount = mode === QUESTION_MODES.multipleChoice8 ? 8 : 4;
  const wrongAnswers = generateWrongAnswers(
    fact.table,
    fact.factor,
    choiceCount - 1,
    choiceVariant
  );
  const choiceValues = deterministicShuffle(
    [fact.product, ...wrongAnswers],
    `${fact.id}-${mode}-${choiceVariant}`
  );

  return createBaseQuestion(fact, mode, {
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
  const selectedTables = getSelectedTables(progress);
  const requestedTable = Number(options.table);

  if (isValidTable(requestedTable) && selectedTables.includes(requestedTable)) {
    return [requestedTable];
  }

  if (Array.isArray(options.tables)) {
    const optionTables = options.tables.map(Number).filter(isValidTable);
    const playableTables = selectedTables.filter((table) => optionTables.includes(table));

    if (playableTables.length > 0) {
      return playableTables;
    }
  }

  return selectedTables;
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

function rotateAnswers(values, variant) {
  if (values.length === 0) {
    return values;
  }

  const offset = Math.abs(variant) % values.length;
  return [...values.slice(offset), ...values.slice(0, offset)];
}

function normalizeVariant(value) {
  return Number.isInteger(value) && value >= 0 ? value : 0;
}

function createFallbackAnswers(correctAnswer) {
  return [
    correctAnswer + 1,
    correctAnswer - 1,
    correctAnswer + 2,
    correctAnswer - 2,
    correctAnswer + 3,
    correctAnswer - 3,
    correctAnswer + 5,
    correctAnswer + 8,
    correctAnswer + 12
  ]
    .filter((answer) => answer > 0 && answer !== correctAnswer);
}
