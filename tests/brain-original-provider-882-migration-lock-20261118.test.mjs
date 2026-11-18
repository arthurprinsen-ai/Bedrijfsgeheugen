import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const lock=JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json',import.meta.url),'utf8'));
const expected={version:'20261118174500',name:'original_provider_owner_notification_receipt_v3'};
test('native 882nd migration identity is exact and unique, never synthesized',()=>{
 assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
 assert.equal(lock.applied.length,882);
 assert.deepEqual(lock.applied.at(-1),expected);
 assert.equal(lock.applied.filter(x=>x.version===expected.version&&x.name===expected.name).length,1);
 assert.equal(new Set(lock.applied.map(x=>x.version)).size,lock.applied.length);
});
test('the independent native applied identity has matching original SQL source',()=>{
 const p=new URL('../supabase/migrations/'+expected.version+'_'+expected.name+'.sql',import.meta.url);
 assert.equal(existsSync(p),true);
 const sql=readFileSync(p,'utf8');
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_original_result_guardian_v1\(\)/i);
 assert.match(sql,/PENDING_VERIFIED_OWNER_NOTIFICATION/);
 assert.match(sql,/NOT_SENT_BY_GUARDIAN/);
});
