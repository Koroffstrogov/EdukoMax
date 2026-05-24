import { test } from "./test-runner.js";
import { assert } from "./test-utils.js";
import { evaluateBadges, applyBadgeRewards, getBadgeStats, updateStatsAfterSession } from "../js/collectibles/badge-engine.js";

function createBaseSave() {
  return {
    collectibles: {
      cards: { owned: [], newlyUnlocked: [] },
      badges: { owned: [], newlyUnlocked: [] },
      showcase: { featuredCardIds: [], featuredBadgeIds: [] }
    },
    stats: {
      sessionsCompleted: 0,
      totalCorrectAnswers: 0,
      totalQuestionsAnswered: 0,
      perfectSessions: 0,
      bestGlobalStreak: 0
    },
    progress: { multiplication: { facts: {} } },
    sessions: { completed: 0 }
  };
}

test("first-session badge awarded on first session", () => {
  const save = createBaseSave();
  save.stats.sessionsCompleted = 1;
  const summary = { table: 2, accuracy: 0.5, perfect: false, bestStreak: 2, correctAnswers: 4, totalQuestions: 8, masteredTablesBefore: [], masteredTablesAfter: [] };
  const badges = evaluateBadges(save, summary);
  assert(badges.some((b) => b.id === "first-session"), "first-session awarded");
});

test("badges are not awarded twice", () => {
  const save = createBaseSave();
  save.collectibles.badges.owned = ["first-session"];
  save.stats.sessionsCompleted = 2;
  const summary = { table: 2, accuracy: 0.5, perfect: false, bestStreak: 2, correctAnswers: 4, totalQuestions: 8, masteredTablesBefore: [], masteredTablesAfter: [] };
  const badges = evaluateBadges(save, summary);
  assert(!badges.some((b) => b.id === "first-session"), "first-session not awarded again");
});

test("perfect-session badge awarded on perfect session", () => {
  const save = createBaseSave();
  save.stats.sessionsCompleted = 1;
  const summary = { table: 2, accuracy: 1, perfect: true, bestStreak: 8, correctAnswers: 8, totalQuestions: 8, masteredTablesBefore: [], masteredTablesAfter: [] };
  const badges = evaluateBadges(save, summary);
  assert(badges.some((b) => b.id === "perfect-session"), "perfect-session awarded");
});

test("five-streak badge awarded when bestStreak >= 5", () => {
  const save = createBaseSave();
  save.stats.sessionsCompleted = 1;
  const summary = { table: 3, accuracy: 0.75, perfect: false, bestStreak: 5, correctAnswers: 6, totalQuestions: 8, masteredTablesBefore: [], masteredTablesAfter: [] };
  const badges = evaluateBadges(save, summary);
  assert(badges.some((b) => b.id === "five-streak"), "five-streak awarded");
});

test("table-2-mastered badge awarded when table 2 is mastered", () => {
  const save = createBaseSave();
  save.stats.sessionsCompleted = 5;
  const summary = { table: 2, accuracy: 1, perfect: true, bestStreak: 8, correctAnswers: 8, totalQuestions: 8, masteredTablesBefore: [], masteredTablesAfter: [2] };
  const badges = evaluateBadges(save, summary);
  assert(badges.some((b) => b.id === "table-2-mastered"), "table-2-mastered awarded");
});

test("applyBadgeRewards adds badges without duplicates", () => {
  const save = createBaseSave();
  const badges = [{ id: "first-session", name: "test", emoji: "🎒" }];
  applyBadgeRewards(save, badges);
  applyBadgeRewards(save, badges);
  assert(save.collectibles.badges.owned.filter((id) => id === "first-session").length === 1, "no duplicate");
});

test("updateStatsAfterSession increments counters", () => {
  const save = createBaseSave();
  const summary = { correctAnswers: 6, totalQuestions: 8, perfect: false, bestStreak: 4 };
  updateStatsAfterSession(save, summary);
  assert(save.stats.sessionsCompleted === 1, "sessions incremented");
  assert(save.stats.totalCorrectAnswers === 6, "correct answers tracked");
  assert(save.stats.totalQuestionsAnswered === 8, "total questions tracked");
  assert(save.stats.bestGlobalStreak === 4, "best streak tracked");
});

test("getBadgeStats counts correctly", () => {
  const save = createBaseSave();
  save.collectibles.badges.owned = ["first-session", "perfect-session"];
  const stats = getBadgeStats(save);
  assert(stats.ownedBadges === 2, "2 owned badges");
  assert(stats.totalBadges > 0, "total badges > 0");
});

