import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const js=fs.readFileSync(new URL("../../assets/scan-workshop.js",import.meta.url),"utf8");
const edge=fs.readFileSync(new URL("../../supabase/functions/powerhouse-scan-ingest/index.ts",import.meta.url),"utf8");
const migration=fs.readFileSync(new URL("../../supabase/migrations/20260928130500_workshop_scan_preprovision_customer_portal.sql",import.meta.url),"utf8");

test("workshop submission persists personal intake separately from aggregate scan",()=>{
  assert.match(js,/portal_intake/);
  for(const key of ["company_name","contact_name","email","phone","employees","sector","region","consent"]) assert.ok(js.includes(key),key);
  assert.match(edge,/workshop_portal_intakes/);
  assert.match(edge,/preprovisionProjection/);
  assert.match(edge,/privacy_scope:'no_pii'/);
});

test("customer portal is preprovisioned and can be claimed after authentication",()=>{
  assert.match(edge,/scan:\$\{scan\.submissionKey\}/);
  assert.match(edge,/bg_portal_state_put_internal/);
  assert.match(edge,/portal_preprovisioned/);
  assert.match(edge,/claimed_tenant_id/);
  assert.match(edge,/PORTAL_CLAIM_FAILED/);
});

test("PII intake table is private",()=>{
  assert.match(migration,/enable row level security/i);
  assert.match(migration,/revoke all on public\.workshop_portal_intakes from anon, authenticated/i);
  assert.match(migration,/grant all on public\.workshop_portal_intakes to service_role/i);
});
