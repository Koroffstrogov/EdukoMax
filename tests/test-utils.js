/**
 * Assertion helpers for the mini test harness.
 */

export function assert(condition, message = "Assertion failed") {
  if (!condition) {
    throw new Error(message);
  }
}

export function assertEqual(actual, expected, message = "") {
  if (actual !== expected) {
    const detail = message ? `${message}: ` : "";
    throw new Error(
      `${detail}expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
}

export function assertNotEqual(actual, unexpected, message = "") {
  if (actual === unexpected) {
    const detail = message ? `${message}: ` : "";
    throw new Error(`${detail}expected value to differ from ${JSON.stringify(unexpected)}`);
  }
}

export function assertApprox(actual, expected, tolerance, message = "") {
  if (Math.abs(actual - expected) > tolerance) {
    const detail = message ? `${message}: ` : "";
    throw new Error(
      `${detail}expected ~${expected} (±${tolerance}), got ${actual}`
    );
  }
}

export function assertThrows(fn, message = "Expected function to throw") {
  let threw = false;

  try {
    fn();
  } catch {
    threw = true;
  }

  if (!threw) {
    throw new Error(message);
  }
}

export function assertDeepEqual(actual, expected, message = "") {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);

  if (actualJson !== expectedJson) {
    const detail = message ? `${message}: ` : "";
    throw new Error(`${detail}expected ${expectedJson}, got ${actualJson}`);
  }
}
