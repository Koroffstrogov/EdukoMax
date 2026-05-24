const THEMES = Object.freeze([
  {
    id: "sunny",
    label: "Soleil",
    description: "Clair, chaud et joyeux.",
    swatch: ["#2563eb", "#14b8a6", "#facc15"]
  },
  {
    id: "ocean",
    label: "Océan",
    description: "Frais, calme et concentré.",
    swatch: ["#0f76c9", "#10b981", "#fde047"]
  },
  {
    id: "berry",
    label: "Fruits",
    description: "Vif, doux et pétillant.",
    swatch: ["#c026d3", "#22c55e", "#f97316"]
  }
]);

export function getAvailableThemes() {
  return THEMES.map((theme) => ({
    ...theme,
    swatch: [...theme.swatch]
  }));
}

export function applyTheme(themeName) {
  const safeTheme = isKnownTheme(themeName) ? themeName : getFallbackTheme();
  document.documentElement.dataset.theme = safeTheme;
  return safeTheme;
}

export function isKnownTheme(themeName) {
  return THEMES.some((theme) => theme.id === themeName);
}

export function getFallbackTheme() {
  return THEMES[0].id;
}
