import {createHash} from 'node:crypto';

// One-time provider-attested historical source restoration. NOT a generic
// exception to migration admission. The native production schema_migrations
// table was queried independently 24 Nov 2026 for all four exact versions,
// name identities and each original statements[1] MD5. SQL was applied
// already. The protected original social source contains a redundant ";\n"
// suffix relative to the native statements[1], proved independently by
// native statements[1] == originalGitSource.slice(0,-2) for ALL four.
//
// Never reapply provider SQL, edit provider history, waive normal migrations,
// or reuse these attestations for another Git base/branch/source revision.
export const EXACT_ORIGINAL_896_BASE='f0921c24e730d983fed3fb3f225a04fd7e1c5d72';
export const EXACT_ORIGINAL_896_PROVIDER_PROJECT='adhjwmvyoixzjtmiroln';
// Already protected, but NOT provider-applied: exact original #6138 bytes.
export const ORIGINAL_896_PENDING_MIRA=Object.freeze({
 version:'20261124063700',name:'mira_original_exact_job_claim_v1',
 file:'supabase/migrations/20261124063700_mira_original_exact_job_claim_v1.sql',
 blob:'2408396c3423e7c93c1d1b58d65d921c21737482'
});
export const ORIGINAL_896_FILES=Object.freeze([
 Object.freeze({version:'20261124063737',name:'original_social_loop_comparable_provider_windows',
  file:'supabase/migrations/20261124063737_original_social_loop_comparable_provider_windows.sql',
  blob:'7539984b8e8929700e219842dba30d563c2e071f',
  native_statement_md5:'e6880cd1a3b70097ae2b477bebc2cfd6'}),
 Object.freeze({version:'20261124063938',name:'original_social_analyst_variant_rotation_and_proof',
  file:'supabase/migrations/20261124063938_original_social_analyst_variant_rotation_and_proof.sql',
  blob:'36949527558ad6c0e0a85bd98b0ea7c43ece1fb5',
  native_statement_md5:'6855074f8eb8c2723e21cc931a5e1050'}),
 Object.freeze({version:'20261124064216',name:'original_personal_artifact_evidence_lossless_normalization',
  file:'supabase/migrations/20261124064216_original_personal_artifact_evidence_lossless_normalization.sql',
  blob:'5c7f013f9cc253fd4837a7cf03222c6122d35c44',
  native_statement_md5:'efd6420d1a0a6cfc6e601cb3a91ff012'}),
 Object.freeze({version:'20261124064859',name:'original_personal_observational_analyst',
  file:'supabase/migrations/20261124064859_original_personal_observational_analyst.sql',
  blob:'bdc24987007d4726b89557930064292139899851',
  native_statement_md5:'000e953a8df582f4aed591a458000fe3'})
]);
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const md5=s=>createHash('md5').update(s,'utf8').digest('hex');
const gitBlob=s=>{
 const b=Buffer.from(s,'utf8');
 return createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
};
export function verifyOriginalProvider896SourceLockReconciliation({
 baseSha='',baseLock,headLock,changedMigrations=[],sourceSQL={},pendingBaseSQL,pendingHeadSQL
}={}){
 const fail=reason=>Object.freeze({ok:false,reason});
 if(baseSha!==EXACT_ORIGINAL_896_BASE) return fail('UNEXPECTED_PROTECTED_BASE');
 if(!baseLock||!headLock||!Array.isArray(baseLock.applied)||!Array.isArray(headLock.applied))
  return fail('MISSING_ORIGINAL_PROVIDER_HISTORY');
 if(baseLock.project_ref!==EXACT_ORIGINAL_896_PROVIDER_PROJECT
  ||baseLock.source!=='supabase_migration_history'
  ||headLock.source!==baseLock.source||headLock.project_ref!==baseLock.project_ref)
  return fail('ORIGINAL_PROVIDER_IDENTITY_MISMATCH');
 if(baseLock.applied.length!==892||headLock.applied.length!==896
  ||!equal(baseLock.applied.at(-1),{version:'20261123214500',name:'personal_founder_perspective_v2_materializer_alignment'}))
  return fail('EXACT_892_TO_896_COUNT_OR_OLD_TAIL_REQUIRED');
 if(!equal(headLock.applied.slice(0,892),baseLock.applied)
  ||!equal(headLock.applied.slice(892),ORIGINAL_896_FILES.map(x=>({version:x.version,name:x.name}))))
  return fail('PROTECTED_PREFIX_OR_NATIVE_TAIL_CHANGED');
 const all=headLock.applied.map(x=>x.version);
 if(new Set(all).size!==all.length||all.some((v,i)=>i>0&&v<=all[i-1]))
  return fail('HISTORY_DUPLICATE_OR_ORDER_CHANGED');
 if(!equal(Object.keys(baseLock).sort(),Object.keys(headLock).sort())
  ||Object.keys(headLock).some(k=>!['applied','captured_at'].includes(k)&&!equal(baseLock[k],headLock[k]))
  ||!Number.isFinite(Date.parse(headLock.captured_at))
  ||Date.parse(headLock.captured_at)<Date.parse(baseLock.captured_at))
  return fail('LOCK_METADATA_NOT_APPEND_ONLY');
 if(!equal(changedMigrations,ORIGINAL_896_FILES.map(x=>({status:'A',file:x.file}))))
  return fail('DIFFERENT_MIGRATION_DIFF_OR_HISTORICAL_REWRITE');
 // The exact #6138 proposal must remain in Git and in native preview.
 // It is outside the historic applied-ledger test population, never applied proof.
 const pending=ORIGINAL_896_PENDING_MIRA;
 if(baseLock.applied.some(x=>x.version===pending.version||x.name===pending.name)
  ||headLock.applied.some(x=>x.version===pending.version||x.name===pending.name)
  ||typeof pendingBaseSQL!=='string'||typeof pendingHeadSQL!=='string'
  ||pendingBaseSQL!==pendingHeadSQL||gitBlob(pendingBaseSQL)!==pending.blob)
  return fail('PENDING_MIRA_EXACT_PROTECTED_SOURCE_REQUIRED');
 if(Object.keys(sourceSQL).length!==ORIGINAL_896_FILES.length)
  return fail('EXACT_FOUR_SOURCES_REQUIRED');
 for(const x of ORIGINAL_896_FILES){
  const s=sourceSQL[x.file];
  if(typeof s!=='string'||!s.endsWith(';;\n'))return fail('SOURCE_TERMINATOR_OR_TEXT_UNEXPECTED:'+x.version);
  if(gitBlob(s)!==x.blob)return fail('GIT_SOURCE_BLOB_CHANGED:'+x.version);
  const providerNativeStatement=s.slice(0,-2); // strip ONLY redundant ";\n"
  if(md5(providerNativeStatement)!==x.native_statement_md5)
   return fail('NATIVE_PROVIDER_STATEMENT_MD5_MISMATCH:'+x.version);
  if(/\b(?:drop\s+table|delete\s+from\s+supabase_migrations|cron\.schedule|net\.http_post)\b/i.test(s))
   return fail('DANGEROUS_NATIVE_SQL_SIDE_EFFECT:'+x.version);
 }
 return Object.freeze({
  ok:true,state:'EXACT_ORIGINAL_NATIVE_896_APPLIED_SOURCE_AND_LOCK_RECONCILIATION',
  fixed_protected_base:baseSha,original_provider:EXACT_ORIGINAL_896_PROVIDER_PROJECT,
  prior_immutable_versions:892,provider_applied_versions:896,
  exact_restored_files:ORIGINAL_896_FILES.map(x=>x.file),
  pending_protected_source:pending.file,pending_protected_source_applied:false,
  attested_native_statement_md5:ORIGINAL_896_FILES.map(x=>x.native_statement_md5),
  provider_history_attested_by_candidate:false,
  no_sql_replay_authorized:true,hosted_preview_required:true
 });
}
