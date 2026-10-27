import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const status = JSON.parse(readFileSync(new URL("../seo-status.json", import.meta.url), "utf8"));
const baseline = JSON.parse(readFileSync(new URL("../site/seo-baseline.json", import.meta.url), "utf8"));

const norm = (p) => (p === "/" ? "/" : String(p).replace(/\/+$/, ""));

test("every baseline keyword is tracked in seo-status.json on the same route", () => {
  const byKeyword = new Map(status.zoekwoorden.map((k) => [k.zoekwoord, norm(k.pagina)]));
  const missing = baseline.keywords
    .filter((k) => byKeyword.get(k.keyword) !== norm(k.route))
    .map((k) => `${k.keyword} -> ${k.route}`);
  assert.deepEqual(missing, []);
});

test("seo-status.json tracks the renamed and new cluster keywords", () => {
  const words = new Set(status.zoekwoorden.map((k) => k.zoekwoord));
  for (const w of ["ai governance", "ai modellen vergelijken", "company brain", "data soevereiniteit"]) {
    assert.ok(words.has(w), w);
  }
  assert.ok(!words.has("ai governance mkb"));
});
