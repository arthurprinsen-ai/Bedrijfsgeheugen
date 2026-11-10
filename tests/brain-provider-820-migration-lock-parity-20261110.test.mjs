import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
const lock=JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json',import.meta.url),'utf8'));
const sql=readdirSync(new URL('../supabase/migrations/',import.meta.url)).filter(s=>/^[0-9]{14}_[a-z0-9_]+[.]sql$/.test(s)).sort();
test('exact 820 unique source, local and provider-observed migration identities',()=>{
 assert.equal(lock.source,'supabase_migration_history');
 assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
 assert.equal(lock.applied.length,820);
 assert.equal(sql.length,820);
 assert.equal(new Set(lock.applied.map(x=>x.version)).size,820);
 assert.deepEqual(sql.map(x=>x.slice(0,-4)),lock.applied.map(x=>x.version+'_'+x.name));
 assert.deepEqual(lock.applied.at(-2),{version:'20261110073500',name:'original_content_handoff_receipts_v1'});
 assert.deepEqual(lock.applied.at(-1),{version:'20261110120000',name:'powerhouse_outreach_research_wait_handoff_v1'});
});
test('commercial migration source present, no fake publication or revenue success',()=>{
 const source=readFileSync(new URL('../supabase/migrations/20261110120000_powerhouse_outreach_research_wait_handoff_v1.sql',import.meta.url),'utf8');
 assert.match(source,/powerhouse_commercial_action_closure_watchdog_v1/);
 const record=JSON.parse(readFileSync(new URL('../brain/learning/2026-11-10-provider-820-migration-lock-parity-v1.json',import.meta.url),'utf8'));
 assert.equal(record.evaluation.live_email_send_proven,false);
 assert.equal(record.evaluation.causal_revenue_uplift_proven,false);
});
