// Exact expected-old-ref Git protocol. Does not establish permission to push.
// The caller must already hold the independently verified main-wide reservation
// and the original writer_control lease; never connect to the entrypoint before
// those guarantees are enforced at the provider.
import {spawnSync} from 'node:child_process';
const SHA=/^[a-f0-9]{40}$/;
const CANONICAL='https://github.com/arthurprinsen-ai/Bedrijfsgeheugen.git';
const safeBranch=b=>typeof b==='string'&&b.length<=220&&/^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(b)&&b!=='main'&&b!=='HEAD'&&!b.includes('..')&&!b.includes('//')&&!b.endsWith('/')&&!b.endsWith('.')&&b.split('/').every(s=>s&&!s.startsWith('.')&&!s.endsWith('.lock'));
function run(cwd,args,env={}){
 return spawnSync('git',args,{cwd,encoding:'utf8',timeout:15000,maxBuffer:1024*1024,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1',GIT_TERMINAL_PROMPT:'0',...env}});
}
function object(cwd,sha){
 if(!SHA.test(sha||''))throw Error('NATIVE_CAS_OBJECT_SHA_INVALID');
 const r=run(cwd,['show','-s','--format=%T%n%P',sha]);
 if(r.status!==0||r.error)throw Error('NATIVE_CAS_OBJECT_UNAVAILABLE');
 const [tree,parents]=r.stdout.trim().split('\n');
 if(!SHA.test(tree)||!parents)throw Error('NATIVE_CAS_OBJECT_UNPROVEN');
 return {tree,parents:parents.split(' ')};
}
// A local-bare transport is supported only for isolated protocol fixtures.
// The public production factory below does not accept a destination override.
export function pushReviewedGitRef({cwd,destination,branch,expectedHead,newHead,main,env={}}){
 if(!safeBranch(branch)||![expectedHead,newHead,main].every(x=>typeof x==='string'&&SHA.test(x))||expectedHead===newHead||main===newHead)throw Error('NATIVE_CAS_IDENTITY_INVALID');
 const ref='refs/heads/'+branch, candidate=object(cwd,newHead);
 if(candidate.parents.length!==2||candidate.parents[0]!==expectedHead||candidate.parents[1]!==main)throw Error('NATIVE_CAS_NOT_EXACT_TWO_PARENT_FORWARD');
 const check=run(cwd,['check-ref-format',ref],env);
 if(check.status!==0||check.error)throw Error('NATIVE_CAS_REF_INVALID');
 // The expected old object is transmitted in the receive-pack ref update.
 // No '+' refspec, bare --force, tracking-ref lease or retry.
 const p=run(cwd,['-c','core.hooksPath=/dev/null','-c','push.followTags=false','-c','push.recurseSubmodules=no','push','--porcelain','--no-verify','--no-follow-tags','--recurse-submodules=no','--force-with-lease='+ref+':'+expectedHead,'--',destination,newHead+':'+ref],env);
 if(p.error||p.status!==0)return {accepted:false,reason:'NATIVE_CAS_REJECTED_OR_AMBIGUOUS'};
 const rows=p.stdout.split(/\r?\n/).filter(x=>/^[ =*+!-]\t/.test(x));
 // Ref already at desired state is not proof that this exact CAS took place.
 if(rows.length!==1||!rows[0].startsWith(' \t')||!rows[0].split('\t')[1]?.endsWith(':'+ref))return {accepted:false,reason:'NATIVE_CAS_RECEIPT_UNPROVEN'};
 return {accepted:true};
}
export function createNativeReviewedTransport({cwd,github,githubToken}){
 if(typeof github?.readCommit!=='function'||typeof githubToken!=='string'||!githubToken||/[\r\n]/.test(githubToken))throw Error('NATIVE_CAS_TRUSTED_CONTEXT_REQUIRED');
 // Credentials remain in the child environment; never include them in argv,
 // returned diagnostics, destination URL or logs. The existing checkout must
 // be trusted and isolated (no arbitrary remotes/config/hooks).
 const env={GIT_CONFIG_COUNT:'2',GIT_CONFIG_KEY_0:'http.https://github.com/.extraheader',GIT_CONFIG_VALUE_0:'AUTHORIZATION: basic '+Buffer.from('x-access-token:'+githubToken).toString('base64'),GIT_CONFIG_KEY_1:'http.followRedirects',GIT_CONFIG_VALUE_1:'false',GIT_TRACE:'0',GIT_TRACE_PACKET:'0',GIT_TRACE_CURL:'0',GIT_CURL_VERBOSE:'0'};
 return {
  inspect:async sha=>object(cwd,sha),
  pushExact:async ({branch,expectedHead,newHead,main})=>pushReviewedGitRef({cwd,destination:CANONICAL,branch,expectedHead,newHead,main,env}),
  readCommit:async sha=>github.readCommit(sha)
 };
}
