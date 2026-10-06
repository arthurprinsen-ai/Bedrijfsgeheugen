import process from 'node:process';

const repo=process.env.GITHUB_REPOSITORY;
const token=process.env.GITHUB_TOKEN;
const now=Date.now();
const MIN_AGE_MS=90_000;
const MAX_AGE_MS=2*60*60*1000;
if(!repo||!token) throw new Error('GITHUB_REPOSITORY and GITHUB_TOKEN are required');
const headers={Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};

async function api(path, init={}){
  const r=await fetch(`https://api.github.com/repos/${repo}${path}`,{...init,headers:{...headers,...(init.headers||{})}});
  if(!r.ok) throw new Error(`GitHub API ${r.status} ${path}: ${await r.text()}`);
  if(r.status===204) return null;
  return r.json();
}

const pulls=await api('/pulls?state=open&base=main&per_page=100');
let dispatched=0;
for(const pr of pulls){
  const age=now-Date.parse(pr.updated_at||pr.created_at);
  if(age<MIN_AGE_MS||age>MAX_AGE_MS) continue;
  const head=pr.head?.sha;
  if(!head) continue;
  const runs=await api(`/actions/runs?head_sha=${head}&per_page=100`);
  const canonical=(runs.workflow_runs||[]).some(run=>run.name==='Required test' && ['queued','in_progress','completed','waiting','requested','pending'].includes(run.status));
  if(canonical) continue;
  const inputs={
    pr_number:String(pr.number),
    base_sha:String(pr.base?.sha||''),
    head_sha:String(head),
    candidate_branch:String(pr.head?.ref||''),
    pr_body:pr.body||'',
    pr_labels_json:JSON.stringify((pr.labels||[]).map(label=>label?.name).filter(Boolean))
  };
  await api('/actions/workflows/required-test.yml/dispatches',{method:'POST',body:JSON.stringify({ref:pr.head.ref,inputs}),headers:{'content-type':'application/json'}});
  console.log(`REQUIRED_GATE_WATCHDOG_DISPATCHED:#${pr.number}:${head}`);
  dispatched++;
}
console.log(`REQUIRED_GATE_WATCHDOG_DONE:${dispatched}`);
