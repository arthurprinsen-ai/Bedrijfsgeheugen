import {createHash} from 'node:crypto';

// Narrow, one-time ORIGINAL provider ledger repair for two genuinely applied
// 2026-11-14 migrations that were missing in the Git source lock.
// This is not a permission to rewrite an applied SQL file, bypass source review,
// or claim a new (854) migration is already live.
export const OUTREACH_BASE_SHA='7603fc67c85093bcd03328fa1e42f6c128200cbb';
export const RESTORED_852='supabase/migrations/20261114080027_original_approved_connection_source_priming_v1.sql';
export const APPLIED_853='supabase/migrations/20261114083500_original_approved_connection_source_priming_v1.sql';
export const PROPOSED_854='supabase/migrations/20261114091500_original_outreach_source_research_cooldown_scope_v2.sql';
const NAME='original_approved_connection_source_priming_v1';
const PROVIDER_NATIVE_852_MD5='7f3b733b4f450b931b416bcaf9eac773';
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const id=(v)=>({version:v,name:NAME});

export function verifyProvider852853OutreachReconciliation({
  baseSha='',changedMigrations=[],baseLock,headLock,
  originalSQL='',restored852SQL='',hotfixSQL=''
}={}){
  const fail=reason=>Object.freeze({ok:false,reason});
  if(baseSha!==OUTREACH_BASE_SHA)return fail('NOT_EXACT_PROTECTED_BASE');
  if(!eq([...changedMigrations].sort((a,b)=>a.file.localeCompare(b.file)),[
    {status:'A',file:RESTORED_852},{status:'A',file:PROPOSED_854}
  ].sort((a,b)=>a.file.localeCompare(b.file))))
    return fail('MIGRATION_DIFF_OUTSIDE_EXACT_852_RECOVERY_PLUS_854_CANDIDATE');

  if(!baseLock||!headLock||!Array.isArray(baseLock.applied)||!Array.isArray(headLock.applied))
    return fail('MISSING_PROVIDER_LOCK');
  if(baseLock.source!=='supabase_migration_history'||headLock.source!==baseLock.source||
     baseLock.project_ref!=='adhjwmvyoixzjtmiroln'||headLock.project_ref!==baseLock.project_ref)
    return fail('NONCANONICAL_PROVIDER');
  if(baseLock.applied.length!==851||headLock.applied.length!==853||
     !eq(baseLock.applied[850],{version:'20261113190000',name:'original_seo_heartbeat_cro_consumer_receipt_v1'})||
     !eq(headLock.applied.slice(0,851),baseLock.applied)||
     !eq(headLock.applied.slice(851),[id('20261114080027'),id('20261114083500')]))
    return fail('PROVIDER_APPLIED_852_853_NOT_EXACT_APPEND');
  if(Object.keys(baseLock).sort().join('|')!==Object.keys(headLock).sort().join('|')||
     Object.keys(headLock).some(k=>!['applied','captured_at'].includes(k)&&!eq(headLock[k],baseLock[k]))||
     !Number.isFinite(Date.parse(headLock.captured_at))||
     Date.parse(headLock.captured_at)<Date.parse(baseLock.captured_at))
    return fail('HISTORICAL_META_REWRITTEN');
  const versions=headLock.applied.map(x=>x.version);
  if(new Set(versions).size!==versions.length||versions.some((v,i)=>i&&v<=versions[i-1]))
    return fail('HISTORY_ORDER_OR_DUPLICATE');

  // Verified native provider schema_migrations.statements[1] at 852 was
  // byte-identical to this protected 853 SQL (11353 chars; MD5 below).
  if(!originalSQL||restored852SQL!==originalSQL||
     Buffer.byteLength(restored852SQL,'utf8')!==11353||
     createHash('md5').update(restored852SQL,'utf8').digest('hex')!==PROVIDER_NATIVE_852_MD5)
    return fail('RESTORED_852_SQL_NOT_PROVIDER_PROVEN_OR_ORIGINAL');
  if(!originalSQL.includes('powerhouse_prime_approved_connection_research_v1')||
     !originalSQL.includes('powerhouse_execute_relationship_research_v1')||
     !originalSQL.includes("'external_side_effect_allowed',false")||
     !originalSQL.includes('from public,anon,authenticated;')||
     /\b(?:drop\s+table|delete\s+from\s+supabase_migrations|cron\.schedule|net\.http_post)\b/i.test(originalSQL))
    return fail('ORIGINAL_852_853_SQL_LOST_NON_SEND_GUARDS');

  // New 854 remains a PROPOSAL. It is handled by ordinary unchanged
  // migration-version, SQL and hosted Preview gates after the above attestation.
  if(!hotfixSQL.includes('create or replace function public.powerhouse_prime_approved_connection_research_v1')||
     !hotfixSQL.includes("nullif(a.evidence#>>'{public_research_execution,researched_at}','') is not null")||
     !hotfixSQL.includes("a.dedupe_key like 'relationship-research:approved-source:%'")||
     !hotfixSQL.includes("a.dedupe_key like 'relationship-research:outreach-source:%'")||
     !hotfixSQL.includes("'external_side_effect_allowed',false")||
     !hotfixSQL.includes('from public,anon,authenticated;')||
     /\b(?:drop\s+table|delete\s+from\s+supabase_migrations|cron\.schedule|net\.http_post)\b/i.test(hotfixSQL))
    return fail('NEW_854_BREAKS_SOURCE_ONLY_GUARDS');

  return Object.freeze({ok:true,
    state:'EXACT_NATIVE_852_853_OUTREACH_SOURCE_RECONCILIATION_WITH_854_PROPOSAL',
    protectedBase:OUTREACH_BASE_SHA,nativeProviderVerified852Md5:PROVIDER_NATIVE_852_MD5,
    appliedBefore:851,originalProviderAppliedNow:853,restoredHistoricalSource:RESTORED_852,
    newUnappliedMigration:PROPOSED_854,
    hostedPreviewRequired:true,providerApplied854:false,
    permissionToSendMail:false});
}
