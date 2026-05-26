import { getShopSummary } from "../reward-engine.js";
import { getThemeById } from "../theme-data.js?v=settings-guard-20260525";

export function renderSettingsView(state) {
  const shop = getShopSummary(state.save);

  return `
    <section class="settings-grid" aria-labelledby="settings-title">
      <div class="panel theme-shop-panel">
        <p class="eyebrow">Boutique des univers</p>
        <h1 id="settings-title">Choisis ton ambiance</h1>
        <p>
          Gagne des pièces, débloque un univers, puis transforme toute l'appli.
        </p>
        ${state.shopMessage ? `<div class="shop-message" role="status">${state.shopMessage}</div>` : ""}
        <div class="theme-grid theme-grid--shop">
          ${shop.themes.map((theme) => renderThemeCard(theme, state.save.settings.theme, shop.coins)).join("")}
        </div>
      </div>
      <aside class="panel theme-wallet" aria-labelledby="wallet-title">
        <p class="eyebrow">Porte-pièces</p>
        <h2 id="wallet-title">🪙 ${shop.coins}</h2>
        <ul class="status-list">
          <li><span>Univers possédés</span><strong>${countOwned(shop.themes)}</strong></li>
          <li><span>Actif</span><strong>${getThemeLabel(shop.themes, state.save.settings.theme)}</strong></li>
          <li><span>Bonnes réponses</span><strong>${shop.totalCorrect}</strong></li>
        </ul>
      </aside>
    </section>
  `;
}

function renderThemeCard(theme, activeTheme, coins) {
  const activeClass = theme.id === activeTheme ? " is-active" : "";
  const lockedClass = theme.isOwned ? "" : " is-locked";
  const visual = getThemeVisual(theme);
  const colors = visual.previewColors;

  return `
    <article
      class="theme-card${activeClass}${lockedClass}"
      style="--swatch-a: ${colors[0]}; --swatch-b: ${colors[1]}; --swatch-c: ${colors[2]}; --swatch-d: ${colors[3] || colors[0]};"
    >
      <div class="theme-preview" aria-hidden="true">
        <span>${visual.emoji}</span>
        <i></i><i></i><i></i>
      </div>
      <div>
        <h3>${visual.emoji} ${visual.label}</h3>
        <p>${visual.description}</p>
      </div>
      ${renderThemePrice(theme, coins)}
      ${renderThemeAction(theme, activeTheme, coins)}
    </article>
  `;
}

function renderThemePrice(theme, coins) {
  const price = getThemePrice(theme);

  if (theme.isOwned && price === 0) {
    return '<span class="tag">Gratuit · Possédé</span>';
  }

  if (theme.isOwned) {
    return '<span class="tag">Possédé</span>';
  }

  const missing = Math.max(0, price - coins);
  return `
    <span class="tag">${price} 🪙</span>
    ${missing > 0 ? `<p class="progress-line">Il te manque ${missing} 🪙</p>` : ""}
  `;
}

function renderThemeAction(theme, activeTheme, coins) {
  if (theme.isOwned) {
    const pressed = theme.id === activeTheme ? "true" : "false";
    return `
      <button class="button button-primary" type="button" data-theme="${theme.id}" aria-pressed="${pressed}">
        ${pressed === "true" ? "Actif" : "Utiliser"}
      </button>
    `;
  }

  if (coins >= getThemePrice(theme)) {
    return `
      <button class="button button-primary" type="button" data-buy-type="theme" data-buy-id="${theme.id}">
        Acheter
      </button>
    `;
  }

  return '<button class="button button-secondary" type="button" disabled>Gagner des pièces</button>';
}

function getThemeLabel(themes, themeId) {
  return themes.find((theme) => theme.id === themeId)?.label || "Kawaii Pop Club";
}

function getThemeVisual(theme) {
  const fallback = getThemeById(theme.id);
  return {
    emoji: theme.emoji || fallback.emoji,
    label: theme.label || theme.name || fallback.label,
    description: theme.description || fallback.description,
    previewColors: getThemeColors(theme.previewColors || theme.swatch || fallback.previewColors)
  };
}

function getThemeColors(colors) {
  return Array.isArray(colors) && colors.length >= 3
    ? colors
    : ["#ff8fd6", "#b99cff", "#fff2a8", "#9fe7ff"];
}

function getThemePrice(theme) {
  return Number.isFinite(theme.price) ? theme.price : Number(theme.cost) || 0;
}

function countOwned(items) {
  return items.filter((item) => item.isOwned).length;
}
