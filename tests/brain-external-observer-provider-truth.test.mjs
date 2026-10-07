import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { evaluateExternalObserverProductionProof } from '../tools/site-shell/external-observer-production-proof.mjs';

const SHA='e53c39adfb7dcd945515f2421ac2f233eb6cda5b';
const deploy={
  id:'6ac63f6b64dc6f000885899d',
  state:'ready',
  context:'production',
  commit_ref:SHA,
  ssl_url:'https://www.bedrijfsgeheugen.nl',
  links:{alias:'https://www.bedrijfsgeheugen.nl'},
  available_functions:[
    {n:'_data-sovereignty-client'},
    {n:'_connector-ai'},
    {n:'_portal-supabase-store'},
    {n:'vraag'},
  ],
};

test('observer refusal does not invalidate exact Netlify provider truth',()=>{
  assert.deepEqual(
    evaluateExternalObserverProductionProof({
      expectedSha:SHA,
      deploy,
      expectedFunctions:['_data-sovereignty-client','_connector-ai','_portal-supabase-store','vraag'],
      githubLineageVerified:true,
      externalObserverStatus:'REFUSED_BY_OBSERVER',
    }),
    {
      status:'LIVE_PROVEN_PROVIDER_TRUTH',
      proof_mode:'netlify_provider_truth',
      observer_status:'REFUSED_BY_OBSERVER',
      observer_authoritative:false,
      provider:'netlify',
      deploy_id:'6ac63f6b64dc6f000885899d',
      state:'ready',
      context:'production',
      alias:'https://www.bedrijfsgeheugen.nl',
      commit_ref:SHA,
      expected_functions:['_data-sovereignty-client','_connector-ai','_portal-supabase-store','vraag'],
      function_inventory_verified:true,
      github_lineage_verified:true,
    },
  );
});

test('provider fallback fails closed on SHA mismatch, wrong alias, missing lineage or missing expected function',()=>{
  assert.throws(()=>evaluateExternalObserverProductionProof({expectedSha:SHA,deploy:{...deploy,commit_ref:'0'.repeat(40)},githubLineageVerified:true}),/commit_ref mismatch/);
  assert.throws(()=>evaluateExternalObserverProductionProof({expectedSha:SHA,deploy:{...deploy,links:{alias:'https://example.com'}},githubLineageVerified:true}),/alias mismatch/);
  assert.throws(()=>evaluateExternalObserverProductionProof({expectedSha:SHA,deploy,githubLineageVerified:false}),/lineage is not verified/);
  assert.throws(()=>evaluateExternalObserverProductionProof({expectedSha:SHA,deploy,expectedFunctions:['not-deployed'],githubLineageVerified:true}),/functions missing/);
});

test('production contract makes external observer explicitly non-authoritative without weakening canonical live readback',async()=>{
  const contract=JSON.parse(await readFile('brain/contracts/production-readback-v1.json','utf8'));
  assert.equal(contract.principles.externalObserverIsNonAuthoritative,true);
  assert.equal(contract.externalObserverReadback.blockedByObserverIsOriginFailure,false);
  assert.equal(contract.externalObserverReadback.blockedByObserverCanInvalidateProvenProduction,false);
  assert.equal(contract.externalObserverReadback.exactShaRequired,true);
  assert.equal(contract.externalObserverReadback.functionInventoryRequiredWhenExpected,true);
  assert.equal(contract.externalObserverReadback.publicFetchStillRequiredInsideCanonicalRunner,true);
  assert.equal(contract.productionTruth.liveReadbackRequired,true);
  assert.equal(contract.principles.contentReadbackRequired,true);
});

test('agent contract forces provider-truth fallback for observer-only fetch refusal',async()=>{
  const agents=await readFile('AGENTS.md','utf8');
  assert.match(agents,/External observer isolation/);
  assert.match(agents,/OBSERVER_UNAVAILABLE/);
  assert.match(agents,/Netlify/);
  assert.match(agents,/exact \`commit_ref\`/);
  assert.match(agents,/LIVE_PROVEN_PROVIDER_TRUTH/);
});
