/**
 * Minimal test runner — no dependency, ES module.
 * Usage: import { test, runTests } from "./test-runner.js";
 */

const tests = [];
const results = { passed: 0, failed: 0, errors: [] };

export function test(name, fn) {
  tests.push({ name, fn });
}

export async function runTests() {
  results.passed = 0;
  results.failed = 0;
  results.errors = [];

  for (const entry of tests) {
    try {
      await entry.fn();
      results.passed += 1;
    } catch (error) {
      results.failed += 1;
      results.errors.push({ name: entry.name, error });
      console.error(`FAIL: ${entry.name}`, error.message || error);
    }
  }

  renderResults();
  return results;
}

function renderResults() {
  const container = document.getElementById("test-results");

  if (!container) {
    return;
  }

  const total = results.passed + results.failed;
  const status = results.failed === 0 ? "ALL PASSED" : "FAILURES";

  container.innerHTML = `
    <h2>${status}</h2>
    <p><strong>${results.passed}</strong> passed, <strong>${results.failed}</strong> failed, <strong>${total}</strong> total</p>
    ${results.errors.length > 0 ? renderErrors() : "<p>✔ Tous les tests passent.</p>"}
  `;

  container.className = results.failed === 0 ? "results-pass" : "results-fail";
}

function renderErrors() {
  return `
    <ul class="error-list">
      ${results.errors.map((entry) => `
        <li>
          <strong>${escapeHtml(entry.name)}</strong>
          <pre>${escapeHtml(entry.error.message || String(entry.error))}</pre>
        </li>
      `).join("")}
    </ul>
  `;
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
