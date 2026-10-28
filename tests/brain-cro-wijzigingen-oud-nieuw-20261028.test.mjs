import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { certainty, projectExperimentChanges, experimentChangesMarkup } from "../portal-v2/modules/experiment-changes.js";

const row = (o = {}) => ({ experiment_id: "x1", gebied: "site", pagina: "/over-ons", wijziging: "Knop boven de vouw", meetpunt: "lead", toegepast_op: "2026-10-01T00:00:00Z", status: "ACTIVE", min_steekproef: 50, oud: { sessies: 200, conversies: 4, ratio: 0.02 }, nieuw: { sessies: 80, conversies: 4, ratio: 0.05 }, verschil_relatief: 1.5, p_waarde: 0.2, ...o });

test("small sample is 'te vroeg om te zeggen', never proven", () => {
  assert.equal(certainty(row({ nieuw: { sessies: 10, ratio: 0.5 }, status: "COMPLETE", p_waarde: 0.01 })).label, "Te vroeg om te zeggen");
});
test("proven needs COMPLETE, enough sessions and p<0.10", () => {
  assert.equal(certainty(row({ status: "COMPLETE", nieuw: { sessies: 80, ratio: 0.05 }, p_waarde: 0.03 })).label, "Bewezen");
  assert.equal(certainty(row({ status: "ACTIVE", nieuw: { sessies: 80, ratio: 0.05 }, p_waarde: 0.03 })).label, "Onzeker");
});
test("rolled back and insufficient evidence are shown honestly", () => {
  assert.equal(certainty(row({ status: "ROLLED_BACK" })).label, "Niet bevestigd");
  assert.equal(certainty(row({ status: "INSUFFICIENT_EVIDENCE" })).label, "Te weinig bewijs");
});
test("unknown is not zero: missing measurement gives no difference", () => {
  const m = projectExperimentChanges({ status: "LIVE", rows: [row({ nieuw: null, verschil_relatief: null })] });
  assert.equal(m.rows[0].verschil, null);
  assert.match(experimentChangesMarkup({ status: "LIVE", rows: [row({ nieuw: null, verschil_relatief: null })] }), /<td>—<\/td><td>—<\/td>/);
});
test("unavailable source and empty register never invent numbers", () => {
  assert.match(experimentChangesMarkup({ status: "UNAVAILABLE", reason: "X", rows: [] }), /geen cijfers verzonnen/);
  assert.match(experimentChangesMarkup({ status: "LIVE", rows: [] }), /Nog geen gestarte wijzigingen/);
  assert.match(experimentChangesMarkup(null), /geen cijfers verzonnen/);
});
test("old value is struck through and text is escaped", () => {
  const html = experimentChangesMarkup({ status: "LIVE", rows: [row({ wijziging: "<img src=x onerror=1>" })] });
  assert.match(html, /<s>2,0%<\/s>/);
  assert.doesNotMatch(html, /<img/);
});
test("admin endpoint, tab and read function are wired and read-only", () => {
  const fn = readFileSync(new URL("../netlify/functions/powerhouse-observability.mjs", import.meta.url), "utf8");
  const ui = readFileSync(new URL("../portal-v2/modules/powerhouse-observability.js", import.meta.url), "utf8");
  assert.match(fn, /loadExperimentChanges/);
  assert.ok(fn.indexOf("isPowerhouseAdmin") < fn.indexOf("loadExperimentChanges()"), "admin gate comes first");
  assert.match(ui, /experiment-changes/);
  const dir = new URL("../supabase/migrations/", import.meta.url);
  const sql = readFileSync(new URL(readdirSync(dir).find((f) => f.endsWith("_bg_experiment_wijzigingen_overzicht_v1.sql")), dir), "utf8");
  assert.match(sql, /stable security definer set search_path = ''/);
  assert.match(sql, /revoke all on function public\.bg_experiment_wijzigingen_overzicht\(int\) from public, anon, authenticated/);
  assert.match(sql, /grant execute on function public\.bg_experiment_wijzigingen_overzicht\(int\) to service_role/);
  assert.doesNotMatch(sql, /\b(insert|update|delete)\b\s+(into|public)/i);
});
