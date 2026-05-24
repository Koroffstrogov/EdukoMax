import { test } from "./test-runner.js";
import { assert, assertEqual, assertDeepEqual } from "./test-utils.js";
import { loadSave, saveGame, clearSave, createDefaultSave } from "../js/storage.js";

// Stub localStorage for test isolation
function withCleanStorage(fn) {
  const key = "edukomax.save.v1";
  const backup = localStorage.getItem(key);
  localStorage.removeItem(key);

  try {
    fn();
  } finally {
    localStorage.removeItem(key);

    if (backup !== null) {
      localStorage.setItem(key, backup);
    }
  }
}

test("storage: absent save creates a valid default state", () => {
  withCleanStorage(() => {
    const save = loadSave();
    assertEqual(save.version, 1);
    assert(Array.isArray(save.progress.multiplication.unlockedTables), "unlockedTables is array");
    assert(save.progress.multiplication.unlockedTables.includes(2), "table 2 unlocked");
    assert(save.progress.multiplication.unlockedTables.includes(5), "table 5 unlocked");
    assert(save.progress.multiplication.unlockedTables.includes(10), "table 10 unlocked");
    assertEqual(save.rewards.coins, 0);
    assertEqual(save.sessions.completed, 0);
  });
});

test("storage: partial save is normalized", () => {
  withCleanStorage(() => {
    localStorage.setItem("edukomax.save.v1", JSON.stringify({
      version: 1,
      settings: { theme: "ocean" },
      rewards: { coins: 5 }
    }));
    const save = loadSave();
    assertEqual(save.settings.theme, "ocean", "theme preserved");
    assertEqual(save.rewards.coins, 5, "coins preserved");
    assert(Array.isArray(save.progress.multiplication.unlockedTables), "tables normalized");
  });
});

test("storage: corrupted save does not block the app", () => {
  withCleanStorage(() => {
    localStorage.setItem("edukomax.save.v1", "NOT_JSON{{{");
    const save = loadSave();
    assertEqual(save.version, 1, "falls back to default");
    assertEqual(save.rewards.coins, 0);
  });
});

test("storage: chosen theme is preserved across save/load", () => {
  withCleanStorage(() => {
    const save = createDefaultSave();
    save.settings.theme = "berry";
    saveGame(save);
    const loaded = loadSave();
    assertEqual(loaded.settings.theme, "berry");
  });
});

test("storage: fact progression is preserved", () => {
  withCleanStorage(() => {
    const save = createDefaultSave();
    save.progress.multiplication.facts["2x3"] = {
      attempts: 10,
      successes: 8,
      errors: 2,
      currentStreak: 3,
      bestStreak: 5,
      recentResults: [{ correct: true, answeredAt: null }],
      lastAnsweredAt: "2025-01-01T00:00:00.000Z",
      averageResponseMs: 1500,
      mastery: 72
    };
    saveGame(save);
    const loaded = loadSave();
    assertEqual(loaded.progress.multiplication.facts["2x3"].attempts, 10);
    assertEqual(loaded.progress.multiplication.facts["2x3"].successes, 8);
    assertEqual(loaded.progress.multiplication.facts["2x3"].mastery, 72);
  });
});
