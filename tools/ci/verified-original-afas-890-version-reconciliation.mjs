import {createHash} from 'node:crypto';
// One-time cryptographically pinned correction for *one provider-applied* AFAS
// migration. Only the protected base exactly below can reconcile this source
// filename; other historical deletions/renames remain forbidden.
export const EXACT_AFAS_BASE_SHA='933592191851cbd539b0c336fefb49b5a75106d3';
export const AFAS_SOURCE_PROPOSAL='supabase/migrations/20261122162000_portal_connector_real_afas_source_readback_v1.sql';
export const AFAS_NATIVE_SOURCE='supabase/migrations/20261122162147_portal_connector_real_afas_source_readback_v1.sql';
const VERSION='20261122162147';
const NAME='portal_connector_real_afas_source_readback_v1';
const SOURCE_BYTES=5569;
const VERIFIED_SQL_SHA256='f9e47051fe44931a1c48e7f7b271b803fd819a82c023fd1243213fb751fc293d';
const NATIVE_STATEMENT_MD5='c06f2b2d0392a57ca383cf0dddb0eb3c';
// Independent original Supabase mgmt list_migrations and native SQL:
// version 20261122162147, name above, statement count 1, provider statement MD5
// c06f2b2d... exactly equals the protected source file MD5.
const equals=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function verifyOriginalAfas890VersionReconciliation({
 baseSha='',changedMigrations=[],baseLock,headLock,baseSQL='',nativeSQL=''
}={}){
 const deny=reason=>Object.freeze({ok:false,reason});
 if(baseSha!==EXACT_AFAS_BASE_SHA)return deny('ORIGINAL_AFAS_PROTECTED_BASE_MISMATCH');
 if(!equals(changedMigrations,[
  {status:'D',file:AFAS_SOURCE_PROPOSAL},
  {status:'A',file:AFAS_NATIVE_SOURCE}
 ].sort((a,b)=>a.file.localeCompare(b.file))))
  return deny('AFAS_MIGRATION_DIFF_NOT_EXACT_ONE_RENAME');
 if(!baseLock||!headLock||!Array.isArray(baseLock.applied)||!Array.isArray(headLock.applied))
  return deny('AFAS_MIGRATION_PROVIDER_LOCK_MISSING');
 if(baseLock.source!=='supabase_migration_history'||
    baseLock.project_ref!=='adhjwmvyoixzjtmiroln'||
    headLock.source!==baseLock.source||headLock.project_ref!==baseLock.project_ref)
  return deny('ORIGINAL_AFAS_PROVIDER_PROJECT_MISMATCH');
 if(baseLock.applied.length!==889||headLock.applied.length!==890||
    !equals(baseLock.applied.at(-1),{version:'20261121090000',name:'reconnect_original_email_reply_in_commercial_stage14'})||
    !equals(headLock.applied.slice(0,889),baseLock.applied)||
    !equals(headLock.applied.at(-1),{version:VERSION,name:NAME}))
  return deny('AFAS_PROVIDER_LOCK_NOT_EXACT_APPEND_ONLY_890');
 if(Object.keys(baseLock).sort().join('|')!==Object.keys(headLock).sort().join('|')||
    Object.keys(headLock).some(k=>!['applied','captured_at'].includes(k)&&!equals(headLock[k],baseLock[k]))||
    !Number.isFinite(Date.parse(headLock.captured_at))||
    Date.parse(headLock.captured_at)<Date.parse(baseLock.captured_at))
  return deny('AFAS_PROVIDER_LOCK_METADATA_DRIFT');
 const versions=headLock.applied.map(r=>r.version);
 if(new Set(versions).size!==versions.length||versions.some((v,i)=>i>0&&v<=versions[i-1])||
    headLock.applied.some(x=>x.version==='20261122162000'))
  return deny('AFAS_DUPLICATE_OR_UNAPPLIED_PROPOSAL_VERSION');
 if(!baseSQL||baseSQL!==nativeSQL||Buffer.byteLength(nativeSQL,'utf8')!==SOURCE_BYTES||
    createHash('sha256').update(nativeSQL,'utf8').digest('hex')!==VERIFIED_SQL_SHA256||
    createHash('md5').update(nativeSQL,'utf8').digest('hex')!==NATIVE_STATEMENT_MD5)
  return deny('AFAS_SOURCE_SQL_NOT_EXACT_PROVIDER_STATEMENT_BYTES');
 if(!nativeSQL.includes('create table if not exists public.connector_source_snapshots_v1')||
    !nativeSQL.includes('grant execute on function public.connector_afas_vault_read(uuid,uuid) to service_role;')||
    !nativeSQL.includes('revoke all on function public.connector_afas_vault_read')||
    !nativeSQL.includes('alter table public.connector_source_snapshots_v1 enable row level security;')||
    /\b(?:cron\.schedule|net\.http_post|delete\s+from\s+supabase_migrations)\b/i.test(nativeSQL))
  return deny('AFAS_SOURCE_SQL_SECURITY_CONTRACT_MISSING');
 return Object.freeze({
  ok:true,state:'EXACT_890_ORIGINAL_AFAS_PROVIDER_APPLIED_SOURCE_RECONCILIATION',
  protectedBase:EXACT_AFAS_BASE_SHA,sourceFrom:AFAS_SOURCE_PROPOSAL,sourceTo:AFAS_NATIVE_SOURCE,
  sourceBytes:SOURCE_BYTES,sourceSHA256:VERIFIED_SQL_SHA256,
  providerStatementMD5:NATIVE_STATEMENT_MD5,providerVersion:VERSION,
  sourceAppliedBefore:889,sourceAppliedAfter:890,
  providerEvidence:'INDEPENDENT_SUPABASE_LIST_MIGRATIONS_AND_SCHEMA_MIGRATIONS_STATEMENT_MD5',
  newSQLExecuted:false,hostedPreviewRequired:true,
  genericHistoricalRenameAllowed:false
 });
}
