import process from 'node:process';

const repo=process.env.GITHUB_REPOSITORY;
const token=process.env.GITHUB_TOKEN;
if(!repo||!token) throw new Error('GITHUB_REPOSITORY and GITHUB_TOKEN are required');
const headers={Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};
async function api(path,init={}){
  const r=await fetch(`https://api.github.com/repos/${repo}${path}`,{...init,headers:{...headers,...(init.headers||{})}});
  if(!r.ok) throw new Error(`GitHub API ${r.status} ${path}: ${await r.text()}`);
  if(r.status===204) return null;
  return r.json();
}
const obligationId=body=>String(body||'').match(/^Obligation-ID:\s*(\S+)\s*$/mi)?.[1]||null;
const supersedes=body=>[...String(body||'').matchAll(/^Supersedes:\s*(\d+)\s*$/gmi)].map(m=>Number(m[1]));

const pulls=[];
for(let page=1;;page++){
  const batch=await api(`/pulls?state=open&base=main&per_page=100&page=${page}`);
  pulls.push(...batch);
  if(batch.length<100) break;
}
const byNumber=new Map(pulls.map(pr=>[pr.number,pr]));
const safeSuperseded=new Set();
for(const successor of pulls){
  const successorObligation=obligationId(successor.body);
  if(!successorObligation) continue;
  for(const n of supersedes(successor.body)){
    const predecessor=byNumber.get(n);
    if(!predecessor) continue;
    if(obligationId(predecessor.body)!==successorObligation){
      console.log(`PR_JANITOR_SKIP_CROSS_OBLIGATION:#${successor.number}->#${n}`);
      continue;
    }
    safeSuperseded.add(n);
  }
}
let closed=0;
for(const n of safeSuperseded){
  await api(`/pulls/${n}`,{method:'PATCH',body:JSON.stringify({state:'closed'}),headers:{'content-type':'application/json'}});
  console.log(`PR_JANITOR_CLOSED_SUPERSEDED:#${n}`);
  closed++;
}
const staleCutoff=Date.now()-30*24*60*60*1000;
const generated=/^(SEO candidate|Regulatory source candidate|Approved blog candidate|Paginacontrole candidate)\b/i;
for(const pr of pulls){
  if(safeSuperseded.has(pr.number)) continue;
  if(!generated.test(pr.title||'')) continue;
  if(Date.parse(pr.updated_at||pr.created_at)>=staleCutoff) continue;
  await api(`/pulls/${pr.number}`,{method:'PATCH',body:JSON.stringify({state:'closed'}),headers:{'content-type':'application/json'}});
  console.log(`PR_JANITOR_CLOSED_STALE_GENERATED:#${pr.number}`);
  closed++;
}
console.log(`PR_JANITOR_DONE:open=${pulls.length}:closed=${closed}`);
