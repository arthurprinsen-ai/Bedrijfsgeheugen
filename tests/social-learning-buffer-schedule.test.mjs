import test from 'node:test';
import assert from 'node:assert/strict';
import bufferCollect, { config, runBufferCollection } from '../netlify/functions/buffer-social-collect.mjs';
import { localDayWindow, providerReconciliationState } from '../netlify/functions/social-publication-delivery.mjs';
import { hasProviderCoverage, selectDeliverySource, deliveryDecision } from '../platform/social-delivery-guarantee.mjs';

test('Buffer collector is scheduled natively and not through Make', () => {
  assert.equal(config.schedule, '15 */6 * * *');
});

test('missing Buffer credential records one fail-closed obligation', async () => {
  const obligations=[];
  const store={recordObligation:async obligation=>obligations.push(obligation)};
  const result=await runBufferCollection({apiKey:null,store,now:new Date('2026-09-09T10:00:00Z')});
  assert.equal(result.ok,false);
  assert.equal(result.reason,'BUFFER_API_KEY_REQUIRED');
  assert.equal(obligations.length,1);
  assert.equal(obligations[0].id,'buffer-social-learning:credential');
});

test('scheduled handler returns 503 when credential is absent instead of false green', async () => {
  const response=await bufferCollect({apiKey:null,store:{recordObligation:async()=>{}}});
  assert.equal(response.status,503);
});

test('Amsterdam day window is DST-safe in summer and winter', () => {
  assert.deepEqual(localDayWindow('2026-07-15'), { start:'2026-07-14T22:00:00.000Z', end:'2026-07-15T22:00:00.000Z' });
  assert.deepEqual(localDayWindow('2026-01-15'), { start:'2026-01-14T23:00:00.000Z', end:'2026-01-15T23:00:00.000Z' });
  assert.deepEqual(localDayWindow('2026-10-25'), { start:'2026-10-24T22:00:00.000Z', end:'2026-10-25T23:00:00.000Z' });
});

test('provider scheduled/sending/sent readback advances canonical state without regression', () => {
  assert.equal(providerReconciliationState('PLANNED','scheduled'),'DISPATCHED');
  assert.equal(providerReconciliationState('APPROVED','sending'),'DISPATCHED');
  assert.equal(providerReconciliationState('DISPATCHED','scheduled'),null);
  assert.equal(providerReconciliationState('PLANNED','sent'),'LIVE_PROVEN');
  assert.equal(providerReconciliationState('LIVE_PROVEN','sent'),null);
});

const personalArtifact = {
  channel:'linkedin_personal', artifact_type:'linkedin_post', body:'Vanochtend keek ik in Buffer. Leeg.', status:'content_ready',
  generation_evidence:{ identity_gate_result:'PASS', concrete_personal_anchor:true, corporate_style:false, personal_truth_verified:true },
};

const instagramArtifact = {
  channel:'instagram', artifact_type:'instagram_post', body:'Mira zoekt de laatste versie.', status:'content_ready',
  generation_evidence:{ instagram_publish_gate_input:{
    channelKind:'instagram_company', channelId:'6a70384d99afb44349f0fba9', text:'Mira zoekt de laatste versie.', miraGatePassed:true, mediaKind:'image',
    assetUrl:'https://cdn.example/final.jpg', assetMimeType:'image/jpeg',
    lineage:{ contentId:'mira-1', calendarDate:'2026-09-16', predictionId:'pred-1', sourceDecisionId:'decision-1' },
    instagramVisual:{ verified:true, evidenceRefs:['vision:final'], assetUrl:'https://cdn.example/final.jpg', placeholderDetected:false, identityClass:'mira_daily_life', formatVerified:true, width:1080, height:1350, colorSpace:'RGB', hasAlpha:false, decodeComplete:true, visualComplete:true, grayOrEmptyDetected:false },
  } },
};

test('a Buffer Idea never counts as provider delivery coverage', () => {
  assert.equal(hasProviderCoverage({ ideas:[{id:'idea-1'}], posts:[] }),false);
});

test('scheduled, sending or sent provider records count as delivery coverage', () => {
  for (const status of ['scheduled','sending','sent']) assert.equal(hasProviderCoverage({ posts:[{status}] }),true);
  assert.equal(hasProviderCoverage({ posts:[{status:'draft'}] }),false);
});

test('personal LinkedIn never publishes from a Buffer Idea', () => {
  assert.equal(selectDeliverySource({ channel:'linkedin_personal', artifact:null, idea:{id:'idea-personal',content:{text:'generic seed'}} }),null);
});

test('personal LinkedIn uses exact canonical PASS artifact body', () => {
  const source=selectDeliverySource({ channel:'linkedin_personal', artifact:personalArtifact, idea:{id:'idea-personal',content:{text:'different text'}} });
  assert.equal(source.kind,'artifact'); assert.equal(source.text,personalArtifact.body); assert.equal(source.ideaId,null);
});

test('personal LinkedIn fails closed when personal truth evidence is incomplete', () => {
  const artifact=structuredClone(personalArtifact); artifact.generation_evidence.personal_truth_verified=false;
  assert.equal(selectDeliverySource({channel:'linkedin_personal',artifact}),null);
});

test('Instagram never publishes from an Idea even when the Idea has media', () => {
  const decision=deliveryDecision({channel:'instagram',posts:[],artifact:null,idea:{id:'idea-instagram',content:{text:'caption',media:[{type:'image',url:'https://cdn.example/generic.jpg'}]}}});
  assert.equal(decision.action,'BLOCK'); assert.equal(decision.reason,'INSTAGRAM_MIRA_ARTIFACT_REQUIRED');
});

test('Instagram requires exact verified Mira daily-life final asset evidence', () => {
  const bad=structuredClone(instagramArtifact); bad.generation_evidence.instagram_publish_gate_input.instagramVisual.identityClass='generic_person';
  assert.equal(selectDeliverySource({channel:'instagram',artifact:bad}),null);
  const source=selectDeliverySource({channel:'instagram',artifact:instagramArtifact});
  assert.equal(source.kind,'artifact'); assert.deepEqual(source.media,[{type:'image',url:'https://cdn.example/final.jpg',alt:null}]);
});

test('existing company provider coverage dedupes before any create action', () => {
  const decision=deliveryDecision({channel:'linkedin_company',posts:[{id:'post-1',status:'scheduled'}],idea:{id:'idea-company',content:{text:'company copy'}}});
  assert.equal(decision.action,'NONE'); assert.equal(decision.reason,'PROVIDER_COVERED');
});

test('personal provider coverage only satisfies delivery when provider text equals the PASS artifact', () => {
  const covered=deliveryDecision({channel:'linkedin_personal',posts:[{id:'post-1',status:'sent',text:personalArtifact.body}],artifact:personalArtifact});
  assert.equal(covered.action,'NONE');
  assert.equal(covered.reason,'PROVIDER_COVERED_VERIFIED');

  const mismatch=deliveryDecision({channel:'linkedin_personal',posts:[{id:'post-2',status:'sent',text:'Different personal post'}],artifact:personalArtifact});
  assert.equal(mismatch.action,'BLOCK');
  assert.equal(mismatch.reason,'PERSONAL_PROVIDER_ARTIFACT_MISMATCH');
});

test('Instagram provider coverage fails closed unless canonical evidence proves the exact Mira gate', () => {
  const posts=[{id:'ig-1',status:'sent',text:instagramArtifact.body}];
  const invalid=deliveryDecision({
    channel:'instagram', posts, artifact:instagramArtifact,
    obligation:{status:'BLOCKED',evidence:{identity_gate_result:'FAIL',mira_identity_verified:false,asset_verified_under_current_contract:false}},
  });
  assert.equal(invalid.action,'BLOCK');
  assert.equal(invalid.reason,'INSTAGRAM_PROVIDER_IDENTITY_UNVERIFIED');

  const verified=deliveryDecision({
    channel:'instagram', posts, artifact:instagramArtifact,
    obligation:{status:'LIVE_PROVEN',evidence:{identity_gate_result:'PASS',mira_identity_verified:true,asset_verified_under_current_contract:true,final_media_asset_url:'https://cdn.example/final.jpg'}},
  });
  assert.equal(verified.action,'NONE');
  assert.equal(verified.reason,'PROVIDER_COVERED_VERIFIED');
});
