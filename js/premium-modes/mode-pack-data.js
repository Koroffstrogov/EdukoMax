export const SPECIAL_MODE_PACKS = Object.freeze([
  pack("competitive-pack", "Défis Champions", "🏆", 180, "Des défis rapides pour battre les meilleurs scores.", "competitive"),
  pack("chill-pack", "Mode Détente", "🌸", 140, "Des jeux calmes, rigolos et sans pression.", "chill"),
  pack("science-pack", "Coach Mémoire", "🧠", 220, "Des révisions intelligentes pour mieux retenir.", "science")
]);

export const PREMIUM_MODES = Object.freeze([
  mode("speed-60", "Sprint 60”", "Réponds vite pendant 60 secondes.", "competitive-pack", "🏆", 60),
  mode("combo-max", "Combo Max", "Cherche ta plus longue série sans erreur.", "competitive-pack", "⚡", 20),
  mode("garden", "Jardin des Multiplications", "Chaque bonne réponse fait pousser une fleur.", "chill-pack", "🌷", 8),
  mode("mascot-snack", "Goûter de la Mascotte", "Offre des friandises avec tes réponses.", "chill-pack", "🍪", 8),
  mode("smart-review", "Révision Intelligente", "Revois les multiplications les plus utiles.", "science-pack", "📘", 10),
  mode("anti-forget", "Mission Anti-Oubli", "Réveille les multiplications anciennes.", "science-pack", "⭐", 10),
  mode("clever-mix", "Mix Malin", "Mélange les tables proches pour bien choisir.", "science-pack", "🔬", 10)
]);

export function getSpecialModePacks() {
  return SPECIAL_MODE_PACKS.map(copyItem);
}

export function getPremiumModes() {
  return PREMIUM_MODES.map(copyItem);
}

export function getPackById(packId) {
  return copyItem(SPECIAL_MODE_PACKS.find((packItem) => packItem.id === packId) || null);
}

export function getModeById(modeId) {
  return copyItem(PREMIUM_MODES.find((modeItem) => modeItem.id === modeId) || null);
}

export function getModesForPack(packId) {
  return PREMIUM_MODES.filter((modeItem) => modeItem.packId === packId).map(copyItem);
}

export function getPackForMode(modeId) {
  const modeItem = getModeById(modeId);
  return modeItem ? getPackById(modeItem.packId) : null;
}

export function isKnownPack(packId) {
  return SPECIAL_MODE_PACKS.some((packItem) => packItem.id === packId);
}

export function isKnownPremiumMode(modeId) {
  return PREMIUM_MODES.some((modeItem) => modeItem.id === modeId);
}

function pack(id, name, emoji, price, description, family) {
  return Object.freeze({ id, name, label: name, emoji, price, cost: price, description, family });
}

function mode(id, name, description, packId, emoji, questionCount) {
  return Object.freeze({ id, name, label: name, description, packId, emoji, questionCount });
}

function copyItem(item) {
  return item ? { ...item } : null;
}
