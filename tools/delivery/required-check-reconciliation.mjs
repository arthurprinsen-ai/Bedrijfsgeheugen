#!/usr/bin/env node
// Read-only, fail-closed required-check reconciliation for the existing Recovery Supervisor.
import { execFileSync } from 'node:child_process';
export function reconcile(expected, observed, sha) {
  if (!sha || !Array.isArray(expected) || !Array.isArray(observed)) return {state:'UNKNOWN',reason:'INCOMPLETE_EVIDENCE',sha};
  const missing=[], ambiguous=[], wrongSource=[], incomplete=[];
  for (const req of expected) {
    if (!req.context) { incomplete.push('REQUIRED_CONTEXT_UNSPECIFIED'); continue; }
    const matches=observed.filter(x=>x.name===req.context && x.sha===sha);
    if (!matches.length) {missing.push(req.context);continue;}
    const candidates=req.integration_id ? matches.filter(x=>String(x.app_id)===String(req.integration_id)):matches;
    if (!candidates.length) {wrongSource.push(req.context);continue;}
    // GitHub reruns can produce multiple run attempts; only the latest authoritative conclusion counts.
    const last=[...candidates].sort((a,b)=>String(a.completed_at||a.started_at||'').localeCompare(String(b.completed_at||b.started_at||''))).at(-1);
    if (!last || last.conclusion!=='success') incomplete.push(req.context);
    if (new Set(candidates.map(x=>x.app_id)).size>1 && !req.integration_id) ambiguous.push(req.context);
  }
  return {state:missing.length||wrongSource.length||ambiguous.length||incomplete.length?'BLOCKED_CONFIG_OR_CHECK':'PASS',sha,missing,wrongSource,ambiguous,incomplete};
}
function gh(path){ return JSON.parse(execFileSync('gh',['api',path],{encoding:'utf8',timeout:20000})); }
if (process.argv[1] && import.meta.url===new URL('file://'+process.argv[1]).href) {
  try {
    const repo=process.env.GITHUB_REPOSITORY,sha=process.env.RELEASE_CHECK_SHA;
    if(!repo||!/^[0-9a-f]{40}$/.test(sha||'')) throw Error('REPOSITORY_OR_SHA_MISSING');
    const [protection,rulesets,checks,statuses]=[
      (()=>{try{return gh('repos/'+repo+'/branches/main/protection/required_status_checks')}catch{return null}})(),
      (()=>{try{return gh('repos/'+repo+'/rulesets?includes_parents=true')}catch{return null}})(),
      gh('repos/'+repo+'/commits/'+sha+'/check-runs?per_page=100'),
      gh('repos/'+repo+'/commits/'+sha+'/status')
    ];
    const expected=(protection?.checks||[]).map(c=>({context:c.context,integration_id:c.app_id}));
    const observed=[
      ...(checks.check_runs||[]).map(c=>({name:c.name,sha:c.head_sha,app_id:c.app?.id,conclusion:c.conclusion,completed_at:c.completed_at,url:c.html_url})),
      ...(statuses.statuses||[]).map(c=>({name:c.context,sha,app_id:null,conclusion:c.state==='success'?'success':c.state,completed_at:c.updated_at,url:c.target_url}))
    ];
    // An unreadable ruleset must never be treated as proof of a correct configuration.
    const diagnostic=reconcile(expected,observed,sha);
    if(!protection || !rulesets) {diagnostic.state='UNKNOWN';diagnostic.reason='RULESET_OR_PROTECTION_READ_UNAVAILABLE';}
    diagnostic.rulesetIds=Array.isArray(rulesets)?rulesets.map(x=>x.id):[];
    diagnostic.expected=expected; diagnostic.observed=observed;
    process.stdout.write(JSON.stringify(diagnostic)+'\n');
    if(diagnostic.state!=='PASS') process.stderr.write('::warning::REQUIRED_CHECK_RECONCILIATION_'+diagnostic.state+'\n');
  } catch(e) {process.stdout.write(JSON.stringify({state:'UNKNOWN',reason:String(e.message||e)})+'\n');}
}
