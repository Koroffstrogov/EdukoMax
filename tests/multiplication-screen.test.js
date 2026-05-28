import { test } from "./test-runner.js";
import { assert, assertEqual } from "./test-utils.js";
import { createDefaultSave } from "../js/save-data.js";
import { renderMultiplicationView } from "../js/screens/multiplication-screen.js";

function renderDefaultScreen() {
  return renderMultiplicationView({
    save: createDefaultSave(),
    shopMessage: ""
  });
}

test("multiplication screen renders compact mode mini-cards", () => {
  const html = renderDefaultScreen();

  assertEqual((html.match(/class="mode-mini-card"/g) || []).length, 6, "6 free modes");
  assert(html.includes("QCM 8"), "QCM 8 short label visible");
  assert(html.includes("Bonus pièces"), "QCM 8 compact hint visible");
});

test("multiplication screen renders 9 table number tiles", () => {
  const html = renderDefaultScreen();

  assertEqual((html.match(/class="table-number-tile/g) || []).length, 9, "9 tables");
  assertEqual((html.match(/table-state-badge">ON/g) || []).length, 3, "3 active tables");
  assertEqual((html.match(/table-state-badge">OFF/g) || []).length, 6, "6 inactive tables");
});

test("multiplication screen table tiles avoid verbose action text", () => {
  const html = renderDefaultScreen();
  const tableGrid = html.slice(html.indexOf("table-tile-grid"));

  assert(!tableGrid.includes("Jouer"), "table tiles do not launch sessions");
  assert(!tableGrid.includes("Acheter"), "table tiles do not sell tables");
  assert(!tableGrid.includes("Peut apparaître"), "old active sentence removed");
  assert(!tableGrid.includes("Ne sort pas"), "old inactive sentence removed");
});
