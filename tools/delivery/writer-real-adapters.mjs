const SHA=/^[a-f0-9]{40}$/;
function assertSha(value){if(!SHA.test(value||''))throw Error('INVALID_SHA');return value;}
export function createGitHubWriterAdapter({owner,repo,token,fetchImpl=globalThis.fetch}){
 if(!/^[a-z\d_.-]+$/i.test(owner||'')||!/^[a-z\d_.-]+$/i.test(repo||'')||!token)throw Error('GITHUB_WRITER_CONTEXT_REQUIRED');
 const base=`https://api.github.com/repos/${owner}/${repo}`;
 async function api(method,url,body){
   const response=await fetchImpl(base+url,{method,headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
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
