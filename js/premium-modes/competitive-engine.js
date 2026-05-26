const COMPETITIVE_MODES = Object.freeze(["speed-60", "combo-max"]);
const MAX_LEADERBOARD_ENTRIES = 10;

export function normalizeLeaderboards(leaderboards) {
  const source = isPlainObject(leaderboards) ? leaderboards : {};

  return COMPETITIVE_MODES.reduce((boards, modeId) => {
    boards[modeId] = normalizeEntries(source[modeId]);
    return boards;
  }, {});
}

export function recordCompetitiveScore(saveData, sessionSummary) {
  const modeId = sessionSummary?.mode;

  if (!COMPETITIVE_MODES.includes(modeId)) {
    return { save: cloneData(saveData), entry: null, rank: null, leaderboard: [] };
  }

  const save = cloneData(saveData);
  const entry = buildScoreEntry(save, sessionSummary);
  const leaderboards = normalizeLeaderboards(save.leaderboards);
  const nextBoard = sortEntries([...leaderboards[modeId], entry])
    .slice(0, MAX_LEADERBOARD_ENTRIES);

  save.leaderboards = {
    ...leaderboards,
    [modeId]: nextBoard
  };
  save.premiumModes = normalizePremiumModes(save.premiumModes);
  save.premiumModes.highScores[modeId] = getBestProfileScore(
    save.premiumModes.highScores[modeId],
    entry
  );

  return {
    save,
    entry,
    rank: nextBoard.findIndex((item) => item.id === entry.id) + 1 || null,
    leaderboard: nextBoard
  };
}

export function getLeaderboard(saveData, modeId) {
  return normalizeLeaderboards(saveData?.leaderboards)[modeId] || [];
}

export function calculateCompetitiveBonus(summary) {
  if (summary?.mode === "speed-60") {
    return Math.min(4, Math.floor(normalizeCount(summary.score) / 10));
  }

  if (summary?.mode === "combo-max") {
    return Math.min(4, Math.floor(normalizeCount(summary.score) / 5));
  }

  return 0;
}

function buildScoreEntry(save, summary) {
  const profile = save.profile || {};
  return {
    id: `score-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    profileId: String(profile.id || save.activeProfileId || "profile"),
    profileName: String(profile.name || "Explorateur"),
    avatar: String(profile.icon || "🧒"),
    score: normalizeCount(summary.score),
    accuracy: normalizeAccuracy(summary.accuracy),
    table: summary.table || "mix",
    mode: summary.mode,
    elapsedMs: normalizeCount(summary.elapsedMs),
    createdAt: new Date().toISOString()
  };
}

function normalizeEntries(entries) {
  return sortEntries((Array.isArray(entries) ? entries : [])
    .filter(isPlainObject)
    .map(normalizeEntry)
    .filter(Boolean))
    .slice(0, MAX_LEADERBOARD_ENTRIES);
}

function normalizeEntry(entry) {
  if (!COMPETITIVE_MODES.includes(entry.mode)) {
    return null;
  }

  return {
    id: String(entry.id || `score-${entry.mode}-${entry.createdAt || Date.now()}`),
    profileId: String(entry.profileId || "profile"),
    profileName: String(entry.profileName || "Explorateur"),
    avatar: String(entry.avatar || "🧒"),
    score: normalizeCount(entry.score),
    accuracy: normalizeAccuracy(entry.accuracy),
    table: entry.table || "mix",
    mode: entry.mode,
    elapsedMs: normalizeCount(entry.elapsedMs),
    createdAt: typeof entry.createdAt === "string" ? entry.createdAt : null
  };
}

function sortEntries(entries) {
  return [...entries].sort((first, second) => {
    if (second.score !== first.score) return second.score - first.score;
    if (second.accuracy !== first.accuracy) return second.accuracy - first.accuracy;
    if (first.elapsedMs !== second.elapsedMs) return first.elapsedMs - second.elapsedMs;
    return String(second.createdAt).localeCompare(String(first.createdAt));
  });
}

function getBestProfileScore(previous, entry) {
  const current = isPlainObject(previous) ? normalizeEntry({ ...previous, mode: entry.mode }) : null;
  return sortEntries([current, entry].filter(Boolean))[0];
}

function normalizePremiumModes(premiumModes) {
  return {
    ...(isPlainObject(premiumModes) ? premiumModes : {}),
    ownedPacks: Array.isArray(premiumModes?.ownedPacks) ? premiumModes.ownedPacks : [],
    highScores: isPlainObject(premiumModes?.highScores) ? { ...premiumModes.highScores } : {}
  };
}

function normalizeAccuracy(value) {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}

function normalizeCount(value) {
  return Number.isFinite(value) && value >= 0 ? Math.round(value) : 0;
}

function cloneData(data) {
  return JSON.parse(JSON.stringify(data));
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
