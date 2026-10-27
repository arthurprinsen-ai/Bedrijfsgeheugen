import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const status = JSON.parse(readFileSync(new URL("../seo-status.json", import.meta.url), "utf8"));
const baseline = JSON.parse(readFileSync(new URL("../site/seo-baseline.json", import.meta.url), "utf8"));

const norm = (p) => (p === "/" ? "/" : String(p).replace(/\/+$/, ""));

test("every seo-status.json keyword is owned by the same route in the baseline", () => {
  const owners = new Map(baseline.keywordOwners.map((k) => [k.keyword, norm(k.route)]));
  const drift = status.zoekwoorden
    .filter((k) => owners.get(k.zoekwoord) !== norm(k.pagina))
    .map((k) => `${k.zoekwoord} -> ${k.pagina} (baseline: ${owners.get(k.zoekwoord)})`);
  assert.deepEqual(drift, []);
});

test("seo-status.json tracks the renamed and new cluster keywords", () => {
  const words = new Set(status.zoekwoorden.map((k) => k.zoekwoord));
  for (const w of ["ai governance", "ai modellen vergelijken", "company brain", "data soevereiniteit"]) {
    assert.ok(words.has(w), w);
  }
  assert.ok(!words.has("ai governance mkb"));
});
