import {createHash} from 'node:crypto';

// One-time, original-provider-backed recovery, not a generic migration-lock waiver.
// Native Supabase production schema_migrations on 2026-11-20 attested 888
// consecutive version/name identities. This candidate is pinned to the exact
// protected main where the source lock still had 886 immutable records.
// Version 887 security SQL is restored byte-for-byte from provider.statements[1];
// version 888 original founder-policy SQL is already in protected main.
// Any change of base, source SQL, lock prefix, role boundary or candidate path
// must fail closed. Hosted provider preview and the original merge gates still run.
export const EXACT_PROVIDER_888_BASE='a5684e6b376271b37eb27853a826f147c7425d6a';
export const ORIGINAL_SECURITY_SQL_PATH='supabase/migrations/20261120134537_security_pw_mo14_private_player_data_20261120.sql';
export const ORIGINAL_FOUNDER_SQL_PATH='supabase/migrations/20261120143500_personal_verified_founder_source_v2_policy_alignment.sql';
export const EXPECTED_PROVIDER_888_TAIL=Object.freeze([
 Object.freeze({version:'20261120134537',name:'security_pw_mo14_private_player_data_20261120'}),
 Object.freeze({version:'20261120143500',name:'personal_verified_founder_source_v2_policy_alignment'})
]);
export const VERIFIED_SECURITY_PROVIDER_MD5='87410f524c200d30bfaf64a4e72d02ee';

const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const hash=(text)=>createHash('md5').update(String(text),'utf8').digest('hex');

export function verifyAlreadyAppliedProvider888SourceLockRecovery({
 baseSha='',baseLock,headLock,changedMigrations=[],securitySQL='',founderSQL=''
}={}){
 const reject=reason=>Object.freeze({ok:false,reason});
 if(baseSha!==EXACT_PROVIDER_888_BASE)return reject('UNEXPECTED_PROTECTED_BASE');
 if(!baseLock||!headLock||!Array.isArray(baseLock.applied)||!Array.isArray(headLock.applied))
  return reject('MISSING_PROTECTED_LOCK');
 if(!same(changedMigrations,[{status:'A',file:ORIGINAL_SECURITY_SQL_PATH}]))
  return reject('UNEXPECTED_MIGRATION_SOURCE_CHANGE');
 if(baseLock.source!=='supabase_migration_history'||headLock.source!==baseLock.source
    ||baseLock.project_ref!=='adhjwmvyoixzjtmiroln'||headLock.project_ref!==baseLock.project_ref)
  return reject('INVALID_ORIGINAL_PROVIDER_PROJECT');
 if(baseLock.applied.length!==886||headLock.applied.length!==888)
  return reject('EXACT_PROVIDER_HISTORY_COUNT_REQUIRED');
 if(!same(baseLock.applied.at(-1),{version:'20261119090500',name:'company_signal_word_boundary_verified_entity_v1'}))
  return reject('PROTECTED_HISTORY_TAIL_UNEXPECTED');
 if(!same(headLock.applied.slice(0,886),baseLock.applied)
    ||!same(headLock.applied.slice(886),EXPECTED_PROVIDER_888_TAIL))
  return reject('PROTECTED_HISTORY_PREFIX_OR_APPLIED_TAIL_DRIFT');
 if(Object.keys(baseLock).sort().join('|')!==Object.keys(headLock).sort().join('|')
    ||Object.keys(headLock).some(k=>!['applied','captured_at'].includes(k)&&!same(headLock[k],baseLock[k]))
    ||!Number.isFinite(Date.parse(headLock.captured_at))
    ||Date.parse(headLock.captured_at)<Date.parse(baseLock.captured_at))
  return reject('IMMUTABLE_LOCK_METADATA_DRIFT');
 const versions=headLock.applied.map(x=>x.version);
 if(new Set(versions).size!==versions.length||versions.some((v,i)=>i>0&&v<=versions[i-1]))
  return reject('HISTORY_ORDER_OR_DUPLICATE');
 if(!securitySQL||hash(securitySQL)!==VERIFIED_SECURITY_PROVIDER_MD5)
  return reject('PROVIDER_SECURITY_SQL_BYTES_NOT_EXACT');
 // This is NOT authorization to disable RLS: it only restores an already
 // executed, exact-byte private-minors security migration.
 if(!securitySQL.includes('ALTER TABLE public.pw_beoordelingen ENABLE ROW LEVEL SECURITY;')
   ||!securitySQL.includes('ALTER TABLE public.pw_opstellingen ENABLE ROW LEVEL SECURITY;')
   ||!securitySQL.includes('COMMENT ON TABLE public.pw_beoordelingen')
   ||!securitySQL.trimEnd().endsWith('COMMIT;'))
  return reject('SOURCE_SECURITY_RLS_CONTRACT_DRIFT');
 if(!founderSQL.includes('CREATE OR REPLACE FUNCTION public.powerhouse_materialize_source_backed_channel_candidates_v2')
   ||!founderSQL.includes('is_verified_user_founder')
   ||!founderSQL.includes('REVOKE ALL ON FUNCTION public.powerhouse_materialize_source_backed_channel_candidates_v2(date)')
   ||!founderSQL.includes('GRANT EXECUTE ON FUNCTION public.powerhouse_materialize_source_backed_channel_candidates_v2(date)')
   ||!founderSQL.includes('TO service_role'))
  return reject('PROTECTED_ORIGINAL_FOUNDER_SQL_DRIFT');
 return Object.freeze({
  ok:true,state:'EXACT_NATIVE_888_ALREADY_APPLIED_SOURCE_AND_LOCK_RECONCILIATION',
  fixed_protected_base:baseSha,
  original_provider_project:'adhjwmvyoixzjtmiroln',
  restored_source:ORIGINAL_SECURITY_SQL_PATH,
  original_founder_source:ORIGINAL_FOUNDER_SQL_PATH,
  base_provider_versions:886,
  exact_provider_applied_versions:888,
  hosted_preview_required:true,
  provider_history_attested_by_candidate:false,
  no_sql_replay_authorized:true,
  security_sql_md5:VERIFIED_SECURITY_PROVIDER_MD5
 });
}
