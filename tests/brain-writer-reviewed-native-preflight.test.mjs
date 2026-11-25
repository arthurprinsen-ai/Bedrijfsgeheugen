import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {preflightReviewedWriterHandoff} from '../tools/delivery/writer-authorized-runner.mjs';
const a='a'.repeat(40),b='b'.repeat(40),c='c'.repeat(40),d='d'.repeat(40);
const path='platform/agents/agent-team.mjs',repo='arthurprinsen-ai/Bedrijfsgeheugen';
const hash=s=>createHash('sha256').update(s).digest('hex');
function fixture(){
 const manifest={contract:'brain-writer-patch-handoff-v2',prNumber:5940,expectedHead:a,expectedBase:b,reviewedMainSha:c,branch:'fix/original',obligation:'original',files:[{path,expectedMainSha256:hash('main'),expectedOldSha256:hash('old'),content:'resolved',contentSha256:hash('resolved')}]};
 const policy={contract:'brain-writer-approved-paths-v1',paths:[path]};
 const manifestBytes=JSON.stringify(manifest),policyBytes=JSON.stringify(policy);
 const calls=[],opts={pr:{number:5940,state:'open',body:'Obligation-ID: original',head:{sha:a,ref:'fix/original',repo:{full_name:repo}},base:{sha:b,ref:'main',repo:{full_name:repo}}},compare:{base_commit:{sha:c},merge_base_commit:{sha:c},behind_by:0,ahead_by:1,status:'ahead'},main:d,manifestBytes,policyBytes};
 const fetchImpl=async(url,request)=>{
  const route=url.pathname.replace('/repos/'+repo,'')+url.search;calls.push({route,method:request.method});
  assert.equal(request.method,'GET');assert.equal(url.origin,'https://api.github.com');
  let data;
  if(route==='/pulls/5940')data=opts.pr;
  else if(route==='/git/ref/heads/main')data={object:{sha:opts.main}};
  else if(route==='/compare/'+c+'...'+d)data=opts.compare;
  else if(route.startsWith('/contents/')){
   const [file,ref]=route.slice(10).split('?ref=');
   const bytes=file==='config/brain-writer-approved-handoff.json'?opts.manifestBytes:file==='config/brain-writer-approved-paths.json'?opts.policyBytes:file===path?(ref===a?'old':'main'):null;
   if(bytes===null)throw Error('UNEXPECTED_FILE');
   data={encoding:'base64',content:Buffer.from(bytes).toString('base64')};
  }else throw Error('UNEXPECTED_ROUTE:'+route);
  return {ok:true,status:200,json:async()=>data};
 };
 return {opts,calls,input:{owner:'arthurprinsen-ai',repo:'Bedrijfsgeheugen',githubToken:'test',manifest,manifestBytes,policy,policyBytes,invocationSha:d,checkoutSha:d,fetchImpl}};
}
test('exact native v2 preflight proves trusted provider bytes and old PR base without write authority',async()=>{const f=fixture();const r=await preflightReviewedWriterHandoff(f.input);assert.equal(r.executionMainSha,d);assert.equal(r.prBaseSha,b);assert.equal(r.writeAuthorized,false);assert.ok(f.calls.every(c=>c.method==='GET'));assert.equal(f.calls.filter(c=>c.route==='/pulls/5940').length,2)});
test('provider manifest or policy bytes mismatch fails before candidate access',async()=>{for(const k of ['manifestBytes','policyBytes']){const f=fixture();f.opts[k]+=' ';await assert.rejects(preflightReviewedWriterHandoff(f.input),/PROTECTED_REVIEW_BYTES_MISMATCH/);assert.ok(!f.calls.some(c=>c.route==='/pulls/5940'))}});
test('foreign repository, wrong base branch, wrong PR and closed candidate fail closed',async()=>{for(const edit of [p=>p.head.repo.full_name='other/repo',p=>p.base.repo.full_name='other/repo',p=>p.base.ref='dev',p=>p.number=5,p=>p.state='closed']){const f=fixture();edit(f.opts.pr);await assert.rejects(preflightReviewedWriterHandoff(f.input),/REVIEWED_PR_NATIVE_IDENTITY_MISMATCH/)}});
test('missing, duplicate or mismatched obligation cannot pass',async()=>{for(const body of ['', 'Obligation-ID: original\nObligation-ID: original','Obligation-ID: other']){const f=fixture();f.opts.pr.body=body;await assert.rejects(preflightReviewedWriterHandoff(f.input),/REVIEWED_PR_OBLIGATION_UNPROVEN|CANDIDATE_IDENTITY_DRIFT/)}});
test('ambiguous native ancestry cannot pass even if numeric coercion would give zero',async()=>{for(const edit of [p=>p.behind_by=null,p=>p.behind_by='0',p=>p.base_commit.sha=b,p=>p.merge_base_commit.sha=b,p=>p.status='diverged',p=>p.ahead_by=0]){const f=fixture();edit(f.opts.compare);await assert.rejects(preflightReviewedWriterHandoff(f.input),/REVIEWED_MAIN_NOT_ANCESTOR/)}});
test('actual main drift is rejected',async()=>{const f=fixture();f.opts.main=b;await assert.rejects(preflightReviewedWriterHandoff(f.input),/MAIN_EPOCH_DRIFT/)});
