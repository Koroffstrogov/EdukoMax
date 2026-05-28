import {
  BRACELET_CHARMS,
  BRACELET_HELP_MESSAGES,
  BRACELET_SUCCESS_MESSAGES,
  MAGIC_BRACELETS_QUESTION_MODES,
  MAGIC_BRACELETS_VARIANTS
} from "./magic-bracelets-data.js";

export function createMagicBraceletsRound(fact, index = 0) {
  const variant = MAGIC_BRACELETS_VARIANTS[index % MAGIC_BRACELETS_VARIANTS.length];
  const base = createBaseRound(fact, index, variant);

  if (variant === "total-mystery") {
    return createTotalMysteryRound(base);
  }

  if (variant === "missing-lot") {
    return createMissingLotRound(base);
  }

  return createGroupsRound(base);
}

export function generateBraceletChoices(round) {
  const candidates = round.variant === "total-mystery"
    ? getTotalChoices(round)
    : getLotChoices(round);
  const distractors = rotateValues(
    uniquePositiveNumbers(candidates).filter((value) => value !== round.correctAnswer),
    round.index
  ).slice(0, 3);
  const choices = rotateValues([round.correctAnswer, ...distractors], round.index);

  return choices.map((value) => ({
    value,
    label: getChoiceLabel(round, value),
    isCorrect: value === round.correctAnswer
  }));
}

export function createMagicBraceletsQuestion(fact, index = 0) {
  const round = createMagicBraceletsRound(fact, index);
  const choices = generateBraceletChoices(round);

  return {
    id: `magic-bracelets-${index}-${fact.id}`,
    mode: MAGIC_BRACELETS_QUESTION_MODES[round.variant],
    answerType: "bracelet-choice",
    factId: fact.id,
    table: fact.table,
    factor: fact.factor,
    product: fact.product,
    prompt: round.storyText,
    correctAnswer: round.correctAnswer,
    choices,
    round: { ...round, choices: choices.map((choice) => choice.value) }
  };
}

export function createMagicBraceletsFeedback(question, answerDetails = {}, isCorrect = false) {
  const messageIndex = question.round.index % BRACELET_SUCCESS_MESSAGES.length;
  const helpIndex = question.round.index % BRACELET_HELP_MESSAGES.length;

  return {
    isCorrect,
    tone: isCorrect ? "success" : "help",
    title: isCorrect ? BRACELET_SUCCESS_MESSAGES[messageIndex] : "On ajuste le bracelet",
    message: isCorrect ? "Les perles brillent dans l'atelier." : BRACELET_HELP_MESSAGES[helpIndex],
    explanation: isCorrect ? "" : question.round.hintText,
    autoAdvance: isCorrect,
    correctAnswer: question.correctAnswer,
    selectedAnswer: Number(answerDetails.value),
    charm: getCharmForIndex(question.round.index)
  };
}

export function summarizeMagicBraceletsSession(session) {
  const charm = getCharmForIndex(session.correctCount || 0);
  return `Atelier terminé : ${session.correctCount} commandes réussies · Charm ${charm}`;
}

export function isMagicBraceletsQuestion(question) {
  return question?.answerType === "bracelet-choice";
}

function createBaseRound(fact, index, variant) {
  return {
    id: `bracelet-round-${String(index + 1).padStart(3, "0")}`,
    index,
    variant,
    factorA: fact.table,
    factorB: fact.factor,
    braceletCount: fact.table,
    pearlsPerBracelet: fact.factor,
    expectedAnswer: fact.product,
    expectedLotSize: fact.factor
  };
}

function createGroupsRound(round) {
  return {
    ...round,
    correctAnswer: round.expectedLotSize,
    storyText: `La cliente veut ${round.braceletCount} bracelets avec ${round.pearlsPerBracelet} perles chacun.`,
    successText: `${round.braceletCount} bracelets de ${round.pearlsPerBracelet}, ça fait ${round.expectedAnswer} perles.`,
    hintText: `Astuce : ajoute ${round.pearlsPerBracelet} perles sur chaque bracelet.`
  };
}

function createTotalMysteryRound(round) {
  return {
    ...round,
    correctAnswer: round.expectedAnswer,
    storyText: `${round.braceletCount} bracelets avec ${round.pearlsPerBracelet} perles chacun : quel coffre choisir ?`,
    successText: `${round.braceletCount} x ${round.pearlsPerBracelet} = ${round.expectedAnswer} perles.`,
    hintText: `Compte ${round.pearlsPerBracelet} perles, ${round.braceletCount} fois.`
  };
}

function createMissingLotRound(round) {
  return {
    ...round,
    correctAnswer: round.expectedLotSize,
    storyText: `Il faut ${round.expectedAnswer} perles pour ${round.braceletCount} bracelets.`,
    successText: `${round.expectedAnswer} perles partagées en ${round.braceletCount} bracelets donnent ${round.pearlsPerBracelet} perles chacun.`,
    hintText: `Cherche le lot qui répété ${round.braceletCount} fois donne ${round.expectedAnswer}.`
  };
}

function getLotChoices(round) {
  return [
    round.pearlsPerBracelet - 2,
    round.pearlsPerBracelet - 1,
    round.pearlsPerBracelet + 1,
    round.pearlsPerBracelet + 2,
    round.braceletCount,
    Math.max(2, round.expectedAnswer - round.pearlsPerBracelet)
  ];
}

function getTotalChoices(round) {
  return [
    round.expectedAnswer - round.braceletCount,
    round.expectedAnswer + round.braceletCount,
    round.expectedAnswer - round.pearlsPerBracelet,
    round.expectedAnswer + round.pearlsPerBracelet,
    round.expectedAnswer + 10
  ];
}

function getChoiceLabel(round, value) {
  if (round.variant === "total-mystery") {
    return `${value} perles`;
  }

  return `${value} par bracelet`;
}

function uniquePositiveNumbers(values) {
  return values
    .map(Number)
    .filter((value) => Number.isInteger(value) && value > 0)
    .filter((value, index, list) => list.indexOf(value) === index);
}

function rotateValues(values, index) {
  const offset = values.length > 0 ? index % values.length : 0;
  return [...values.slice(offset), ...values.slice(0, offset)];
}

function getCharmForIndex(index) {
  return BRACELET_CHARMS[Math.abs(index) % BRACELET_CHARMS.length];
}
