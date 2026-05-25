import {
  INITIAL_UNLOCKED_TABLES,
  TABLE_UNLOCK_ORDER,
  getFactById,
  isValidTable
} from "./multiplication-data.js";
import {
  INITIAL_OWNED_THEMES,
  normalizeOwnedThemes,
  normalizeTablePoints,
  normalizeUnlockedModes
} from "./reward-engine.js";

export const CURRENT_VERSION = 1;
export const PROFILE_ICONS = Object.freeze(["🧒", "👧", "👦", "🧑", "🦸", "🧙", "🚀", "⭐"]);

export function createDefaultSave(options = {}) {
  const now = new Date().toISOString();
  const profile = createProfileRecord(options, null, now);
  return buildRuntimeSave([profile], profile.id, now);
}

export function normalizeSave(saveData) {
  if (!isPlainObject(saveData)) {
    return createDefaultSave();
  }

  const now = new Date().toISOString();
  const profiles = normalizeProfiles(saveData, now);
  const activeId = normalizeString(saveData.activeProfileId, profiles[0].id);
  const syncedProfiles = syncRuntimeProfile(profiles, activeId, saveData, now);

  return buildRuntimeSave(
    syncedProfiles,
    syncedProfiles.some((profile) => profile.id === activeId) ? activeId : syncedProfiles[0].id,
    normalizeString(saveData.updatedAt, now)
  );
}

export function addProfile(saveData, details = {}) {
  const save = normalizeSave(saveData);
  const profile = createProfileRecord(details, null, new Date().toISOString());
  return buildRuntimeSave([...save.profiles, profile], profile.id, profile.updatedAt);
}

export function activateProfile(saveData, profileId) {
  const save = normalizeSave(saveData);
  const activeId = save.profiles.some((profile) => profile.id === profileId)
    ? profileId
    : save.activeProfileId;
  return buildRuntimeSave(save.profiles, activeId, new Date().toISOString());
}

export function removeProfile(saveData, profileId) {
  const save = normalizeSave(saveData);
  let profiles = save.profiles.filter((profile) => profile.id !== profileId);

  if (profiles.length === 0) {
    profiles = [createProfileRecord({}, null, new Date().toISOString())];
  }

  const activeId = save.activeProfileId === profileId ? profiles[0].id : save.activeProfileId;
  return buildRuntimeSave(profiles, activeId, new Date().toISOString());
}

export function updateActiveProfileDetails(saveData, details = {}) {
  const save = normalizeSave(saveData);
  const profiles = save.profiles.map((profile) => {
    if (profile.id !== save.activeProfileId) {
      return profile;
    }

    return updateProfileRecord(profile, details, new Date().toISOString());
  });

  return buildRuntimeSave(profiles, save.activeProfileId, new Date().toISOString());
}

function normalizeProfiles(saveData, now) {
  const sourceProfiles = Array.isArray(saveData.profiles) ? saveData.profiles : [];
  const profiles = sourceProfiles
    .filter(isPlainObject)
    .map((profile) => createProfileRecord(profile, profile, now));

  if (profiles.length === 0) {
    return [createProfileRecord(saveData.profile || {}, saveData, now)];
  }

  return uniqueProfiles(profiles);
}

function syncRuntimeProfile(profiles, activeId, source, now) {
  return profiles.map((profile) => {
    if (profile.id !== activeId) {
      return profile;
    }

    return createProfileRecord({
      id: profile.id,
      name: source.profile?.name || profile.name,
      icon: source.profile?.icon || profile.icon,
      favoriteTheme: source.settings?.theme || source.profile?.favoriteTheme || profile.favoriteTheme,
      createdAt: source.profile?.createdAt || profile.createdAt,
      updatedAt: now
    }, source, now);
  });
}

function createProfileRecord(details = {}, payload = null, now) {
  const theme = normalizeTheme(details.favoriteTheme || payload?.settings?.theme || "sunny");
  const settings = normalizeSettings(payload?.settings, theme);

  settings.theme = theme;

  return {
    id: normalizeId(details.id),
    name: normalizeProfileName(details.name || payload?.profile?.name),
    icon: normalizeProfileIcon(details.icon || payload?.profile?.icon),
    favoriteTheme: theme,
    createdAt: normalizeString(details.createdAt || payload?.profile?.createdAt, now),
    updatedAt: normalizeString(details.updatedAt || payload?.updatedAt, now),
    settings,
    progress: normalizeProgress(payload?.progress),
    rewards: normalizeRewards(payload?.rewards, theme),
    sessions: normalizeSessions(payload?.sessions),
    collectibles: normalizeCollectiblesSection(payload?.collectibles),
    stats: normalizeStatsSection(payload?.stats, payload?.sessions)
  };
}

function updateProfileRecord(profile, details, now) {
  const theme = normalizeTheme(details.favoriteTheme || profile.favoriteTheme);
  return {
    ...profile,
    name: normalizeProfileName(details.name || profile.name),
    icon: normalizeProfileIcon(details.icon || profile.icon),
    favoriteTheme: theme,
    updatedAt: now,
    settings: { ...profile.settings, theme },
    rewards: normalizeRewards({
      ...profile.rewards,
      ownedThemes: [...profile.rewards.ownedThemes, theme]
    }, theme)
  };
}

function buildRuntimeSave(profiles, activeProfileId, updatedAt) {
  const active = profiles.find((profile) => profile.id === activeProfileId) || profiles[0];
  return {
    version: CURRENT_VERSION,
    activeProfileId: active.id,
    profiles: profiles.map(cloneData),
    profile: pickProfileMeta(active),
    settings: cloneData(active.settings),
    progress: cloneData(active.progress),
    rewards: cloneData(active.rewards),
    sessions: cloneData(active.sessions),
    collectibles: cloneData(active.collectibles),
    stats: cloneData(active.stats),
    updatedAt
  };
}

function pickProfileMeta(profile) {
  return {
    id: profile.id,
    name: profile.name,
    icon: profile.icon,
    favoriteTheme: profile.favoriteTheme,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt
  };
}

function normalizeSettings(settings, theme) {
  return {
    theme: normalizeTheme(settings?.theme || theme),
    reducedMotion: Boolean(settings?.reducedMotion)
  };
}

function normalizeProgress(progress) {
  return {
    multiplication: normalizeMultiplicationProgress(progress?.multiplication),
    fractions: { unlocked: Boolean(progress?.fractions?.unlocked) },
    equations: { unlocked: Boolean(progress?.equations?.unlocked) }
  };
}

function normalizeMultiplicationProgress(progress) {
  return {
    unlockedTables: normalizeUnlockedTables(progress?.unlockedTables),
    mixedModeUnlocked: Boolean(progress?.mixedModeUnlocked),
    unlockedModes: normalizeUnlockedModes(progress?.unlockedModes, progress?.mixedModeUnlocked),
    tablePoints: normalizeTablePoints(progress?.tablePoints),
    facts: normalizeMultiplicationFacts(progress?.facts)
  };
}

function normalizeUnlockedTables(tables) {
  const requestedTables = Array.isArray(tables) ? tables : [];
  const cleanTables = [...INITIAL_UNLOCKED_TABLES, ...requestedTables]
    .map(Number)
    .filter(isValidTable);

  return TABLE_UNLOCK_ORDER.filter((table) => cleanTables.includes(table));
}

function normalizeMultiplicationFacts(facts) {
  if (!isPlainObject(facts)) {
    return {};
  }

  return Object.entries(facts).reduce((cleanFacts, [factId, factProgress]) => {
    if (getFactById(factId)) {
      cleanFacts[factId] = normalizeFactProgress(factProgress);
    }
    return cleanFacts;
  }, {});
}

function normalizeFactProgress(factProgress) {
  const attempts = normalizeCount(factProgress?.attempts);
  const successes = Math.min(normalizeCount(factProgress?.successes), attempts);
  const errors = Math.min(normalizeCount(factProgress?.errors), attempts);

  return {
    attempts,
    successes,
    errors,
    currentStreak: normalizeCount(factProgress?.currentStreak),
    bestStreak: normalizeCount(factProgress?.bestStreak),
    recentResults: normalizeRecentResults(factProgress?.recentResults),
    lastAnsweredAt: normalizeNullableString(factProgress?.lastAnsweredAt),
    averageResponseMs: normalizeNullableCount(factProgress?.averageResponseMs),
    mastery: clampScore(factProgress?.mastery)
  };
}

function normalizeRewards(rewards, activeTheme) {
  return {
    xp: normalizeCount(rewards?.xp),
    stars: normalizeCount(rewards?.stars),
    coins: normalizeCount(rewards?.coins),
    totalCoinsEarned: normalizeCount(rewards?.totalCoinsEarned),
    ownedThemes: normalizeOwnedThemes(rewards?.ownedThemes || INITIAL_OWNED_THEMES, activeTheme),
    purchases: normalizePurchases(rewards?.purchases),
    collectibles: Array.isArray(rewards?.collectibles) ? rewards.collectibles : []
  };
}

function normalizePurchases(purchases) {
  return Array.isArray(purchases)
    ? purchases.filter(isPlainObject).map((purchase) => ({
      type: normalizeString(purchase.type, "unknown"),
      id: normalizeString(purchase.id, "unknown"),
      cost: normalizeCount(purchase.cost),
      purchasedAt: normalizeNullableString(purchase.purchasedAt)
    }))
    : [];
}

function normalizeSessions(sessions) {
  return {
    completed: normalizeCount(sessions?.completed),
    lastPlayedAt: normalizeNullableString(sessions?.lastPlayedAt)
  };
}

function normalizeCollectiblesSection(collectibles) {
  return {
    cards: normalizeIdPair(collectibles?.cards),
    badges: normalizeIdPair(collectibles?.badges),
    showcase: normalizeShowcaseSection(collectibles?.showcase)
  };
}

function normalizeIdPair(section) {
  return {
    owned: normalizeStringArray(section?.owned),
    newlyUnlocked: normalizeStringArray(section?.newlyUnlocked)
  };
}

function normalizeShowcaseSection(showcase) {
  return {
    featuredCardIds: normalizeStringArray(showcase?.featuredCardIds),
    featuredBadgeIds: normalizeStringArray(showcase?.featuredBadgeIds)
  };
}

function normalizeStatsSection(stats, sessions) {
  return {
    sessionsCompleted: normalizeCount(stats?.sessionsCompleted ?? sessions?.completed),
    totalCorrectAnswers: normalizeCount(stats?.totalCorrectAnswers),
    totalQuestionsAnswered: normalizeCount(stats?.totalQuestionsAnswered),
    perfectSessions: normalizeCount(stats?.perfectSessions),
    bestGlobalStreak: normalizeCount(stats?.bestGlobalStreak)
  };
}

function normalizeRecentResults(recentResults) {
  return Array.isArray(recentResults)
    ? recentResults.map(normalizeRecentResult).filter(Boolean).slice(-10)
    : [];
}

function normalizeRecentResult(result) {
  if (typeof result === "boolean") {
    return { correct: result, answeredAt: null };
  }

  return isPlainObject(result)
    ? { correct: Boolean(result.correct), answeredAt: normalizeNullableString(result.answeredAt) }
    : null;
}

function uniqueProfiles(profiles) {
  const seen = new Set();
  return profiles.map((profile) => {
    if (!seen.has(profile.id)) {
      seen.add(profile.id);
      return profile;
    }
    const nextProfile = { ...profile, id: createProfileId() };
    seen.add(nextProfile.id);
    return nextProfile;
  });
}

function normalizeProfileName(value) {
  const name = typeof value === "string" ? value.trim().slice(0, 18) : "";
  return name || "Explorateur";
}

function normalizeProfileIcon(value) {
  return PROFILE_ICONS.includes(value) ? value : PROFILE_ICONS[0];
}

function normalizeTheme(value) {
  return ["sunny", "ocean", "berry"].includes(value) ? value : "sunny";
}

function normalizeId(value) {
  return typeof value === "string" && value.trim() !== "" ? value : createProfileId();
}

function createProfileId() {
  return globalThis.crypto?.randomUUID?.() || `profile-${Date.now()}-${Math.random()}`;
}

function normalizeCount(value) {
  return Number.isFinite(value) && value >= 0 ? Math.round(value) : 0;
}

function normalizeNullableCount(value) {
  return Number.isFinite(value) && value >= 0 ? Math.round(value) : null;
}

function normalizeString(value, fallback) {
  return typeof value === "string" && value.trim() !== "" ? value : fallback;
}

function normalizeNullableString(value) {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function normalizeStringArray(arr) {
  return Array.isArray(arr)
    ? arr.filter((item) => typeof item === "string" && item.length > 0)
    : [];
}

function clampScore(value) {
  return Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : 0;
}

function cloneData(data) {
  return JSON.parse(JSON.stringify(data));
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
