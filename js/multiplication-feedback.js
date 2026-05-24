export function createMultiplicationFeedback(question, answerDetails = {}) {
  const isCorrect = resolveCorrectness(question, answerDetails);

  return {
    isCorrect,
    tone: isCorrect ? "success" : "help",
    title: isCorrect ? getPositiveTitle(question) : "On regarde ensemble",
    message: isCorrect
      ? getPositiveMessage(question)
      : getHelpfulMessage(question, answerDetails),
    explanation: isCorrect ? "" : explainMultiplication(question.table, question.factor),
    autoAdvance: isCorrect,
    correctAnswer: question.correctAnswer
  };
}

export function explainMultiplication(table, factor) {
  if (table === 9 || factor === 9) {
    return explainWithNineTrick(table, factor);
  }

  if (table === 10 || factor === 10) {
    return explainWithTen(table, factor);
  }

  if (table === 5 || factor === 5) {
    return explainWithFive(table, factor);
  }

  if (table === 4 || factor === 4) {
    return explainWithDoubleDouble(table, factor);
  }

  return explainWithRepeatedAddition(table, factor);
}

export function explainWithRepeatedAddition(table, factor) {
  const product = table * factor;

  if (factor <= 6) {
    return `${table} x ${factor} = ${product} parce que ${repeatAddition(table, factor)} = ${product}.`;
  }

  return `${table} x ${factor} = ${product}: on compte ${factor} groupes de ${table}.`;
}

function explainWithNineTrick(table, factor) {
  const other = table === 9 ? factor : table;
  const product = table * factor;
  const tenProduct = other * 10;

  return `${table} x ${factor} = ${product}, comme 10 x ${other} = ${tenProduct} puis on enlève ${other}.`;
}

function explainWithTen(table, factor) {
  const other = table === 10 ? factor : table;
  const product = table * factor;

  return `${table} x ${factor} = ${product}: la table de 10 ajoute un zéro à ${other}.`;
}

function explainWithFive(table, factor) {
  const product = table * factor;

  return `${table} x ${factor} = ${product}: on peut compter de 5 en 5 ou utiliser la moitié de la table de 10.`;
}

function explainWithDoubleDouble(table, factor) {
  const other = table === 4 ? factor : table;
  const product = table * factor;

  return `${table} x ${factor} = ${product}: pour multiplier par 4, on double ${other}, puis on double encore.`;
}

function getPositiveTitle(question) {
  if (question.mode === "missing-factor") {
    return "Bien trouvé";
  }

  if (question.mode === "multiple-choice") {
    return "Bon choix";
  }

  return "Bravo";
}

function getPositiveMessage(question) {
  return `${question.table} x ${question.factor} = ${question.product}.`;
}

function getHelpfulMessage(question, answerDetails) {
  if (answerDetails.value === undefined || answerDetails.value === null) {
    return "Essaie de regarder les groupes et de compter calmement.";
  }

  return `Ta réponse ${answerDetails.value} est une bonne piste. La réponse attendue est ${question.correctAnswer}.`;
}

function resolveCorrectness(question, answerDetails) {
  if (typeof answerDetails.isCorrect === "boolean") {
    return answerDetails.isCorrect;
  }

  return Number(answerDetails.value) === Number(question.correctAnswer);
}

function repeatAddition(value, times) {
  return Array.from({ length: times }, () => value).join(" + ");
}
