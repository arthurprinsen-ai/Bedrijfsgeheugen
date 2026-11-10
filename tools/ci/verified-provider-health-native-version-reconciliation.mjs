import {createHash} from 'node:crypto';

// One-time, provider-evidenced correction of a *source filename* after the
// canonical Supabase management provider assigned a different applied version.
// This does not authorize another SQL application or relax admission of ANY
// other migration, historical deletion, or ordinary version renaming.
export const EXACT_BASE_SHA='40400729db629699289ce6bf6d84d4aac3878db2';
export const PROPOSAL='supabase/migrations/20261110153331_linkedin_org_readback_sticky_provider_health_v1.sql';
export const NATIVE='supabase/migrations/20261110160055_linkedin_org_readback_sticky_provider_health_v1.sql';
const NATIVE_VERSION='20261110160055';
const NAME='linkedin_org_readback_sticky_provider_health_v1';
const ORIGINAL_LAST={version:'20261110134500',name:'original_source_wait_is_not_send_v1'};
const DIGEST='f22aa2e366cf32a5a6770fedf8b2c126129b0101a125dd3216f456114319f8e5';
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

export function verifyNativeProviderHealthVersionReconciliation({
  baseSha='',changedMigrations=[],baseLock,headLock,baseSQL='',nativeSQL=''
}={}){
  const fail=reason=>Object.freeze({ok:false,reason});
  if(baseSha!==EXACT_BASE_SHA) return fail('UNRECOGNIZED_ORIGINAL_PROTECTED_BASE');
  if(!equal(changedMigrations,[
    {status:'D',file:PROPOSAL},{status:'A',file:NATIVE}
  ].sort((a,b)=>a.file.localeCompare(b.file))))
    return fail('MIGRATION_DIFF_NOT_EXACT_SINGLE_NATIVE_VERSION_RENAME');
  if(!baseLock||!headLock||!Array.isArray(baseLock.applied)||!Array.isArray(headLock.applied))
    return fail('MISSING_ORIGINAL_PROVIDER_HISTORY_LOCK');
  if(baseLock.source!=='supabase_migration_history'||headLock.source!==baseLock.source||
     baseLock.project_ref!=='adhjwmvyoixzjtmiroln'||headLock.project_ref!==baseLock.project_ref)
    return fail('UNKNOWN_PROVIDER_OR_HISTORY_SOURCE');
  if(baseLock.applied.length!==823||headLock.applied.length!==824||
     !equal(baseLock.applied.at(-1),ORIGINAL_LAST)||
     !equal(headLock.applied.slice(0,823),baseLock.applied)||
     !equal(headLock.applied.at(-1),{version:NATIVE_VERSION,name:NAME}))
    return fail('NATIVE_PROVIDER_HISTORY_IS_NOT_EXACT_APPEND_ONLY_824');
  if(Object.keys(baseLock).sort().join('|')!==Object.keys(headLock).sort().join('|')||
     Object.keys(headLock).some(key=>!['applied','captured_at'].includes(key)&&!equal(headLock[key],baseLock[key]))||
     !Number.isFinite(Date.parse(headLock.captured_at))||
     Date.parse(headLock.captured_at)<Date.parse(baseLock.captured_at))
    return fail('PROVIDER_HISTORY_METADATA_DRIFT');
  const versions=headLock.applied.map(x=>x.version);
  if(versions.some((v,i)=>i&&v<=versions[i-1])||
     new Set(versions).size!==versions.length||
     headLock.applied.some(x=>x.version==='20261110153331'))
    return fail('DUPLICATE_OR_STALE_PROPOSAL_VERSION');
  if(!baseSQL||nativeSQL!==baseSQL||
     Buffer.byteLength(nativeSQL,'utf8')!==3834||
     createHash('sha256').update(nativeSQL,'utf8').digest('hex')!==DIGEST)
    return fail('NATIVE_SQL_MUST_EQUAL_PROTECTED_AND_PROVIDER_READBACK_BYTES');
  // This is the independently observed official production statements digest,
  // fixed to one released 2026-11-10 provider source ID, not a PR declaration.
  if(!nativeSQL.includes('create or replace view public.powerhouse_provider_health_v1')||
     !nativeSQL.includes('security_invoker = true')||
     !nativeSQL.includes('from public, anon, authenticated;')||
     !nativeSQL.includes('provider_capability_readback_denied')||
     /\b(?:drop\s+table|delete\s+from\s+supabase_migrations|cron\.schedule|net\.http_post)\b/i.test(nativeSQL))
    return fail('SOURCE_RENAMED_SQL_LOST_SECURITY_OR_NO_REPLAY_GUARDS');
  return Object.freeze({
    ok:true,state:'EXACT_824_PROVIDER_APPLIED_NATIVE_VERSION_SOURCE_RECONCILIATION',
    originalProtectedBase:EXACT_BASE_SHA,from:PROPOSAL,to:NATIVE,
    sourceBytes:3834,providerObservedSha256:DIGEST,
    authoritativeProviderVersion:NATIVE_VERSION,originalAppliedCount:823,currentAppliedCount:824,
    hostedPreviewRequired:true,providerHistoryAttestedByCandidate:false,
    replayAppliedSql:false
  });
}
