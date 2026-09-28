
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../pages/scan.html", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../assets/scan-workshop.css", import.meta.url), "utf8");
const js = fs.readFileSync(new URL("../assets/scan-workshop.js", import.meta.url), "utf8");

test("post-scan output is exactly two result pages", () => {
  assert.match(html, /id="reportPage1"/);
  assert.match(html, /id="reportPage2"/);
  assert.doesNotMatch(html, /id="reportPage3"/);
  assert.match(html, /Kracht, knelpunten/);
  assert.match(html, /Jouw 3 grootste hefbomen/);
});

test("page one contains benchmark comparison and domain detail", () => {
  assert.match(html, /Benchmark \(gemiddeld MKB\)/);
  assert.match(html, /Interpretatie/);
  assert.match(html, /Toelichting/);
  assert.match(js, /benchmark/);
  assert.match(js, /scorecell/);
});

test("page two contains levers, roadmap and honest measured KPIs", () => {
  assert.match(html, /Jouw 90-dagen roadmap/);
  assert.match(html, /KPI’s om vanaf dag 1 te volgen/);
  assert.match(js, /Grootste benchmarkgap/);
  assert.match(js, /huidige nulmeting/);
  assert.match(js, /Verbetercyclus/);
});

test("both result pages route into the same portal scan lineage", () => {
  assert.match(html, /reportQr/);
  assert.match(html, /reportQr2/);
  assert.match(js, /klantportaal\?source=scanrapport/);
  assert.match(css, /Workshopscan results design v3/);
});
