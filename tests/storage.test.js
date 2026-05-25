import { test } from "./test-runner.js";
import { assert, assertEqual, assertDeepEqual } from "./test-utils.js";
import { loadSave, saveGame, clearSave, createDefaultSave } from "../js/storage.js";
import { activateProfile, addProfile, removeProfile } from "../js/save-data.js";

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
    assertEqual(save.profiles.length, 1, "one default profile");
    assertEqual(save.activeProfileId, save.profile.id, "active profile mirrored");
    assert(Array.isArray(save.progress.multiplication.unlockedTables), "unlockedTables is array");
    assert(save.progress.multiplication.unlockedTables.includes(2), "table 2 unlocked");
    assert(save.progress.multiplication.unlockedTables.includes(5), "table 5 unlocked");
    assert(save.progress.multiplication.unlockedTables.includes(10), "table 10 unlocked");
    assert(save.progress.multiplication.unlockedModes.includes("direct-answer"), "direct mode unlocked");
    assert(save.progress.multiplication.unlockedModes.includes("multiple-choice"), "QCM unlocked");
    assert(save.progress.multiplication.unlockedModes.includes("visual-groups"), "visual groups unlocked");
    assert(save.progress.multiplication.unlockedModes.includes("missing-factor"), "missing factor unlocked");
    assert(save.progress.multiplication.unlockedModes.includes("mixed"), "mix unlocked");
    assertEqual(save.rewards.coins, 0);
    assertEqual(save.sessions.completed, 0);
  });
});

test("storage: profile switch restores profile-specific progress", () => {
  const firstSave = createDefaultSave({ name: "Lina", icon: "👧" });
  firstSave.rewards.coins = 12;
  firstSave.progress.multiplication.unlockedTables.push(3);

  const secondSave = addProfile(firstSave, {
    name: "Noé",
    icon: "🚀",
    favoriteTheme: "ocean"
  });

  assertEqual(secondSave.profile.name, "Noé");
  assertEqual(secondSave.rewards.coins, 0, "new profile starts fresh");
  assertEqual(secondSave.settings.theme, "ocean", "favorite theme applied");

  const restoredFirst = activateProfile(secondSave, firstSave.activeProfileId);
  assertEqual(restoredFirst.profile.name, "Lina");
  assertEqual(restoredFirst.rewards.coins, 12, "coins restored");
  assert(restoredFirst.progress.multiplication.unlockedTables.includes(3), "table restored");
});

test("storage: deleting the active profile selects another profile", () => {
  const firstSave = createDefaultSave({ name: "Lina" });
  const secondSave = addProfile(firstSave, { name: "Noé", icon: "🚀" });
  const afterDelete = removeProfile(secondSave, secondSave.activeProfileId);

  assertEqual(afterDelete.profiles.length, 1);
  assertEqual(afterDelete.profile.name, "Lina");
  assertEqual(afterDelete.activeProfileId, firstSave.activeProfileId);
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

test("storage: active profile payload is saved inside profiles", () => {
  withCleanStorage(() => {
    const save = createDefaultSave({ name: "Mila", icon: "🚀" });
    save.rewards.coins = 23;
    save.progress.multiplication.unlockedTables.push(3);

    saveGame(save);
    const loaded = loadSave();
    const storedProfile = loaded.profiles.find((profile) => profile.id === loaded.activeProfileId);

    assertEqual(storedProfile.rewards.coins, 23);
    assert(storedProfile.progress.multiplication.unlockedTables.includes(3), "profile owns table 3");
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
