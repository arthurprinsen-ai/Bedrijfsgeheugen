import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readCanonicalProductionReleaseIdentity} from '../tools/ci/portal-canonical-browser-release-fence.mjs';

const sha='a'.repeat(40),deploy='b'.repeat(24);
const canonical='https://www.bedrijfsgeheugen.nl/release.json';
const immutable='https://'+deploy+'--bedrijfsgeheugen.netlify.app/release.json';
const valid={contract:'BRAIN-DELIVERY-v2',context:'production',commit_ref:sha,deploy_id:deploy};
const response=(body,url,ok=true)=>({ok,status:ok?200:503,url,async json(){return body;}});
function witness({first=valid,immutableBody=valid,second=valid,failUrl='',redirectUrl='',raise=false}={}){
 const calls=[];
 const fetchImpl=async(url,options)=>{
  calls.push({url,options});
  if(raise)throw new Error('network unavailable');
  if(url.includes('innovation_release_readback=1'))
   return response(first,redirectUrl||url,!url.includes(failUrl)||!failUrl);
  if(url.startsWith(immutable))return response(immutableBody,url,!url.includes(failUrl)||!failUrl);
  if(url.startsWith(canonical))return response(second,url,!url.includes(failUrl)||!failUrl);
  throw new Error('unexpected untrusted URL: '+url);
 };
 return {fetchImpl,calls};
}
test('original innovation can independently read CURRENT production with zero Netlify secrets',async()=>{
 const w=witness();
 const result=await readCanonicalProductionReleaseIdentity({fetchImpl:w.fetchImpl});
 assert.deepEqual(result,{state:'ready',context:'production',commit_ref:sha,id:deploy,
  manifest_source:'CANONICAL_AND_IMMUTABLE_HTTP_RELEASE_MANIFESTS',independent_release_manifests:2});
 assert.equal(w.calls.length,3);
 assert.ok(w.calls[0].url.startsWith(canonical));
 assert.ok(w.calls[1].url.startsWith(immutable));
 assert.ok(w.calls[2].url.startsWith(canonical));
 for(const call of w.calls){
  assert.equal(call.options.headers['cache-control'],'no-cache');
  assert.equal(call.options.cache,'no-store');
  assert.equal(call.options.headers.authorization,undefined);
 }
 assert.equal(w.calls[0].options.redirect,'error');
});
test('preview, malformed, redirect, stale SHA, provider outage and mismatch all fail closed',async()=>{
 for(const config of [
  {first:{...valid,context:'deploy-preview'}},
  {first:{...valid,contract:'UNTRUSTED'}},
  {first:{...valid,commit_ref:'z'.repeat(40)}},
  {first:{...valid,deploy_id:'../../path'}},
  {first:{...valid,deploy_id:null}},
  {immutableBody:{...valid,context:'deploy-preview'}},
  {immutableBody:{...valid,commit_ref:'c'.repeat(40)}},
  {second:{...valid,deploy_id:'c'.repeat(24)}},
  {failUrl:'innovation_release_readback=1'},
  {failUrl:'--bedrijfsgeheugen.netlify.app'},
  {raise:true},
  {redirectUrl:'https://attacker.example/release.json?innovation_release_readback=1'}
 ]){
  assert.equal(await readCanonicalProductionReleaseIdentity({fetchImpl:witness(config).fetchImpl}),null,
   'invalid public release must not become verified Netlify production');
 }
 assert.equal(await readCanonicalProductionReleaseIdentity({fetchImpl:async()=>({ok:true,status:200,url:canonical+'?innovation_release_readback=1',async json(){throw new SyntaxError('html')}})}),null);
});
test('same original daily and recovery workflow use public proof, not wider secrets or invented effect',()=>{
 const flow=readFileSync('.github/workflows/powerhouse-daily-self-evolution.yml','utf8');
 const script=readFileSync('scripts/brain/innovation-original-delivery-continuity.mjs','utf8');
 const start=flow.indexOf('  original-delivery-recovery:');
 const recovery=flow.slice(start,flow.indexOf('  model-freshness:',start));
 assert.match(recovery,/innovation-original-delivery-continuity.mjs --reconcile/);
 assert.doesNotMatch(recovery,/NETLIFY_AUTH_TOKEN|NETLIFY_SITE_ID|contents: write/);
 assert.match(script,/if\(!token\|\|!site\)return readCanonicalProductionReleaseIdentity\(\{fetchImpl\}\)/);
 assert.match(script,/current_contains_merge===true/);
 assert.match(script,/independent_impact_verified:false,consumer_ack_verified/);
});
