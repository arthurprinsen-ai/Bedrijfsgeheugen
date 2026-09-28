
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const js = fs.readFileSync(new URL("../../assets/scan-workshop.js", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../../pages/scan.html", import.meta.url), "utf8");
const ingest = fs.readFileSync(new URL("../../supabase/functions/powerhouse-scan-ingest/index.ts", import.meta.url), "utf8");
const skill = fs.readFileSync(new URL("../../.agents/skills/seo-revenue-growth/SKILL.md", import.meta.url), "utf8");

test("workshop scan persists into the canonical Powerhouse scan loop", () => {
  assert.match(js, /\/api\/powerhouse-scan-ingest/);
  assert.match(js, /submission_key/);
  assert.match(js, /source_kind:"workshop_scan"/);
  assert.match(js, /bg_scan_pakket/);
  assert.match(js, /bg_scan_submission_key/);
  assert.match(ingest, /isWorkshop/);
  assert.match(ingest, /workshop_scan/);
  assert.match(ingest, /website\.workshop_scan/);
});

test("workshop attribution survives the durable scan payload", () => {
  for (const key of ["partner","workshop","event","utm_source","utm_medium","utm_campaign"]) {
    assert.ok(js.includes(key), key + " missing");
  }
  assert.match(js, /attribution:p/);
  assert.match(ingest, /attribution:safeObj/);
});

test("portal is the primary post-scan continuation", () => {
  assert.match(html, /Open jouw portaal/);
  assert.match(html, /\/klantportaal\?source=workshopscan/);
  assert.match(js, /\/klantportaal\?source=scanrapport/);
  assert.match(html, /Bekijk trajecten & prijzen/);
});

test("Powerhouse scan persistence keeps participant PII out of the aggregate payload", () => {
  const start = js.indexOf("var scanPayload=");
  const end = js.indexOf("fetch(\"/api/powerhouse-scan-ingest", start);
  const payload = js.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.doesNotMatch(payload, /email/);
  assert.doesNotMatch(payload, /naam:/);
  assert.match(skill, /workshop-scan-powerhouse-handoff-v1/);
});
