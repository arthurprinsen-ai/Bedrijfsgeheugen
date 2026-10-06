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
const pulls=[];
for(let page=1;;page++){
  const batch=await api(`/pulls?state=open&base=main&per_page=100&page=${page}`);
  pulls.push(...batch);
  if(batch.length<100) break;
}

function supersededNumbers(body=''){
  const values=[];
  for(const match of body.matchAll(/^Supersedes:\s*(.+)$/gmi)){
    for(const n of match[1].match(/\d+/g)||[]) values.push(Number(n));
  }
  return [...new Set(values.filter(Number.isInteger))];
}
function obligationId(body=''){
  return body.match(/^Obligation-ID:\s*(\S+)\s*$/mi)?.[1]||null;
}
function terminalLease(body=''){
  return /^Writer-Lease-State:\s*TERMINAL_DELIVERY\s*$/mi.test(body);
}
function canonicalRank(pr,groupNumbers){
  const body=pr.body||'';
  const supersedesPeer=supersededNumbers(body).some(n=>groupNumbers.has(n));
  return (terminalLease(body)?1_000_000_000:0)+(supersedesPeer?100_000_000:0)+Number(pr.number||0);
}

const byNumber=new Map(pulls.map(pr=>[pr.number,pr]));
const closedNumbers=new Set();
let closed=0;
async function closePr(pr,reason){
  if(!pr||closedNumbers.has(pr.number)) return;
  await api(`/pulls/${pr.number}`,{method:'PATCH',body:JSON.stringify({state:'closed'}),headers:{'content-type':'application/json'}});
  closedNumbers.add(pr.number);
  closed++;
  console.log(`PR_JANITOR_CLOSED_${reason}:#${pr.number}`);
}

const explicit=new Set();
for(const pr of pulls){
  for(const n of supersededNumbers(pr.body||'')) explicit.add(n);
}
for(const n of explicit){
  await closePr(byNumber.get(n),'SUPERSEDED');
}

const groups=new Map();
for(const pr of pulls){
  if(closedNumbers.has(pr.number)) continue;
  const id=obligationId(pr.body||'');
  if(!id) continue;
  const list=groups.get(id)||[];
  list.push(pr);
  groups.set(id,list);
}
for(const [id,group] of groups){
  if(group.length<2) continue;
  const groupNumbers=new Set(group.map(pr=>pr.number));
  const ordered=[...group].sort((a,b)=>canonicalRank(b,groupNumbers)-canonicalRank(a,groupNumbers));
  const canonical=ordered[0];
  console.log(`PR_JANITOR_CANONICAL_OBLIGATION:${id}:#${canonical.number}:terminal=${terminalLease(canonical.body||'')}`);
  for(const duplicate of ordered.slice(1)) await closePr(duplicate,'DUPLICATE_OBLIGATION');
}

const staleCutoff=Date.now()-30*24*60*60*1000;
const generated=/^(SEO candidate|Regulatory source candidate|Approved blog candidate|Paginacontrole candidate)\b/i;
for(const pr of pulls){
  if(closedNumbers.has(pr.number)) continue;
  if(!generated.test(pr.title||'')) continue;
  if(Date.parse(pr.updated_at||pr.created_at)>=staleCutoff) continue;
  await closePr(pr,'STALE_GENERATED');
}
console.log(`PR_JANITOR_DONE:open=${pulls.length}:closed=${closed}`);
