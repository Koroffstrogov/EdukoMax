export const TABLES = Object.freeze([2, 3, 4, 5, 6, 7, 8, 9, 10]);
export const FACTORS = Object.freeze([2, 3, 4, 5, 6, 7, 8, 9, 10]);
export const INITIAL_UNLOCKED_TABLES = Object.freeze([2, 5, 10]);
export const TABLE_UNLOCK_ORDER = Object.freeze([2, 5, 10, 3, 4, 6, 8, 9, 7]);
export const MIXED_MODE_ID = "mixed";

export const TABLE_METADATA = Object.freeze({
  2: freezeMetadata(2, 1, 1, "Île des doubles", "Doubler pour démarrer vite."),
  3: freezeMetadata(3, 2, 4, "Jardin des trois", "Des petits pas réguliers."),
  4: freezeMetadata(4, 3, 5, "Atelier quatre", "Deux doubles à assembler."),
  5: freezeMetadata(5, 1, 2, "Fusées de cinq", "Compter de 5 en 5."),
  6: freezeMetadata(6, 4, 6, "Roue de six", "Mélanger doubles et table de 3."),
  7: freezeMetadata(7, 5, 9, "Labyrinthe sept", "La table défi de fin."),
  8: freezeMetadata(8, 4, 7, "Ville huit", "Doubler, puis doubler encore."),
  9: freezeMetadata(9, 4, 8, "Étoiles neuf", "Presque la table de 10."),
  10: freezeMetadata(10, 1, 3, "Planète dix", "Ajouter un zéro mentalement.")
});

export const MULTIPLICATION_FACTS = Object.freeze(
  TABLES.flatMap((table) =>
    FACTORS.map((factor) =>
      Object.freeze({
        id: getFactId(table, factor),
        table,
        factor,
        product: table * factor
      })
    )
  )
);

export function getFactId(table, factor) {
  return `${table}x${factor}`;
}

export function parseFactId(factId) {
  const match = /^([2-9]|10)x([2-9]|10)$/.exec(String(factId));

  if (!match) {
    return null;
  }

  return {
    table: Number(match[1]),
    factor: Number(match[2])
  };
}

export function getFactById(factId) {
  const parsedFact = parseFactId(factId);

  if (!parsedFact) {
    return null;
  }

  return {
    id: getFactId(parsedFact.table, parsedFact.factor),
    table: parsedFact.table,
    factor: parsedFact.factor,
    product: parsedFact.table * parsedFact.factor
  };
}

export function getFactsForTable(table) {
  if (!isValidTable(table)) {
    return [];
  }

  return FACTORS.map((factor) => ({
    id: getFactId(table, factor),
    table,
    factor,
    product: table * factor
  }));
}

export function isValidTable(table) {
  return TABLES.includes(Number(table));
}

export function isValidFactor(factor) {
  return FACTORS.includes(Number(factor));
}

export function getTableMetadata(table) {
  return TABLE_METADATA[table] || null;
}

function freezeMetadata(table, difficulty, unlockOrder, worldName, description) {
  return Object.freeze({
    table,
    difficulty,
    unlockOrder,
    worldName,
    description
  });
}
