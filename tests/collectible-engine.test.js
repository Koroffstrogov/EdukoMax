import { test } from "./test-runner.js";
import { assert } from "./test-utils.js";
import { pickCardRewards, applyCardRewards, getEligibleCardsForSession, normalizeCollectibles, markCollectiblesSeen, getCollectionStats } from "../js/collectibles/collectible-engine.js";
import { COLLECTIBLE_CARDS, CARD_RARITIES } from "../js/collectibles/collectible-data.js";

function createSave(ownedCards = []) {
  return {
    collectibles: {
      cards: { owned: [...ownedCards], newlyUnlocked: [] },
      badges: { owned: [], newlyUnlocked: [] },
      showcase: { featuredCardIds: [], featuredBadgeIds: [] }
    },
    stats: { sessionsCompleted: 0, totalCorrectAnswers: 0, totalQuestionsAnswered: 0, perfectSessions: 0, bestGlobalStreak: 0 },
    sessions: { completed: 0 }
  };
}

test("normalizeCollectibles returns default for missing data", () => {
  const result = normalizeCollectibles(undefined);
  assert(Array.isArray(result.cards.owned), "cards.owned is array");
  assert(result.cards.owned.length === 0, "empty owned cards");
});

test("normalizeCollectibles preserves existing cards", () => {
  const save = createSave(["t2-c1"]);
  const result = normalizeCollectibles(save);
  assert(result.cards.owned.includes("t2-c1"), "card preserved");
});

test("applyCardRewards does not add duplicate cards", () => {
  const save = createSave(["t2-c1"]);
  const card = COLLECTIBLE_CARDS.find((c) => c.id === "t2-c1");
  applyCardRewards(save, [card]);
  assert(save.collectibles.cards.owned.filter((id) => id === "t2-c1").length === 1, "no duplicate");
});

test("getEligibleCardsForSession excludes owned cards", () => {
  const save = createSave(["t2-c1", "t2-c2", "t2-c3", "t2-c4"]);
  const summary = { table: 2, accuracy: 0.5, perfect: false, bestStreak: 2, masteredTablesBefore: [], masteredTablesAfter: [] };
  const eligible = getEligibleCardsForSession(save, summary);
  const hasOwned = eligible.some((c) => save.collectibles.cards.owned.includes(c.id));
  assert(!hasOwned, "owned cards excluded");
});

test("getEligibleCardsForSession excludes mastery cards", () => {
  const save = createSave();
  const summary = { table: 2, accuracy: 1, perfect: true, bestStreak: 8, masteredTablesBefore: [], masteredTablesAfter: [] };
  const eligible = getEligibleCardsForSession(save, summary);
  const hasMastery = eligible.some((c) => c.rarity === CARD_RARITIES.MASTERY);
  assert(!hasMastery, "mastery cards excluded from eligible");
});

test("pickCardRewards gives mastery card when table is newly mastered", () => {
  const save = createSave();
  const summary = { table: 2, accuracy: 1, perfect: true, bestStreak: 8, masteredTablesBefore: [], masteredTablesAfter: [2] };
  const result = pickCardRewards(save, summary);
  const hasMastery = result.cards.some((c) => c.rarity === CARD_RARITIES.MASTERY && c.table === 2);
  assert(hasMastery, "mastery card awarded");
});

test("pickCardRewards returns max 3 cards", () => {
  const save = createSave();
  const summary = { table: 2, accuracy: 1, perfect: true, bestStreak: 8, masteredTablesBefore: [], masteredTablesAfter: [2] };
  const result = pickCardRewards(save, summary);
  assert(result.cards.length <= 3, "max 3 cards");
});

test("markCollectiblesSeen clears newlyUnlocked", () => {
  const save = createSave(["t2-c1"]);
  save.collectibles.cards.newlyUnlocked = ["t2-c1"];
  save.collectibles.badges.newlyUnlocked = ["first-session"];
  markCollectiblesSeen(save);
  assert(save.collectibles.cards.newlyUnlocked.length === 0, "cards cleared");
  assert(save.collectibles.badges.newlyUnlocked.length === 0, "badges cleared");
});

test("getCollectionStats counts correctly", () => {
  const save = createSave(["t2-c1", "t2-c2"]);
  const stats = getCollectionStats(save);
  assert(stats.ownedCards === 2, "2 owned cards");
  assert(stats.totalCards === COLLECTIBLE_CARDS.length, "total cards correct");
  assert(stats.percent > 0, "percent > 0");
});

