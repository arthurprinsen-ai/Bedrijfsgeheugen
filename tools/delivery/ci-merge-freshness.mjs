// Deterministic, read-only merge freshness advisory over evidence the hourly Janitor ALREADY fetched.
// Never claim checks passed or mutate PRs based solely on ahead/behind counters.
import {readFile, mkdir, writeFile} from 'node:fs/promises';

const SHA=/^[0-9a-f]{40}$/i;
const validCount=n=>Number.isSafeInteger(n)&&n>=0;
const base=reason=>({
  schema:'powerhouse-canonical-merge-freshness-v1',
  status:reason,
  parent_issue:4661,
  evidence_kind:'PINNED_MAIN_SHA_GITHUB_COMPARE_WITH_EXACT_OPEN_PR_HEADS',
  point_in_time_only:true,
  exact_head_checks_verified:false,
  may_update_branch:false,
  may_dispatch_ci:false,
  may_merge:false,
  drifted_active_prs:0,
  recorded_obligations_with_multiple_open_writers:[],
  candidate_refresh_reviews:[]
});

export function assessObservedMergeFreshness({snapshot={},openPrs=[],mainSha=''}={}){
  if(!SHA.test(mainSha)||snapshot?.main_epoch_sha!==mainSha)
    return base('WITHHELD_UNVERIFIED_MAIN_EPOCH');
  if(!Array.isArray(openPrs)||!Array.isArray(snapshot?.candidates)||
    !validCount(snapshot?.open_pr_count)||snapshot.open_pr_count!==openPrs.length||
    snapshot.candidates.length!==openPrs.length)
    return base('WITHHELD_INCOMPLETE_OPEN_PR_SNAPSHOT');
  const raw=new Map(),seen=new Set();
  for(const pr of openPrs){
    if(!validCount(pr?.number)||pr.number===0||seen.has(pr.number)||
      pr.state!=='open'||!SHA.test(pr.head?.sha||''))return base('WITHHELD_PR_IDENTITY_MISMATCH');
    seen.add(pr.number);
    raw.set(pr.number,pr);
  }
  const rows=[],obligations=new Map();
  for(const c of snapshot.candidates){
    const pr=raw.get(c?.number);
    if(!pr||!SHA.test(c?.headSha||'')||c.headSha!==pr.head.sha||!seen.delete(c.number))
      return base('WITHHELD_PR_IDENTITY_MISMATCH');
    const retired=/^\s*RETIRED\b/i.test(pr.title||'')||
      /Retirement-State:\s*RETIRED_DO_NOT_MERGE|\nRETIRED:/i.test(pr.body||'');
    if(retired||pr.draft===true)continue;
    const cmp=c.compareEvidence;
    if(!cmp||!['ahead','diverged','behind','identical'].includes(cmp.status)||
      !validCount(cmp.ahead_by)||!validCount(cmp.behind_by)||
      (cmp.status==='diverged'&&!(cmp.ahead_by>0&&cmp.behind_by>0))||
      (cmp.status==='ahead'&&!(cmp.ahead_by>0&&cmp.behind_by===0))||
      (cmp.status==='behind'&&!(cmp.ahead_by===0&&cmp.behind_by>0))||
      (cmp.status==='identical'&&!(cmp.ahead_by===0&&cmp.behind_by===0))||
      c.uniqueCommits!==(cmp.ahead_by>0))
      return base('WITHHELD_INCOMPLETE_OR_CONTRADICTORY_COMPARE');
    if(cmp.ahead_by===0)continue;
    const obligationMatch=String(pr.body||'').match(/^Obligation-ID:\s*(\S.{0,158})$/m);
    const obligationId=obligationMatch?.[1]?.trim()||null;
    if(obligationId){
      const group=obligations.get(obligationId)||[];
      group.push(pr.number);
      obligations.set(obligationId,group);
    }
    if(cmp.behind_by===0)continue;
    rows.push({
      pr_number:pr.number,
      head_sha:c.headSha,
      main_epoch_sha:mainSha,
      behind_commits:cmp.behind_by,
      ahead_commits:cmp.ahead_by,
      obligation_id:obligationId,
      owner_resolution_required:!obligationId,
      checks_state:'UNVERIFIED_AT_EXACT_HEAD',
      next_action:'EXISTING_CANONICAL_WRITER_CHECK_HEAD_GATES_AND_CONFLICTS_BEFORE_REFRESH'
    });
  }
  if(seen.size!==0)return base('WITHHELD_PR_IDENTITY_MISMATCH');
  const duplicateGroups=[...obligations].filter(([,n])=>n.length>1)
    .map(([obligation_id,pr_numbers])=>({obligation_id,pr_numbers:pr_numbers.sort((a,b)=>a-b)}))
    .sort((a,b)=>a.obligation_id.localeCompare(b.obligation_id));
  rows.sort((a,b)=>b.behind_commits-a.behind_commits||a.pr_number-b.pr_number);
  return {
    ...base('OBSERVED_COMMIT_DRIFT_ADVISORY_ONLY'),
    main_epoch_sha:mainSha,
    sampled_open_prs:openPrs.length,
    drifted_active_prs:rows.length,
    recorded_obligations_with_multiple_open_writers:duplicateGroups.slice(0,10),
    candidate_refresh_reviews:rows.slice(0,12).map(row=>({
      ...row,
      multiple_open_writers:row.obligation_id!==null&&
        (obligations.get(row.obligation_id)?.length||0)>1,
      refresh_admission:'BLOCK_UNTIL_EXACT_HEAD_CHECKS_AND_ONE_WRITER_VERIFIED'
    }))
  };
}

if(process.argv[1] && import.meta.url===new URL('file://'+process.argv[1]).href){
  const out='.artifacts/powerhouse-merge-freshness.json';
  let report;
  try{
    const [snapshot,prs]=await Promise.all([
      readFile('.artifacts/powerhouse-repository-janitor.json','utf8').then(JSON.parse),
      readFile('.artifacts/open-prs.json','utf8').then(JSON.parse)
    ]);
    report=assessObservedMergeFreshness({
      snapshot,openPrs:prs,mainSha:process.env.GITHUB_SHA||''
    });
  }catch{
    report=base('WITHHELD_UNAVAILABLE_JANITOR_INPUTS');
  }
  await mkdir('.artifacts',{recursive:true});
  await writeFile(out,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({status:report.status,drifted_active_prs:report.drifted_active_prs,
    review_candidates:report.candidate_refresh_reviews.length,
    multiple_open_writer_obligations:report.recorded_obligations_with_multiple_open_writers.length,
    may_mutate:report.may_update_branch}));
  if(report.status.startsWith('WITHHELD_'))process.exitCode=2;
}
