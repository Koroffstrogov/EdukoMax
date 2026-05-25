import { createDefaultSave, normalizeSave } from "./save-data.js";

const SAVE_KEY = "edukomax.save.v1";

export { createDefaultSave };

export function loadSave() {
  const rawSave = readRawSave();

  if (rawSave === null) {
    return createDefaultSave();
  }

  const parsedSave = parseSave(rawSave);
  return parsedSave === null ? createDefaultSave() : normalizeSave(parsedSave);
}

export function saveGame(saveData) {
  const normalizedSave = normalizeSave(saveData);

  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(normalizedSave));
    return true;
  } catch {
    return false;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
    return true;
  } catch {
    return false;
  }
}

function readRawSave() {
  try {
    return localStorage.getItem(SAVE_KEY);
  } catch {
    return null;
  }
}

function parseSave(rawSave) {
  try {
    return JSON.parse(rawSave);
  } catch {
    return null;
  }
}
