import {
  INITIAL_UNLOCKED_TABLES,
  TABLE_UNLOCK_ORDER,
  isValidTable
} from "./multiplication-data.js";

export function normalizeSelectedTables(tables, fallbackTables = INITIAL_UNLOCKED_TABLES) {
  const source = Array.isArray(tables) ? tables : fallbackTables;
  const cleanTables = source.map(Number).filter(isValidTable);
  const orderedTables = TABLE_UNLOCK_ORDER.filter((table) => cleanTables.includes(table));

  return orderedTables.length > 0 ? orderedTables : [2];
}

export function getSelectedTables(progress) {
  return normalizeSelectedTables(
    progress?.selectedTables,
    progress?.unlockedTables || INITIAL_UNLOCKED_TABLES
  );
}

export function isTableSelected(progress, table) {
  return getSelectedTables(progress).includes(Number(table));
}

export function toggleSelectedTable(progress, table) {
  const selectedTables = getSelectedTables(progress);
  const numberTable = Number(table);

  if (!isValidTable(numberTable)) {
    return { ...progress, selectedTables };
  }

  const isSelected = selectedTables.includes(numberTable);

  if (isSelected && selectedTables.length === 1) {
    return { ...progress, selectedTables };
  }

  const nextTables = isSelected
    ? selectedTables.filter((selectedTable) => selectedTable !== numberTable)
    : [...selectedTables, numberTable];

  return {
    ...progress,
    selectedTables: normalizeSelectedTables(nextTables, [2])
  };
}

export function calculateTableSelectionBonus(progress) {
  return Math.max(0, getSelectedTables(progress).length - 1) * 2;
}
