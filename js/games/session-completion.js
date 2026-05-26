import { calculateTableMastery } from "../mastery-engine.js";
import { pickCardRewards, applyCardRewards } from "../collectibles/collectible-engine.js";
import { evaluateBadges, applyBadgeRewards, updateStatsAfterSession } from "../collectibles/badge-engine.js";
import {
  calculateCompetitiveBonus,
  recordCompetitiveScore
} from "../premium-modes/competitive-engine.js";
import { summarizeScienceFocus } from "../premium-modes/science-review-engine.js";

export function completeSession(save, session) {
  const nextSave = save;
  const completedSession = { ...session, completionRecorded: true };
  const sessionSummary = buildSessionSummary(nextSave, completedSession);

  nextSave.sessions.completed += 1;
  nextSave.sessions.lastPlayedAt = new Date().toISOString();
  updateStatsAfterSession(nextSave, sessionSummary);

  const cardResult = pickCardRewards(nextSave, sessionSummary);
  applyCardRewards(nextSave, cardResult.cards);

  const badgeResult = evaluateBadges(nextSave, sessionSummary);
  applyBadgeRewards(nextSave, badgeResult);

  addCoins(nextSave, cardResult.bonusCoins);

  const premiumResult = applyPremiumCompletion(nextSave, completedSession, sessionSummary);

  return {
    save: premiumResult.save,
    session: {
      ...completedSession,
      leaderboardRank: premiumResult.rank,
      scienceSummary: premiumResult.scienceSummary
    },
    sessionRewards: {
      cards: cardResult.cards,
      badges: badgeResult,
      bonusCoins: cardResult.bonusCoins,
      premiumBonusCoins: premiumResult.bonusCoins,
      premiumXp: premiumResult.xpBonus,
      leaderboardRank: premiumResult.rank,
      scienceSummary: premiumResult.scienceSummary
    }
  };
}

export function buildSessionSummary(save, session) {
  const table = getSessionTable(session);
  const masteredTablesBefore = getMasteredTablesList(save);

  return {
    table,
    mode: session.modeId,
    totalQuestions: session.totalQuestions,
    correctAnswers: session.correctCount,
    accuracy: session.answeredCount > 0 ? session.correctCount / session.answeredCount : 0,
    bestStreak: calculateBestStreak(session.answers),
    score: session.score ?? session.correctCount,
    elapsedMs: getElapsedMs(session),
    perfect: session.correctCount === session.totalQuestions,
    masteredTablesBefore,
    masteredTablesAfter: masteredTablesBefore,
    premiumFamily: session.packFamily || null
  };
}

function applyPremiumCompletion(save, session, summary) {
  if (session.type !== "premium") {
    return { save, bonusCoins: 0, xpBonus: 0, rank: null, scienceSummary: null };
  }

  let nextSave = save;
  let rank = null;
  const bonusCoins = calculateCompetitiveBonus(summary);
  const xpBonus = session.packFamily === "science" ? 5 : 0;
  const scienceSummary = session.packFamily === "science"
    ? summarizeScienceFocus(session)
    : null;

  if (session.packFamily === "competitive") {
    const scoreResult = recordCompetitiveScore(nextSave, summary);
    nextSave = scoreResult.save;
    rank = scoreResult.rank;
  }

  addCoins(nextSave, bonusCoins);
  nextSave.rewards.xp += xpBonus;

  return { save: nextSave, bonusCoins, xpBonus, rank, scienceSummary };
}

function addCoins(save, coins) {
  if (coins > 0) {
    save.rewards.coins += coins;
    save.rewards.totalCoinsEarned += coins;
  }
}

function getSessionTable(session) {
  if (session.table) {
    return session.table;
  }

  if (!session.answers || session.answers.length === 0) {
    return 2;
  }

  const tableCounts = {};

  for (const answer of session.answers) {
    const table = Number(String(answer.factId).split("x")[0]);

    if (table >= 2 && table <= 10) {
      tableCounts[table] = (tableCounts[table] || 0) + 1;
    }
  }

  return Number(Object.entries(tableCounts)
    .sort((first, second) => second[1] - first[1])[0]?.[0] || 2);
}

function getMasteredTablesList(save) {
  const mastered = [];

  for (let table = 2; table <= 10; table++) {
    const stats = calculateTableMastery(table, save.progress.multiplication);
    if (stats.mastery >= 80) mastered.push(table);
  }

  return mastered;
}

function calculateBestStreak(answers) {
  let best = 0;
  let current = 0;

  for (const answer of answers || []) {
    current = answer.isCorrect ? current + 1 : 0;
    best = Math.max(best, current);
  }

  return best;
}

function getElapsedMs(session) {
  if (!Number.isFinite(session.startedAtMs)) {
    return 0;
  }

  return Math.max(0, Date.now() - session.startedAtMs);
}
