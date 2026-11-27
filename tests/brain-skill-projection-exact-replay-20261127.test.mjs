import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {classifyProjectionReplay,verifyProjectionReplayEvidence} from '../tools/delivery/skill-projection-replay.mjs';
const sha='a'.repeat(40),parent='b'.repeat(40),since='2026-11-27T10:00:00Z',title='Skill projection replay PR #6213 '+sha;
const run={id:101,event:'workflow_dispatch',head_branch:'main',display_title:title,status:'completed',created_at:'2026-11-27T11:00:00Z'};
const page=rows=>[{total_count:rows.length,workflow_runs:rows}];
test('recovery requires complete unique exact provider flight identity',()=>{
 assert.equal(classifyProjectionReplay(page([]),title,since).safe_to_dispatch,true);
 assert.equal(classifyProjectionReplay(page([run]),title,since).run_id,101);
 assert.equal(classifyProjectionReplay(page([{...run,status:'queued'}]),title,since).active,true);
 assert.equal(classifyProjectionReplay(page([{...run,display_title:'Powerhouse Skill Projection'}]),title,since).safe_to_dispatch,false);
 assert.equal(classifyProjectionReplay(page([run,{...run,id:102}]),title,since).complete,false);
 assert.equal(classifyProjectionReplay([{total_count:2,workflow_runs:[run]}],title,since).safe_to_dispatch,false);
});
const file='brain/learning/example.json',tests=['tests/brain-example.test.mjs'];
const evaluation=mode=>({mode,passed:true,test_count:1,tests,output_sha256:'d'.repeat(64)});
const record={source:file,canonical_eligible:true,evidence_digest:'e'.repeat(64),plan:{historical_replay_required:true,shadow_required:true,canary_required:true},evaluations:['HISTORICAL_REPLAY','SHADOW','CANARY'].map(evaluation)};
const evidence={contract:'powerhouse-learning-canonicalization-gate-v1',base_sha:parent,head_sha:sha,canonical_eligible:true,changed_learning_count:1,changed_learning_files:[file],evaluated:[record]};
const verify=e=>verifyProjectionReplayEvidence({evidence:e,mergeSha:sha,parentSha:parent,learningFiles:[file]});
test('actual exact evaluation evidence and all required modes are mandatory',()=>{
 assert.equal(verify(evidence).ok,true);
 assert.equal(verify({...evidence,head_sha:parent}).ok,false);
 assert.equal(verify({...evidence,evaluated:[]}).ok,false);
 assert.equal(verify({...evidence,evaluated:[{...record,evaluations:record.evaluations.slice(0,2)}]}).ok,false);
 assert.equal(verify({...evidence,evaluated:[{...record,evaluations:[{...evaluation('HISTORICAL_REPLAY'),passed:false},evaluation('SHADOW'),evaluation('CANARY')]}]}).ok,false);
 assert.equal(verify({...evidence,evaluated:[{...record,evidence_digest:''}]}).ok,false);
});
test('original workflows enforce protected identity and artifact proof before terminal claim',()=>{
 const p=readFileSync('.github/workflows/powerhouse-skill-projection.yml','utf8');
 const t=readFileSync('.github/workflows/obligation-terminal-closure.yml','utf8');
 assert.match(p,/git merge-base --is-ancestor "\$MERGE_SHA" "\$GITHUB_SHA"/);
 assert.match(p,/git checkout --detach "\$MERGE_SHA"/);
 assert.match(t,/gh api --paginate --slurp "\$replay_query"/);
 assert.match(t,/SKILL_REPLAY_ORIGINAL_EVENT_ARRIVED/);
 assert.ok(t.indexOf('skill-projection-replay.mjs verify')<t.indexOf('SKILL_EXACT_REPLAY_PROVEN'));
 assert.match(t,/SKILL_PROJECTION_DESCENDANT_NOT_PROVEN/);
});
