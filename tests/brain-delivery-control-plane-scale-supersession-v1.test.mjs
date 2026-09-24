import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { classifyCandidate, evaluateAdmission, evaluateSupersession } from '../tools/delivery/delivery-hygiene.mjs';

const workflow=fs.readFileSync(new URL('../.github/workflows/powerhouse-delivery-hygiene.yml', import.meta.url),'utf8');
const policy=JSON.parse(fs.readFileSync(new URL('../config/powerhouse-delivery-hygiene-v1.json', import.meta.url)));

test('delivery hygiene paginates the full open PR candidate set with bounded large buffer',()=>{
  assert.match(workflow,/GH_MAX_BUFFER = 64 \* 1024 \* 1024/);
  assert.match(workflow,/\['api','--paginate','--slurp',path\]/);
  assert.match(workflow,/const open = await ghAll\(/);
});

test('explicit same-obligation successor blocks predecessor without implying terminal success',()=>{
  const base='a'.repeat(40), head1='b'.repeat(40), head2='c'.repeat(40);
  const predecessor=classifyCandidate({number:2790,state:'open',baseSha:base,headSha:head1,body:[
    'Obligation-ID: powerhouse-people-problem-radar-p0-v1',
    'Delivery-Lane: backend',
    'Candidate-Type: implementation',
    'Base-SHA: '+base
  ].join('\n')},policy);
  const successor=classifyCandidate({number:2796,state:'open',baseSha:base,headSha:head2,body:[
    'Obligation-ID: powerhouse-people-problem-radar-p0-v1',
    'Delivery-Lane: backend',
    'Candidate-Type: implementation',
    'Base-SHA: '+base,
    'Supersedes: 2790'
  ].join('\n')},policy);
  assert.equal(evaluateSupersession({successor,predecessor}).safe,true);
  const result=evaluateAdmission({candidate:predecessor,openCandidates:[predecessor,successor],policy,currentMainSha:base});
  assert.equal(result.ok,false);
  assert.equal(result.state,'BLOCKED_SUPERSEDED');
  assert.deepEqual(result.blockers,[2796]);
  assert.equal('terminal' in result,false);
});

test('successor remains admissible only with proven predecessor lineage',()=>{
  const base='d'.repeat(40), oldHead='e'.repeat(40), newHead='f'.repeat(40);
  const predecessor=classifyCandidate({number:10,state:'closed',baseSha:base,headSha:oldHead,body:[
    'Obligation-ID: obligation-x','Delivery-Lane: backend','Candidate-Type: implementation','Base-SHA: '+base
  ].join('\n')},policy);
  const successor=classifyCandidate({number:11,state:'open',baseSha:base,headSha:newHead,body:[
    'Obligation-ID: obligation-x','Delivery-Lane: backend','Candidate-Type: implementation','Base-SHA: '+base,'Supersedes: 10'
  ].join('\n')},policy);
  const result=evaluateAdmission({candidate:successor,openCandidates:[successor,predecessor],policy,currentMainSha:base});
  assert.equal(result.ok,true);
  assert.equal(result.state,'ADMITTED');
  assert.equal(result.predecessorNumber,10);
});
