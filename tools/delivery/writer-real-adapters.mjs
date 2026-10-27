const SHA=/^[a-f0-9]{40}$/;
function assertSha(value){if(!SHA.test(value||''))throw Error('INVALID_SHA');return value;}
// The writer only operates on the canonical repository, never on manifest-defined origins.
const CANONICAL_GITHUB_API='https://api.github.com/repos/arthurprinsen-ai/Bedrijfsgeheugen';
const GITHUB_ROUTES=Object.freeze({
 GET:[
  /^\/pulls\/[1-9]\d*$/,
  /^\/git\/ref\/heads\/[A-Za-z0-9._~%\/-]+$/,
  /^\/git\/commits\/[a-f0-9]{40}$/,
  /^\/contents\/[A-Za-z0-9._~%\/-]+\?ref=[a-f0-9]{40}$/,
 ],
 POST:[/^\/git\/blobs$/, /^\/git\/trees$/, /^\/git\/commits$/],
 PATCH:[/^\/git\/refs\/heads\/[A-Za-z0-9._~%\/-]+$/],
});
function canonicalGithubTarget(method,route) {
 if (typeof route!=='string' || !(GITHUB_ROUTES[method]||[]).some(p=>p.test(route))) throw Error('GITHUB_ROUTE_NOT_ALLOWED');
 if (route.includes('..') || route.includes('//') || route.includes('%2e') || route.includes('%2E')) throw Error('GITHUB_ROUTE_TRAVERSAL_DENIED');
 const target=new URL(CANONICAL_GITHUB_API+route);
 if (target.protocol!=='https:' || target.origin!=='https://api.github.com' ||
     !target.pathname.startsWith('/repos/arthurprinsen-ai/Bedrijfsgeheugen/') ||
     target.username || target.password || target.port) throw Error('GITHUB_API_ORIGIN_DENIED');
 return target;
}
export function createGitHubWriterAdapter({owner,repo,token,fetchImpl=globalThis.fetch}){
 if(owner!=='arthurprinsen-ai'||repo!=='Bedrijfsgeheugen'||!token)throw Error('GITHUB_WRITER_CONTEXT_REQUIRED');
 async function api(method,route,body){
   const target=canonicalGithubTarget(method,route);
   const response=await fetchImpl(target,{method,redirect:'error',headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
   if(!response.ok)throw Error(`GITHUB_API_${response.status}`);
   return response.status===204?{}:response.json();
 }
 const branchPath=b=>{if(!b||b.startsWith('/')||b.includes('..')||b.includes('\n'))throw Error('INVALID_BRANCH');return b.split('/').map(encodeURIComponent).join('/');};
 return {
   async readPR(number){const p=await api('GET',`/pulls/${number}`);return {number:p.number,branch:p.head.ref,headSha:assertSha(p.head.sha),baseSha:assertSha(p.base.sha),open:p.state==='open'};},
   async readHead(branch){const r=await api('GET',`/git/ref/heads/${branchPath(branch)}`);return assertSha(r.object.sha);},
   async readFile(path,ref){
     if(!ref)throw Error('IMMUTABLE_REF_REQUIRED');
     const r=await api('GET',`/contents/${path.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(assertSha(ref))}`);
     if(r.encoding!=='base64')throw Error('UNSUPPORTED_CONTENT_ENCODING');
     return Buffer.from(r.content.replace(/\s/g,''),'base64').toString('utf8');
   },
   async applyExpectedHeadCas({prNumber,branch,expectedHead,writes}){
     assertSha(expectedHead);
     const pr=await this.readPR(prNumber);
     if(!pr.open||pr.branch!==branch||pr.headSha!==expectedHead)throw Error('PR_CHANGED_BEFORE_COMMIT');
     const root=await api('GET',`/git/commits/${expectedHead}`);
     const blobs=[];
     for(const file of writes){const b=await api('POST','/git/blobs',{content:file.content,encoding:'utf-8'});blobs.push({path:file.path,mode:'100644',type:'blob',sha:assertSha(b.sha)});}
     const tree=await api('POST','/git/trees',{base_tree:root.tree.sha,tree:blobs});
     const commit=await api('POST','/git/commits',{message:'fix(brain): apply lease-verified recovery patch',tree:tree.sha,parents:[expectedHead]});
     const newHead=assertSha(commit.sha);
     await api('PATCH',`/git/refs/heads/${branchPath(branch)}`,{sha:newHead,force:false});
     if(await this.readHead(branch)!==newHead)throw Error('GITHUB_READBACK_MISMATCH');
     return {applied:true,newHead};
   }
 };
}
export function createSupabaseLeaseVerifier({query}){
 if(typeof query!=='function')throw Error('AUTHORIZED_SQL_EXECUTOR_REQUIRED');
 return {async verifyLease({obligation,holder,token,branch,head,main}){
   if(!Number.isSafeInteger(token)||token<1)throw Error('INVALID_FENCE_TOKEN');
   const rows=await query('select writer_control.verify($1,$2,$3,$4,$5,$6) as verified',[obligation,holder,token,branch,head,main]);
   return rows?.[0]?.verified===true;
 }};
}
