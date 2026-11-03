// Read-only exact-head BRAIN workflow flight index for the EXISTING terminal owner.
// GitHub indexes workflow_dispatch under the main SHA, not the PR candidate SHA.
// Absence is safe to use for dispatch only after every native pagination page is read.
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

const TITLE=/^BRAIN delivery PR #[1-9]\d* [0-9a-f]{40}$/i;
const ACTIVE=new Set(['queued','requested','pending','in_progress','waiting']);

export function classifyOriginalBrainFlightPages(pages,expectedTitle){
  if(!TITLE.test(String(expectedTitle||'')))
    return {status:'INVALID_EXACT_CANDIDATE',complete:false,safe_to_dispatch:false};
  if(!Array.isArray(pages)||pages.length===0||
     !pages.every(p=>p&&Array.isArray(p.workflow_runs)&&Number.isSafeInteger(p.total_count)&&p.total_count>=0))
    return {status:'PROVIDER_PAGINATION_INVALID',complete:false,safe_to_dispatch:false};
  const total=pages[0].total_count;
  const rows=pages.flatMap(p=>p.workflow_runs);
  const ids=rows.map(r=>r?.id);
  const complete=pages.every(p=>p.total_count===total)&&
    rows.length===total&&ids.every(id=>Number.isSafeInteger(id)&&id>0)&&
    new Set(ids).size===total;
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
    const result=classifyOriginalBrainFlightPages(pages,title);
    process.stdout.write(JSON.stringify(result)+'\n');
    if(!result.complete)process.exitCode=78;
  }catch(error){
    process.stdout.write(JSON.stringify({status:'PROVIDER_HISTORY_PARSE_ERROR',complete:false,
      safe_to_dispatch:false,reason:String(error?.name||'Error')})+'\n');
    process.exitCode=78;
  }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)cli();
