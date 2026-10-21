if(!process.env.PGLITE_MODULE_URL)throw new Error('ISOLATED_PGLITE_MODULE_URL_REQUIRED');
const {PGlite}=await import(process.env.PGLITE_MODULE_URL);
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url).pathname;
const {createPortalBusinessInputHandler}=await import(root+'platform/api/portal-business-input-handler.mjs');
const db=new PGlite();
await db.exec('create role anon; create role authenticated; create role service_role;');
await db.exec(readFileSync(root+'supabase/migrations/20260831071514_whole_brain_canonical_records.sql','utf8'));
await db.exec(readFileSync(root+'supabase/migrations/20260831164051_brain_ai_governance_projection.sql','utf8').split('create or replace function')[0]);
const append=async({record:r,idempotencyKey,sourceRevision})=>{
 const args=[r.tenantId,r.id,r.type,r.kind,r.subjectId,r.correlationId,r.predecessorIds,r.owner,r.status,r.observedAt,r.executed,r.verified,r.result,r.evidenceIds,r.provenance,r.payload,idempotencyKey,sourceRevision];
 const result=await db.query('select * from public.brain_append_record('+args.map((_,i)=>'$'+(i+1)).join(',')+')',args);
 return {authority:'supabase:brain_records',record:result.rows[0]};
};
const handler=tenant=>createPortalBusinessInputHandler({getUser:async()=>({id:'user-'+tenant,app_metadata:{tenantId:tenant}}),authority:{append},store:{getLayer:async()=>null,putCanonical:async(_tenant,record)=>({stored:true,record})}});
const request=()=>new Request('https://www.bedrijfsgeheugen.nl/api/portal-business-input',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({inputType:'StrategyCanvas',modelId:'strategy-dna',answers:{ambition:'Test fixture'},sourcePortal:'portal-v2',submittedAt:'2026-10-21T06:10:00.000Z'})});
const before=await handler('fixture-a')(request());assert.equal(before.status,502);assert.equal((await before.json()).error,'RAW_SOURCE_WRITE_FAILED');
await db.exec(readFileSync(root+'supabase/migrations/20261021060606_portal_brain_input_taxonomy_v1.sql','utf8'));
for(const tenant of ['fixture-a','fixture-b'])for(let n=0;n<2;n++){
 const response=await handler(tenant)(request());assert.equal(response.status,200,JSON.stringify(await response.clone().json()));
}
assert.equal((await db.query('select count(*)::int as n from brain_records')).rows[0].n,8);
assert.equal((await db.query('select count(distinct tenant_id)::int as n from brain_records')).rows[0].n,2);
await assert.rejects(db.query("insert into brain_records (tenant_id,record_id,record_type,record_kind,subject_id,observed_at,idempotency_key) values ('fixture-a','bad','FabricatedApproval','unverified_override','bad',now(),'bad')"));
const controls=await db.query("select relrowsecurity from pg_class where oid='public.brain_records'::regclass");assert.equal(controls.rows[0].relrowsecurity,true);
await db.exec(readFileSync(root+'supabase/migrations/20261021060606_portal_brain_input_taxonomy_v1.sql','utf8'));
console.log('PostgreSQL: original 502 reproduced; migration applied twice; two fixture tenants each store four real writer records; replay deduplicates; invalid taxonomy rejected; RLS preserved. This is isolated DB validation, not customer acceptance.');
await db.close();
