import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { rowToRecord } from '../../brain/operating-loop/supabase-record-adapter.mjs';
import { evaluateApprovedCanonicalReviews } from '../../brain/observability/planned-action-review-queue.mjs';

export const AUDIT_FILE = '.artifacts/planned-action-independent-review-queue.json';
const CONTRACTS = ['PLANNED_ACTION_GUARD_OBSERVATION_V1','PLANNED_ACTION_INDEPENDENT_REVIEW_V1'];

export function trustedBrainReadConfig(env = process.env) {
  if (env.GITHUB_ACTIONS === 'true' && env.GITHUB_REF !== 'refs/heads/main') throw Error('REVIEW_AUDIT_TRUSTED_MAIN_REQUIRED');
  const url = String(env.BG_PORTAL_EU_SUPABASE_URL || env.SUPABASE_URL || '').trim().replace(/\/$/,'');
  const key = String(env.BG_PORTAL_EU_SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  let origin;
  try { const u = new URL(url);
    if (u.protocol==='https:' && !u.username && !u.password && !u.search && !u.hash
        && (u.pathname===''||u.pathname==='/') && /^[a-z0-9-]+\.supabase\.co$/i.test(u.hostname)) origin=u.origin;
  } catch {}
  if (!origin || !key) throw Error('REVIEW_AUDIT_CANONICAL_AUTH_UNAVAILABLE');
  return Object.freeze({origin,key});
}

export async function readCanonicalReviewCorpus({ config,fetchImpl=globalThis.fetch,days=30,now=new Date().toISOString() } = {}) {
  if (!config?.origin || !config?.key || typeof fetchImpl!=='function') throw Error('REVIEW_AUDIT_AUTH_REQUIRED');
  if (!Number.isInteger(days) || days<1 || days>365 || !Number.isFinite(Date.parse(now))) throw TypeError('review window invalid');
  const from = new Date(Date.parse(now) - 86400000*days).toISOString();
  const results=[];
  for(const contract of CONTRACTS) {
    const limit=500;
    for(let offset=0;offset<10000;offset+=limit) {
      const params=new URLSearchParams();
      params.set('tenant_id','eq.canonical');
      params.set('payload->>contract','eq.'+contract);
      params.set('observed_at','gte.'+from);
      params.set('order','observed_at.asc');
      params.set('limit',String(limit));
      params.set('offset',String(offset));
      params.set('select','tenant_id,record_id,record_type,record_kind,subject_id,correlation_id,owner_id,status,observed_at,verified,payload,source_revision');
      let response;
      try { response=await fetchImpl(config.origin+'/rest/v1/brain_records?'+params,{
        headers:{apikey:config.key,Authorization:'Bearer '+config.key,Accept:'application/json'},
        signal:AbortSignal.timeout(20000)
      });} catch { throw Error('REVIEW_AUDIT_PROVIDER_UNAVAILABLE'); }
      if (!response.ok) throw Error('REVIEW_AUDIT_PROVIDER_HTTP_'+response.status);
      let rows;
      try { rows=await response.json(); } catch { throw Error('REVIEW_AUDIT_PROVIDER_INVALID_JSON'); }
      if (!Array.isArray(rows) || rows.length>limit) throw Error('REVIEW_AUDIT_PROVIDER_INVALID_CARDINALITY');
      results.push(...rows.map(rowToRecord));
      if (rows.length<limit) break;
      if (offset+limit>=10000) throw Error('REVIEW_AUDIT_UNBOUNDED_CORPUS');
    }
  }
  return results;
}

export async function runReadOnlyReviewAudit({
  env=process.env,fetchImpl=globalThis.fetch,now=new Date().toISOString(),days=30,
}={}) {
  const config=trustedBrainReadConfig(env);
  const rows=await readCanonicalReviewCorpus({config,fetchImpl,now,days});
  const evaluated=await evaluateApprovedCanonicalReviews(rows,{
    now,days,githubToken:String(env.GH_TOKEN||env.GITHUB_TOKEN||''),
    fetchImpl,
  });
  return Object.freeze({ ...evaluated,
    independentAuthority:'GitHub provider-approved exact-head review + canonical BRAIN record',
    counts:{...evaluated.counts,providerRowsRead:rows.length},
    publicStatus:evaluated.metrics.verdict,
    releaseProof:'READ_ONLY_PROVIDER_CORPUS_AUDIT_NOT_A_PRODUCTION_RELEASE',
  });
}

async function main(){
  try {
    const result=await runReadOnlyReviewAudit();
    await mkdir('.artifacts',{recursive:true});
    await writeFile(AUDIT_FILE, JSON.stringify(result,null,2)+'\n');
    process.stdout.write(JSON.stringify({contract:result.contract,
      publicStatus:result.publicStatus,counts:result.counts,
      independentAttestationsVerified:result.independentAttestationsVerified,
      confusion:result.metrics.confusion,metrics:result.metrics.metrics,
      sample:result.metrics.sample,causalPrevention:result.metrics.causalPrevention})+'\n');
  } catch(error) {
    await mkdir('.artifacts',{recursive:true});
    await writeFile(AUDIT_FILE,JSON.stringify({
      contract:'PLANNED_ACTION_REAL_CORPUS_REVIEW_QUEUE_V1',
      publicStatus:'NOT_MEASURED',sourceReadback:'FAILED',metrics:null,
      failureCode:String(error?.message??'REVIEW_AUDIT_UNKNOWN_ERROR')
    },null,2)+'\n');
    process.stderr.write('REVIEW_AUDIT_FAILED:'+String(error?.message||'UNKNOWN')+'\n');
    process.exitCode=1;
  }
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
