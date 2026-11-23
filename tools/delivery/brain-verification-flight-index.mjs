// Read-only exact-head BRAIN workflow flight index for the EXISTING terminal owner.
// GitHub indexes workflow_dispatch under the main SHA, not the PR candidate SHA.
// Absence is safe to use for dispatch only after every native pagination page is read.
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

const TITLE=/^BRAIN delivery PR #[1-9]\d* [0-9a-f]{40}$/i;
const ACTIVE=new Set(['queued','requested','pending','in_progress','waiting']);

/** An exact PR-number verification flight cannot predate provider PR creation.
 * Preserve ten minutes of skew while failing closed on invalid provider time. */
export function originalBrainFlightSince(prCreatedAt){
  const raw=String(prCreatedAt||'');
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(raw))
    throw new TypeError('BRAIN_PROVIDER_PR_CREATED_AT_INVALID');
  const ms=Date.parse(raw);
  if(!Number.isFinite(ms)||new Date(ms).toISOString()!==raw.replace(/Z$/,'.000Z'))
    throw new TypeError('BRAIN_PROVIDER_PR_CREATED_AT_INVALID');
  return new Date(ms-10*60000).toISOString().replace('.000Z','Z');
}

export function classifyOriginalBrainFlightPages(pages,expectedTitle,{since=null}={}){
  if(!TITLE.test(String(expectedTitle||'')))
    return {status:'INVALID_EXACT_CANDIDATE',complete:false,safe_to_dispatch:false};
  if(!Array.isArray(pages)||pages.length===0||
     !pages.every(p=>p&&Array.isArray(p.workflow_runs)&&Number.isSafeInteger(p.total_count)&&p.total_count>=0))
    return {status:'PROVIDER_PAGINATION_INVALID',complete:false,safe_to_dispatch:false};
  const total=pages[0].total_count;
  // GitHub Actions filtered workflow-run search stops at 1,000 results.
  // Never report an absent exact run at the provider search cap.
  if(total>=1000)
    return {status:'PROVIDER_SEARCH_CAP_UNPROVEN',complete:false,
      provider_total:total,safe_to_dispatch:false};
  if(since!==null&&(typeof since!=='string'||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(since)||
    !Number.isFinite(Date.parse(since))))
    return {status:'PROVIDER_CREATED_FILTER_INVALID',complete:false,safe_to_dispatch:false};
  const rows=pages.flatMap(p=>p.workflow_runs);
  const ids=rows.map(r=>r?.id);
  const complete=pages.every(p=>p.total_count===total)&&
    rows.length===total&&ids.every(id=>Number.isSafeInteger(id)&&id>0)&&
    new Set(ids).size===total&&
    (since===null||rows.every(run=>Number.isFinite(Date.parse(run?.created_at||''))&&
      Date.parse(run.created_at)>=Date.parse(since)));
  if(!complete)return {status:'PROVIDER_HISTORY_INCOMPLETE',complete:false,
    observed_rows:rows.length,provider_total:total,safe_to_dispatch:false};
  const matches=rows.filter(run=>run.event==='workflow_dispatch'&&run.head_branch==='main'&&
    run.display_title===expectedTitle);
  matches.sort((a,z)=>String(z.created_at||'').localeCompare(String(a.created_at||''))||z.id-a.id);
  if(matches.length){
    const found=matches[0];
    return {status:'EXISTING_FLIGHT',complete:true,safe_to_dispatch:false,
      provider_total:total,observed_rows:rows.length,matching_flights:matches.length,
      run_id:found.id,run_status:found.status||'unknown',
      active:ACTIVE.has(found.status)};
  }
  return {status:'NO_FLIGHT_PROVEN_FULL_HISTORY',complete:true,safe_to_dispatch:true,
    provider_total:total,observed_rows:rows.length,matching_flights:0};
}

function cli(){
  const ix=process.argv.indexOf('--title');
  const title=ix>0?process.argv[ix+1]:null;
  try{
    const pages=JSON.parse(readFileSync(0,'utf8'));
    const sinceIx=process.argv.indexOf('--since');
    const since=sinceIx>0?process.argv[sinceIx+1]:null;
    const result=classifyOriginalBrainFlightPages(pages,title,{since});
    process.stdout.write(JSON.stringify(result)+'\n');
    if(!result.complete)process.exitCode=78;
  }catch(error){
    process.stdout.write(JSON.stringify({status:'PROVIDER_HISTORY_PARSE_ERROR',complete:false,
      safe_to_dispatch:false,reason:String(error?.name||'Error')})+'\n');
    process.exitCode=78;
  }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)cli();
