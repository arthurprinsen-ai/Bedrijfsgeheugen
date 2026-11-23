import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const migration=await readFile(new URL('../supabase/migrations/20261102074013_verified_tenant_intake_and_quoted_value_payment_truth.sql',import.meta.url),'utf8');
const aclFinalizer=await readFile(new URL('../supabase/migrations/20261102075243_verified_intake_privileged_trigger_acl_finalizer.sql',import.meta.url),'utf8');
const original=await readFile(new URL('../supabase/migrations/20260911100916_bg_salescyclus_herkomst_en_uitkomsten.sql',import.meta.url),'utf8');

test('original historical risk: source trigger did not replay conversion on verified tenant claim',()=>{
 assert.match(original,/create trigger bg_scan_uitkomst after insert on public\.scan_inzendingen/i);
 assert.match(migration,/CREATE TRIGGER bg_scan_uitkomst\s+AFTER INSERT OR UPDATE OF tenant_identity_status, organisatie_id\s+ON public\.scan_inzendingen/i);
 assert.match(migration,/NEW\.tenant_identity_status <> 'verified' OR NEW\.organisatie_id IS NULL/);
 assert.match(migration,/IF TG_OP = 'UPDATE'[\s\S]+OLD\.tenant_identity_status = 'verified'/);
 assert.match(migration,/OLD\.organisatie_id IS NOT DISTINCT FROM NEW\.organisatie_id/);
 assert.match(migration,/intern\.bg_uitkomst_eenmalig\(\s*'scan', NEW\.id::text, 'lead', 0/i);
});

test('demo, unverified or repeated tenant identity can never become a customer lead through these triggers',()=>{
 const f=migration.split('CREATE OR REPLACE FUNCTION intern.trg_scan_uitkomst()')[1].split('DROP TRIGGER IF EXISTS bg_scan_uitkomst')[0];
 assert.match(f,/RETURN NEW;[\s\S]*END IF;[\s\S]*TG_OP/);
 assert.match(f,/NEW\.tenant_identity_status <> 'verified'/);
 assert.match(f,/NEW\.organisatie_id IS NULL/);
 assert.doesNotMatch(f,/\bcommercial_leads\b/i);
 assert.match(f,/intern\.bg_uitkomst_eenmalig/);
});

test('quote signature is not proof of paid order or realized revenue',()=>{
 const f=migration.split('CREATE OR REPLACE FUNCTION intern.trg_offerte_uitkomst()')[1].split('DROP TRIGGER IF EXISTS bg_offerte_uitkomst')[0];
 assert.match(f,/NEW\.tenant_identity_status <> 'verified' OR NEW\.organisatie_id IS NULL/);
 assert.match(f,/intern\.bg_uitkomst_eenmalig\(\s*'offerte', NEW\.id::text \|\| ':voorstel', 'proposal', 0/i);
 assert.doesNotMatch(f,/'won_order'|'revenue'|'paid_order'/i);
 assert.match(f,/'quoted_contract_value_eur', NEW\.totaal/);
 assert.match(f,/'payment_status', 'NOT_VERIFIED'/);
 assert.match(f,/'revenue_verified', false/);
 assert.match(migration,/AFTER INSERT OR UPDATE OF getekend, tenant_identity_status, organisatie_id/);
});

test('only existing original canonical outcome authority may write; no extra schedule, policy or public privileges',()=>{
 assert.match(migration,/CREATE OR REPLACE FUNCTION intern\.trg_scan_uitkomst/);
 assert.match(migration,/CREATE OR REPLACE FUNCTION intern\.trg_offerte_uitkomst/);
 assert.equal((migration.match(/intern\.bg_uitkomst_eenmalig\(/g)||[]).length,2);
 assert.equal((migration.match(/SECURITY DEFINER SET search_path = ''/g)||[]).length,2);
 assert.match(migration,/REVOKE ALL ON FUNCTION intern\.trg_scan_uitkomst\(\) FROM PUBLIC, anon, authenticated/);
 assert.match(migration,/REVOKE ALL ON FUNCTION intern\.trg_offerte_uitkomst\(\) FROM PUBLIC, anon, authenticated/);
 assert.doesNotMatch(migration,/create table|create extension|\bgrant\b|\bcreate policy\b|\bcron\.|\bhttp_post\b|\bservice_role\b/i);
 assert.doesNotMatch(migration,/update\s+public\.(scan_inzendingen|offerte_inzendingen|growth_outcomes)/i);
 assert.match(migration,/BEGIN;[\s\S]*COMMIT;/);
});

test('historical signed demo quotes are not admissible customer revenue evidence',()=>{
 const verified=({identity,organisation})=>identity==='verified'&&Boolean(organisation);
 assert.equal(verified({identity:'demo',organisation:null}),false);
 assert.equal(verified({identity:'unverified',organisation:null}),false);
 assert.equal(verified({identity:'verified',organisation:'tenant-1'}),true);
 assert.match(migration,/No historical backfill/);
});

test('a separately versioned immutable ACL finalizer repairs an already-applied first preview migration',()=>{
 assert.match(aclFinalizer,/REVOKE ALL ON FUNCTION intern\.trg_scan_uitkomst\(\) FROM PUBLIC, anon, authenticated/);
 assert.match(aclFinalizer,/REVOKE ALL ON FUNCTION intern\.trg_offerte_uitkomst\(\) FROM PUBLIC, anon, authenticated/);
 assert.doesNotMatch(aclFinalizer,/CREATE OR REPLACE FUNCTION|CREATE TRIGGER|\bGRANT\b|\bUPDATE\b|\bDELETE\b/i);
 assert.match(aclFinalizer,/BEGIN;[\s\S]*COMMIT;/);
});
