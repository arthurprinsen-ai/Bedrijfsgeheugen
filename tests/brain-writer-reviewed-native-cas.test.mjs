import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,rmSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createGitHubWriterAdapter} from '../tools/delivery/writer-real-adapters.mjs';
import {pushReviewedGitRef} from '../tools/delivery/reviewed-native-cas.mjs';
function fixture(t){
 const root=mkdtempSync(join(tmpdir(),'native-cas-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
 const cwd=join(root,'src'),destination=join(root,'remote.git');mkdirSync(cwd);
 const git=(...args)=>{const r=spawnSync('git',args,{cwd,encoding:'utf8'});assert.equal(r.status,0,r.stderr);return r.stdout.trim()};
 const write=(p,s)=>writeFileSync(join(cwd,p),s);
 git('init','-q','-b','main');git('config','user.name','Test');git('config','user.email','test@example.invalid');
 write('base','base');git('add','.');git('commit','-qm','base');
 git('switch','-qc','candidate');write('candidate','candidate');git('add','.');git('commit','-qm','candidate');const expectedHead=git('rev-parse','HEAD');
 git('switch','-q','main');write('main','main');git('add','.');git('commit','-qm','main');const main=git('rev-parse','HEAD');
 git('switch','-q','candidate');git('merge','--no-ff','--no-edit','main');const newHead=git('rev-parse','HEAD');
 git('init','--bare','-q',destination);
 git('push',destination,main+':refs/heads/main',expectedHead+':refs/heads/candidate');
 const remote=ref=>git('--git-dir='+destination,'rev-parse',ref);
 return {git,remote,req:{cwd,destination,branch:'candidate',expectedHead,newHead,main}};
}
test('real receive-pack advances exactly the reviewed candidate and leaves main untouched',t=>{const f=fixture(t);assert.deepEqual(pushReviewedGitRef(f.req),{accepted:true});assert.equal(f.remote('refs/heads/candidate'),f.req.newHead);assert.equal(f.remote('refs/heads/main'),f.req.main)});
test('stale expected head rejected even if another writer moves to an ancestor of new head',t=>{const f=fixture(t);const base=f.git('rev-parse',f.req.expectedHead+'^');f.git('push','--force',f.req.destination,base+':refs/heads/candidate');assert.equal(pushReviewedGitRef(f.req).accepted,false);assert.equal(f.remote('refs/heads/candidate'),base)});
test('already landed is not a fresh CAS receipt',t=>{const f=fixture(t);assert.equal(pushReviewedGitRef(f.req).accepted,true);assert.equal(pushReviewedGitRef(f.req).accepted,false)});
test('main, option-like branch, and incorrect ordered parents cannot be pushed',t=>{const f=fixture(t);assert.throws(()=>pushReviewedGitRef({...f.req,branch:'main'}),/IDENTITY_INVALID/);assert.throws(()=>pushReviewedGitRef({...f.req,branch:'--evil'}),/IDENTITY_INVALID/);assert.throws(()=>pushReviewedGitRef({...f.req,expectedHead:f.req.main,main:f.req.expectedHead}),/NOT_EXACT_TWO_PARENT_FORWARD/);assert.equal(f.remote('refs/heads/candidate'),f.req.expectedHead)});

test('independent native commit readback binds exact SHA, tree and parent order',async()=>{const H='a'.repeat(40),M='b'.repeat(40),N='c'.repeat(40),T='d'.repeat(40);let native={sha:N,tree:{sha:T},parents:[{sha:H},{sha:M}]};const g=createGitHubWriterAdapter({owner:'arthurprinsen-ai',repo:'Bedrijfsgeheugen',token:'fixture',fetchImpl:async(url,opts)=>{assert.equal(url.pathname,'/repos/arthurprinsen-ai/Bedrijfsgeheugen/git/commits/'+N);assert.equal(opts.method,'GET');return {ok:true,status:200,json:async()=>native}}});assert.deepEqual(await g.readCommit(N),{sha:N,tree:T,parents:[H,M]});native={...native,sha:H};await assert.rejects(g.readCommit(N),/NATIVE_COMMIT_IDENTITY_UNPROVEN/)});

import {createNativeReviewedTransport} from '../tools/delivery/reviewed-native-cas.mjs';
for(const kind of ['insteadOf','pushInsteadOf'])test('production transport rejects configured URL rewrite: '+kind,async t=>{const f=fixture(t);f.git('config','url.'+f.req.destination+'.'+kind,'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen.git');const transport=createNativeReviewedTransport({cwd:f.req.cwd,github:{readCommit:async()=>null},githubToken:'local-fixture-not-a-real-token'});await assert.rejects(transport.pushExact(f.req),/NATIVE_CAS_URL_REWRITE_UNPROVEN/);assert.equal(f.remote('refs/heads/candidate'),f.req.expectedHead);assert.equal(f.remote('refs/heads/main'),f.req.main)});
