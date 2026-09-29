import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const html=fs.readFileSync(new URL("../pages/scan.html",import.meta.url),"utf8");
const js=fs.readFileSync(new URL("../assets/scan-workshop.js",import.meta.url),"utf8");
const edge=fs.readFileSync(new URL("../supabase/functions/powerhouse-scan-ingest/index.ts",import.meta.url),"utf8");
const migration=fs.readFileSync(new URL("../supabase/migrations/20260929150500_workshop_portal_intake_phone.sql",import.meta.url),"utf8");

test("workshop asks required contact data and renders it into the personal PDF",()=>{
  assert.match(html,/id="name"/);
  assert.match(html,/id="email"/);
  assert.match(html,/id="phone"/);
  assert.match(html,/id="reportContactLine"/);
  assert.match(html,/id="reportContactLine2"/);
  assert.match(js,/contactLine=el\("#name"\).*el\("#email"\).*el\("#phone"\)/);
  assert.match(js,/telefoon:el\("#phone"\)/);
});

test("private portal intake persists phone without adding PII to aggregate growth",()=>{
  assert.match(js,/phone:el\("#phone"\)/);
  assert.match(edge,/phone:intake\.phone/);
  assert.match(edge,/contact:\{name:intake\.contact_name,email:intake\.email,phone:intake\.phone\}/);
  assert.match(edge,/privacy_scope:'no_pii'/);
  assert.match(migration,/add column if not exists phone text/i);
});
