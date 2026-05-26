import {
  getAvailableThemes,
  getFallbackTheme,
  isKnownTheme,
  normalizeThemeId
} from "./theme-data.js";

export { getAvailableThemes, getFallbackTheme, isKnownTheme };

export function applyTheme(themeName) {
  const safeTheme = normalizeThemeId(themeName);
  document.documentElement.removeAttribute("data-theme");
  document.body.dataset.theme = safeTheme;
  return safeTheme;
}
