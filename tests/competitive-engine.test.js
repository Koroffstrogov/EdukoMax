import { test } from "./test-runner.js";
import { assert, assertEqual } from "./test-utils.js";
import { createDefaultSave } from "../js/save-data.js";
import {
  getLeaderboard,
  normalizeLeaderboards,
  recordCompetitiveScore
} from "../js/premium-modes/competitive-engine.js";

test("competitive score is linked to active profile", () => {
  const save = createDefaultSave({ name: "Lina", icon: "🚀" });
  const result = recordCompetitiveScore(save, {
    mode: "speed-60",
    score: 12,
    accuracy: 0.9,
    table: "mix",
    elapsedMs: 60000
  });

  assertEqual(result.entry.profileName, "Lina");
  assertEqual(result.entry.avatar, "🚀");
  assertEqual(result.rank, 1);
});

test("leaderboard keeps only the 10 best entries", () => {
  let save = createDefaultSave();

  for (let score = 1; score <= 12; score += 1) {
    save = recordCompetitiveScore(save, {
      mode: "speed-60",
      score,
      accuracy: 0.8,
      table: "mix",
      elapsedMs: 60000
    }).save;
  }

  const board = getLeaderboard(save, "speed-60");
  assertEqual(board.length, 10);
  assertEqual(board[0].score, 12);
  assertEqual(board.at(-1).score, 3);
});

test("leaderboard sorting uses score, accuracy, then elapsed time", () => {
  const boards = normalizeLeaderboards({
    "combo-max": [
      entry("a", 9, 0.8, 30000),
      entry("b", 9, 0.9, 40000),
      entry("c", 9, 0.9, 20000),
      entry("d", 10, 0.5, 50000)
    ]
  });

  assertEqual(boards["combo-max"].map((item) => item.id).join(","), "d,c,b,a");
});

function entry(id, score, accuracy, elapsedMs) {
  return {
    id,
    profileId: "p",
    profileName: "Test",
    avatar: "🧒",
    score,
    accuracy,
    table: "mix",
    mode: "combo-max",
    elapsedMs,
    createdAt: "2026-01-01T00:00:00.000Z"
  };
}
