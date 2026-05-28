export const MAGIC_BRACELETS_MODE_ID = "magic-bracelets";

export const MAGIC_BRACELETS_VARIANTS = Object.freeze([
  "groups",
  "total-mystery",
  "missing-lot"
]);

export const MAGIC_BRACELETS_QUESTION_MODES = Object.freeze({
  groups: "bracelets-groups",
  "total-mystery": "bracelets-total-mystery",
  "missing-lot": "bracelets-missing-lot"
});

export const MAGIC_BRACELETS_CONFIG = Object.freeze({
  questionCount: 8,
  xpBonus: 3,
  choicesCount: 4
});

export const BRACELET_CHARMS = Object.freeze([
  "Étoile rose",
  "Ruban lune",
  "Cœur nacré",
  "Perle arc-en-ciel",
  "Mini cristal",
  "Breloque soleil"
]);

export const BRACELET_SUCCESS_MESSAGES = Object.freeze([
  "Bracelet parfait !",
  "Ça scintille !",
  "Commande magique réussie !",
  "Les perles sont pile au bon nombre !"
]);

export const BRACELET_HELP_MESSAGES = Object.freeze([
  "Presque ! Regarde combien de perles va sur chaque bracelet.",
  "On ajuste doucement l'atelier.",
  "Observe les bracelets : chaque groupe doit avoir la même taille.",
  "La cliente attend le même nombre de perles sur chaque bracelet."
]);
