import { test } from "./test-runner.js";
import { assert, assertEqual } from "./test-utils.js";
import {
  getPracticeBucket,
  normalizeSpacedSchedule,
  updateSpacedSchedule
} from "../js/spaced-repetition-engine.js";

test("spacing: old facts normalize missing spaced fields", () => {
  const schedule = normalizeSpacedSchedule({ attempts: 2, mastery: 50 });

  assertEqual(schedule.nextReviewAt, null);
  assertEqual(schedule.reviewIntervalDays, 0);
  assertEqual(schedule.retrievalStrength, 0.5);
  assertEqual(schedule.lastDifficulty, "new");
});

test("spacing: fast correct answer increases interval more than slow answer", () => {
  const base = { reviewIntervalDays: 0, retrievalStrength: 0.2 };
  const fast = updateSpacedSchedule(base, answer(true, 1200));
  const slow = updateSpacedSchedule(base, answer(true, 5200));

  assert(fast.reviewIntervalDays > slow.reviewIntervalDays);
  assertEqual(fast.lastDifficulty, "easy");
  assertEqual(slow.lastDifficulty, "slow");
});

test("spacing: wrong answer reduces strength and schedules close review", () => {
  const base = { reviewIntervalDays: 6, retrievalStrength: 0.7 };
  const wrong = updateSpacedSchedule(base, answer(false, 1800));

  assertEqual(wrong.reviewIntervalDays, 0);
  assert(wrong.retrievalStrength < 0.7);
  assertEqual(wrong.lastDifficulty, "wrong");
  assert(new Date(wrong.nextReviewAt).getTime() > new Date(answeredAt).getTime());
});

test("spacing: wrong or repeated errors put fact in fragile bucket", () => {
  const bucket = getPracticeBucket({
    attempts: 4,
    successes: 2,
    recentResults: [{ correct: false }, { correct: false }],
    lastDifficulty: "wrong"
  });

  assertEqual(bucket, "fragile");
});

const answeredAt = "2026-01-01T10:00:00.000Z";

function answer(isCorrect, responseMs) {
  return { isCorrect, responseMs, answeredAt };
}
