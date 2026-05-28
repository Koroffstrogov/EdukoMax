const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_MINUTE = 60 * 1000;
const MAX_INTERVAL_DAYS = 30;
const DIFFICULTIES = Object.freeze(["new", "wrong", "slow", "steady", "easy"]);

export function normalizeSpacedSchedule(factProgress) {
  return {
    nextReviewAt: normalizeNullableDate(factProgress?.nextReviewAt),
    reviewIntervalDays: clampInterval(factProgress?.reviewIntervalDays),
    retrievalStrength: clampUnit(
      Number.isFinite(factProgress?.retrievalStrength)
        ? factProgress.retrievalStrength
        : Number(factProgress?.mastery) / 100
    ),
    lastDifficulty: normalizeDifficulty(factProgress?.lastDifficulty)
  };
}

export function updateSpacedSchedule(factProgress, answerMeta = {}) {
  const schedule = normalizeSpacedSchedule(factProgress);
  const answeredAt = parseDate(answerMeta.answeredAt) || new Date();
  const difficulty = classifyDifficulty(answerMeta);
  const intervalDays = getNextInterval(schedule.reviewIntervalDays, difficulty);

  return {
    nextReviewAt: getNextReviewAt(answeredAt, intervalDays, difficulty),
    reviewIntervalDays: intervalDays,
    retrievalStrength: getNextStrength(schedule.retrievalStrength, difficulty),
    lastDifficulty: difficulty
  };
}

export function getSpacedReviewScore(factProgress, now = new Date()) {
  const schedule = normalizeSpacedSchedule(factProgress);
  const nextReview = parseDate(schedule.nextReviewAt);

  if (!nextReview) {
    return schedule.reviewIntervalDays === 0 ? 25 : 10;
  }

  const daysLate = (now.getTime() - nextReview.getTime()) / MS_PER_DAY;
  const dueScore = daysLate >= 0
    ? Math.min(85, 42 + daysLate * 16)
    : Math.max(0, 18 + daysLate * 8);
  const difficultyBoost = { wrong: 18, slow: 10, steady: 0, easy: -10, new: 0 }[
    schedule.lastDifficulty
  ] || 0;

  return clampScore(dueScore + difficultyBoost - schedule.retrievalStrength * 14);
}

export function getPracticeBucket(factProgress, now = new Date()) {
  const attempts = normalizeCount(factProgress?.attempts);

  if (attempts === 0) {
    return "new";
  }

  if (isFragile(factProgress)) {
    return "fragile";
  }

  const nextReview = parseDate(normalizeSpacedSchedule(factProgress).nextReviewAt);
  if (nextReview && nextReview.getTime() <= now.getTime()) {
    return "due";
  }

  if (isEasy(factProgress)) {
    return "easy";
  }

  return "consolidation";
}

function classifyDifficulty(answerMeta) {
  if (!answerMeta?.isCorrect) {
    return "wrong";
  }

  const responseMs = normalizeNullableCount(answerMeta.responseMs);
  if (responseMs !== null && responseMs >= 4500) {
    return "slow";
  }

  return responseMs !== null && responseMs <= 2200 ? "easy" : "steady";
}

function getNextInterval(currentInterval, difficulty) {
  if (difficulty === "wrong") return 0;
  if (difficulty === "slow") return clampInterval(currentInterval <= 0 ? 1 : currentInterval * 1.35);
  if (difficulty === "easy") return clampInterval(currentInterval <= 0 ? 2 : currentInterval * 2.2 + 1);
  return clampInterval(currentInterval <= 0 ? 1 : currentInterval * 1.7);
}

function getNextStrength(currentStrength, difficulty) {
  const delta = { wrong: -0.22, slow: 0.06, steady: 0.12, easy: 0.2, new: 0 }[difficulty] || 0;
  return clampUnit(currentStrength + delta);
}

function getNextReviewAt(answeredAt, intervalDays, difficulty) {
  if (difficulty === "wrong") {
    return new Date(answeredAt.getTime() + 10 * MS_PER_MINUTE).toISOString();
  }

  return new Date(answeredAt.getTime() + intervalDays * MS_PER_DAY).toISOString();
}

function isFragile(factProgress) {
  const attempts = normalizeCount(factProgress?.attempts);
  const successes = Math.min(normalizeCount(factProgress?.successes), attempts);
  const accuracy = attempts > 0 ? successes / attempts : 0;
  return countRecentErrors(factProgress?.recentResults) >= 2 ||
    accuracy < 0.65 ||
    factProgress?.lastDifficulty === "wrong";
}

function isEasy(factProgress) {
  return Number(factProgress?.mastery) >= 80 &&
    normalizeCount(factProgress?.currentStreak) >= 3 &&
    countRecentErrors(factProgress?.recentResults) === 0;
}

function countRecentErrors(recentResults) {
  return Array.isArray(recentResults)
    ? recentResults.filter((result) => result && result.correct === false).length
    : 0;
}

function normalizeDifficulty(value) {
  return DIFFICULTIES.includes(value) ? value : "new";
}

function normalizeNullableDate(value) {
  const date = parseDate(value);
  return date ? date.toISOString() : null;
}

function parseDate(value) {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function clampInterval(value) {
  return Math.max(0, Math.min(MAX_INTERVAL_DAYS, Number.isFinite(value) ? Number(value) : 0));
}

function clampUnit(value) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? Number(value) : 0));
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeCount(value) {
  return Number.isFinite(value) && value >= 0 ? Math.round(value) : 0;
}

function normalizeNullableCount(value) {
  return Number.isFinite(value) && value >= 0 ? Math.round(value) : null;
}
