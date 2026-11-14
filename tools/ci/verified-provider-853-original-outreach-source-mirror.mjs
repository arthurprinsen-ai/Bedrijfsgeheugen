// One-time, exact native-provider-attested restoration of outreach source 852/853.
// Never generalize to unapplied migrations. Protected preview remains mandatory.
// Facts: Supabase native schema_migrations version 20261114080027 has ONE 11353-char
// statement whose actual native MD5 is 7f3b733b4f450b931b416bcaf9eac773.
// Its exact SQL matches protected source migration 20261114083500 on original
// main 7603fc67c85093bcd03328fa1e42f6c128200cbb. Do not replay either.
import {createHash} from 'node:crypto';

export const SOURCE_853_BASE='7603fc67c85093bcd03328fa1e42f6c128200cbb';
export const SOURCE_853_ORIGINAL='supabase/migrations/20261114083500_original_approved_connection_source_priming_v1.sql';
export const SOURCE_853_MIRROR='supabase/migrations/20261114080027_original_approved_connection_source_priming_v1.sql';
const VERSION_NAME='original_approved_connection_source_priming_v1';
const expected=(version)=>({version,name:VERSION_NAME});
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function verifyAlreadyApplied853OutreachMirror({
 baseSha='',baseLock,headLock,proposed=[],originalBaseSQL='',restoredSQL=''
}={}){
 const fail=reason=>Object.freeze({ok:false,reason});
 if(baseSha!==SOURCE_853_BASE)return fail('UNEXPECTED_PROTECTED_BASE');
 if(!baseLock||!headLock||!Array.isArray(baseLock.applied)||!Array.isArray(headLock.applied))
   return fail('PROVIDER_LOCK_MISSING');
 if(baseLock.source!=='supabase_migration_history'||baseLock.project_ref!=='adhjwmvyoixzjtmiroln')
   return fail('UNTRUSTED_ORIGINAL_PROVIDER_PROJECT');
 if(!eq(proposed,[SOURCE_853_MIRROR]))return fail('UNEXPECTED_MIGRATION_CHANGE');
 if(baseLock.applied.length!==851||headLock.applied.length!==853)
   return fail('UNEXPECTED_NATIVE_HISTORY_SIZE');
 if(!eq(baseLock.applied.at(-1),{version:'20261113190000',
   name:'original_seo_heartbeat_cro_consumer_receipt_v1'}))
   return fail('LAST_TRUSTED_NATIVE_IDENTITY_MISMATCH');
 if(!eq(headLock.applied.slice(0,851),baseLock.applied)
   ||!eq(headLock.applied.slice(851),[expected('20261114080027'),expected('20261114083500')]))
   return fail('PREEXISTING_HISTORY_DRIFT_OR_UNATTESTED_ADDITION');
 if(Object.keys(baseLock).sort().join('|')!==Object.keys(headLock).sort().join('|')
   ||headLock.source!==baseLock.source||headLock.project_ref!==baseLock.project_ref
   ||Object.keys(headLock).some(k=>!['applied','captured_at'].includes(k)&&!eq(headLock[k],baseLock[k]))
   ||!Number.isFinite(Date.parse(headLock.captured_at))
   ||Date.parse(headLock.captured_at)<Date.parse(baseLock.captured_at))
   return fail('NATIVE_LOCK_METADATA_DRIFT');
 const versions=headLock.applied.map(x=>x.version);
 if(new Set(versions).size!==versions.length || versions.some((v,i)=>i&&v<=versions[i-1]))
   return fail('INVALID_VERSION_ORDER_OR_DUPLICATE');
 if(!originalBaseSQL||originalBaseSQL!==restoredSQL)
   return fail('MIRROR_SQL_DIFFERS_FROM_PROTECTED_ORIGINAL');
 if(restoredSQL.length!==11353
   ||createHash('md5').update(restoredSQL,'utf8').digest('hex')!=='7f3b733b4f450b931b416bcaf9eac773')
   return fail('MIRROR_DIFFERS_FROM_NATIVE_PROVIDER_STATEMENTS_MD5');
 if(!/create or replace function public\.powerhouse_prime_approved_connection_research_v1\(/i.test(restoredSQL)
   ||!/perform public\.powerhouse_prime_approved_connection_research_v1\(p_run_date\)/i.test(restoredSQL)
   ||!restoredSQL.includes("'external_side_effect_allowed',false")
   ||!restoredSQL.includes("'recipient_authority_not_inferred',true")
   ||!restoredSQL.includes("revoke all on function public.powerhouse_prime_approved_connection_research_v1(date)")
   ||!/\bgrant execute on function public\.powerhouse_prime_approved_connection_research_v1\(date\)\s+to service_role/i.test(restoredSQL)
   ||/\b(?:drop\s+table|delete\s+from\s+supabase_migrations|cron\.schedule|net\.http_post)\b/i.test(restoredSQL))
   return fail('UNSAFE_OR_NONORIGINAL_SOURCE_SCOPE');
 return Object.freeze({ok:true,state:'EXACT_853_NATIVE_ALREADY_APPLIED_SOURCE_MIRROR',
   original:SOURCE_853_ORIGINAL,restored:SOURCE_853_MIRROR,
   original_provider_rows:851,verified_provider_rows:853,
   native_statements_md5:'7f3b733b4f450b931b416bcaf9eac773',
   hostedPreviewRequired:true,providerHistoryAttestedByCandidate:false,
   externalSendAuthorized:false});
}
