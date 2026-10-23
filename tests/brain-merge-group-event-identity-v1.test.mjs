import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { normalizeGitHubDeliveryEvent } from '../tools/delivery-github-event-context.mjs';
import { evaluateBranchHygiene } from '../tools/delivery-branch-hygiene-guard.mjs';

const sha=c=>c.repeat(40);
const event={merge_group:{base_sha:sha('a'),head_sha:sha('b')}};

test('native merge group identity has no synthetic PR number and binds exact provider SHA',()=>{
  const actual=normalizeGitHubDeliveryEvent({eventName:'merge_group',event,githubSha:sha('b'),runId:'39951080247'});
  assert.equal(actual.prNumber,null);
  assert.equal(actual.candidateSha,sha('b'));
  assert.equal(actual.changeHeadSha,sha('b'));
  assert.equal(actual.baseSha,sha('a'));
});

test('native queue fails closed on missing or divergent provider head',()=>{
  assert.throws(()=>normalizeGitHubDeliveryEvent({eventName:'merge_group',event:{merge_group:{base_sha:sha('a')}},githubSha:sha('b'),runId:'1'}),/valid mergeGroup.headSha/);
  assert.throws(()=>normalizeGitHubDeliveryEvent({eventName:'merge_group',event,githubSha:sha('c'),runId:'1'}),/MERGE_GROUP_HEAD_SHA_MISMATCH/);
  assert.throws(()=>normalizeGitHubDeliveryEvent({eventName:'merge_group',event:{merge_group:{base_sha:'broken',head_sha:sha('b')}},githubSha:sha('b'),runId:'1'}),/valid baseSha/);
});

test('combined group scope is strictly bounded without adopting a stale PR manifest',()=>{
  const policy={expectedPaths:[],maxFiles:40,delivery:{candidateType:'implementation'}};
  const valid=evaluateBranchHygiene({changedPaths:['tools/ci/a.mjs'],metadata:policy,labels:[]});
  assert.equal(valid.ok,true);
  const wide=evaluateBranchHygiene({changedPaths:Array.from({length:41},(_,i)=>'tools/ci/f'+i+'.mjs'),metadata:policy,labels:[]});
  assert.equal(wide.ok,false);
  assert.match(wide.state,/SCOPE_BUDGET_EXCEEDED|HARD_SCOPE_LIMIT_EXCEEDED/);
});

test('Required uses synthetic-group budget and empty PR output, preserving three mandatory checks',async()=>{
  const required=await readFile('.github/workflows/required-test.yml','utf8');
  const hygiene=await readFile('.github/workflows/powerhouse-delivery-hygiene.yml','utf8');
  const codeql=await readFile('.github/workflows/codeql.yml','utf8');
  assert.match(required,/process\.env\.EVENT_NAME === 'merge_group'/);
  assert.match(required,/expectedPaths:\[\],maxFiles:40/);
  assert.match(required,/pr_number=\$\{context\.prNumber \?\? ''\}/);
  assert.match(required,/github\.event\.merge_group\.head_sha/);
  assert.match(hygiene,/MERGE_GROUP_SHA_MISMATCH/);
  assert.match(codeql,/merge_group:/);
  assert.match(required,/^  test:/m);
  assert.match(hygiene,/name: Admit one canonical candidate before expensive CI/);
});
