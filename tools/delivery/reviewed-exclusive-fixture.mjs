// Offline transcript-shape review only. Never authenticates native evidence.
const REPO_ID=1303700955,APP=5916428;
const SHA=/^[a-f0-9]{40}$/,DIGEST=/^[a-f0-9]{64}$/;
const positive=n=>Number.isSafeInteger(n)&&n>0;
const str=(v,re)=>typeof v==='string'&&re.test(v);
const cases=Object.freeze({
 ordinary_pr_merge:'denied',admin_pr_merge:'denied',other_app_pr_merge:'denied',
 ordinary_direct_push:'denied',dedicated_app_direct_push:'denied',
 preexisting_auto_merge:'denied',dedicated_app_failed_ci:'denied',
 dedicated_app_stale_head:'denied',dedicated_app_stale_base:'denied',
 dedicated_app_green_pr:'merged',restore_baseline:'restored'
});
export function reviewExclusiveFixtureTranscript(json){
 const out=state=>Object.freeze({state,providerEnforced:false,mutationAuthority:false,activationAuthorized:false});
 if(typeof json!=='string'||json.length>65536)return out('FIXTURE_INPUT_INVALID');
 let t;try{t=JSON.parse(json)}catch{return out('FIXTURE_INPUT_INVALID')}
 if(!t||!positive(t.fixtureRepositoryId)||t.fixtureRepositoryId===REPO_ID||
 !str(t.fixtureRepository,/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/)||t.fixtureRepository.toLowerCase()==='arthurprinsen-ai/bedrijfsgeheugen'||
 t.appId!==APP||!positive(t.ruleId)||!str(t.proposalDigest,DIGEST)||!str(t.baselineDigest,DIGEST)||
 !Array.isArray(t.observations)||t.observations.length!==Object.keys(cases).length)return out('FIXTURE_IDENTITY_UNPROVEN');
 const seen=new Set(),receipts=new Set(),attempts=new Set();
 for(const o of t.observations){
  if(!o||!Object.hasOwn(cases,o.scenario)||seen.has(o.scenario)||o.repositoryId!==t.fixtureRepositoryId||
    o.ruleId!==t.ruleId||o.proposalDigest!==t.proposalDigest||o.outcome!==cases[o.scenario]||
    !str(o.before,SHA)||!str(o.after,SHA)||!str(o.receiptDigest,DIGEST)||receipts.has(o.receiptDigest)||
    !str(o.attemptId,/^[A-Za-z0-9_-]{1,120}$/)||attempts.has(o.attemptId))return out('FIXTURE_SCENARIO_UNPROVEN');
  if(o.outcome==='denied'&&o.before!==o.after)return out('DENIED_MUTATION_OBSERVED');
  if(o.outcome==='merged'&&(o.before===o.after||o.actorAppId!==APP||o.ciConclusion!=='success'||o.expectedMerge!==o.after))return out('POSITIVE_CONTROL_UNPROVEN');
  if(o.outcome==='restored'&&(o.before!==o.after||o.restoredBaselineDigest!==t.baselineDigest))return out('ROLLBACK_UNPROVEN');
  seen.add(o.scenario);receipts.add(o.receiptDigest);attempts.add(o.attemptId);
 }
 return out('FIXTURE_TRANSCRIPT_SHAPE_COMPLETE_PROVENANCE_REQUIRED');
}
