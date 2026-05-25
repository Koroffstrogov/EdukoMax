import { getShopSummary } from "../reward-engine.js";
import { getAvailableThemes } from "../theme-manager.js";

export function renderSettingsView(state) {
  const shop = getShopSummary(state.save);
  const themes = shop.themes.map((theme) => ({
    ...theme,
    swatch: getThemeSwatch(theme.id)
  }));

  return `
    <section class="settings-grid" aria-labelledby="settings-title">
      <div class="panel">
        <p class="eyebrow">Ambiance</p>
        <h1 id="settings-title">Boutique des thèmes</h1>
        <p>
          Débloque une ambiance avec tes pièces, puis active-la pour la prochaine
          session.
        </p>
        <div class="theme-grid">
          ${themes.map((theme) => renderThemeCard(theme, state.save.settings.theme)).join("")}
        </div>
      </div>
      <aside class="panel" aria-labelledby="wallet-title">
        <p class="eyebrow">Porte-pièces</p>
        <h2 id="wallet-title">🪙 ${shop.coins}</h2>
        <ul class="status-list">
          <li><span>Bonnes réponses</span><strong>${shop.totalCorrect}</strong></li>
          <li><span>Thèmes possédés</span><strong>${countOwned(themes)}</strong></li>
          <li><span>Actif</span><strong>${getThemeLabel(state.save.settings.theme)}</strong></li>
        </ul>
      </aside>
    </section>
  `;
}

function renderThemeCard(theme, activeTheme) {
  const activeClass = theme.id === activeTheme ? " is-active" : "";
  const pressed = theme.id === activeTheme ? "true" : "false";

  return `
    <article class="theme-button${activeClass}">
      <span
        class="theme-swatch"
        aria-hidden="true"
        style="--swatch-a: ${theme.swatch[0]}; --swatch-b: ${theme.swatch[1]}; --swatch-c: ${theme.swatch[2]};"
      ></span>
      <strong>${theme.label}</strong>
      <span>${theme.description}</span>
      ${renderThemeAction(theme, pressed)}
    </article>
  `;
}

function renderThemeAction(theme, pressed) {
  if (theme.isOwned) {
    return `
      <button
        class="button button-primary"
        type="button"
        data-theme="${theme.id}"
        aria-pressed="${pressed}"
      >
        ${pressed === "true" ? "Actif" : "Utiliser"}
      </button>
    `;
  }

  if (theme.canBuy) {
    return `
      <button
        class="button button-primary"
        type="button"
        data-buy-type="theme"
        data-buy-id="${theme.id}"
      >
        Acheter ${theme.cost}
      </button>
    `;
  }

  return `
    <button class="button button-secondary" type="button" disabled>
      ${theme.cost} pièces
    </button>
  `;
}

function getThemeSwatch(themeId) {
  return getAvailableThemes().find((theme) => theme.id === themeId)?.swatch ||
    ["#2563eb", "#14b8a6", "#facc15"];
}

function getThemeLabel(themeId) {
  return getAvailableThemes().find((theme) => theme.id === themeId)?.label ||
    "Soleil";
}

function countOwned(items) {
  return items.filter((item) => item.isOwned).length;
}
