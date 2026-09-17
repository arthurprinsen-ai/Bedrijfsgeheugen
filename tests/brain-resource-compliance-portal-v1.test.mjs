import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>{assert.ok(fs.existsSync(path),`missing ${path}`);return fs.readFileSync(path,'utf8')};
const migration='supabase/migrations/20260917111500_powerhouse_resource_compliance_tenant_portal_v1.sql';

test('resource and compliance intelligence is tenant scoped',()=>{
 const sql=read(migration);
 assert.match(sql,/alter table public\.powerhouse_compliance_evidence_v1\s+add column if not exists tenant_id text/i);
 assert.match(sql,/alter table public\.powerhouse_optimization_candidate_v1\s+add column if not exists tenant_id text/i);
 assert.match(sql,/powerhouse_resource_tenant_summary_v1/i);
 assert.match(sql,/group by tenant_id/i);
 assert.match(sql,/unnest\(tenant_ids\)/i);
});

test('catalog is evidence-first and does not claim legal compliance',()=>{
 const sql=read(migration);
 assert.match(sql,/powerhouse_compliance_control_catalog_v1/i);
 assert.match(sql,/assessment_required/i);
 assert.match(sql,/EU_AI_ACT/i);
 assert.match(sql,/NIS2/i);
 assert.match(sql,/CSRD_ESRS/i);
 assert.match(sql,/https:\/\/digital-strategy\.ec\.europa\.eu/i);
 assert.match(sql,/https:\/\/finance\.ec\.europa\.eu/i);
 assert.doesNotMatch(sql,/compliance_score/i);
});

test('portal EU gateway exposes tenant resource intelligence without cross-tenant candidates',()=>{
 const source=read('supabase/functions/portal-state-eu/index.ts');
 assert.match(source,/action==='resource_intelligence'/);
 assert.match(source,/powerhouse_resource_tenant_summary_v1/);
 assert.match(source,/powerhouse_compliance_control_catalog_v1/);
 assert.match(source,/powerhouse_compliance_evidence_v1/);
 assert.match(source,/powerhouse_optimization_candidate_v1/);
 assert.match(source,/\.eq\('tenant_id',tenantId\)/);
 assert.match(source,/evidenceCoveragePct/);
});

test('existing portal state composes resource intelligence into the canonical state',()=>{
 const store=read('netlify/functions/_portal-supabase-store.mjs');
 assert.match(store,/getResourceIntelligence/);
 assert.match(store,/action:'resource_intelligence'/);
 assert.match(store,/resourceIntelligence/);
});

test('overview renders evidence-labelled impact and governance cockpit',()=>{
 const source=read('portal-v2/modules/resource-intelligence.js');
 assert.match(source,/Kosten & waarde/);
 assert.match(source,/Energie/);
 assert.match(source,/CO₂e/);
 assert.match(source,/Water/);
 assert.match(source,/EU AI Act/);
 assert.match(source,/NIS2/);
 assert.match(source,/CSRD \/ ESRS/);
 assert.match(source,/Bewijsdekking/);
 assert.match(source,/Geen juridische conformiteitsverklaring/);
 const overview=read('portal-v2/modules/overview.js');
 assert.match(overview,/mountResourceIntelligenceCockpit/);
});
