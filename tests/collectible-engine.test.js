import { test } from "./test-runner.js";
import { assert } from "./test-utils.js";
import { pickCardRewards, applyCardRewards, getEligibleCardsForSession, normalizeCollectibles, markCollectiblesSeen, getCollectionStats } from "../js/collectibles/collectible-engine.js";
import { COLLECTIBLE_CARDS, CARD_RARITIES } from "../js/collectibles/collectible-data.js";
import { renderCollectionView } from "../js/collectibles/collection-renderer.js";
import { renderRewardReveal } from "../js/collectibles/reward-reveal.js";

function createSave(ownedCards = [], selectedTables = [2, 5, 10]) {
  return {
    progress: { multiplication: { selectedTables } },
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

test("pickCardRewards does not give max card unless all tables are active", () => {
  const save = createSave([], [2, 5, 10]);
  const summary = { table: 2, accuracy: 1, perfect: true, bestStreak: 8, masteredTablesBefore: [], masteredTablesAfter: [] };
  const result = pickCardRewards(save, summary);
  const hasMax = result.cards.some((c) => c.rarity === CARD_RARITIES.MAX);
  assert(!hasMax, "max card not awarded");
});

test("pickCardRewards gives max card with all tables active and more than 90 percent", () => {
  const save = createSave([], [2, 3, 4, 5, 6, 7, 8, 9, 10]);
  const summary = { table: 2, accuracy: 0.91, perfect: false, bestStreak: 8, masteredTablesBefore: [], masteredTablesAfter: [] };
  const result = pickCardRewards(save, summary);
  const hasMax = result.cards.some((c) => c.rarity === CARD_RARITIES.MAX);
  assert(hasMax, "max card awarded");
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

test("renderRewardReveal hides cards behind a clickable reveal cover", () => {
  const maxCard = COLLECTIBLE_CARDS.find((card) => card.rarity === CARD_RARITIES.MAX);
  const html = renderRewardReveal([maxCard], [], 0);

  assert(html.includes("<details"), "uses details disclosure");
  assert(html.includes("<summary"), "uses clickable summary");
  assert(html.includes("Clique pour dévoiler tes cartes"), "child click instruction is visible");
  assert(html.includes("Carte MAX"), "max reward message is visible");
});

test("renderCollectionView shows max cards as masked placeholders from start", () => {
  const html = renderCollectionView(createSave());
  const firstMaxIndex = html.indexOf("Carte MAX masquée");
  const firstRegularMysteryIndex = html.indexOf("Carte mystère");

  assert((html.match(/collectible-card--max/g) || []).length >= 3, "max placeholders rendered");
  assert(html.includes("9 tables actives + plus de 90 %"), "max unlock hint visible");
  assert(firstMaxIndex > 0 && firstMaxIndex < firstRegularMysteryIndex, "max cards appear first");
});

