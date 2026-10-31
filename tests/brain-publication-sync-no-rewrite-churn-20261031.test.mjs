import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const source=()=>readFile(new URL('../supabase/migrations/20261031133000_publication_sync_preserve_recovery_handoff_v1.sql',import.meta.url),'utf8');
const fn=(s)=>s.slice(s.indexOf('CREATE OR REPLACE FUNCTION public.sync_content_publication_obligations'));

test('original SQL sync never resets already-owned next_action while reconciling',async()=>{
 const sql=await source(),body=fn(sql);
 assert.match(body,/CREATE OR REPLACE FUNCTION public\.sync_content_publication_obligations\(p_from date/);
 assert.match(body,/SECURITY DEFINER\s+SET search_path TO 'public'/);
 assert.match(body,/on conflict \(tenant_id,publication_date,channel\) do update/i);
 const conflict=body.slice(body.indexOf('on conflict (tenant_id,publication_date,channel) do update'));
 assert.doesNotMatch(conflict,/next_action\s*=/i);
 assert.doesNotMatch(conflict,/(status|external_id|evidence|last_error|live_proven_at)\s*=/i);
 assert.match(conflict,/set experiment_id=excluded\.experiment_id,\s+content_kind=excluded\.content_kind,/);
 assert.match(conflict,/where \(content_publication_obligations\.experiment_id,\s+content_publication_obligations\.content_kind\)\s+is distinct from\s+\(excluded\.experiment_id,excluded\.content_kind\)/);
 assert.match(conflict,/get diagnostics v_count=row_count/);
 assert.match(conflict,/end;\$function\$;/);
 assert.match(sql,/REVOKE EXECUTE ON FUNCTION public\.sync_content_publication_obligations\(date,date\)\s+FROM PUBLIC, anon, authenticated;/);
});
test('the same original insertion still establishes four genuine obligations without new provider side effects',async()=>{
 const sql=await source();
 assert.match(sql,/insert into public\.content_publication_obligations\(/);
 assert.match(sql,/from public\.social_experiments e/);
 assert.match(sql,/e\.tenant_id='canonical'/);
 assert.match(sql,/ch\.channel in \('linkedin_personal','linkedin_company','instagram','blog'\)/);
 assert.match(sql,/,\s*'PLANNED'\s*,/);
 assert.match(sql,/next_action,updated_at/);
 assert.doesNotMatch(sql,/\bnet\.http_post\b|\bcron\.schedule\b|\bprovider_create\b|\bexecute\s+http/i);
});
test('existing original handoff writer keeps the same one-loop CAS and independent proof',async()=>{
 const code=await readFile(new URL('../supabase/functions/powerhouse-content-loop/index.ts',import.meta.url),'utf8');
 assert.match(code,/planOriginalPublicationHandoffs\(recovery,obligations\|\|\[\]\)/);
 assert.match(code,/\.eq\('channel',handoff\.channel\)\.eq\('next_action',handoff\.previous\)/);
 assert.match(code,/\.eq\('external_id',null\)/);
 assert.match(code,/const TERMINAL_GREEN = new Set\(\['LIVE_PROVEN','MEASURED','LEARNED'\]\)/);
 assert.match(code,/const LOOP_LEASE_MS = 240_000/);
});

test('original ONE BRAIN portal renders only sanitized measured handoff churn without false green',async()=>{
 const [guard,portal]=await Promise.all([
  readFile(new URL('../brain/observability/one-loop-guard-diagnostics.mjs',import.meta.url),'utf8'),
  readFile(new URL('../portal-v2/modules/powerhouse-observability.js',import.meta.url),'utf8')]);
 assert.match(guard,/function safePublicationHandoffWriteback\(row,receipt\)/);
 assert.match(guard,/handoff\?\.contract!=='original-publication-obligation-recovery-v1'/);
 assert.match(guard,/Number\.isSafeInteger\(handoff\[k\]\)/);
 assert.match(guard,/publicationHandoffWriteback:safePublicationHandoffWriteback\(row,receipt\)/);
 assert.match(portal,/publicationHandoffWriteback/);
 assert.match(portal,/data-publication-handoff-writeback/);
 assert.match(portal,/Werkelijke publicatie vereist apart providerbewijs/);
 assert.match(portal,/data-publication-recovery="RECOVERY_DUE"/);
});
