export function classifyError(error) {
  const status = Number(error?.status || 0);
  const msg = String(error?.message || '');
  if (status === 409) return 'MERGE_CONFLICT_OR_CONCURRENT_UPDATE';
  if (status === 422) return 'STALE_SHA_OR_UNPROCESSABLE';
  if (status === 403) return 'PERMISSION_OR_RULESET';
  if (status === 404) return 'MISSING_REF_OR_PERMISSION';
  if (status === 401) return 'AUTHENTICATION';
  if (status === 429 || status >= 500) return 'RETRYABLE_PROVIDER';
  if (/timeout|ECONNRESET|ETIMEDOUT/i.test(msg)) return 'RETRYABLE_NETWORK';
  return 'UNKNOWN_BLOCKER';
}
export async function reconcile({github, owner, repo, logger = console, enrolledLabel = 'autonomous-sync', wait = async()=>{}, maxPolls = 8}) {
  const report = {updated:[],current:[],blocked:[],skipped:[],pending:[]};
  const prs = await github.paginate(github.rest.pulls.list, {owner,repo,state:'open',base:'main',per_page:100});
  for(const pr of prs) {
    const id=pr.number;
    if (pr.draft || pr.head.repo?.full_name !== owner+'/'+repo || !(pr.labels||[]).some(x=>x.name===enrolledLabel)) {
      report.skipped.push(id); continue;
    }
    try {
      const latest = (await github.rest.pulls.get({owner,repo,pull_number:id})).data;
      if(latest.state!=='open' || latest.draft || latest.head.repo?.full_name!==owner+'/'+repo || !(latest.labels||[]).some(x=>x.name===enrolledLabel)) {
        report.skipped.push(id); continue;
      }
      const before=(await github.rest.repos.compareCommits({owner,repo,base:latest.head.sha,head:latest.base.sha})).data;
      if(before.ahead_by===0) { report.current.push({pr:id,head:latest.head.sha,base:latest.base.sha}); continue; }
      await github.request('PUT /repos/{owner}/{repo}/pulls/{pull_number}/update-branch', {
        owner,repo,pull_number:id,expected_head_sha:latest.head.sha
      });
      let verified=false;
      for(let i=0;i<maxPolls;i++) {
        await wait(i);
        const fresh=(await github.rest.pulls.get({owner,repo,pull_number:id})).data;
        if(fresh.head.sha===latest.head.sha) continue;
        const comparison=(await github.rest.repos.compareCommits({owner,repo,base:fresh.head.sha,head:fresh.base.sha})).data;
        if(comparison.ahead_by===0 && fresh.state==='open') {
          report.updated.push({pr:id,oldHead:latest.head.sha,newHead:fresh.head.sha,base:fresh.base.sha});
          verified=true;break;
        }
      }
      if(!verified) report.pending.push({pr:id,reason:'UPDATE_ACCEPTED_NOT_VERIFIED'});
    } catch(error) {
      const reason=classifyError(error);
      logger.warn?.('PR #'+id+': '+reason+': '+(error?.message||''));
      report.blocked.push({pr:id,reason,status:error?.status||null});
    }
  }
  return report;
}
