import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveAgentImprovement, agentImprovementMarkup } from '../portal-v2/modules/agent-improvement-intelligence.js';

const now=Date.parse('2026-10-23T10:00:00Z');
const event=(id,occurredAt,status,extra={})=>({
  id,occurredAt,status,actor:'agent-1',source:'Brain',title:'Workflow event',...extra
});

test('deduplicates observations and preserves independently unknown value',()=>{
  const events=[
    event('a','2026-10-22T10:00:00Z','FAILED',{title:'GitHub workflow failed',fingerprint:'ci-123'}),
    event('a','2026-10-22T10:00:00Z','FAILED',{title:'GitHub workflow failed',fingerprint:'ci-123'}),
    event('b','2026-10-21T10:00:00Z','VERIFIED',{title:'Netlify deploy',source:'Netlify',referenceUrl:'https://app.netlify.com/deploys/123'}),
    event('c','2026-10-15T10:00:00Z','WARNING',{title:'Notion learning'})
  ];
  const d=deriveAgentImprovement({events},now);
  assert.equal(d.counts.events,3);
  assert.equal(d.counts.failures,1);
  assert.equal(d.counts.verifiedSignals,1);
  assert.equal(d.realizedValue,null);
  assert.equal(d.sources.find(s=>s.id==='github').eventCount,1);
  assert.equal(d.sources.find(s=>s.id==='supabase').eventCount,0);
  assert.equal(d.sources.find(s=>s.id==='netlify').proofLinks,1);
  assert.equal(d.comparison.recentCount,2);
  assert.equal(d.comparison.priorCount,1);
  assert.match(agentImprovementMarkup({events},now),/Niet meetbaar in deze projectie/);
});

test('no time series or failure rate is invented when no observations exist',()=>{
  const d=deriveAgentImprovement({},now);
  assert.equal(d.counts.events,0);
  assert.equal(d.comparison.recentFailureRate,null);
  assert.equal(d.comparison.priorFailureRate,null);
  assert.equal(d.sources.length,4);
  assert.match(agentImprovementMarkup({},now),/Geen gedateerde events/);
  assert.doesNotMatch(agentImprovementMarkup({},now),/100% succes/);
});

test('repeated error fingerprint becomes a hypothesis, not an automatic action',()=>{
  const events=[
    event('x','2026-10-22T12:00:00Z','FAILED',{fingerprint:'cron-46',title:'Supabase cron'}),
    event('y','2026-10-22T13:00:00Z','FAILED',{fingerprint:'cron-46',title:'Supabase cron'})
  ];
  const d=deriveAgentImprovement({events},now);
  assert.deepEqual(d.repeatFailures.map(x=>x.count),[2]);
  assert.match(agentImprovementMarkup({events},now),/raadpleeg canoniek incident/);
  assert.match(agentImprovementMarkup({events},now),/read-only/);
});

test('untrusted actor, fingerprint and title cannot inject HTML',()=>{
  const events=[
    event('evil','2026-10-22T10:00:00Z','FAILED',{
      actor:'<img src=x onerror=alert(1)>',
      fingerprint:'<script>alert(1)</script>',
      title:'GitHub'
    }),
    event('evil2','2026-10-22T10:01:00Z','FAILED',{
      actor:'<img src=x onerror=alert(1)>',
      fingerprint:'<script>alert(1)</script>',
      title:'GitHub'
    })
  ];
  const html=agentImprovementMarkup({events},now);
  assert.doesNotMatch(html,/<script>|<img src=x/);
  assert.match(html,/&lt;script&gt;/);
  assert.match(html,/&lt;img src=x/);
});

test('completed-loop count requires explicit complete===true and zero remains observed zero',()=>{
  const d=deriveAgentImprovement({loops:[{complete:true},{complete:'true'},{complete:false}],economics:{realizedValue:0,currency:'EUR'}},now);
  assert.equal(d.counts.completeLoops,1);
  assert.equal(d.realizedValue,0);
  assert.match(agentImprovementMarkup({loops:[{complete:true}],economics:{realizedValue:0,currency:'EUR'}},now),/€/);
});
