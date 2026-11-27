import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {prepareReviewedUnion} from '../tools/delivery/reviewed-union.mjs';
const hash=s=>createHash('sha256').update(s).digest('hex');
function fixture(t){
 const cwd=mkdtempSync(join(tmpdir(),'union-test-'));t.after(()=>rmSync(cwd,{recursive:true,force:true}));
 const git=(...args)=>{const r=spawnSync('git',args,{cwd,encoding:'utf8'});assert.equal(r.status,0,r.stderr);return r.stdout.trim()};
 const write=(p,s)=>writeFileSync(join(cwd,p),s);
 git('init','-q','-b','main');git('config','user.name','Test');git('config','user.email','test@example.invalid');
 write('overlap','base');write('candidate-only','base');write('main-only','base');git('add','.');git('commit','-qm','base');const base=git('rev-parse','HEAD');
 git('switch','-qc','candidate');write('overlap','candidate');write('candidate-only','candidate');git('add','.');git('commit','-qm','candidate');const head=git('rev-parse','HEAD');
 git('switch','-q','main');write('overlap','main');write('main-only','main');git('add','.');git('commit','-qm','main');const main=git('rev-parse','HEAD');
 const manifest={expectedHead:head,expectedBase:base,obligation:'original',branch:'candidate',candidatePaths:['overlap','candidate-only'],files:[{path:'overlap',expectedOldSha256:hash('candidate'),expectedMainSha256:hash('main'),content:'resolved',contentSha256:hash('resolved')}]};
 return {cwd,git,head,main,manifest,get manifestBytes(){return JSON.stringify(manifest)},preflight:{headSha:head,prBaseSha:base,obligation:'original',branch:'candidate',executionMainSha:main,writeAuthorized:false,get manifestSha256(){return hash(JSON.stringify(manifest))}},declaredPaths:['overlap','candidate-only']};
}
test('real git object union preserves both histories and both disjoint changes, no ref moves',t=>{const f=fixture(t);const r=prepareReviewedUnion(f);assert.deepEqual(r.scope,['candidate-only','overlap']);assert.equal(f.git('show',r.commit+':main-only'),'main');assert.equal(f.git('show',r.commit+':candidate-only'),'candidate');assert.equal(f.git('show',r.commit+':overlap'),'resolved');assert.equal(f.git('show','-s','--format=%P',r.commit),f.head+' '+f.main);assert.equal(f.git('rev-parse','candidate'),f.head);assert.equal(f.git('rev-parse','main'),f.main);assert.equal(r.writeAuthorized,false)});
test('unreviewed overlap rejects without a ref move',t=>{const f=fixture(t);f.manifest.files=[];assert.throws(()=>prepareReviewedUnion(f),/UNREVIEWED_OVERLAP/);assert.equal(f.git('rev-parse','candidate'),f.head)});
test('tampered digest or stale source rejects',t=>{const f=fixture(t);f.manifest.files[0].expectedMainSha256=hash('old');assert.throws(()=>prepareReviewedUnion(f),/UNION_SOURCE_DIGEST_DRIFT/);f.manifest.files[0].content='tampered';assert.throws(()=>prepareReviewedUnion(f),/UNAPPROVED_UNION_PATCH/)});
test('declared and actual candidate scope must both match immutable reviewed scope',t=>{const f=fixture(t);f.declaredPaths=['overlap'];assert.throws(()=>prepareReviewedUnion(f),/APPROVED_CANDIDATE_SCOPE_MISMATCH/);f.manifest.candidatePaths=['overlap'];assert.throws(()=>prepareReviewedUnion(f),/ACTUAL_CANDIDATE_SCOPE_MISMATCH/)});
test('wrong preflight binding and protected paths rejected',t=>{const f=fixture(t);f.preflight.headSha=f.main;assert.throws(()=>prepareReviewedUnion(f),/REVIEWED_PREFLIGHT_REQUIRED/);f.preflight.headSha=f.head;f.manifest.candidatePaths=['.github/workflows/evil.yml'];f.declaredPaths=f.manifest.candidatePaths;assert.throws(()=>prepareReviewedUnion(f),/APPROVED_CANDIDATE_SCOPE_MISMATCH/)});

test('tampered immutable manifest bytes cannot reuse earlier preflight',t=>{const f=fixture(t);const proof={...f.preflight};f.manifest.files[0].content='other';assert.throws(()=>prepareReviewedUnion({...f,preflight:proof}),/REVIEWED_PREFLIGHT_REQUIRED/)});
