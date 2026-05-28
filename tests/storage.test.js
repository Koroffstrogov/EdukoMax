import { test } from "./test-runner.js";
import { assert, assertEqual, assertDeepEqual } from "./test-utils.js";
import { loadSave, saveGame, clearSave, createDefaultSave } from "../js/storage.js";
import { activateProfile, addProfile, normalizeSave, removeProfile } from "../js/save-data.js";
import { BADGES, COLLECTIBLE_CARDS } from "../js/collectibles/collectible-data.js";

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
    assertDeepEqual(save.progress.multiplication.selectedTables, [2, 5, 10]);
    assert(save.progress.multiplication.unlockedModes.includes("direct-answer"), "direct mode unlocked");
    assert(save.progress.multiplication.unlockedModes.includes("multiple-choice"), "QCM unlocked");
    assert(save.progress.multiplication.unlockedModes.includes("multiple-choice-8"), "QCM 8 unlocked");
    assert(save.progress.multiplication.unlockedModes.includes("visual-groups"), "visual groups unlocked");
    assert(save.progress.multiplication.unlockedModes.includes("missing-factor"), "missing factor unlocked");
    assert(save.progress.multiplication.unlockedModes.includes("mixed"), "mix unlocked");
    assert(save.cosmetics.ownedThemes.includes("kawaii-pop"), "kawaii-pop owned");
    assert(save.cosmetics.ownedThemes.includes("cosmic-cats"), "cosmic-cats owned");
    assertEqual(save.cosmetics.activeTheme, "kawaii-pop", "default cosmetic theme");
    assertEqual(save.rewards.coins, 0);
    assertEqual(save.sessions.completed, 0);
  });
});

test("storage: profile switch restores profile-specific progress", () => {
  const firstSave = createDefaultSave({ name: "Lina", icon: "👧" });
  firstSave.rewards.coins = 12;
  firstSave.progress.multiplication.selectedTables.push(3);
  firstSave.progress.multiplication.facts["3x4"].attempts = 4;
  firstSave.progress.multiplication.facts["3x4"].needsPractice = true;

  const secondSave = addProfile(firstSave, {
    name: "Noé",
    icon: "🚀",
    favoriteTheme: "cosmic-cats"
  });

  assertEqual(secondSave.profile.name, "Noé");
  assertEqual(secondSave.rewards.coins, 0, "new profile starts fresh");
  assertEqual(secondSave.settings.theme, "cosmic-cats", "favorite theme applied");
  assertEqual(secondSave.progress.multiplication.facts["3x4"].attempts, 0, "new profile has fresh fact memory");

  const restoredFirst = activateProfile(secondSave, firstSave.activeProfileId);
  assertEqual(restoredFirst.profile.name, "Lina");
  assertEqual(restoredFirst.rewards.coins, 12, "coins restored");
  assert(restoredFirst.progress.multiplication.selectedTables.includes(3), "table selection restored");
  assertEqual(restoredFirst.progress.multiplication.facts["3x4"].attempts, 4, "fact memory restored");
  assertEqual(restoredFirst.progress.multiplication.facts["3x4"].needsPractice, true, "practice flag restored");
});

test("storage: TesT profile starts with test unlocks", () => {
  const save = addProfile(createDefaultSave({ name: "Lina" }), { name: "TesT" });

  assertEqual(save.profile.name, "TesT");
  assertEqual(save.progress.multiplication.selectedTables.length, 9, "all tables active");
  assert(save.premiumModes.ownedPacks.includes("competitive-pack"), "competitive pack owned");
  assert(save.premiumModes.ownedPacks.includes("chill-pack"), "chill pack owned");
  assert(save.premiumModes.ownedPacks.includes("science-pack"), "science pack owned");
  assert(save.premiumModes.ownedPacks.includes("magic-bracelets"), "bracelets pack owned");
  assertEqual(save.collectibles.cards.owned.length, COLLECTIBLE_CARDS.length, "all cards owned");
  assertEqual(save.collectibles.badges.owned.length, BADGES.length, "all badges owned");
});

test("storage: test profile trigger is case sensitive", () => {
  const save = addProfile(createDefaultSave({ name: "Lina" }), { name: "test" });

  assertEqual(save.profile.name, "test");
  assertEqual(save.progress.multiplication.selectedTables.length, 3);
  assertEqual(save.premiumModes.ownedPacks.length, 0);
  assertEqual(save.collectibles.cards.owned.length, 0);
  assertEqual(save.collectibles.badges.owned.length, 0);
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
    assertEqual(save.settings.theme, "cosmic-cats", "legacy theme mapped");
    assert(save.rewards.ownedThemes.includes("cosmic-cats"), "mapped theme owned");
    assertEqual(save.rewards.coins, 5, "coins preserved");
    assert(Array.isArray(save.progress.multiplication.unlockedTables), "tables normalized");
    assertDeepEqual(save.progress.multiplication.selectedTables, [2, 5, 10]);
    assertEqual(Object.keys(save.progress.multiplication.facts).length, 81, "all facts initialized");
  });
});

test("storage: legacy unlocked tables seed selectedTables", () => {
  const save = normalizeSave({
    progress: { multiplication: { unlockedTables: [2, 5, 10, 7] } }
  });

  assertDeepEqual(save.progress.multiplication.selectedTables, [2, 5, 10, 7]);
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
    assertEqual(loaded.settings.theme, "magic-bakery");
    assert(loaded.rewards.ownedThemes.includes("magic-bakery"), "legacy active theme owned");
  });
});

test("storage: active profile payload is saved inside profiles", () => {
  withCleanStorage(() => {
    const save = createDefaultSave({ name: "Mila", icon: "🚀" });
    save.rewards.coins = 23;
    save.progress.multiplication.selectedTables.push(3);
    save.premiumModes.ownedPacks.push("chill-pack");

    saveGame(save);
    const loaded = loadSave();
    const storedProfile = loaded.profiles.find((profile) => profile.id === loaded.activeProfileId);

    assertEqual(storedProfile.rewards.coins, 23);
    assert(storedProfile.progress.multiplication.selectedTables.includes(3), "profile selected table 3");
    assert(storedProfile.premiumModes.ownedPacks.includes("chill-pack"), "profile owns chill pack");
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
    assertEqual(loaded.progress.multiplication.facts["2x3"].needsPractice, false);
  });
});
