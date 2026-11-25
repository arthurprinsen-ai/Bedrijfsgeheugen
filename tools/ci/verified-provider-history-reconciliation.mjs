import {createHash} from 'node:crypto';
// One-time recovery for two provider-applied ORIGINAL Supabase versions.
// Immutable Git base (protected PR #5550) is the SQL authority; the hosted
// Supabase Preview independently confirms the provider ledger after this guard.
// Never generalize this to ordinary, unapplied PR migration candidates.
const BASE_SHA='3e55c792504ddbaf0916244213c58b9e827f120e';
const ORIGINAL_FILE='supabase/migrations/20261109152200_original_social_provider_refresh_learning_v1.sql';
const RESTORED_FILE='supabase/migrations/20261109152945_original_social_provider_refresh_learning_v1.sql';
const NAME='original_social_provider_refresh_learning_v1';
const identity=(version)=>({version,name:NAME});
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

export function verifyAlreadyApplied818HistoryReconciliation({
  baseSha='',baseLock,headLock,proposed=[],originalBaseSQL='',restoredSQL=''
}={}){
  const fail=reason=>Object.freeze({ok:false,reason});
  if(baseSha!==BASE_SHA)return fail('UNEXPECTED_PROTECTED_BASE');
  if(!baseLock||!headLock||!Array.isArray(baseLock.applied)||!Array.isArray(headLock.applied))
    return fail('MISSING_PROVIDER_LOCK');
  if(baseLock.source!=='supabase_migration_history'||baseLock.project_ref!=='adhjwmvyoixzjtmiroln')
    return fail('INVALID_PROVIDER_PROJECT');
  if(!eq(proposed,[RESTORED_FILE]))return fail('OTHER_MIGRATION_OR_MISSING_MIRROR');
  if(baseLock.applied.length!==816||headLock.applied.length!==818)
    return fail('INEXACT_PROVIDER_HISTORY_WINDOW');
  if(!eq(baseLock.applied.at(-1),{version:'20261106160000',name:'mira_original_pristine_waiting_asset_claim_v1'}))
    return fail('INVALID_LAST_TRUSTED_PROVIDER_IDENTITY');
  if(!eq(headLock.applied.slice(0,816),baseLock.applied)||
     !eq(headLock.applied.slice(816),[identity('20261109152200'),identity('20261109152945')]))
    return fail('PREEXISTING_HISTORY_CHANGED_OR_UNVERIFIED_TAIL');
  if(Object.keys(baseLock).sort().join('|')!==Object.keys(headLock).sort().join('|')||
     headLock.source!==baseLock.source||headLock.project_ref!==baseLock.project_ref||
     Object.keys(headLock).some(k=>!['applied','captured_at'].includes(k)&&!eq(headLock[k],baseLock[k]))||
     !Number.isFinite(Date.parse(headLock.captured_at))||
     Date.parse(headLock.captured_at)<Date.parse(baseLock.captured_at))
    return fail('PROVIDER_LOCK_METADATA_DRIFT');
  const versions=headLock.applied.map(x=>x.version);
  if(new Set(versions).size!==versions.length||versions.some((v,i)=>i&&v<=versions[i-1]))
    return fail('MIGRATION_ORDER_OR_DUPLICATE');
  if(!originalBaseSQL||originalBaseSQL!==restoredSQL)
    return fail('RESTORED_SQL_NOT_IDENTICAL_TO_PROTECTED_ORIGINAL');
  // Independent Supabase schema_migrations.statements digest (one original
  // provider-applied SQL statement at version 20261109152945, Nov 9 2026).
  // This is an immutable observation, NOT a self-attested PR manifest.
  if(createHash('md5').update(restoredSQL,'utf8').digest('hex')!=='0f713650278cf68f47011ec97ffd22f9')
    return fail('PROVIDER_APPLIED_SQL_DIGEST_MISMATCH');
  if(!originalBaseSQL.includes('create or replace function public.powerhouse_backfill_social_learning_applications_v1(')||
     !originalBaseSQL.includes("order by m.observed_at,m.source_event_id limit 4")||
     !originalBaseSQL.includes('revoke all on function public.powerhouse_backfill_social_learning_applications_v1(timestamptz)')||
     !originalBaseSQL.includes('grant execute on function public.powerhouse_backfill_social_learning_applications_v1(timestamptz)')||
     /\b(?:drop\s+table|delete\s+from\s+supabase_migrations|cron\.schedule|net\.http_post)\b/i.test(originalBaseSQL))
    return fail('PROTECTED_SQL_UNSAFE_OR_OUTSIDE_SINGLE_OWNER');
  return Object.freeze({ok:true,state:'EXACT_818_ALREADY_APPLIED_SOURCE_RECONCILIATION',
    protectedOriginal:ORIGINAL_FILE,restored:RESTORED_FILE,
    priorApplied:816,verifiedCandidateApplied:818,
    // Truth is not asserted from candidate files: protected hosted Preview must confirm.
    hostedPreviewRequired:true,providerHistoryAttestedByCandidate:false});
}
