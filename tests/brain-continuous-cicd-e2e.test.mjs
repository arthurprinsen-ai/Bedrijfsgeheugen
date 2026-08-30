import test from 'node:test';
import assert from 'node:assert/strict';
import { createChangeEnvelope } from '../platform/delivery/change-envelope.mjs';
import { evaluateContinuousChange } from '../platform/delivery/orchestrator.mjs';

const envelope=(id,platform,resources,contracts)=>createChangeEnvelope({
  changeId:id,owner:`agent-${platform}`,platform,baseVersion:'base-1',candidateVersion:`candidate-${id}`,
  changedResources:resources,contractKeys:contracts,riskClass:'reversible',requiredGates:['quality'],rollbackStrategy:'restore',hardBoundary:false,expectedEvidence:['live-readback']
});

test('moving main, non-Git activation and cross-platform conflicts remain isolated',()=>{
  const website=envelope('website-1','github',['site/home.html'],['website-nav:v2']);
  const portal=envelope('portal-2','github',['portal/app.mjs'],['portal-state:v4']);
  const notion=envelope('notion-1','notion',['database:content-calendar'],['content-calendar:v2']);
  const supabase=envelope('supa-1','supabase',['table:portal_state'],['portal-state:v4']);
  const dataforseo=envelope('seo-1','dataforseo',['query:keywords'],['seo-evidence:v1']);

  const websiteDecision=evaluateContinuousChange({candidate:website,concurrent:[portal],registered:true,gatesGreen:true,dependenciesGreen:true,exactEvidence:true,mergeable:true,mainDriftPaths:['portal/app.mjs']});
  assert.equal(websiteDecision.conflict.state,'NO_RELEVANT_DRIFT');
  assert.equal(websiteDecision.production.action,'PROMOTE');
  assert.equal(websiteDecision.rebuildRequired,false);

  const notionDecision=evaluateContinuousChange({candidate:notion,concurrent:[portal],registered:true,gatesGreen:true,dependenciesGreen:true,exactEvidence:true});
  assert.equal(notionDecision.production.action,'PROMOTE');
  assert.equal(notionDecision.waitForUnrelatedChanges,false);

  const supabaseDecision=evaluateContinuousChange({candidate:supabase,concurrent:[portal],registered:true,gatesGreen:true,dependenciesGreen:true,exactEvidence:true});
  assert.equal(supabaseDecision.conflict.state,'CONTRACT_OVERLAP');
  assert.equal(supabaseDecision.production.action,'REJECT');
  assert.deepEqual(supabaseDecision.conflict.affectedChanges,['portal-2']);

  const failedSeo=evaluateContinuousChange({candidate:dataforseo,concurrent:[notion],registered:true,gatesGreen:false,dependenciesGreen:true,exactEvidence:false});
  assert.equal(failedSeo.production.action,'REJECT');
  const unrelatedNotion=evaluateContinuousChange({candidate:notion,concurrent:[dataforseo],registered:true,gatesGreen:true,dependenciesGreen:true,exactEvidence:true});
  assert.equal(unrelatedNotion.production.action,'PROMOTE');
});

test('unrelated changes are never batched or made global dependencies',()=>{
  const make=envelope('make-1','make',['scenario:BG200'],['scenario-output:v1']);
  const netlify=envelope('netlify-1','netlify',['deploy:web'],['website-runtime:v1']);
  const result=evaluateContinuousChange({candidate:make,concurrent:[netlify],registered:true,gatesGreen:true,dependenciesGreen:true,exactEvidence:true});
  assert.equal(result.production.batchRequired,false);
  assert.equal(result.waitForUnrelatedChanges,false);
  assert.equal(result.production.action,'PROMOTE');
});
