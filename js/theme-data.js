export const THEME_DEFINITIONS = Object.freeze([
  theme("kawaii-pop", "Kawaii Pop Club", "Un monde pastel avec des stickers, des étoiles et des animaux trop mignons.", "🌈", 0, true, ["#ff8fd6", "#b99cff", "#fff2a8", "#9fe7ff"], "coin-pop", ["Trop chouette !", "Ça brille !", "Combo kawaii !"]),
  theme("cosmic-cats", "Chats Cosmiques", "Des chats astronautes, des planètes et des étoiles.", "🐱", 0, true, ["#25316d", "#8b5cf6", "#ff70c8", "#fde047"], "coin-star", ["Miaou magique !", "Étoile trouvée !", "Mission réussie !"]),
  theme("kpop-studio", "Studio K-Pop", "Monte sur scène avec des mascottes chanteuses et des combos brillants.", "🎤", 120, false, ["#ff4fd8", "#7c3aed", "#38bdf8", "#fde047"], "coin-spotlight", ["Combo Show !", "La scène est à toi !", "Encore une note parfaite !"]),
  theme("neon-unicorns", "Licornes Néon Academy", "Une école magique avec licornes, cristaux et arcs-en-ciel.", "🦄", 140, false, ["#c4b5fd", "#211647", "#ff5cbb", "#67e8f9"], "coin-rainbow", ["Magie réussie !", "Cristal activé !", "Arc-en-ciel de calculs !"]),
  theme("squishy-planet", "Squishy Planet", "Une planète moelleuse avec des créatures rigolotes et rebondissantes.", "🩷", 160, false, ["#ffb3d9", "#b8f7d4", "#ffe4a3", "#bde0ff"], "coin-bounce", ["Pop ! Bonne réponse !", "Ça rebondit bien !", "Squishy combo !"]),
  theme("magic-charms", "Bijoux & Charms Magiques", "Collectionne des breloques, des rubans et des petits trésors brillants.", "💎", 180, false, ["#f9a8d4", "#38d5c8", "#f8d66d", "#ffffff"], "coin-sparkle", ["Nouveau petit trésor !", "Breloque brillante !", "Ça scintille !"]),
  theme("sticker-workshop", "Atelier Paillettes", "Un carnet créatif rempli de stickers, feutres, gommettes et paillettes.", "🎨", 180, false, ["#ff7ab6", "#60a5fa", "#facc15", "#34d399"], "coin-sticker", ["Tampon Bravo !", "Sticker gagné !", "Création réussie !"]),
  theme("magic-bakery", "Pâtisserie Magique", "Des cupcakes, des fraises et des gâteaux qui récompensent tes calculs.", "🧁", 200, false, ["#ffe8c7", "#ff7b9c", "#b8e6c9", "#b08968"], "coin-cookie", ["Miam, bonne réponse !", "Cupcake combo !", "Recette réussie !"])
]);

export const LEGACY_THEME_MAP = Object.freeze({
  sunny: "kawaii-pop",
  ocean: "cosmic-cats",
  berry: "magic-bakery"
});

export const DEFAULT_THEME_ID = "kawaii-pop";
export const DEFAULT_OWNED_THEME_IDS = Object.freeze(
  THEME_DEFINITIONS.filter((item) => item.isDefault).map((item) => item.id)
);

export function getAvailableThemes() {
  return THEME_DEFINITIONS.map(copyTheme);
}

export function getThemeShopItems() {
  return THEME_DEFINITIONS.map((item) => ({
    ...copyTheme(item),
    label: item.name,
    cost: item.price
  }));
}

export function getThemeById(themeId) {
  const safeId = normalizeThemeId(themeId);
  return copyTheme(THEME_DEFINITIONS.find((item) => item.id === safeId));
}

export function isKnownTheme(themeId) {
  const safeId = LEGACY_THEME_MAP[themeId] || themeId;
  return THEME_DEFINITIONS.some((item) => item.id === safeId);
}

export function normalizeThemeId(themeId) {
  const mappedId = LEGACY_THEME_MAP[themeId] || themeId;
  return isKnownTheme(mappedId) ? mappedId : DEFAULT_THEME_ID;
}

export function getFallbackTheme() {
  return DEFAULT_THEME_ID;
}

export function getThemeFeedbackTone(themeId) {
  return getThemeById(themeId).feedbackTone;
}

function theme(id, name, description, emoji, price, isDefault, previewColors, coinEffectClass, feedbackTone) {
  return Object.freeze({
    id,
    name,
    label: name,
    description,
    emoji,
    price,
    cost: price,
    isDefault,
    cssClass: id,
    previewColors: Object.freeze(previewColors),
    swatch: Object.freeze(previewColors),
    coinEffectClass,
    feedbackTone: Object.freeze(feedbackTone)
  });
}

function copyTheme(themeItem) {
  return {
    ...themeItem,
    previewColors: [...themeItem.previewColors],
    swatch: [...themeItem.swatch],
    feedbackTone: [...themeItem.feedbackTone]
  };
}
