import { PROFILE_ICONS } from "../save-data.js";
import { getAvailableThemes } from "../theme-manager.js";

export function renderProfileControls(state) {
  const activeProfile = state.save.profile;
  const expanded = state.profilePanelOpen ? "true" : "false";

  return `
    <div class="profile-area">
      <button
        class="profile-trigger"
        type="button"
        data-profile-toggle
        aria-label="Gérer les profils"
        aria-expanded="${expanded}"
      >
        <span aria-hidden="true">${escapeHtml(activeProfile.icon)}</span>
      </button>
      ${state.profilePanelOpen ? renderProfilePanel(state) : ""}
    </div>
  `;
}

function renderProfilePanel(state) {
  const profiles = state.save.profiles || [];
  const activeId = state.save.activeProfileId;

  return `
    <section class="profile-popover" aria-label="Profils">
      <div class="profile-section">
        <p class="eyebrow">Profils</p>
        <div class="profile-list">
          ${profiles.map((profile) => renderProfileRow(profile, activeId)).join("")}
        </div>
      </div>
      <div class="profile-section">
        <h2>Mon profil</h2>
        ${renderProfileForm("update", state.save.profile)}
      </div>
      <div class="profile-create-box">
        <button class="button button-secondary" type="button" data-profile-create-toggle>
          Nouveau profil
        </button>
        <div data-profile-create-panel hidden>
          ${renderProfileForm("create")}
        </div>
      </div>
    </section>
  `;
}

function renderProfileRow(profile, activeId) {
  const isActive = profile.id === activeId;
  const activeClass = isActive ? " is-active" : "";

  return `
    <article class="profile-row${activeClass}">
      <button
        class="profile-select"
        type="button"
        data-profile-select="${escapeAttribute(profile.id)}"
        aria-current="${isActive ? "true" : "false"}"
      >
        <span aria-hidden="true">${escapeHtml(profile.icon)}</span>
        <strong>${escapeHtml(profile.name)}</strong>
        <small>🪙 ${profile.rewards?.coins || 0}</small>
      </button>
      <button
        class="profile-delete"
        type="button"
        data-profile-delete="${escapeAttribute(profile.id)}"
        aria-label="Supprimer ${escapeAttribute(profile.name)}"
      >
        ×
      </button>
    </article>
  `;
}

function renderProfileForm(mode, profile = {}) {
  const isUpdate = mode === "update";
  const formAttr = isUpdate ? "data-profile-update-form" : "data-profile-create-form";
  const submitLabel = isUpdate ? "Enregistrer" : "Créer";
  const name = isUpdate ? profile.name : "";
  const icon = isUpdate ? profile.icon : PROFILE_ICONS[0];
  const favoriteTheme = isUpdate ? profile.favoriteTheme : "sunny";

  return `
    <form class="profile-form" ${formAttr}>
      <label>
        <span>Pseudo</span>
        <input
          name="name"
          type="text"
          maxlength="18"
          value="${escapeAttribute(name)}"
          placeholder="Explorateur"
          required
        >
      </label>
      <label>
        <span>Icône</span>
        <select name="icon" ${isUpdate ? "data-profile-live" : ""}>
          ${PROFILE_ICONS.map((item) => option(item, item, icon)).join("")}
        </select>
      </label>
      <label>
        <span>Thème favori</span>
        <select name="favoriteTheme" ${isUpdate ? "data-profile-live" : ""}>
          ${getAvailableThemes()
            .map((theme) => option(theme.id, theme.label, favoriteTheme))
            .join("")}
        </select>
      </label>
      <button class="button button-primary" type="submit">${submitLabel}</button>
    </form>
  `;
}

function option(value, label, selectedValue) {
  const selected = value === selectedValue ? " selected" : "";
  return `<option value="${escapeAttribute(value)}"${selected}>${escapeHtml(label)}</option>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
